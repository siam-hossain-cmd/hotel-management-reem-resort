# 🚀 Quick Command Reference

## Local Testing

```bash
# Test production build locally
./test-production.sh

# Or manually:
npm run build
npm run start:production
# Visit http://localhost:4000
```

## Build Commands

```bash
npm run build:production        # Build frontend for production
npm run dev                     # Run development mode (frontend + backend)
npm run lint                    # Check code quality
```

## VPS Deployment

```bash
# Initial setup
npm install
cd server && npm install && cd ..
npm run build
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup

# Updates
git pull
npm install && cd server && npm install && cd ..
npm run build
pm2 restart reem-resort
```

## PM2 Commands

```bash
pm2 status                      # Show all running apps
pm2 logs reem-resort            # View logs in real-time
pm2 restart reem-resort         # Restart application
pm2 stop reem-resort            # Stop application
pm2 delete reem-resort          # Remove from PM2
pm2 monit                       # Real-time monitoring
pm2 save                        # Save current process list
```

## Nginx Commands

```bash
# Test configuration
nginx -t

# Restart Nginx
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## Database Commands

```bash
# Backup
mysqldump -h 216.104.47.118 -u reemresort_admin -p reemresort_hotel_db > backup.sql

# Restore
mysql -h 216.104.47.118 -u reemresort_admin -p reemresort_hotel_db < backup.sql

# Connect
mysql -h 216.104.47.118 -u reemresort_admin -p reemresort_hotel_db
```

## SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test renewal
sudo certbot renew --dry-run
```

## Git Commands

```bash
# Check status
git status

# Commit changes
git add .
git commit -m "Description"
git push

# Pull updates
git pull origin main
```

## System Monitoring

```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top

# Check running processes
ps aux | grep node

# Check port usage
lsof -i :4000
```

## Environment Setup

```bash
# Copy environment template
cp server/.env.production.example server/.env

# Edit environment variables
nano server/.env

# Required variables:
# NODE_ENV=production
# PORT=4000
# MYSQL_HOST=216.104.47.118
# MYSQL_USER=reemresort_admin
# MYSQL_PASSWORD=your-password
# MYSQL_DATABASE=reemresort_hotel_db
# FRONTEND_URL=https://your-domain.com
```

## Troubleshooting

```bash
# Check if port is in use
lsof -i :4000

# Kill process on port
kill -9 $(lsof -t -i:4000)

# Check Node.js version
node -v

# Check npm version
npm -v

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Heroku Deployment

```bash
# Login
heroku login

# Create app
heroku create reem-resort

# Add MySQL
heroku addons:create cleardb:ignite

# Deploy
git push heroku main

# View logs
heroku logs --tail

# Open app
heroku open
```

## cPanel Deployment

```bash
# Build locally
npm run build

# Upload via File Manager or FTP:
# - dist/* → public_html/
# - server/* → public_html/api/

# In cPanel:
# 1. Setup Node.js App
# 2. Set Application Root: api
# 3. Set Startup File: index.js
# 4. Add environment variables
# 5. Restart app
```

## Quick Health Checks

```bash
# Check server is running
curl http://localhost:4000/_health

# Check website is accessible
curl -I https://your-domain.com

# Check SSL certificate
curl -vI https://your-domain.com

# Check database connection
mysql -h 216.104.47.118 -u reemresort_admin -p -e "SELECT 1"
```

## Backup & Restore

```bash
# Full backup (code + database)
tar -czf reem-resort-backup-$(date +%Y%m%d).tar.gz \
    --exclude=node_modules \
    --exclude=dist \
    /var/www/reem-resort

mysqldump -h 216.104.47.118 -u reemresort_admin -p \
    reemresort_hotel_db > db-backup-$(date +%Y%m%d).sql

# Restore
tar -xzf reem-resort-backup-20240101.tar.gz
mysql -h 216.104.47.118 -u reemresort_admin -p \
    reemresort_hotel_db < db-backup-20240101.sql
```

---

**🔗 Full Documentation:**
- `DEPLOYMENT_READY_SUMMARY.md` - Start here!
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step guide
- `DEPLOYMENT_GUIDE.md` - Detailed platform guides
- `PRODUCTION_README.md` - Production operations
