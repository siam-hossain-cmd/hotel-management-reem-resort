# 🚀 Quick Backend Deployment to CyberPanel

## Issue
Frontend at `https://admin.reemresort.com` is working, but API calls are timing out because backend is not deployed.

## Solution: Deploy Backend NOW

### Step 1: Prepare Backend Files Locally

```bash
cd "/Users/siamhossain/Project/REEM RESORT 2"

# Create production .env file
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
EOF

# Create deployment package
tar -czf backend-deploy.tar.gz server/ package.json
```

### Step 2: Upload to CyberPanel

```bash
# SSH to your server
ssh admin@server.reemresort.com

# Or use SFTP to upload backend-deploy.tar.gz
```

### Step 3: Setup on Server

```bash
# On the server
cd /home/admin.reemresort.com/public_html

# Extract files
tar -xzf backend-deploy.tar.gz

# Copy production env
cp server/.env.production server/.env

# Install dependencies
npm install --production
cd server && npm install --production

# Install PM2 globally (if not already installed)
sudo npm install -g pm2

# Start backend
pm2 start server/index.js --name "reem-resort-api"
pm2 save
pm2 startup

# Check status
pm2 status
pm2 logs reem-resort-api
```

### Step 4: Configure Reverse Proxy

#### For OpenLiteSpeed (CyberPanel default):

```bash
# Edit virtual host config
sudo nano /usr/local/lsws/conf/vhosts/admin.reemresort.com/vhost.conf
```

Add this context:

```apache
context /api {
  type                    proxy
  handler                 lsapi:lsphp
  uri                     http://127.0.0.1:4000/api
  addDefaultCharset       off
}
```

Restart LiteSpeed:
```bash
sudo systemctl restart lsws
```

#### For Nginx (if using):

```bash
sudo nano /etc/nginx/sites-available/admin.reemresort.com
```

Add this location block:

```nginx
location /api {
    proxy_pass http://localhost:4000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

Restart Nginx:
```bash
sudo systemctl restart nginx
```

### Step 5: Test

```bash
# On server - test locally
curl http://localhost:4000/api/rooms

# From your machine - test production
curl https://admin.reemresort.com/api/rooms
```

---

## Quick Commands Summary

```bash
# 1. LOCAL: Create deployment package
cd "/Users/siamhossain/Project/REEM RESORT 2"
tar -czf backend-deploy.tar.gz server/ package.json

# 2. LOCAL: Upload to server (use SFTP or rsync)
scp backend-deploy.tar.gz admin@server.reemresort.com:/home/admin.reemresort.com/public_html/

# 3. SERVER: Deploy
ssh admin@server.reemresort.com
cd /home/admin.reemresort.com/public_html
tar -xzf backend-deploy.tar.gz
cp server/.env.production server/.env
npm install --production
cd server && npm install --production
pm2 start server/index.js --name "reem-resort-api"
pm2 save

# 4. SERVER: Configure reverse proxy (see above)

# 5. Test
curl https://admin.reemresort.com/api/rooms
```

---

## Alternative: Quick Test with SSH Tunnel

If you want to test immediately without full deployment:

```bash
# On your local machine
ssh -R 4000:localhost:4000 admin@server.reemresort.com

# Keep this terminal open and run your local backend
# Your production site will temporarily use your local backend
```

---

## Troubleshooting

### Backend not starting:
```bash
pm2 logs reem-resort-api
# Check for errors
```

### Can't connect to database:
```bash
# Test database connection
mysql -u admin_reem -p admin_reemresort
# Make sure MYSQL_HOST=localhost in .env
```

### API still timing out:
```bash
# Check PM2 status
pm2 status

# Check if port 4000 is listening
netstat -tlnp | grep 4000

# Check firewall (should allow from localhost)
sudo ufw status

# Test locally first
curl http://localhost:4000/api/rooms
```

---

**This is the fastest way to get your production site working!**
