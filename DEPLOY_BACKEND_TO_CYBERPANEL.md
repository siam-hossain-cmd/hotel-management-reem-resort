# 🚀 Deploy Backend to CyberPanel

## Overview
This guide shows you how to deploy your Node.js backend to your CyberPanel server.

Your backend needs to be running on CyberPanel for the production site to work.

## Solution: Deploy Backend on CyberPanel

### Option 1: Deploy Backend on Same Domain (Recommended)

Deploy backend at: `https://admin.reemresort.com/api`

#### Steps:

1. **SSH into your CyberPanel server:**
```bash
ssh root@server.reemresort.com
```

2. **Navigate to your website directory:**
```bash
cd /home/admin.reemresort.com/public_html
```

3. **Upload your project files:**
- Use FTP/SFTP to upload the entire project
- Or clone from Git:
```bash
git clone https://github.com/siam-hossain-cmd/invoice-reel-resort.git .
```

4. **Install dependencies:**
```bash
npm install
cd server
npm install
cd ..
```

5. **Create production .env file:**
```bash
cd server
nano .env
```

Paste this content:
```bash
PORT=4000
NODE_ENV=production

# Database Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=admin_reem
MYSQL_PASSWORD=jFm@@qC2MGdGb7h-
MYSQL_DATABASE=admin_reemresort

# Firebase (optional)
# FIREBASE_SERVICE_ACCOUNT_JSON=...
```

6. **Build the frontend:**
```bash
cd /home/admin.reemresort.com/public_html
npm run build
```

7. **Start backend with PM2:**
```bash
cd server
pm2 start index.js --name "reem-resort-api"
pm2 save
pm2 startup
```

8. **Configure Nginx reverse proxy:**
```bash
nano /usr/local/lsws/conf/vhosts/admin.reemresort.com/vhost.conf
```

Add this location block:
```nginx
location /api {
    proxy_pass http://localhost:4000/api;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Restart web server:
```bash
systemctl restart lsws
```

---

### Option 2: Deploy Backend on Subdomain (Alternative)

Deploy backend at: `https://api.reemresort.com`

#### Steps:

1. **Create subdomain in CyberPanel:**
   - Go to: Websites → Create Website
   - Domain: `api.reemresort.com`
   - Select package and create

2. **Upload backend files:**
```bash
ssh root@server.reemresort.com
cd /home/api.reemresort.com/public_html
# Upload or clone your server folder here
```

3. **Install dependencies and setup:**
```bash
cd /home/api.reemresort.com/public_html
npm install
```

4. **Create .env file:**
```bash
nano .env
```
(Same content as Option 1)

5. **Start with PM2:**
```bash
pm2 start index.js --name "reem-resort-api" -i 1
pm2 save
```

6. **Configure Node.js in CyberPanel:**
   - Go to: Websites → List Websites
   - Click on `api.reemresort.com` → Manage
   - Enable Node.js application
   - Set entry point: `index.js`
   - Port: 4000

7. **Update frontend API URL:**

Edit `/src/services/api.js`:
```javascript
const API_BASE = import.meta.env.PROD 
  ? 'https://api.reemresort.com/api'
  : '/api';
```

Then rebuild and redeploy frontend.

---

## Quick Deploy Script

Save this as `deploy-to-cyberpanel.sh`:

```bash
#!/bin/bash
echo "🚀 Deploying to CyberPanel..."

# Build frontend
echo "📦 Building frontend..."
npm run build

# Upload files via rsync
echo "📤 Uploading files..."
rsync -avz --exclude 'node_modules' --exclude '.git' \
  ./ root@server.reemresort.com:/home/admin.reemresort.com/public_html/

# SSH commands
echo "🔧 Setting up on server..."
ssh root@server.reemresort.com << 'ENDSSH'
cd /home/admin.reemresort.com/public_html

# Install dependencies
npm install
cd server && npm install && cd ..

# Restart PM2
pm2 restart reem-resort-api || pm2 start server/index.js --name "reem-resort-api"
pm2 save

echo "✅ Deployment complete!"
ENDSSH

echo "🎉 Done! Visit https://admin.reemresort.com"
```

Make executable:
```bash
chmod +x deploy-to-cyberpanel.sh
```

---

## Verify Backend is Running

After deployment, test:

```bash
# On server
curl http://localhost:4000/api/rooms

# From outside
curl https://admin.reemresort.com/api/rooms
```

---

## Frontend Configuration

Your frontend should point to the same domain for API calls.

### Current configuration (already updated):
```javascript
const API_BASE = '/api';
```

This works for both development and production when using reverse proxy.

After any changes, rebuild:
```bash
npm run build
```

---

## Troubleshooting

### Backend not starting:
```bash
pm2 logs reem-resort-api
```

### Check if port 4000 is listening:
```bash
netstat -tlnp | grep 4000
```

### Test database connection on server:
```bash
cd /home/admin.reemresort.com/public_html/server
node scripts/test_connection.js
```

### Restart everything:
```bash
pm2 restart all
systemctl restart lsws
```

---

## Summary

1. ✅ Database already configured (admin_reemresort on CyberPanel)
2. ⏳ Upload project files to CyberPanel
3. ⏳ Install dependencies
4. ⏳ Configure .env with database credentials
5. ⏳ Start backend with PM2
6. ⏳ Configure reverse proxy
7. ⏳ Update frontend API URL
8. ⏳ Rebuild and deploy frontend

**Your backend needs to be running on CyberPanel for the production site to work!**
