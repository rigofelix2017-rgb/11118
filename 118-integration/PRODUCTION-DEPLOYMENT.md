# Production Deployment Checklist - void2

Complete deployment checklist for launching void2 to production.

## Pre-Deployment

### ✅ Code Review
- [ ] All PRs merged to main
- [ ] Code reviewed by team
- [ ] No console.log statements (or use production flag)
- [ ] No TODO/FIXME in critical paths
- [ ] TypeScript errors resolved
- [ ] Linting passes

### ✅ Testing Complete
- [ ] All tests passing (unit, integration, e2e)
- [ ] Manual QA complete (see TESTING-CHECKLIST.md)
- [ ] Browser compatibility verified (see BROWSER-COMPATIBILITY.md)
- [ ] Mobile testing complete (see MOBILE-TESTING-GUIDE.md)
- [ ] Performance benchmarks met
- [ ] Security audit passed

### ✅ Database
- [ ] Migrations tested in staging
- [ ] Backup strategy in place
- [ ] Rollback plan documented
- [ ] Connection pooling configured
- [ ] Indexes optimized
- [ ] Data seeded (if needed)

### ✅ Environment Variables
- [ ] Production .env configured
- [ ] API keys secured (not in repo)
- [ ] Database URLs correct
- [ ] Third-party service credentials
- [ ] Feature flags set
- [ ] CORS origins configured

### ✅ Assets & CDN
- [ ] Images optimized (WebP, compressed)
- [ ] Fonts subseted
- [ ] 3D models optimized
- [ ] Audio files compressed
- [ ] CDN configured (Cloudflare/CloudFront)
- [ ] Cache headers set correctly

### ✅ Security
- [ ] HTTPS enforced (redirect HTTP)
- [ ] CSP headers configured
- [ ] CORS properly restricted
- [ ] Rate limiting enabled
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF tokens (if applicable)
- [ ] Cookies secure (SameSite, Secure, HttpOnly)
- [ ] Dependencies updated (no vulnerabilities)

## Deployment Steps

### 1. Build Production Bundle

```bash
# Clean previous builds
rm -rf dist/

# Install dependencies
npm ci

# Run production build
npm run build

# Verify build
ls -lh dist/
```

**Checklist**:
- [ ] Build completes without errors
- [ ] Bundle size acceptable (< 5MB total)
- [ ] Source maps generated (for debugging)
- [ ] Assets fingerprinted (cache busting)

### 2. Test Production Build Locally

```bash
# Preview production build
npm run preview

# Open http://localhost:4173
# Test all critical features
```

**Checklist**:
- [ ] All features work
- [ ] No console errors
- [ ] Assets load from correct paths
- [ ] API calls work
- [ ] Authentication works

### 3. Deploy to Staging

```bash
# Deploy to staging environment
npm run deploy:staging

# Or manual upload
rsync -avz dist/ user@staging-server:/var/www/void2-staging/
```

**Checklist**:
- [ ] Staging environment matches production config
- [ ] SSL certificate valid
- [ ] Database connection works
- [ ] All features functional
- [ ] Performance acceptable

### 4. Smoke Test Staging

**Critical Paths**:
- [ ] Homepage loads
- [ ] Intro sequence plays
- [ ] Login/signup works
- [ ] Game world loads
- [ ] Movement controls work
- [ ] Chat functions
- [ ] Building modals open
- [ ] Audio plays
- [ ] Mobile controls work

### 5. Database Migration (if needed)

```bash
# Backup production database
pg_dump -h prod-db -U user -d void2_prod > backup-$(date +%Y%m%d).sql

# Run migrations
npm run db:migrate:production

# Verify migration
npm run db:verify
```

**Checklist**:
- [ ] Backup created and stored safely
- [ ] Migration ran successfully
- [ ] Data integrity verified
- [ ] Rollback script ready

### 6. Deploy to Production

```bash
# Deploy to production
npm run deploy:production

# Or manual deployment
rsync -avz dist/ user@prod-server:/var/www/void2/
```

**Checklist**:
- [ ] Files uploaded successfully
- [ ] Permissions correct (644 files, 755 dirs)
- [ ] Symlinks updated (if using blue-green)
- [ ] Server restarted (if needed)

### 7. Verify Production Deployment

**Immediate Checks** (within 5 minutes):
- [ ] Website accessible (https://yourdomain.com)
- [ ] SSL certificate valid (green padlock)
- [ ] Homepage loads without errors
- [ ] Critical features work
- [ ] No 500 errors in logs
- [ ] CDN serving assets correctly

### 8. Monitor Initial Launch

**First Hour**:
- [ ] Error rates normal (< 1%)
- [ ] Server CPU/memory acceptable
- [ ] Database connections healthy
- [ ] API response times good (< 200ms)
- [ ] No critical bugs reported
- [ ] User feedback positive

### 9. DNS & CDN

```bash
# Update DNS records (if needed)
# Point domain to production server

# Flush CDN cache
# Cloudflare: Purge All
# CloudFront: Create invalidation
```

**Checklist**:
- [ ] DNS propagated (use dnschecker.org)
- [ ] CDN cache purged
- [ ] Old assets no longer served
- [ ] New assets cached correctly

## Post-Deployment

### ✅ Monitoring Setup

**Error Tracking**:
- [ ] Sentry configured (or alternative)
- [ ] Error alerts set up
- [ ] Slack/Discord notifications
- [ ] PagerDuty (if 24/7 support)

**Analytics**:
- [ ] Google Analytics tracking
- [ ] User behavior tracking
- [ ] Conversion funnels
- [ ] Performance metrics (Core Web Vitals)

**Server Monitoring**:
- [ ] Uptime monitoring (Pingdom, UptimeRobot)
- [ ] CPU/memory alerts
- [ ] Disk space alerts
- [ ] Database performance

**Application Monitoring**:
- [ ] API endpoint monitoring
- [ ] Response time tracking
- [ ] Error rate alerts
- [ ] User session recording (if applicable)

### ✅ Rollback Plan

**If Critical Issues**:
1. Identify issue severity
2. Check if hotfix possible (< 30 min)
3. If not, rollback:

```bash
# Rollback deployment
git revert HEAD
npm run build
npm run deploy:production

# Or restore previous version
rsync -avz dist-backup/ user@prod-server:/var/www/void2/

# Rollback database (if needed)
psql -h prod-db -U user -d void2_prod < backup-YYYYMMDD.sql
```

**Checklist**:
- [ ] Previous version in dist-backup/
- [ ] Database backup recent (< 24hr)
- [ ] Rollback script tested
- [ ] Team notified of rollback

### ✅ Communication

**Internal**:
- [ ] Team notified of deployment
- [ ] Deploy notes shared (what changed)
- [ ] Known issues documented
- [ ] On-call schedule set

**External**:
- [ ] Users notified (if breaking changes)
- [ ] Changelog updated
- [ ] Social media announcement (if major)
- [ ] Support team briefed

### ✅ Documentation

- [ ] Deployment notes updated
- [ ] Architecture diagrams current
- [ ] API documentation updated
- [ ] User guides updated
- [ ] Troubleshooting guides current

## Production Environment Config

### Environment Variables (.env.production)

```bash
# App
NODE_ENV=production
VITE_APP_URL=https://yourdomain.com
VITE_API_URL=https://api.yourdomain.com

# Database
DATABASE_URL=postgresql://user:pass@prod-db:5432/void2_prod
DATABASE_SSL=true
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://prod-redis:6379
REDIS_TLS=true

# Auth
JWT_SECRET=<secure-random-string>
SESSION_SECRET=<secure-random-string>
COOKIE_SECURE=true

# Web3 (LAME)
COINBASE_API_KEY=<production-key>
COINBASE_API_SECRET=<production-secret>
WALLET_NETWORK=mainnet

# External Services
SENTRY_DSN=<your-sentry-dsn>
GA_TRACKING_ID=<google-analytics-id>

# Feature Flags
ENABLE_DEBUG=false
ENABLE_ANALYTICS=true
ENABLE_ERROR_TRACKING=true
```

### Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    root /var/www/void2/dist;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https: wss:;" always;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API proxy
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## Performance Optimization

### Build Optimization

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          babylon: ['@babylonjs/core'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-button']
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
});
```

### CDN Configuration

**Cloudflare**:
- [ ] Auto Minify (JS, CSS, HTML)
- [ ] Brotli compression
- [ ] Browser cache TTL: 4 hours
- [ ] Edge cache TTL: 2 hours
- [ ] Always Online enabled

**CloudFront**:
- [ ] Gzip/Brotli compression
- [ ] Cache behaviors configured
- [ ] Origin failover
- [ ] Lambda@Edge (if needed)

## Health Checks

### Application Health Endpoint

```typescript
// /api/health
app.get('/api/health', (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'ok', // Check DB connection
    redis: 'ok',    // Check Redis connection
    version: process.env.npm_package_version
  };
  res.json(health);
});
```

### Monitoring Checklist
- [ ] /api/health returns 200 OK
- [ ] Database connection active
- [ ] Redis connection active
- [ ] Disk space > 20% free
- [ ] Memory usage < 80%
- [ ] CPU usage < 70%

## Disaster Recovery

### Backup Strategy

**Database**:
- Daily full backups (retained 30 days)
- Hourly incremental backups (retained 7 days)
- Off-site backup storage

**Files**:
- Daily backups of /var/www/void2
- Version control (git) for code
- S3/GCS for asset backups

### Recovery Procedures

**Database Failure**:
1. Switch to read replica (if available)
2. Restore from latest backup
3. Verify data integrity
4. Update DNS to new primary

**Server Failure**:
1. Launch new server instance
2. Deploy latest code
3. Restore database connection
4. Update DNS records
5. Verify functionality

## Launch Day Checklist

**T-24 hours**:
- [ ] Final QA complete
- [ ] Team briefed
- [ ] Backup verified
- [ ] Rollback tested

**T-4 hours**:
- [ ] Build production bundle
- [ ] Test staging thoroughly
- [ ] Prepare deployment scripts

**T-1 hour**:
- [ ] Announce maintenance window (if needed)
- [ ] Database backup
- [ ] Clear CDN cache

**T-0 (Launch)**:
- [ ] Deploy to production
- [ ] Verify health checks
- [ ] Test critical paths
- [ ] Monitor errors

**T+1 hour**:
- [ ] Error rates normal
- [ ] Performance acceptable
- [ ] User feedback positive
- [ ] Team debriefing

## Success Metrics

**Technical**:
- Uptime > 99.9%
- API response time < 200ms (p95)
- Error rate < 0.1%
- Page load time < 3s

**Business**:
- User retention > 40%
- Session duration > 10min
- Conversion rate (if applicable)
- User satisfaction > 4/5

---

**Last Updated**: November 2025  
**Deployment Date**: TBD  
**Status**: ✅ Ready for Production Deployment
