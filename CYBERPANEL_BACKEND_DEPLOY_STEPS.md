# 🚀 CyberPanel Backend Deployment - Step by Step

## Quick Overview
Your frontend is already deployed at `https://admin.reemresort.com`  
Now we need to deploy the backend so API calls work.

---

## 📋 Prerequisites

- ✅ CyberPanel server access (server.reemresort.com)
- ✅ SSH credentials for the server
- ✅ Domain: admin.reemresort.com already pointing to server
- ✅ Database: admin_reemresort already created and configured

---

## 🔧 Step-by-Step Deployment

### Step 1: Prepare Files Locally

```bash
# Navigate to your project
cd "/Users/siamhossain/Project/REEM RESORT 2"

# Create production environment file
cat > server/.env.production << 'EOF'
NODE_ENV=production
PORT=4000

# Database
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=admin_reem
MYSQL_PASSWORD=jFm@@qC2MGdGb7h-
MYSQL_DATABASE=admin_reemresort

# Frontend
FRONTEND_URL=https://admin.reemresort.com
FIREBASE_ADMIN_SDK=false
EOF

# Package the server folder (without node_modules)
tar -czf backend.tar.gz server/ --exclude='server/node_modules'

echo "✅ Backend package ready: backend.tar.gz"
```

---

### Step 2: Upload to Server

**Option A: Using SCP (Terminal)**
```bash
# Upload the package
scp backend.tar.gz root@server.reemresort.com:/home/admin.reemresort.com/public_html/

# Or if using admin user:
scp backend.tar.gz admin@server.reemresort.com:/home/admin.reemresort.com/public_html/
```

**Option B: Using FileZilla (GUI)**
1. Open FileZilla
2. Connect to: `server.reemresort.com`
3. Username: `root` or `admin`
4. Port: `22` (SFTP)
5. Upload `backend.tar.gz` to `/home/admin.reemresort.com/public_html/`

**Option C: CyberPanel File Manager**
1. Login to CyberPanel: `https://server.reemresort.com:8090`
2. Go to: File Manager → admin.reemresort.com
3. Upload `backend.tar.gz`

---

### Step 3: SSH into Server

```bash
# Connect to your CyberPanel server
ssh root@server.reemresort.com

# Or if using admin:
ssh admin@server.reemresort.com
```

---

### Step 4: Extract and Setup

```bash
# Navigate to website directory
cd /home/admin.reemresort.com/public_html

# Extract the backend
tar -xzf backend.tar.gz

# Copy production environment file
cp server/.env.production server/.env

# Install dependencies
cd server
npm install --production

# Go back to root
cd ..
```

---

### Step 5: Install PM2 (Process Manager)

```bash
# Install PM2 globally (if not installed)
npm install -g pm2

# Verify installation
pm2 -v
```

---

### Step 6: Start Backend

```bash
# Start the backend server
cd /home/admin.reemresort.com/public_html
pm2 start server/index.js --name "reem-resort-api"

# Save PM2 process list
pm2 save

# Setup PM2 to start on server reboot
pm2 startup

# Check status
pm2 status

# View logs
pm2 logs reem-resort-api
```

**You should see:**
```
✅ MySQL pool created and tested successfully!
🚀 Server running in PRODUCTION mode
📡 Server listening on port 4000
```

---

### Step 7: Test Backend Locally (on server)

```bash
# Test if backend is responding
curl http://localhost:4000/api/rooms

# Should return JSON with rooms data
```

If you get a response, backend is running! ✅

---


^C
root@Project-my:/home/admin.reemresort.com/public_html# # Connect to MySQL
mysql -u admin_reem -p admin_reemresort
Enter password: 
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A

Welcome to the MariaDB monitor.  Commands end with ; or \g.
Your MariaDB connection id is 2367
Server version: 10.11.15-MariaDB-ubu2404 mariadb.org binary distribution

Copyright (c) 2000, 2018, Oracle, MariaDB Corporation Ab and others.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

MariaDB [admin_reemresort]> ### Step 8: Configure Reverse Proxy

Now we need to route `https://admin.reemresort.com/api` to `http://localhost:4000/api`

#### CyberPanel uses OpenLiteSpeed by default:

**Option A: Using CyberPanel UI (Easier)**

1. Login to CyberPanel: `https://server.reemresort.com:8090`
2. Go to: **Websites** → **List Websites**
3. Find **admin.reemresort.com** → Click **Manage**
4. Click **Rewrite Rules**
5. Add this rule:

```apache
RewriteEngine On
RewriteRule ^api/(.*)$ http://localhost:4000/api/$1 [P,L]
```

6. Click **Save**
7. Restart LiteSpeed:

```bash
systemctl restart lsws
```

**Option B: Manual Configuration**

```bash
# Edit virtual host config
nano /usr/local/lsws/conf/vhosts/admin.reemresort.com/vhost.conf
```

Add this context before the closing tag:

```apache
context /api {
  type                    proxy
  handler                 lsapi:lsphp
  uri                     http://127.0.0.1:4000
  addDefaultCharset       off
}
```

Save and restart:
```bash
systemctl restart lsws
```

---

### Step 9: Test Production API

**From your local machine:**

```bash
# Test API endpoint
curl https://admin.reemresort.com/api/rooms

# Should return JSON with rooms data
```

**Or open in browser:**
```
https://admin.reemresort.com/api/rooms
```

---

### Step 10: Verify in Your Application

Now go to your production site and try adding a room:
```
https://admin.reemresort.com
```

It should work! ✅

---

## 🔍 Troubleshooting

### Backend not starting:
```bash
# Check PM2 logs
pm2 logs reem-resort-api

# Check for errors
pm2 status

# Restart if needed
pm2 restart reem-resort-api
```

### Database connection failed:
```bash
# Test database connection
mysql -u admin_reem -p admin_reemresort

# Make sure .env has MYSQL_HOST=localhost
cat server/.env
```

### API still timing out:
```bash
# 1. Check if backend is running
pm2 status
curl http://localhost:4000/api/rooms

# 2. Check if port 4000 is listening
netstat -tlnp | grep 4000

# 3. Check LiteSpeed rewrite rules
cat /usr/local/lsws/conf/vhosts/admin.reemresort.com/vhost.conf

# 4. Check LiteSpeed logs
tail -f /usr/local/lsws/logs/error.log

# 5. Restart everything
pm2 restart reem-resort-api
systemctl restart lsws
```

### Reverse proxy not working:
```bash
# Test backend directly
curl http://localhost:4000/api/rooms

# If this works but https://admin.reemresort.com/api/rooms doesn't,
# the issue is with the reverse proxy configuration

# Check LiteSpeed error logs
tail -f /usr/local/lsws/logs/error.log
```

---

## 📝 Useful PM2 Commands

```bash
# View all processes
pm2 list

# View logs
pm2 logs reem-resort-api

# View only errors
pm2 logs reem-resort-api --err

# Restart backend
pm2 restart reem-resort-api

# Stop backend
pm2 stop reem-resort-api

# Delete from PM2
pm2 delete reem-resort-api

# Monitor in real-time
pm2 monit
```

---

## 🔄 Updating Backend (Future Deployments)

When you make changes:

```bash
# 1. LOCAL: Package new backend
cd "/Users/siamhossain/Project/REEM RESORT 2"
tar -czf backend.tar.gz server/ --exclude='server/node_modules'

# 2. LOCAL: Upload to server
scp backend.tar.gz root@server.reemresort.com:/home/admin.reemresort.com/public_html/

# 3. SERVER: Extract and restart
ssh root@server.reemresort.com
cd /home/admin.reemresort.com/public_html
tar -xzf backend.tar.gz
pm2 restart reem-resort-api

# 4. Check logs
pm2 logs reem-resort-api
```

---

## ✅ Deployment Complete Checklist

- [ ] Backend package created
- [ ] Files uploaded to server
- [ ] Dependencies installed
- [ ] .env file configured
- [ ] PM2 process started
- [ ] Backend accessible at localhost:4000
- [ ] Reverse proxy configured
- [ ] API accessible at https://admin.reemresort.com/api
- [ ] Production site working
- [ ] Can add rooms, bookings, etc.

---

## 🎉 Success!

When everything is working:
- ✅ Frontend: https://admin.reemresort.com
- ✅ Backend API: https://admin.reemresort.com/api
- ✅ Database: localhost (CyberPanel MySQL)
- ✅ Process Manager: PM2

Your hotel management system is now fully deployed! 🚀

---

## 📞 Quick Reference

**Server:** server.reemresort.com  
**Website Directory:** /home/admin.reemresort.com/public_html  
**Backend Port:** 4000  
**PM2 Process:** reem-resort-api  
**Database:** admin_reemresort  

**Restart Everything:**
```bash
pm2 restart reem-resort-api && systemctl restart lsws
```
