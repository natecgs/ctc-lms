# Production Deployment Checklist

> Use this simplified checklist before deploying to production

## 1. Code & Build Quality

```bash
# Lint both frontend and backend
npm run lint
cd backend && npm run lint && cd ..

# Build both
npm run build
cd backend && npm run build && cd ..

# Check for vulnerabilities
npm audit
cd backend && npm audit && cd ..
```

- [ ] No lint errors or warnings
- [ ] Both builds complete successfully
- [ ] No npm security vulnerabilities
- [ ] All secrets removed from code
- [ ] No hardcoded API endpoints

## 2. Environment Setup

```bash
# Production backend .env
cp .env.production.example backend/.env.production

# Production frontend .env
cat > .env.production << EOF
VITE_API_URL=https://your-production-domain.com/api
VITE_ENV=production
EOF
```

- [ ] Backend `.env.production` configured with real values
- [ ] Frontend `.env.production` configured with real values
- [ ] JWT_SECRET generated: `openssl rand -base64 32`
- [ ] Database password is strong and unique
- [ ] SMTP credentials verified
- [ ] FRONTEND_URL matches domain name
- [ ] Database credentials match production database

## 3. Database Preparation

```bash
# Create production database
psql -U postgres -h your-db-host -c "CREATE DATABASE ctc_lms_prod;"

# Import schema
psql -U postgres -h your-db-host -d ctc_lms_prod -f backend/database/schema.sql

# Create restricted user
psql -U postgres -h your-db-host << EOF
CREATE USER lms_app WITH PASSWORD 'your-secure-password';
GRANT CONNECT ON DATABASE ctc_lms_prod TO lms_app;
GRANT USAGE ON SCHEMA public TO lms_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO lms_app;
EOF

# Create indices for performance
psql -U postgres -h your-db-host -d ctc_lms_prod << EOF
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_enrollments_user_course ON enrollments(user_id, course_id);
ANALYZE;
EOF
```

- [ ] Database `ctc_lms_prod` created
- [ ] Schema imported successfully
- [ ] Restricted database user created
- [ ] Indices created and analyzed
- [ ] Backup procedure tested

## 4. Server & Infrastructure

### Self-Hosted or Cloud VM

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL (if local)
sudo apt install -y postgresql

# Install Nginx
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2

# Setup SSL with Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
sudo certbot certonly --standalone -d your-domain.com
```

- [ ] Node.js 18+ installed
- [ ] PostgreSQL running (if self-hosted)
- [ ] Nginx installed and configured
- [ ] SSL certificate obtained
- [ ] Firewall configured (allow 80, 443, deny 5000, 5432)

### Docker Deployment

```bash
# Build Docker images
docker build -f Dockerfile.backend -t ctc-lms-backend .
docker build -f Dockerfile.frontend -t ctc-lms-frontend .

# Run with docker-compose
docker-compose up -d
```

- [ ] Docker and Docker Compose installed
- [ ] Dockerfiles created and tested
- [ ] docker-compose.yml configured
- [ ] Container registry access configured

## 5. Security Hardening

- [ ] HTTPS/SSL configured and working
- [ ] Security headers configured (Helmet.js)
- [ ] Rate limiting enabled
- [ ] CORS configured for production domain only
- [ ] Database SSL connections enabled
- [ ] Non-root user created for application
- [ ] File permissions restricted (600 for .env, 700 for dist)
- [ ] SSH key-based authentication only (no passwords)
- [ ] Firewall rules configured correctly
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented

## 6. Monitoring & Logging

```bash
# Install monitoring tools
npm install --save @sentry/node
npm install --save winston

# Setup log rotation
sudo apt install -y logrotate
# Configure /etc/logrotate.d/ctc-lms
```

- [ ] Error tracking (Sentry) configured
- [ ] Logging strategy implemented
- [ ] Log rotation configured
- [ ] Server monitoring set up (New Relic, Datadog, CloudWatch)
- [ ] Uptime monitoring configured (UptimeRobot, Pingdom)
- [ ] Alerts configured for critical errors
- [ ] Dashboard created for monitoring

## 7. Backup & Recovery

```bash
# Create backup script
cat > /path/to/backup-database.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/lms"
DB_NAME="ctc_lms_prod"
DB_USER="your-db-user"
DB_HOST="your-db-host"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump -U $DB_USER -h $DB_HOST $DB_NAME | gzip > $BACKUP_DIR/lms-full-$TIMESTAMP.sql.gz
find $BACKUP_DIR -name "lms-full-*.sql.gz" -mtime +30 -delete
EOF

chmod +x /path/to/backup-database.sh

# Schedule daily backups
crontab -e
# Add: 0 2 * * * /path/to/backup-database.sh
```

- [ ] Daily database backups configured and tested
- [ ] Backups stored in separate location (S3, external drive)
- [ ] Backup restoration tested
- [ ] Disaster recovery plan documented
- [ ] RTO and RPO targets defined

## 8. Final Verification

```bash
# Test backend health
curl https://your-domain.com/api/health

# Test frontend loads
curl https://your-domain.com/

# Test database connection
curl https://your-domain.com/api/courses

# Test authentication
curl -X POST https://your-domain.com/api/users/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'
```

- [ ] Backend API responds with 200 status
- [ ] Frontend loads without errors
- [ ] Database queries work correctly
- [ ] Authentication endpoints working
- [ ] SSL certificate valid (https://sslchecker.com)
- [ ] Security headers present
- [ ] CORS properly configured
- [ ] No console errors in browser
- [ ] No sensitive data in logs

## 9. Deployment

### Option A: Manual Deployment

```bash
# SSH into server
ssh user@your-server.com

# Clone code
git clone your-repo-url /app/ctc-lms
cd /app/ctc-lms

# Install dependencies
npm install
cd backend && npm install && npm run build && cd ..

# Build frontend
npm run build

# Start with PM2
pm2 start backend/dist/server.js --name "lms-backend"
pm2 start "npm run preview" --name "lms-frontend"
pm2 save
```

### Option B: Docker Deployment

```bash
docker-compose up -d --build
docker-compose logs -f
```

### Option C: CI/CD Deployment

- [ ] GitHub Actions / GitLab CI configured
- [ ] Automated tests run on push
- [ ] Automated deployment on master branch
- [ ] Rollback procedure documented

## 10. Go-Live Ready

- [ ] Team trained on deployment
- [ ] On-call rotation established
- [ ] Status page configured
- [ ] Incident response plan documented
- [ ] Customer communication plan ready
- [ ] Performance baseline established
- [ ] Gradual rollout plan (if applicable)

---

## Post-Deployment Tasks

After successful deployment:

```bash
# Monitor for 24-48 hours
watch -n 5 'curl -s https://your-domain.com/api/health'

# Check error logs
docker logs ctc-lms-backend
# or
pm2 logs lms-backend

# Monitor database
psql -U your-db-user -h your-db-host -d ctc_lms_prod -c "SELECT count(*) FROM users;"
```

- [ ] Monitor application logs for errors
- [ ] Monitor database performance
- [ ] Check user experience
- [ ] Verify all features working
- [ ] Document lessons learned
- [ ] Update internal documentation

---

## Emergency Contacts

- Database Administrator: [contact info]
- DevOps Lead: [contact info]
- On-Call Engineer: [contact info]
- ISP Support: [contact info]
- Cloud Provider Support: [contact info]

---

**Last Updated**: [DATE]
**Deployed By**: [NAME]
**Deployment Version**: [VERSION/COMMIT]
**Deployment Date**: [DATE]
**Status**: ✅ LIVE / 🟡 TESTING / ❌ FAILED
