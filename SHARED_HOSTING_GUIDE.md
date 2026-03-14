# Shared Hosting Deployment Guide (Non-Root User)

> Deploy CTC LMS on shared hosting without root access

## Prerequisites

Before starting, you need:

- [ ] SSH access to your hosting account
- [ ] **Node.js installed** (ask your provider or install in home directory)
- [ ] **External PostgreSQL database** (managed service like AWS RDS, DigitalOcean, Heroku)
- [ ] **Web server pre-configured** (cPanel, Plesk, or basic Nginx/Apache)
- [ ] **Git access** (optional, but recommended)
- [ ] **PM2 Node.js process manager** (will be installed)

---

## Key Differences from Full VPS

| Feature | VPS | Shared Hosting |
|---------|-----|---|
| System packages | ✅ Can install | ❌ Pre-installed only |
| Firewall control | ✅ Full control | ❌ Managed by provider |
| PostgreSQL | ✅ Local install | ❌ Use managed service |
| Web server | ✅ Configure from scratch | ❌ Already configured |
| Root access | ✅ Yes | ❌ No |
| Node.js | ✅ Install freely | ⚠️ Check availability |
| Process manager | ✅ systemd | ✅ PM2 (user-level) |

---

## Step 1: SSH into Your Hosting Account

```bash
ssh username@your-host.com

# Navigate to home directory
cd ~
pwd  # Should show something like /home/username
```

---

## Step 2: Check Node.js is Available

```bash
node --version
npm --version
```

**If Node.js is not installed:**

Contact your hosting provider to install it, or:

```bash
# Install Node.js in home directory (nvm method)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
```

---

## Step 3: Run the Shared Hosting Setup Script

```bash
# Clone the repository or download it
git clone https://github.com/natecgs/ctc-lms.git ~/ctc-lms
cd ~/ctc-lms

# Run the shared hosting setup script (NO sudo needed!)
bash scripts/shared-hosting-setup.sh your-domain.com

# Wait for setup to complete (10-15 minutes)
```

---

## Step 4: Create External PostgreSQL Database

Since you can't install PostgreSQL locally on shared hosting, use a managed service:

### Option A: AWS RDS

```bash
# 1. Create database in AWS RDS console
# 2. Get connection string: your-db-identifier.xxx.us-east-1.rds.amazonaws.com
# 3. Create database and user

psql -h your-db-endpoint.rds.amazonaws.com -U postgres -c "CREATE DATABASE ctc_lms_prod;"

psql -h your-db-endpoint.rds.amazonaws.com -U postgres -c "CREATE USER lms_app WITH PASSWORD 'your-password';"

# Import schema
psql -h your-db-endpoint.rds.amazonaws.com -U postgres -d ctc_lms_prod -f backend/database/schema.sql

# Grant permissions
psql -h your-db-endpoint.rds.amazonaws.com -U postgres -d ctc_lms_prod << EOF
GRANT CONNECT ON DATABASE ctc_lms_prod TO lms_app;
GRANT USAGE ON SCHEMA public TO lms_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO lms_app;
EOF
```

### Option B: DigitalOcean Managed Database

```bash
# Get connection string from DigitalOcean dashboard
# Format: dbname.xxxxx.db.ondigitalocean.com:25060

psql -h dbname.xxxxx.db.ondigitalocean.com -p 25060 -U doadmin "sslmode=require dbname=defaultdb" << EOF
CREATE DATABASE ctc_lms_prod;
GRANT CREATE ON DATABASE postgres TO doadmin;
\c ctc_lms_prod
CREATE SCHEMA IF NOT EXISTS public;
EOF
```

### Option C: Heroku Postgres

```bash
# Get DATABASE_URL from Heroku
heroku pg:psql --app your-app << EOF
CREATE DATABASE ctc_lms_prod;
EOF
```

---

## Step 5: Configure Environment

```bash
cd ~/ctc-lms/app

# Copy template
cp .env.production.example .env.production

# Edit with your values
nano .env.production
```

**Critical values:**
```bash
# External database credentials
DB_HOST=your-db-endpoint.aws.com
DB_PORT=5432
DB_USER=lms_app
DB_PASSWORD=your-secure-password
DB_NAME=ctc_lms_prod

# Frontend URL
FRONTEND_URL=https://your-domain.com

# Generate JWT secret
openssl rand -base64 32
# Copy output to JWT_SECRET

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@your-domain.com
```

---

## Step 6: Start Services with PM2

```bash
cd ~/ctc-lms/app

# Start services using ecosystem config
./node_modules/.bin/pm2 start ecosystem.config.js

# Save PM2 config for auto-restart (if hosting supports)
./node_modules/.bin/pm2 save

# Check status
./node_modules/.bin/pm2 list

# View logs
./node_modules/.bin/pm2 logs
```

---

## Step 7: Configure Web Server

### For cPanel Users

1. Go to **cPanel → Addon Domains** or **Parked Domains**
2. Point your domain to a public directory (or use subdomain)
3. Create `.htaccess` file in public directory:

```apache
# .htaccess for reverse proxy to Node.js

<IfModule mod_proxy.c>
    ProxyPreserveHost On
    ProxyPass /api http://127.0.0.1:5000/api
    ProxyPassReverse /api http://127.0.0.1:5000/api
    ProxyPass / http://127.0.0.1:8080/
    ProxyPassReverse / http://127.0.0.1:8080/
</IfModule>

# Serve static files first
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ index.html [L]
</IfModule>
```

### For Plesk Users

1. Go to **Domains → Your Domain**
2. Under **Hosting & Traffic**, find **Application Servers**
3. Add Node.js application pointing to port 5000 and 8080
4. Configure SSL certificate

### Manual Nginx/Apache

Contact your hosting provider for custom web server configuration to proxy:
- `http://127.0.0.1:5000` for backend API
- `http://127.0.0.1:8080` for frontend

---

## Step 8: Setup Automated Backups

```bash
# Edit your personal crontab
crontab -e

# Add this line for daily backups at 2 AM:
0 2 * * * ~/ctc-lms/scripts/backup-lms-db.sh >> ~/ctc-lms/logs/backup.log 2>&1

# Or run manually anytime:
~/ctc-lms/scripts/backup-lms-db.sh
```

---

## Verification

```bash
# Check services running
~/ctc-lms/app/node_modules/.bin/pm2 list

# Test API
curl http://localhost:5000/api/health

# Test frontend
curl http://localhost:8080/

# Health check
~/ctc-lms/scripts/health-check.sh

# View error logs
~/ctc-lms/app/node_modules/.bin/pm2 logs lms-backend --err-only
```

---

## Useful Commands

```bash
# View logs
~/ctc-lms/app/node_modules/.bin/pm2 logs

# Restart services
~/ctc-lms/app/node_modules/.bin/pm2 restart all

# Stop services
~/ctc-lms/app/node_modules/.bin/pm2 stop all

# Deploy updates
~/ctc-lms/scripts/deploy.sh

# Health check
~/ctc-lms/scripts/health-check.sh

# Database backup
~/ctc-lms/scripts/backup-lms-db.sh

# Monitor processes
~/ctc-lms/app/node_modules/.bin/pm2 monit
```

---

## Troubleshooting

### "PM2 command not found"
```bash
~/${APP_DIR}/node_modules/.bin/pm2 list
```

### "Port 5000 already in use"
```bash
# Find process using port 5000
lsof -i :5000

# Kill if necessary
kill -9 <PID>
```

### "Database connection refused"
```bash
# Test database connection
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1;"

# Verify environment variables
grep DB_ ~/ctc-lms/app/.env.production

# Check firewall allows outgoing DB connection
# (Contact hosting provider if needed)
```

### "Node.js out of memory"
```bash
# Check available memory
free -h

# Increase Node.js heap size
export NODE_OPTIONS="--max-old-space-size=512"
~/ctc-lms/app/node_modules/.bin/pm2 restart all
```

### "Disk space full"
```bash
# Check disk usage
df -h

# Clean old backups manually
ls -lh ~/ctc-lms/backups/
rm ~/ctc-lms/backups/lms-full-OLD_DATE.sql.gz
```

---

## Shared Hosting Limitations & Solutions

| Limitation | Solution |
|-----------|----------|
| Limited disk space | Use external backups (S3, Dropbox) |
| Limited memory | Monitor usage, adjust PM2 instances |
| No root/systemd | Use crontab for restarts instead |
| Inactivity timeout | Keep-alive script or background job |
| Email restrictions | Use external SMTP (Gmail, SendGrid) |
| Restart on reboot | Ask hosting provider or use keep-alive |

---

## Security Checklist

- [ ] `.env.production` file permissions: `chmod 600 .env.production`
- [ ] Database password changed from default
- [ ] JWT_SECRET is random and strong
- [ ] SMTP credentials from app-specific password
- [ ] Firewall allows HTTPS only
- [ ] Regular database backups tested
- [ ] Log files cleaned periodically
- [ ] PM2 error logs monitored

---

## Advanced: Custom Domain with SSL

```bash
# If hosting provider offers free SSL (Let's Encrypt):

# Ask hosting provider to issue SSL certificate for your domain
# Usually automated in cPanel/Plesk

# Then update your .env.production:
FRONTEND_URL=https://your-domain.com  # Use HTTPS

# And configure htaccess/nginx to use SSL
```

---

## Monthly Maintenance

```bash
# 1. Check and update dependencies
cd ~/ctc-lms/app
npm audit
npm update --production

# 2. Verify backups exist
ls -lh ~/ctc-lms/backups/ | head -10

# 3. Monitor disk usage
du -sh ~/ctc-lms/*

# 4. Check PM2 processes
~/ctc-lms/app/node_modules/.bin/pm2 list

# 5. Review error logs
~/ctc-lms/app/node_modules/.bin/pm2 logs lms-backend --err-only | head -20
```

---

## When to Upgrade to Full VPS

Consider upgrading from shared hosting if:

- You need more CPU/memory (apps running slow)
- You want full system control
- You need to install additional tools
- You have very high traffic
- You want better security isolation
- You need multiple applications

Recommended VPS providers: DigitalOcean, Linode, AWS, Vultr

---

**Ready?** Run: `bash scripts/shared-hosting-setup.sh your-domain.com`

For more detailed information, see [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)
