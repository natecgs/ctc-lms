#!/bin/bash
# Production Deployment Setup Script
# This script automates the initial setup of a production environment

set -e  # Exit on error

echo "🚀 CTC LMS Production Deployment Setup"
echo "======================================="
echo ""

# Configuration
DOMAIN="${1:-childcare-portal.natecgs.com}"
EMAIL="${2:-admin@childcare-portal.natecgs.com}"
APP_DIR="/app/ctc-lms"
APP_USER="lms-app"
APP_HOME="/home/$APP_USER"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log() {
    echo -e "${GREEN}✓${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    error "This script must be run as root"
fi

echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo ""

# Update system
log "Updating system packages..."
apt update && apt upgrade -y

# Install Node.js
log "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PostgreSQL
log "Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib

# Install Nginx
log "Installing Nginx..."
apt install -y nginx

# Install Certbot for SSL
log "Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# Install PM2 globally
log "Installing PM2..."
npm install -g pm2

# Install other utilities
log "Installing utilities..."
apt install -y git curl wget vim htop net-tools fail2ban ufw

# Create application user
if ! id "$APP_USER" &>/dev/null; then
    log "Creating application user: $APP_USER"
    useradd -m -s /bin/bash -d $APP_HOME $APP_USER
else
    log "User $APP_USER already exists"
fi

# Create application directory
if [ -d "$APP_DIR" ]; then
    log "Application directory already exists: $APP_DIR"
else
    log "Creating application directory: $APP_DIR"
    mkdir -p $APP_DIR
fi
chown -R $APP_USER:$APP_USER $APP_DIR
chmod 750 $APP_DIR

# Setup firewall
log "Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw limit 22/tcp      # Rate limit SSH
ufw --force enable

# Setup PostgreSQL
log "Configuring PostgreSQL..."
systemctl enable postgresql
systemctl restart postgresql

# Create PostgreSQL backup directory
mkdir -p /backups/lms
chmod 700 /backups/lms

# Setup log rotation
log "Configuring log rotation..."
cat > /etc/logrotate.d/ctc-lms << 'EOF'
/var/log/ctc-lms/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 lms-app lms-app
    sharedscripts
    postrotate
        systemctl reload lms-app > /dev/null 2>&1 || true
    endscript
}
EOF

# Create log directory
mkdir -p /var/log/ctc-lms
chown -R $APP_USER:$APP_USER /var/log/ctc-lms
chmod 755 /var/log/ctc-lms

# Setup SSL with Let's Encrypt
log "Setting up SSL certificate..."
mkdir -p /etc/letsencrypt/live/$DOMAIN
certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos -m $EMAIL -q || \
    warn "SSL setup may require manual configuration"

# Create backup script
log "Creating backup script..."
cat > /usr/local/bin/backup-lms-db << 'BACKUP_EOF'
#!/bin/bash
BACKUP_DIR="/backups/lms"
DB_NAME="${DB_NAME:-ctc_lms_prod}"
KEEP_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Starting database backup..."

# Create backup
pg_dump -U postgres $DB_NAME | gzip > $BACKUP_DIR/lms-full-$TIMESTAMP.sql.gz

if [ $? -eq 0 ]; then
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Backup completed: $BACKUP_DIR/lms-full-$TIMESTAMP.sql.gz"
    
    # Clean old backups
    find $BACKUP_DIR -name "lms-full-*.sql.gz" -mtime +$KEEP_DAYS -delete
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Cleaned backups older than $KEEP_DAYS days"
else
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Backup failed!"
    exit 1
fi
BACKUP_EOF

chmod +x /usr/local/bin/backup-lms-db

# Schedule backups
log "Scheduling daily backups..."
(crontab -l 2>/dev/null | grep -v backup-lms-db; echo "0 2 * * * /usr/local/bin/backup-lms-db >> /var/log/ctc-lms/backup.log 2>&1") | crontab -

# Create deployment script
log "Creating deployment helper script..."
cat > /usr/local/bin/deploy-lms << 'DEPLOY_EOF'
#!/bin/bash
set -e

echo "📦 Deploying CTC LMS..."

cd /app/ctc-lms

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production
cd backend && npm install --production && npm run build && cd ..

# Build frontend
echo "🏗️  Building frontend..."
npm run build

# Restart services
echo "🔄 Restarting services..."
pm2 restart lms-backend
pm2 restart lms-frontend

echo "✅ Deployment completed!"
DEPLOY_EOF

chmod +x /usr/local/bin/deploy-lms

# Create systemd service file for PM2
log "Creating systemd service..."
cd $APP_HOME
su - $APP_USER -c "pm2 startup systemd -u $APP_USER --hp $APP_HOME"

# Create .env.production template
log "Creating environment file template..."
cat > $APP_DIR/.env.production.example << 'ENV_EOF'
# See .env.production.example in project root
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=lms_app
DB_PASSWORD=YOUR_SECURE_PASSWORD
DB_NAME=ctc_lms_prod
JWT_SECRET=YOUR_JWT_SECRET_KEY
FRONTEND_URL=https://your-domain.com
ENV_EOF

chown $APP_USER:$APP_USER $APP_DIR/.env.production.example
chmod 600 $APP_DIR/.env.production.example

# Create health check script
log "Creating health check script..."
cat > /usr/local/bin/check-lms-health << 'HEALTH_EOF'
#!/bin/bash

API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health)
WEB_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80/)
DB_CHECK=$(psql -U postgres -d ctc_lms_prod -c "SELECT 1" 2>/dev/null | grep -c 1 || echo 0)

echo "API Health: $API_HEALTH"
echo "Web Health: $WEB_HEALTH"
echo "DB Connected: $DB_CHECK"

if [ "$API_HEALTH" = "200" ] && [ "$WEB_HEALTH" = "200" ] && [ "$DB_CHECK" = "1" ]; then
    echo "✅ All systems operational"
    exit 0
else
    echo "❌ Some systems are down"
    exit 1
fi
HEALTH_EOF

chmod +x /usr/local/bin/check-lms-health

# Enable fail2ban for SSH brute force protection
log "Enabling Fail2Ban..."
systemctl enable fail2ban
systemctl restart fail2ban

# Create firewall rules backup
log "Saving firewall configuration..."
mkdir -p /etc/ufw/backup
cp /etc/ufw/user.rules /etc/ufw/backup/user.rules.$(date +%Y%m%d)

# Summary
echo ""
echo "✅ Production environment setup complete!"
echo ""
echo "📋 Next Steps:"
echo "1. SSH into your server: ssh root@$DOMAIN"
echo "2. Review and update environment variables:"
echo "   - sudo nano $APP_DIR/.env.production"
echo "3. Create PostgreSQL database as the lms-app user"
echo "4. Deploy your application:"
echo "   - deploy-lms"
echo "5. Check services status:"
echo "   - pm2 list"
echo "   - check-lms-health"
echo ""
echo "📚 Useful commands:"
echo "  - View logs: pm2 logs lms-backend"
echo "  - Restart services: pm2 restart all"
echo "  - Database backup: backup-lms-db"
echo "  - Health check: check-lms-health"
echo ""
echo "For more information, see PRODUCTION_DEPLOYMENT.md"
