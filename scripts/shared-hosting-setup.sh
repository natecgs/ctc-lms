#!/bin/bash
# Shared Hosting Deployment Setup Script (Non-Root User)
# This script deploys the CTC LMS application on shared hosting without root access
# Requires: Node.js pre-installed, external PostgreSQL database, web server already configured

set -e  # Exit on error

echo "🚀 CTC LMS Shared Hosting Deployment Setup (Non-Root)"
echo "======================================================"
echo ""

# Configuration
DOMAIN="${1:-}"
APP_HOME="${HOME}/ctc-lms"
APP_DIR="${APP_HOME}/app"
LOGS_DIR="${APP_HOME}/logs"
BACKUPS_DIR="${APP_HOME}/backups"

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

# Prompt for domain if not provided
if [ -z "$DOMAIN" ]; then
    echo "⚠️  No domain provided"
    read -p "Enter your production domain (e.g., your-domain.com): " DOMAIN
    if [ -z "$DOMAIN" ]; then
        error "Domain is required"
    fi
fi

echo "Domain: $DOMAIN"
echo "Home Directory: $APP_HOME"
echo ""

# Check if running as root (should NOT be root)
if [ "$EUID" -eq 0 ]; then 
    error "This script should NOT be run as root. Run as your regular user account."
fi

# Check Node.js is installed
if ! command -v node &> /dev/null; then
    error "Node.js is not installed. Please ask your hosting provider to install Node.js or install it in your home directory."
fi

log "Node.js found: $(node --version)"

# Create directory structure
log "Creating application directories..."
mkdir -p $APP_DIR
mkdir -p $LOGS_DIR
mkdir -p $BACKUPS_DIR

# Check if git is available
if ! command -v git &> /dev/null; then
    warn "Git is not installed. You may need to manually download and extract the repository."
fi

# Clone repository (if not already present)
if [ -d "$APP_DIR/.git" ]; then
    log "Repository already cloned, pulling latest changes..."
    cd $APP_DIR
    git pull origin main || warn "Could not pull latest changes"
else
    log "Cloning repository..."
    git clone https://github.com/natecgs/ctc-lms.git $APP_DIR || \
        warn "Git clone failed. Manually download the repository to $APP_DIR"
fi

cd $APP_DIR

# Install PM2 locally if not already global
if ! command -v pm2 &> /dev/null; then
    log "Installing PM2 locally..."
    npm install pm2
    # Create alias for local pm2
    alias pm2="$APP_DIR/node_modules/.bin/pm2" || true
fi

# Install dependencies
log "Installing backend dependencies..."
cd backend
npm install --production
npm run build
cd ..

log "Installing frontend dependencies..."
npm install --production
npm run build

# Create backup script
log "Creating backup script..."
mkdir -p $APP_HOME/scripts
cat > $APP_HOME/scripts/backup-lms-db.sh << 'BACKUP_EOF'
#!/bin/bash
BACKUP_DIR="$HOME/ctc-lms/backups"
DB_NAME="${DB_NAME:-ctc_lms_prod}"
DB_HOST="${DB_HOST:-localhost}"
DB_USER="${DB_USER:-lms_app}"
KEEP_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Starting database backup..."

# Create backup
if pg_dump -h $DB_HOST -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/lms-full-$TIMESTAMP.sql.gz; then
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Backup completed: $BACKUP_DIR/lms-full-$TIMESTAMP.sql.gz"
    
    # Clean old backups
    find $BACKUP_DIR -name "lms-full-*.sql.gz" -mtime +$KEEP_DAYS -delete
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Cleaned backups older than $KEEP_DAYS days"
else
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Backup failed!"
    exit 1
fi
BACKUP_EOF

chmod +x $APP_HOME/scripts/backup-lms-db.sh

# Create deployment script
log "Creating deployment helper script..."
cat > $APP_HOME/scripts/deploy.sh << 'DEPLOY_EOF'
#!/bin/bash
set -e

echo "📦 Deploying CTC LMS..."

cd $HOME/ctc-lms/app

# Pull latest code
echo "📥 Pulling latest code..."
if command -v git &> /dev/null; then
    git pull origin main || echo "⚠️  Git pull failed, continuing..."
else
    echo "⚠️  Git not available, skipping code update"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production
cd backend && npm install --production && npm run build && cd ..

# Build frontend
echo "🏗️  Building frontend..."
npm run build

# Restart services
echo "🔄 Restarting services..."
$HOME/ctc-lms/app/node_modules/.bin/pm2 restart lms-backend
$HOME/ctc-lms/app/node_modules/.bin/pm2 restart lms-frontend

echo "✅ Deployment completed!"
DEPLOY_EOF

chmod +x $APP_HOME/scripts/deploy.sh

# Create health check script
log "Creating health check script..."
cat > $APP_HOME/scripts/health-check.sh << 'HEALTH_EOF'
#!/bin/bash

API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health)
WEB_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/ || echo 000)
DB_HOST="${DB_HOST:-localhost}"
DB_NAME="${DB_NAME:-ctc_lms_prod}"
DB_USER="${DB_USER:-lms_app}"

if command -v psql &> /dev/null; then
    DB_CHECK=$(psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1" 2>/dev/null | grep -c 1 || echo 0)
else
    DB_CHECK="N/A"
fi

echo "API Health: $API_HEALTH"
echo "Web Health: $WEB_HEALTH"
echo "DB Connected: $DB_CHECK"

if [ "$API_HEALTH" = "200" ] || [ "$WEB_HEALTH" = "200" ]; then
    echo "✅ Services operational"
    exit 0
else
    echo "❌ Services may be down"
    exit 1
fi
HEALTH_EOF

chmod +x $APP_HOME/scripts/health-check.sh

# Create environment template
log "Creating environment file template..."
cat > $APP_DIR/.env.production.example << 'ENV_EOF'
# Shared Hosting Production Configuration

NODE_ENV=production
PORT=5000

# ============================================================================
# EXTERNAL DATABASE (Use managed database service)
# Examples: AWS RDS, DigitalOcean Managed DB, Heroku Postgres, etc.
# ============================================================================
DB_HOST=your-db-host.example.com
DB_PORT=5432
DB_USER=lms_app
DB_PASSWORD=your-secure-database-password
DB_NAME=ctc_lms_prod

# ============================================================================
# APPLICATION
# ============================================================================
FRONTEND_URL=https://your-domain.com
JWT_SECRET=your-long-random-secure-secret-key-min-32-chars
JWT_EXPIRY=7d

# ============================================================================
# EMAIL CONFIGURATION
# ============================================================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@your-domain.com

# ============================================================================
# RATE LIMITING & SECURITY
# ============================================================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ============================================================================
# LOGGING & MONITORING (Optional)
# ============================================================================
LOG_LEVEL=info
SENTRY_DSN=
ENV_EOF

chmod 600 $APP_DIR/.env.production.example

# Create startup script for PM2
log "Configuring PM2 for shared hosting..."
cat > $APP_DIR/ecosystem.config.js << 'ECOSYSTEM_EOF'
module.exports = {
  apps: [
    {
      name: 'lms-backend',
      script: './backend/dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
    {
      name: 'lms-frontend',
      script: 'npm run preview',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
ECOSYSTEM_EOF

# Create crontab entry for backups (user crontab, not system)
log "Setting up automated backups via crontab..."
cat > /tmp/crontab-entry.txt << 'CRON_EOF'
# CTC LMS - Daily database backup at 2 AM
0 2 * * * $HOME/ctc-lms/scripts/backup-lms-db.sh >> $HOME/ctc-lms/logs/backup.log 2>&1
CRON_EOF

echo ""
echo "✅ Shared hosting setup complete!"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Configure your environment:"
echo "   nano $APP_DIR/.env.production"
echo ""
echo "2. Ensure external database is created:"
echo "   - Create database 'ctc_lms_prod' on your managed database service"
echo "   - Import schema: psql -h \$DB_HOST -U \$DB_USER -d ctc_lms_prod < backend/database/schema.sql"
echo ""
echo "3. Start services with PM2:"
echo "   cd $APP_DIR"
echo "   ./node_modules/.bin/pm2 start ecosystem.config.js"
echo "   ./node_modules/.bin/pm2 save"
echo ""
echo "4. Setup crontab for automated backups (optional):"
echo "   crontab -e"
echo "   # Then paste the contents of: cat /tmp/crontab-entry.txt"
echo ""
echo "5. Configure your web server to proxy to the application:"
echo "   - Backend: Proxy /api to http://localhost:5000"
echo "   - Frontend: Serve from $APP_DIR/dist"
echo ""
echo "📚 Useful commands:"
echo "   - View logs: $APP_HOME/app/node_modules/.bin/pm2 logs"
echo "   - Restart services: $APP_HOME/app/node_modules/.bin/pm2 restart all"
echo "   - Deploy updates: $APP_HOME/scripts/deploy.sh"
echo "   - Health check: $APP_HOME/scripts/health-check.sh"
echo "   - Database backup: $APP_HOME/scripts/backup-lms-db.sh"
echo ""
echo "⚠️  IMPORTANT:"
echo "   - Do NOT commit .env.production to git"
echo "   - Keep database credentials secure"
echo "   - Monitor your file quotas (shared hosting may have limits)"
echo "   - Check with your hosting provider about Node.js/PM2 support"
echo ""
echo "For more information, see PRODUCTION_DEPLOYMENT.md"
