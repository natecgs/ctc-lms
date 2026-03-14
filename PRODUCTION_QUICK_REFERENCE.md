# CTC LMS Production - Quick Reference Card

## 🎯 Deployment Decision Tree

```
START HERE
    ↓
Q: Want to test locally first?
├─ YES → Use Docker Compose
└─ NO → Go to Q2

Q2: Have a Linux server?
├─ YES → Use production-setup.sh
└─ NO → Use Docker or Cloud services

Q3: Need auto-scaling?
├─ YES → Use Cloud (Vercel/Railway/AWS)
└─ NO → Use Docker or Linux VPS
```

---

## 📦 Docker (5 Commands)

```bash
# 1. Configure
cp .env.production.example .env
nano .env  # Edit values

# 2. Build
docker-compose build

# 3. Start
docker-compose up -d

# 4. Check
docker-compose ps
curl http://localhost/api/health

# 5. View logs
docker-compose logs -f backend
```

---

## 🖥️ Linux VPS (5 Commands)

```bash
# 1. Setup
sudo bash scripts/production-setup.sh your-domain.com

# 2. Configure
sudo nano /app/ctc-lms/backend/.env.production

# 3. Initialize DB
psql -U postgres -d ctc_lms_prod -f backend/database/schema.sql

# 4. Deploy
sudo -u lms-app deploy-lms

# 5. Verify
check-lms-health
```

---

## 🔑 Required Secrets (Generate These)

```bash
# JWT Secret (32+ chars)
openssl rand -base64 32
# Copy this to: JWT_SECRET in .env

# Database Password
openssl rand -base64 24
# Copy this to: DB_PASSWORD in .env

# Alternatively, use any secure random string generator
```

---

## 📋 Pre-Deployment Commands

```bash
# Check code quality
npm run lint

# Build frontend
npm run build

# Build backend
cd backend && npm run build && npm audit && cd ..

# Check security vulnerabilities
npm audit
cd backend && npm audit && cd ..

# Check bundle size
du -sh dist/
du -sh backend/dist/
```

---

## 🚀 Health Check Commands

```bash
# API Health
curl https://your-domain.com/api/health

# Frontend
curl https://your-domain.com/

# Full health
check-lms-health  # VPS only

# Database
psql -U postgres -d ctc_lms_prod -c "SELECT 1;"

# Services
pm2 list          # VPS only
docker-compose ps # Docker
```

---

## 🔍 Troubleshooting Quick Fixes

| Problem | Fix |
|---------|-----|
| Port 5000 in use | `sudo fuser -k 5000/tcp` |
| Database won't connect | Check .env DB credentials |
| CORS errors | Verify FRONTEND_URL in .env |
| SSL certificate error | Run `sudo certbot renew` |
| Services won't start | Check logs: `pm2 logs` or `docker-compose logs` |

---

## 📊 File Permissions (VPS)

```bash
# Secret files (read/write owner only)
chmod 600 /app/ctc-lms/backend/.env.production

# Directories (read/write/execute owner only)
chmod 700 /app/ctc-lms

# Application files (read/execute)
chmod 755 /app/ctc-lms/dist/
chmod 644 /app/ctc-lms/dist/index.html
```

---

## 🔐 Security Basics

```
✅ NEVER commit .env files
✅ USE SSH keys for server access (no passwords)
✅ CHANGE default database password
✅ ROTATE secrets regularly
✅ ENABLE firewall (allow: 22, 80, 443 only)
✅ SETUP automatic backups
✅ ENABLE error tracking (Sentry)
✅ MONITOR logs regularly
```

---

## 📁 Critical Files Location

```
.env.production          ← Application secrets
backend/.env.production  ← Backend config
/backups/lms/           ← Database backups
/var/log/ctc-lms/       ← Application logs
/etc/nginx/             ← Web server config
```

---

## ⏰ Deployment Timeline

```
Docker:        30-45 min
Linux VPS:     60-90 min
Cloud:         90-120 min

All include:
- Configuration: 15 min
- Setup: 15-45 min
- Deployment: 10-20 min
- Testing: 10 min
```

---

## 📞 Emergency Commands

```bash
# Stop everything
pm2 stop all              # or
docker-compose down

# Restart
pm2 restart all           # or
docker-compose up -d

# View error logs
pm2 logs --err-only       # or
docker-compose logs backend --tail 100

# Database backup
backup-lms-db

# Restore from backup
psql -U postgres -d ctc_lms_prod < backup-20240101_020000.sql.gz
```

---

## 📖 Documentation Map

```
START → PRODUCTION_START_HERE.md
         ↓
READ → PRODUCTION_QUICKSTART.md (10 min)
       ↓
CHOOSE → Docker / Linux VPS / Cloud
         ↓
DEPLOY → Follow chosen method
         ↓
VERIFY → PRODUCTION_CHECKLIST.md
         ↓
MONITOR → PRODUCTION_DEPLOYMENT.md § Monitoring
```

---

## 🎯 Critical Configuration Values

```
NODE_ENV=production
PORT=5000
DB_HOST=your-db.example.com
DB_PORT=5432
DB_NAME=ctc_lms_prod
DB_USER=lms_app
DB_PASSWORD=***[GENERATE]***

JWT_SECRET=***[GENERATE]***
JWT_EXPIRY=7d
FRONTEND_URL=https://your-domain.com

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=***[APP PASSWORD]***
SMTP_FROM=noreply@your-domain.com

SENTRY_DSN=https://***[YOUR_DSN]***
```

---

## ✅ Go-Live Checklist (Last 5 items)

```
FINAL CHECKS:
☐ All services running: pm2 list or docker-compose ps
☐ Health check passing: curl /api/health
☐ HTTPS working: try https://your-domain.com
☐ Database connected: SELECT COUNT(*) FROM users;
☐ Backups configured and tested

THEN:
☐ Point DNS to server
☐ Monitor logs (first hour)
☐ Test user signup
☐ Verify email sending
☐ Check error tracking

DONE! 🎉
```

---

## 📱 Useful Links & Resources

- Node.js Docs: https://nodejs.org/docs/
- Nginx Docs: https://nginx.org/en/docs/
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Docker Docs: https://docs.docker.com/
- Let's Encrypt: https://letsencrypt.org/
- Sentry: https://sentry.io/

---

## 🆘 When Things Go Wrong

1. **Check logs first**
   ```bash
   pm2 logs lms-backend --err-only
   # or
   docker-compose logs backend --tail 50
   ```

2. **Common issues**
   - Database: Check .env credentials
   - CORS: Check FRONTEND_URL domain
   - SSL: Check certificate expiration
   - Memory: Check process heap size

3. **Get help**
   - See PRODUCTION_DEPLOYMENT.md § Troubleshooting
   - Check GitHub issues
   - Review server logs for error messages

---

## ⚡ TL;DR (Too Long; Didn't Read)

```
1. Read: PRODUCTION_QUICKSTART.md
2. Configure: Copy .env template and fill values
3. Generate: Secrets (JWT, DB password)
4. Deploy: One command (Docker or VPS)
5. Verify: Health checks pass
6. Monitor: Setup error tracking
7. Done: Go live! 🚀
```

---

**Print this page and keep it handy!** 📋
**Most deployments take 1-2 hours.** ⏱️
**Your LMS is production-ready!** ✅

Save this file to your bookmarks or print it out for easy reference during deployment.
