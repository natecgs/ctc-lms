# Production Quick Start Guide

> Fast-track guide to get your LMS running in production

## Prerequisites

Before starting, ensure you have:

- [ ] Linux server (Ubuntu 20.04+ recommended)
- [ ] SSL certificate (or domain for Let's Encrypt)
- [ ] PostgreSQL credentials
- [ ] SMTP credentials for emails
- [ ] JWT secret key
- [ ] Git access to your repository

## One-Command Setup (Ubuntu/Debian)

```bash
# SSH into your server
ssh root@your-domain.com

# Clone repository and run setup script
git clone https://github.com/natecgs/ctc-lms.git /app/ctc-lms
cd /app/ctc-lms
sudo bash scripts/production-setup.sh childcare-portal.natecgs.com admin@childcare-portal.natecgs.com

# Wait for setup to complete (5-10 minutes)
```

**Replace:**
- `your-domain.com` with your actual production domain (e.g., `lms.example.com`)
- `admin@your-domain.com` with your admin email (e.g., `admin@example.com`)

## Manual Setup in 5 Steps

### Step 1: Clone Repository (5 minutes)

```bash
git clone https://your-repo-url.git /app/ctc-lms
cd /app/ctc-lms
```

### Step 2: Configure Environment (5 minutes)

```bash
# Copy environment template
cp .env.production.example backend/.env.production
cp .env.production.example .env.production

# Edit with your values
nano backend/.env.production
```

Required values:
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET` (run: `openssl rand -base64 32`)
- `FRONTEND_URL` (your domain)
- SMTP settings (Gmail, SendGrid, etc.)

### Step 3: Setup Database (5 minutes)

```bash
# Create database
sudo -u postgres createdb ctc_lms_prod

# Create user
sudo -u postgres psql -c "CREATE USER lms_app WITH PASSWORD 'your-password';"

# Import schema
psql -U postgres -d ctc_lms_prod -f backend/database/schema.sql

# Grant permissions
sudo -u postgres psql << EOF
GRANT CONNECT ON DATABASE ctc_lms_prod TO lms_app;
GRANT USAGE ON SCHEMA public TO lms_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO lms_app;
EOF
```

### Step 4: Build & Deploy (10 minutes)

```bash
# Install dependencies
npm install
cd backend && npm install && npm run build && cd ..

# Build frontend
npm run build

# Start with PM2
pm2 start backend/dist/server.js --name "lms-backend"
pm2 start "npm run preview" --name "lms-frontend"
pm2 save

# Configure auto-start
pm2 startup
systemctl enable pm2-root
```

### Step 5: Configure Web Server (5 minutes)

```bash
# Use provided Nginx config
sudo cp nginx-ssl.conf /etc/nginx/sites-available/ctc-lms

# Update domain name in config
sudo sed -i 's/your-production-domain.com/your-actual-domain.com/g' /etc/nginx/sites-available/ctc-lms

# Enable site
sudo ln -s /etc/nginx/sites-available/ctc-lms /etc/nginx/sites-enabled/
sudo nginx -t

# Setup SSL
sudo certbot certonly --nginx -d your-domain.com

# Restart Nginx
sudo systemctl restart nginx
```

## Verification (2 minutes)

```bash
# Check services are running
pm2 list

# Test API
curl https://your-domain.com/api/health

# Test frontend
curl https://your-domain.com/

# Check process logs
pm2 logs lms-backend

# Full health check
check-lms-health
```

## Troubleshooting

### "Unable to connect to database"
```bash
# Verify database exists
psql -U postgres -l

# Check credentials in .env
grep DB_ backend/.env.production

# Test connection
psql -U lms_app -h localhost -d ctc_lms_prod
```

### "Port 5000 already in use"
```bash
# Kill process using port 5000
sudo fuser -k 5000/tcp

# Or use different port in .env
echo "PORT=5001" >> backend/.env.production
```

### "SSL certificate error"
```bash
# Check certificate
sudo certbot certificates

# Renew if needed
sudo certbot renew

# Install auto-renewal
sudo systemctl enable certbot.timer
```

### "CORS errors"
```bash
# Verify FRONTEND_URL in backend/.env.production
grep FRONTEND_URL backend/.env.production

# Should be: FRONTEND_URL=https://your-domain.com (no trailing slash)
```

## Useful Commands

```bash
# View logs
pm2 logs
pm2 logs lms-backend -n 50

# Restart services
pm2 restart lms-backend
pm2 restart all

# Stop services
pm2 stop lms-backend

# Stats
pm2 monit

# Database backup
backup-lms-db

# Health check
check-lms-health

# Deploy updates
deploy-lms

# Nginx restart
sudo systemctl restart nginx

# View Nginx logs
sudo tail -f /var/log/nginx/ctc-lms-error.log
```

## Daily Monitoring

```bash
# Check all systems
check-lms-health

# Monitor in real-time
pm2 monit

# Review logs
pm2 logs lms-backend | head -20

# Database dump
pg_dump -U lms_app -d ctc_lms_prod | gzip > backup-$(date +%Y%m%d).sql.gz
```

## Security Checklist

- [ ] Firewall allows only 22, 80, 443
- [ ] SSH uses key-based auth only
- [ ] .env files have 600 permissions
- [ ] Root user password changed
- [ ] Automatic updates enabled
- [ ] Backup job running and tested
- [ ] Fail2ban enabled for SSH
- [ ] SSL certificate valid and auto-renewing
- [ ] Database user not using default password
- [ ] API rate limiting enabled

## Emergency Procedures

### Restore from backup
```bash
# List backups
ls -lh /backups/lms/

# Restore from backup
psql -U postgres -d ctc_lms_prod < /backups/lms/lms-full-20240101_020000.sql.gz
```

### Restart everything
```bash
pm2 restart all
sudo systemctl restart nginx
sudo systemctl restart postgresql
```

### Emergency stop
```bash
pm2 stop all
sudo systemctl stop nginx
```

## Getting Help

Check logs first:
```bash
# Backend errors
pm2 logs lms-backend --err-only

# Nginx errors
sudo tail -f /var/log/nginx/ctc-lms-error.log

# System errors
sudo journalctl -xe

# Database errors
psql -U postgres -d ctc_lms_prod -c "SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 5;"
```

---

**Remember**: Always backup before making changes!

For detailed information, see [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)
