# 🚀 CyberPanel Deployment Guide - Ready to Deploy!

## ✅ Build Completed Successfully!

Your application has been built and is ready for deployment to CyberPanel.

---

## 📦 What's Ready

✅ **Frontend Built** - `dist/` folder contains production files  
✅ **Backend Ready** - `server/` folder contains Node.js API  
✅ **Database Configured** - MySQL credentials set for CyberPanel  
✅ **Environment Files** - `.env.example` ready for production  

---

## 🎯 Quick Deployment Steps

### Step 1: Access Your CyberPanel Server

```bash
# SSH into your server
ssh root@your-server-ip
# Or
ssh your-username@your-server-ip
```

### Step 2: Navigate to Your Website Directory

```bash
# For main domain
cd /home/admin.reemresort.com/public_html

# OR for subdomain (if you created one)
cd /home/your-domain.com/public_html
```

### Step 3: Upload Your Files

**Option A: Using Git (Recommended)**
```bash
# Clone the repository
git clone https://github.com/siam-hossain-cmd/invoice-reel-resort.git .

# Or pull if already cloned
git pull origin main
```

**Option B: Using FTP/SFTP**
- Upload the entire project folder
- Make sure to include:
  - `dist/` folder (frontend build)
  - `server/` folder (backend)
  - `package.json`
  - `ecosystem.config.cjs`

### Step 4: Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### Step 5: Configure Environment

```bash
cd server
cp .env.example .env
nano .env
```

**Paste this configuration:**
```bash
PORT=4000
NODE_ENV=production

# CyberPanel MySQL Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=admin_reem
MYSQL_PASSWORD=jFm@@qC2MGdGb7h-
MYSQL_DATABASE=admin_reemresort

# Firebase (Optional - if you're using Firebase Auth)
# FIREBASE_SERVICE_ACCOUNT_JSON=...
```

**Save and exit:** Press `Ctrl+X`, then `Y`, then `Enter`

### Step 6: Initialize Database

```bash
cd server

# Test database connection
node scripts/test_connection.js

# Run migrations to create tables
node scripts/run_migrations.js

cd ..
```

### Step 7: Build Frontend (if not done locally)

```bash
npm run build
```

### Step 8: Install PM2 (if not installed)

```bash
npm install -g pm2
```

### Step 9: Start the Application

```bash
# Start with PM2
pm2 start ecosystem.config.cjs

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the command it gives you
```

### Step 10: Configure Web Server

**For CyberPanel with OpenLiteSpeed:**

1. **Serve Frontend Files:**
   - CyberPanel will automatically serve files from `public_html/`
   - Copy built files: `cp -r dist/* /home/admin.reemresort.com/public_html/`

2. **Setup API Proxy:**

Create/edit rewrite rules in CyberPanel:
- Go to: **Websites → List Websites → Your Domain → Rewrite Rules**

Add this rewrite rule:
```
RewriteEngine On

# API requests to backend
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ http://127.0.0.1:4000/api/$1 [P,L]

# All other requests to index.html (for React Router)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

3. **Restart Web Server:**
```bash
systemctl restart lsws
```

---

## 🔍 Verify Deployment

### Check Backend is Running
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs reem-resort

# Test API endpoint
curl http://localhost:4000/api/health
```

### Check Frontend
```bash
# Visit your domain
https://admin.reemresort.com
# Or
http://your-domain.com
```

### Test Login
1. Open your website
2. Try logging in with your credentials
3. Check if dashboard loads

---

## 📊 Post-Deployment Checklist

- [ ] Backend is running (check with `pm2 status`)
- [ ] Database connection works
- [ ] Frontend loads correctly
- [ ] Login works
- [ ] Dashboard displays data
- [ ] Bookings page works
- [ ] Invoice generation works
- [ ] PDF downloads work
- [ ] All API endpoints respond

---

## 🛠️ Useful Commands

### PM2 Management
```bash
pm2 list                    # List all processes
pm2 status                  # Show status
pm2 logs reem-resort        # View logs
pm2 restart reem-resort     # Restart app
pm2 stop reem-resort        # Stop app
pm2 delete reem-resort      # Remove app
pm2 monit                   # Monitor in real-time
```

### Database Management
```bash
# Backup database
mysqldump -u admin_reem -p admin_reemresort > backup_$(date +%Y%m%d).sql

# Restore database
mysql -u admin_reem -p admin_reemresort < backup_20241113.sql

# Connect to database
mysql -u admin_reem -p admin_reemresort
```

### Update Application
```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install
cd server && npm install && cd ..

# Rebuild frontend
npm run build

# Copy to web root
cp -r dist/* /home/admin.reemresort.com/public_html/

# Restart backend
pm2 restart reem-resort
```

---

## 🔧 Troubleshooting

### Backend Not Starting
```bash
# Check logs
pm2 logs reem-resort

# Check if port is in use
lsof -i :4000

# Check database connection
cd server
node scripts/test_connection.js
```

### Frontend Not Loading
```bash
# Check if files are in public_html
ls -la /home/admin.reemresort.com/public_html/

# Check web server
systemctl status lsws

# Restart web server
systemctl restart lsws
```

### API Errors (CORS/Connection)
```bash
# Check if backend is running
pm2 status

# Check backend logs
pm2 logs reem-resort

# Test API directly
curl http://localhost:4000/api/health
```

### Database Connection Failed
```bash
# Verify credentials
mysql -u admin_reem -p admin_reemresort

# Check .env file
cat server/.env

# Test connection script
cd server
node scripts/test_connection.js
```

---

## 🔐 Security Checklist

- [ ] Changed default database password
- [ ] Created strong admin user password
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] Firewall enabled
- [ ] Only necessary ports open (80, 443)
- [ ] Database not accessible from outside
- [ ] `.env` file not publicly accessible
- [ ] Regular backups scheduled

---

## 📈 Performance Tips

1. **Enable Gzip Compression** (in CyberPanel)
2. **Enable Caching** (in CyberPanel)
3. **Use CDN** for static assets (optional)
4. **Monitor with PM2**: `pm2 monit`
5. **Setup Log Rotation**: `pm2 install pm2-logrotate`

---

## 🎉 You're All Set!

Your Reem Resort Hotel Management System is now deployed on CyberPanel!

**Access your application at:**
- Frontend: `https://admin.reemresort.com` (or your domain)
- Backend API: `https://admin.reemresort.com/api`

**Default Test Login:**
- Check your database for admin users
- Or create one through the registration page

---

## 📞 Need Help?

- Check PM2 logs: `pm2 logs reem-resort`
- Check web server logs: `/usr/local/lsws/logs/error.log`
- Check database: `mysql -u admin_reem -p admin_reemresort`

---

**Deployment Date:** November 13, 2025  
**Version:** Production Ready  
**Status:** ✅ Ready to Deploy
