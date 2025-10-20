#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 Reem Resort - Production Build Test"
echo "======================================"
echo ""

# Check if Node.js is installed
echo -n "Checking Node.js installation... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Found Node.js ${NODE_VERSION}${NC}"
else
    echo -e "${RED}✗ Node.js not found${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
echo -n "Checking npm installation... "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓ Found npm ${NPM_VERSION}${NC}"
else
    echo -e "${RED}✗ npm not found${NC}"
    exit 1
fi

# Check if dependencies are installed
echo -n "Checking dependencies... "
if [ -d "node_modules" ] && [ -d "server/node_modules" ]; then
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠ Dependencies not found${NC}"
    echo "Installing dependencies..."
    npm install
    cd server && npm install && cd ..
fi

# Check if .env file exists
echo -n "Checking environment configuration... "
if [ -f "server/.env" ]; then
    echo -e "${GREEN}✓ .env file found${NC}"
else
    echo -e "${YELLOW}⚠ .env file not found${NC}"
    echo "Please create server/.env from server/.env.production.example"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Build frontend
echo ""
echo "Building frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend build successful${NC}"
else
    echo -e "${RED}✗ Frontend build failed${NC}"
    exit 1
fi

# Check if dist folder was created
echo -n "Checking build output... "
if [ -d "dist" ]; then
    DIST_SIZE=$(du -sh dist | cut -f1)
    echo -e "${GREEN}✓ dist/ folder created (${DIST_SIZE})${NC}"
else
    echo -e "${RED}✗ dist/ folder not found${NC}"
    exit 1
fi

# Start production server
echo ""
echo "Starting production server..."
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo ""
echo "Visit http://localhost:4000 to test the application"
echo ""

NODE_ENV=production node server/index.js
