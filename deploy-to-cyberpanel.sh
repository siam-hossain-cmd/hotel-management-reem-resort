#!/bin/bash

# Deploy to CyberPanel Server
# Run this script to upload your application to CyberPanel

set -e

echo "🚀 Deploying to CyberPanel Server..."
echo "======================================"
echo ""

# Configuration
SERVER_IP="your-server-ip"  # Change this to your server IP
SERVER_USER="root"
REMOTE_PATH="/home/admin.reemresort.com/public_html"
LOCAL_PATH="."

echo "📋 Configuration:"
echo "   Server: $SERVER_USER@$SERVER_IP"
echo "   Remote Path: $REMOTE_PATH"
echo ""

# Ask for server IP if not set
if [ "$SERVER_IP" = "your-server-ip" ]; then
    echo "❓ Enter your CyberPanel server IP address:"
    read -r SERVER_IP
    echo ""
fi

# Step 1: Build frontend
echo "🔨 Step 1: Building frontend..."
npm run build
echo "✅ Frontend built successfully"
echo ""

# Step 2: Create deployment package
echo "📦 Step 2: Creating deployment package..."
tar -czf deploy-package.tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='deploy-package.tar.gz' \
    --exclude='.env' \
    --exclude='*.log' \
    dist/ server/ package.json package-lock.json ecosystem.config.cjs
echo "✅ Package created: deploy-package.tar.gz"
echo ""

# Step 3: Upload to server
echo "📤 Step 3: Uploading to CyberPanel server..."
echo "   This will ask for your SSH password..."
scp deploy-package.tar.gz $SERVER_USER@$SERVER_IP:/tmp/
echo "✅ Package uploaded"
echo ""

# Step 4: Extract and setup on server
echo "⚙️  Step 4: Setting up on server..."
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
set -e

# Navigate to website directory
cd /home/admin.reemresort.com/public_html

# Backup existing installation
if [ -d "server" ]; then
    echo "📦 Creating backup..."
    tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz server/ dist/ 2>/dev/null || true
fi

# Extract new files
echo "📂 Extracting files..."
tar -xzf /tmp/deploy-package.tar.gz -C .

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

cd server
npm install --production

# Keep existing .env if it exists, otherwise create from example
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    echo "⚠️  WARNING: Please update server/.env with your database credentials!"
fi

cd ..

# Copy frontend files to web root
echo "🌐 Copying frontend files..."
cp -r dist/* .

# Restart application with PM2
echo "🔄 Restarting application..."
if pm2 list | grep -q "reem-resort"; then
    pm2 restart reem-resort
else
    pm2 start ecosystem.config.cjs
fi
pm2 save

# Cleanup
rm -f /tmp/deploy-package.tar.gz

echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Application Status:"
pm2 status
echo ""
echo "🌐 Your application is now running!"
echo "   Visit: https://admin.reemresort.com"
echo ""
echo "📝 Next steps:"
echo "   1. Verify .env file: nano server/.env"
echo "   2. Run migrations: cd server && node scripts/run_migrations.js"
echo "   3. Check logs: pm2 logs reem-resort"

ENDSSH

echo ""
echo "✅ Deployment completed!"
echo ""
echo "🔍 To check the deployment:"
echo "   ssh $SERVER_USER@$SERVER_IP"
echo "   pm2 logs reem-resort"
echo ""

# Cleanup local package
rm -f deploy-package.tar.gz
echo "🧹 Cleaned up local deployment package"
