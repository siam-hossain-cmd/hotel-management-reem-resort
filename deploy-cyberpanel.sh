#!/bin/bash

# CyberPanel Deployment Script for Reem Resort
# This script helps deploy the application to CyberPanel

set -e  # Exit on any error

echo "🚀 Reem Resort - CyberPanel Deployment Script"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database credentials
DB_NAME="admin_reemresort"
DB_USER="admin_reem"
DB_PASS="jFm@@qC2MGdGb7h-"

echo "📋 Deployment Checklist:"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Step 1: Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Run this from project root.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Step 1: Project structure verified${NC}"

# Step 2: Check if .env exists
if [ ! -f "server/.env" ]; then
    echo -e "${YELLOW}⚠️  Creating .env file from example...${NC}"
    cp server/.env.example server/.env
    echo -e "${YELLOW}📝 Please edit server/.env with your credentials${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Step 2: Environment file exists${NC}"

# Step 3: Install dependencies
echo ""
echo "📦 Step 3: Installing dependencies..."
npm install
cd server && npm install && cd ..
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Step 4: Build frontend
echo ""
echo "🔨 Step 4: Building frontend..."
npm run build
echo -e "${GREEN}✅ Frontend built successfully${NC}"

# Step 5: Test database connection
echo ""
echo "🔌 Step 5: Testing database connection..."
cd server
node scripts/test_connection.js
CONNECTION_STATUS=$?

if [ $CONNECTION_STATUS -eq 0 ]; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    echo -e "${YELLOW}💡 Please check your database credentials in server/.env${NC}"
    exit 1
fi

# Step 6: Check if migrations are needed
echo ""
echo "🗄️  Step 6: Checking database schema..."
echo "Do you want to run database migrations? (y/n)"
read -r RUN_MIGRATIONS

if [ "$RUN_MIGRATIONS" = "y" ] || [ "$RUN_MIGRATIONS" = "Y" ]; then
    echo "Running migrations..."
    node scripts/run_migrations.js
    echo -e "${GREEN}✅ Migrations completed${NC}"
else
    echo -e "${YELLOW}⏭️  Skipping migrations${NC}"
fi

# Step 7: Check PM2
echo ""
echo "🔄 Step 7: Checking PM2..."
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️  PM2 not found. Installing globally...${NC}"
    npm install -g pm2
    echo -e "${GREEN}✅ PM2 installed${NC}"
else
    echo -e "${GREEN}✅ PM2 is available${NC}"
fi

# Step 8: Start/Restart application
echo ""
echo "🚀 Step 8: Starting application..."
cd ..

# Check if app is already running
if pm2 list | grep -q "reem-resort"; then
    echo "Application is already running. Restarting..."
    pm2 restart reem-resort
    echo -e "${GREEN}✅ Application restarted${NC}"
else
    echo "Starting application for the first time..."
    pm2 start ecosystem.config.cjs
    echo -e "${GREEN}✅ Application started${NC}"
fi

# Save PM2 configuration
pm2 save

# Step 9: Setup PM2 startup
echo ""
echo "⚙️  Step 9: Setting up PM2 startup..."
pm2 startup

echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo "📊 Application Status:"
pm2 list

echo ""
echo "📝 Useful Commands:"
echo "  View logs:     pm2 logs reem-resort"
echo "  Stop app:      pm2 stop reem-resort"
echo "  Restart app:   pm2 restart reem-resort"
echo "  Monitor:       pm2 monit"
echo ""
echo "🌐 Your application should now be running!"
echo "   Backend:  http://localhost:4000"
echo "   Check health: curl http://localhost:4000/health"
echo ""
