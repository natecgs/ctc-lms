# CTC LMS - Production Deployment Guide

Complete guide for deploying the CTC LMS application to a production server.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Configuration](#environment-configuration)
3. [Backend Setup](#backend-setup)
4. [Frontend Build](#frontend-build)
5. [Database Configuration](#database-configuration)
6. [Security Hardening](#security-hardening)
7. [Deployment Options](#deployment-options)
8. [Post-Deployment Verification](#post-deployment-verification)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Code Quality & Testing
- [ ] All code committed to version control (git)
- [ ] ESLint passes: `npm run lint` (frontend & backend)
- [ ] No console errors or warnings in development build
- [ ] Frontend builds successfully: `npm run build`
- [ ] Backend compiles: `cd backend && npm run build`
- [ ] All environment variables documented
- [ ] No hardcoded secrets in code
- [ ] API endpoints tested and working
- [ ] CORS configuration reviewed
- [ ] SSL/TLS certificates obtained (if using HTTPS)

### Dependencies
- [ ] All critical dependencies reviewed
- [ ] No vulnerable packages: `npm audit`
- [ ] Dependencies pinned to specific versions in package.json
- [ ] All backend packages installed
- [ ] All frontend packages installed

### Documentation
- [ ] API documentation complete
- [ ] Database schema documented
- [ ] Deployment procedures documented
- [ ] Rollback procedures documented
- [ ] Runbook created for common issues

---

## Environment Configuration

### Backend Environment Variables

Create `.env.production` or `.env` in the `backend/` directory:

```bash
# Server Configuration
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database Configuration
DB_HOST=your-production-db-host
DB_PORT=5432
DB_USER=your-db-user
DB_PASSWORD=your-secure-db-password
DB_NAME=ctc_lms_prod

# Frontend URL (for CORS)
FRONTEND_URL=https://your-production-domain.com

# JWT Configuration
JWT_SECRET=your-long-random-secure-secret-key-min-32-chars
JWT_EXPIRY=7d

# Email Configuration (Gmail, SendGrid, etc.)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM=noreply@your-domain.com

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Optional: Sentry for error tracking
SENTRY_DSN=your-sentry-dsn-url
```

### Frontend Environment Variables

Create `.env.production` in the root directory:

```bash
VITE_API_URL=https://your-production-domain.com/api
VITE_ENV=production
```

### Security Best Practices for Secrets

```bash
# Never commit .env files to git
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore

# Use environment variable tools:
# - GitHub Secrets (for GitHub Actions CI/CD)
# - AWS Secrets Manager (for AWS deployments)
# - HashiCorp Vault
# - Docker secrets (for Docker/Swarm)
# - 1Password/LastPass (for team sharing)
```

---

## Backend Setup

### 1. Install Production Dependencies

```bash
cd backend
npm install --production
# or
npm ci --production
```

### 2. Build TypeScript

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### 3. Optimize Backend Server

Update [backend/src/server.ts](backend/src/server.ts) for production:

```typescript
// Production-specific configurations
const NODE_ENV = process.env.NODE_ENV || 'production';

// Enhanced CORS for production
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600
};
app.use(cors(corsOptions));

// Disable x-powered-by header
app.disable('x-powered-by');

// Request logging
if (NODE_ENV === 'production') {
  app.use(morgan('combined')); // Detailed logging
} else {
  app.use(morgan('dev')); // Development logging
}

// Helmet security headers (already included)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
    },
  },
  hsts: { maxAge: 31536000 },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// Rate limiting
import rateLimit from 'express-rate-limit';
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
});
app.use('/api/', limiter);

// Compression
import compression from 'compression';
app.use(compression());
```

### 4. Database Connection Pool Tuning

Update [backend/src/db.ts](backend/src/db.ts):

```typescript
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  // Production pool settings
  max: 20,                          // Maximum connections
  min: 2,                           // Minimum connections
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  statement_timeout: 30000,
  // SSL for secure database connections
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: true } 
    : false
});
```

### 5. Add Missing Production Dependencies

```bash
cd backend
npm install compression express-rate-limit dotenv-vault --save-production
```

---

## Frontend Build

### 1. Production Build

```bash
npm run build
```

This creates optimized bundle in `dist/` directory.

### 2. Verify Build Size

```bash
npm run build
# Check bundle size
du -sh dist/
```

### 3. Build Optimization

Update [vite.config.ts](vite.config.ts):

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import compression from "vite-plugin-compression";

export default defineConfig(({ mode }) => ({
  server: {
    host: mode === 'production' ? undefined : "0.0.0.0",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'production' && compression({
      algorithm: 'gzip',
      ext: '.gz',
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    minify: 'terser',
    sourcemap: false, // Set to 'hidden' for production error tracking
    rollupOptions: {
      output: {
        // Chunk splitting for better caching
        manualChunks: {
          'react-vendors': ['react', 'react-dom'],
          'ui-components': ['@radix-ui/react-accordion', '@radix-ui/react-dialog'],
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log statements
        drop_debugger: true
      }
    }
  }
}));
```

### 4. Install Build Dependencies

```bash
npm install --save-dev vite-plugin-compression terser
```

---

## Database Configuration

### 1. Production Database Setup

```bash
# Create production database
psql -U postgres -h your-db-host -c "CREATE DATABASE ctc_lms_prod;"

# Import schema
psql -U postgres -h your-db-host -d ctc_lms_prod -f backend/database/schema.sql

# Verify tables
psql -U postgres -h your-db-host -d ctc_lms_prod -c "\dt"
```

### 2. Database Backups

Create a backup script (`backup-database.sh`):

```bash
#!/bin/bash
BACKUP_DIR="/backups/lms"
DB_NAME="ctc_lms_prod"
DB_USER="your-db-user"
DB_HOST="your-db-host"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Full database backup
pg_dump -U $DB_USER -h $DB_HOST $DB_NAME | gzip > $BACKUP_DIR/lms-full-$TIMESTAMP.sql.gz

# Keep only last 30 days of backups
find $BACKUP_DIR -name "lms-full-*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/lms-full-$TIMESTAMP.sql.gz"
```

Schedule with cron:
```bash
# Daily backup at 2 AM
0 2 * * * /path/to/backup-database.sh >> /var/log/lms-backup.log 2>&1
```

### 3. Database Optimization

```sql
-- Create indices for common queries
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course ON enrollments(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);

-- Analyze query performance
ANALYZE;
```

---

## Security Hardening

### 1. HTTPS/SSL Configuration

**Option A: Using Let's Encrypt with Nginx**

```nginx
server {
    listen 443 ssl http2;
    server_name your-production-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain/privkey.pem;

    # SSL hardening
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTP redirect to HTTPS
server {
    listen 80;
    server_name your-production-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### 2. Environment Isolation

```bash
# Restrict file permissions
chmod 600 .env.production
chmod 700 dist/

# Use non-root user (don't run as root)
useradd -m -s /bin/bash lms-app
chown -R lms-app:lms-app /app/ctc-lms
```

### 3. Authentication Security

- JWT tokens: Use HS256 or RS256 algorithm
- Token expiration: 7 days for access tokens, 30 days for refresh tokens
- Bcrypt rounds: 10-12 for password hashing
- Rate limiting: Enable on auth endpoints

### 4. Database Security

```sql
-- Create restricted database user (not admin)
CREATE USER lms_app WITH PASSWORD 'secure-random-password';
GRANT CONNECT ON DATABASE ctc_lms_prod TO lms_app;
GRANT USAGE ON SCHEMA public TO lms_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO lms_app;

-- Disable super user privileges
ALTER USER postgres ENCRYPTED PASSWORD 'new-secure-password';
```

### 5. Secrets Management

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate database password
openssl rand -base64 24

# Use in environment
export JWT_SECRET=$(openssl rand -base64 32)
export DB_PASSWORD=$(openssl rand -base64 24)
```

---

## Deployment Options

### Option 1: Self-Hosted (Linux VPS)

#### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

#### Step 2: Deploy Application

```bash
# Clone repository
git clone your-repo-url /app/ctc-lms
cd /app/ctc-lms

# Install dependencies
npm install
cd backend && npm install
npm run build
cd ..

# Build frontend
npm run build

# Setup PM2
pm2 start backend/dist/server.js --name "lms-backend"
pm2 start "npm run preview" --name "lms-frontend"
pm2 save
pm2 startup

# Configure Nginx (see HTTPS configuration above)
sudo nano /etc/nginx/sites-available/ctc-lms
sudo ln -s /etc/nginx/sites-available/ctc-lms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option 2: Docker Container

#### Dockerfile for Backend

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY backend/package*.json ./
RUN npm ci --production

# Copy source code
COPY backend/src ./src
COPY backend/tsconfig.json ./

# Build
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

#### Dockerfile for Frontend

```dockerfile
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    environment:
      NODE_ENV: production
      PORT: 5000
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: ${DB_NAME}
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "${BACKEND_PORT}:5000"

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    environment:
      VITE_API_URL: ${VITE_API_URL}
    ports:
      - "${FRONTEND_PORT}:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

Run: `docker-compose up -d`

### Option 3: Vercel (Frontend) + AWS RDS (Database) + Railway/Render (Backend)

#### Deploy Frontend to Vercel

```bash
npm install -g vercel
vercel

# Set environment variables in Vercel dashboard
# VITE_API_URL=https://your-backend-api.com
```

#### Deploy Backend to Railway/Render

1. Create account on Railway.app or Render.com
2. Connect GitHub repository
3. Configure environment variables
4. Deploy

### Option 4: AWS Deployment

#### Using AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p node.js-18 ctc-lms -r us-east-1

# Create environment
eb create production

# Set environment variables
eb setenv DB_HOST=your-rds-endpoint DB_NAME=ctc_lms_prod

# Deploy
eb deploy
```

---

## Post-Deployment Verification

### 1. Health Checks

```bash
# Backend health check
curl https://your-production-domain.com/api/health

# Frontend check
curl https://your-production-domain.com/

# Database connectivity
curl https://your-production-domain.com/api/courses
```

### 2. SSL Certificate Verification

```bash
# Check SSL certificate
openssl s_client -connect your-production-domain.com:443

# Verify certificate validity
curl -I https://your-production-domain.com/
# Look for: HTTP/2 200 and valid certificate
```

### 3. Performance Checks

```bash
# Check server response time
time curl https://your-production-domain.com/

# Load testing (optional)
ab -n 1000 -c 10 https://your-production-domain.com/

# SEO check
curl -I https://your-production-domain.com/
# Verify: X-Robots-Tag not set to noindex
```

### 4. Security Validation

```bash
# Test SSL configuration
curl -I --insecure https://your-production-domain.com/
# Check for security headers

# Check HSTS
curl -I https://your-production-domain.com/ | grep Strict-Transport-Security

# Test CORS
curl -H "Origin: https://other-domain.com" https://your-production-domain.com/api/
# Should reject or handle appropriately
```

### 5. Functional Testing

```bash
# List courses
curl https://your-production-domain.com/api/courses

# User authentication
curl -X POST https://your-production-domain.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Create course
curl -X POST https://your-production-domain.com/api/courses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"Test course"}'
```

---

## Monitoring & Maintenance

### 1. Error Tracking

**Setup Sentry (error tracking)**

```bash
npm install --save @sentry/node
```

In backend/src/server.ts:
```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

### 2. Logging Strategy

```bash
# Install logging package
npm install winston
```

Create logger utility:
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'exceptions.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;
```

### 3. Monitoring Tools

- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Performance Monitoring**: New Relic, Datadog, AWS CloudWatch
- **Log Aggregation**: ELK Stack, Splunk
- **APM**: PM2 Plus, New Relic, Datadog

### 4. Scheduled Tasks

**Database maintenance**
```bash
# Run monthly
VACUUM ANALYZE;
REINDEX DATABASE ctc_lms_prod;
```

**Log rotation**
```bash
# Configure logrotate
cat > /etc/logrotate.d/ctc-lms << EOF
/var/log/lms/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 lms-app lms-app
    sharedscripts
    postrotate
        systemctl reload lms-backend > /dev/null 2>&1 || true
    endscript
}
EOF
```

### 5. Regular Backups

```bash
# Daily automated backups
0 2 * * * /path/to/backup-database.sh

# Weekly backup to S3
0 3 * * 0 /path/to/backup-to-s3.sh

# Monthly backup to external storage
0 4 1 * * /path/to/backup-to-external.sh
```

---

## Troubleshooting

### Issue: Database Connection Fails

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify credentials
psql -U your-db-user -h your-db-host -d ctc_lms_prod -c "SELECT 1;"

# Check environment variables
cd backend && npm run dev 2>&1 | grep DB_
```

### Issue: CORS Errors

```typescript
// In backend/src/server.ts, update CORS config:
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

### Issue: SSL Certificate Errors

```bash
# Check certificate expiration
openssl x509 -in /etc/letsencrypt/live/your-domain/cert.pem -text -noout | grep Not

# Auto-renew (Let's Encrypt)
sudo certbot renew --dry-run
sudo systemctl enable certbot.timer
```

### Issue: Slow Performance

```bash
# Check connection pool
ps aux | grep node

# Analyze slow queries
sudo -u postgres psql -d ctc_lms_prod -c "\x" -c "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# Check disk space
df -h
```

### Issue: High Memory Usage

```bash
# Check Node process memory
node --max-old-space-size=2048 dist/server.js

# Get heap snapshot
node --inspect dist/server.js
# Then use Chrome DevTools
```

---

## Deployment Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Database backups tested and working
- [ ] SSL/TLS certificate installed and valid
- [ ] Rate limiting enabled
- [ ] Email service configured
- [ ] Error tracking (Sentry) configured
- [ ] Logging configured
- [ ] Monitoring/alerting set up
- [ ] Firewall rules configured
- [ ] Database replicated (for high availability)
- [ ] Monitoring dashboard created
- [ ] On-call rotation documented
- [ ] Incident response plan created
- [ ] Disaster recovery plan documented
- [ ] Load testing completed
- [ ] Security audit completed
- [ ] All APIs tested in production
- [ ] User acceptance testing (UAT) completed

---

## Next Steps

1. Choose a deployment option (self-hosted, Docker, cloud)
2. Prepare production environment
3. Configure all environment variables
4. Set up database
5. Deploy backend
6. Deploy frontend
7. Run verification checks
8. Set up monitoring
9. Plan rollback procedure
10. Go live!

For questions or issues, refer to individual service documentation:
- Node.js: https://nodejs.org/docs/
- PostgreSQL: https://www.postgresql.org/docs/
- Nginx: https://nginx.org/docs/
- Docker: https://docs.docker.com/
