# 🚀 Deployment Checklist for Reem Resort Hotel Management System

## Pre-Deployment Checks ✅

### 1. Code & Build
- [ ] All code committed to Git
- [ ] No console.log statements in production code (or controlled)
- [ ] All dependencies in package.json are correct
- [ ] Frontend builds successfully: `npm run build`
- [ ] Production test passes: `npm run test:production`

### 2. Environment Configuration
- [ ] Create `server/.env` from `server/.env.production.example`
- [ ] Update DATABASE credentials in `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Configure `FRONTEND_URL` for CORS
- [ ] Add Firebase service account (if using Firebase Auth)
- [ ] Set secure `JWT_SECRET` (if applicable)
- [ ] Set `SESSION_SECRET` (if using sessions)

### 3. Database Setup
- [ ] MySQL database created on production server
- [ ] Database user created with proper permissions
- [ ] Test database connection from local machine
- [ ] Run migrations: Check `server/migrations/` folder
- [ ] Seed initial data if needed
- [ ] Create database backups before deployment

### 4. Security Review
- [ ] Remove any hardcoded credentials
- [ ] CORS properly configured for production domain
- [ ] SQL queries use parameterized statements (✅ already done)
- [ ] User input validation in place
- [ ] Firebase Auth configured properly
- [ ] Role-based permissions working (MasterAdmin, FullAdmin, Admin, FrontDesk)
- [ ] `.env` file added to `.gitignore` (✅ should be done)

### 5. Testing
- [ ] Test all user roles (MasterAdmin, FullAdmin, Admin, FrontDesk)
- [ ] Test booking creation and editing
- [ ] Test invoice generation and PDF download
- [ ] Test payment recording
- [ ] Test reports and analytics
- [ ] Test permission-based access control
- [ ] Test "Access Denied" modals for restricted operations
- [ ] Test on different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices (responsive design)

---

## Deployment Steps 📦

### Option A: VPS Deployment (DigitalOcean, AWS, Linode)

#### Step 1: Prepare Server
```bash
# SSH into your VPS
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PM2 globally
npm install -g pm2

# Install Nginx
apt install -y nginx

# Install Git
apt install -y git
```

#### Step 2: Clone & Setup Project
```bash
# Create app directory
mkdir -p /var/www/reem-resort
cd /var/www/reem-resort

# Clone repository (or upload via SFTP)
git clone https://github.com/yourusername/reem-resort.git .

# Install dependencies
npm install
cd server && npm install && cd ..

# Create .env file
nano server/.env
# (Paste your production environment variables)
```

#### Step 3: Build Frontend
```bash
npm run build
# This creates dist/ folder with production-ready React app
```

#### Step 4: Configure PM2
```bash
# Create ecosystem config
nano ecosystem.config.cjs
```

Paste this configuration:
```javascript
module.exports = {
  apps: [{
    name: 'reem-resort',
    script: './server/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    }
  }]
};
```

Start with PM2:
```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup  # Follow the command it outputs
```

#### Step 5: Configure Nginx
```bash
nano /etc/nginx/sites-available/reem-resort
```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for long-running requests
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }
}
```

Enable site:
```bash
ln -s /etc/nginx/sites-available/reem-resort /etc/nginx/sites-enabled/
nginx -t  # Test configuration
systemctl restart nginx
```

#### Step 6: Setup SSL (Let's Encrypt)
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com -d www.your-domain.com
```

#### Step 7: Verify Deployment
- [ ] Visit http://your-domain.com
- [ ] Login with test credentials
- [ ] Create a test booking
- [ ] Generate a test invoice
- [ ] Download PDF
- [ ] Check all permissions work

---

### Option B: cPanel Deployment

#### Step 1: Build Locally
```bash
npm run build
```

#### Step 2: Upload Files via cPanel File Manager
1. Upload `dist/` folder contents to `public_html/`
2. Create `api/` folder in `public_html/`
3. Upload `server/` folder contents to `public_html/api/`

#### Step 3: Setup Node.js App in cPanel
1. Go to cPanel → "Setup Node.js App"
2. Create new application:
   - Node.js version: 18+
   - Application root: `api`
   - Application URL: `your-domain.com/api`
   - Application startup file: `index.js`

#### Step 4: Environment Variables
In cPanel Node.js App settings, add:
- `NODE_ENV=production`
- `PORT=4000`
- `MYSQL_HOST=localhost` (or your cPanel MySQL host)
- `MYSQL_USER=your_cpanel_mysql_user`
- `MYSQL_PASSWORD=your_password`
- `MYSQL_DATABASE=your_database_name`
- `FRONTEND_URL=https://your-domain.com`

#### Step 5: Create .htaccess for React Router
In `public_html/.htaccess`:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Don't rewrite API requests
  RewriteCond %{REQUEST_URI} ^/api/ [OR]
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
  
  # Redirect all other requests to index.html
  RewriteRule ^ /index.html [L]
</IfModule>
```

---

### Option C: Heroku Deployment

#### Step 1: Prepare for Heroku
Create `Procfile` in root:
```
web: NODE_ENV=production node server/index.js
```

#### Step 2: Deploy
```bash
heroku login
heroku create reem-resort
heroku addons:create cleardb:ignite  # MySQL database
heroku config:set NODE_ENV=production
git push heroku main
```

---

### Option D: Vercel (Frontend) + Railway (Backend)

#### Frontend on Vercel:
```bash
npm install -g vercel
vercel login
vercel --prod
```

#### Backend on Railway:
1. Go to railway.app
2. Create new project from GitHub
3. Add MySQL database
4. Set environment variables
5. Deploy

---

## Post-Deployment Verification ✅

### Functional Tests
- [ ] Homepage loads correctly
- [ ] Login works with all user roles
- [ ] Dashboard displays data
- [ ] Room management works (create, edit, delete)
- [ ] Booking system works (create, edit, view, checkout)
- [ ] Invoice generation works
- [ ] PDF download works
- [ ] Payment recording works
- [ ] Reports load correctly
- [ ] Permission system works (access denied modals)

### Performance Tests
- [ ] Page load times < 3 seconds
- [ ] API response times < 500ms
- [ ] PDF generation < 5 seconds
- [ ] Database queries optimized

### Security Tests
- [ ] HTTPS enabled (SSL certificate)
- [ ] CORS only allows your domain
- [ ] No sensitive data in browser console
- [ ] SQL injection protected
- [ ] XSS protected
- [ ] Role-based access working

### Monitoring Setup
- [ ] Setup error logging (e.g., Sentry)
- [ ] Setup uptime monitoring (e.g., UptimeRobot)
- [ ] Setup database backups (daily)
- [ ] Setup PM2 monitoring: `pm2 monitor`

---

## Maintenance Tasks 🔧

### Daily
- [ ] Check application logs: `pm2 logs`
- [ ] Monitor error rates
- [ ] Check database size

### Weekly
- [ ] Review application performance
- [ ] Check for security updates
- [ ] Backup database: `mysqldump -u user -p database > backup.sql`

### Monthly
- [ ] Update dependencies: `npm outdated`
- [ ] Review and clean logs
- [ ] Database optimization
- [ ] Security audit

---

## Rollback Plan 🔄

If something goes wrong:

1. **Revert to previous version:**
   ```bash
   pm2 stop reem-resort
   git checkout previous-commit-hash
   npm install && cd server && npm install
   npm run build
   pm2 restart reem-resort
   ```

2. **Restore database backup:**
   ```bash
   mysql -u user -p database < backup.sql
   ```

3. **Check logs:**
   ```bash
   pm2 logs reem-resort --lines 100
   ```

---

## Support & Troubleshooting 🆘

### Common Issues

**Issue: "Cannot connect to database"**
- Solution: Check `.env` file has correct credentials
- Verify MySQL server is running
- Check firewall allows connection on port 3306

**Issue: "404 on refresh"**
- Solution: Nginx not configured for React Router
- Check Nginx configuration has the `try_files` directive

**Issue: "CORS error"**
- Solution: Update `FRONTEND_URL` in `.env`
- Restart server: `pm2 restart reem-resort`

**Issue: "PDF download not working"**
- Solution: Check browser console for errors
- Verify invoice data is loading correctly
- Test in different browser

---

## Contact Information 📞

**Project:** Reem Resort Hotel Management System  
**Version:** 1.0.0  
**Last Updated:** [Current Date]  

For support, contact your system administrator.

---

**🎉 Congratulations on deploying your hotel management system!**
