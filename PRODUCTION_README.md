# Reem Resort - Production Deployment Guide

## 🚀 Quick Start (Production)

### Prerequisites
- Node.js 18+ installed
- MySQL database configured
- Domain name (optional but recommended)
- SSL certificate (Let's Encrypt recommended)

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd reem-resort
npm install
cd server && npm install && cd ..
```

### 2. Configure Environment
```bash
cd server
cp .env.production.example .env
nano .env  # Edit with your production values
```

Required environment variables:
```env
NODE_ENV=production
PORT=4000
MYSQL_HOST=216.104.47.118
MYSQL_USER=reemresort_admin
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=reemresort_hotel_db
FRONTEND_URL=https://your-domain.com
```

### 3. Build Frontend
```bash
npm run build
```

### 4. Test Production Locally
```bash
npm run test:production
```
Visit http://localhost:4000 and verify everything works.

### 5. Deploy

#### Option A: VPS with PM2 (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start ecosystem.config.cjs

# Save PM2 configuration
pm2 save

# Setup auto-restart on server reboot
pm2 startup
```

#### Option B: Heroku
```bash
heroku login
heroku create reem-resort
git push heroku main
```

#### Option C: cPanel
1. Build locally: `npm run build`
2. Upload `dist/` to `public_html/`
3. Upload `server/` to `public_html/api/`
4. Configure Node.js app in cPanel

---

## 📦 Project Structure (Production)

```
reem-resort/
├── dist/                    # Built React app (created by npm run build)
├── server/                  # Backend API
│   ├── index.js            # Production-ready server with static file serving
│   ├── .env                # Production environment variables (DO NOT COMMIT)
│   ├── db.js               # MySQL database connection
│   ├── routes/             # API routes
│   └── middleware/         # Auth middleware
├── ecosystem.config.cjs    # PM2 configuration
├── package.json            # Root dependencies and scripts
└── DEPLOYMENT_CHECKLIST.md # Complete deployment checklist
```

---

## 🔧 Available Scripts

### Development
```bash
npm run dev              # Run both frontend and backend in development mode
npm run dev-client       # Run only frontend (Vite dev server)
npm run dev-server       # Run only backend (Node.js)
```

### Production
```bash
npm run build:production        # Build frontend for production
npm run start:production        # Start server in production mode
npm run test:production         # Build and test production locally
```

### Utilities
```bash
npm run lint                    # Lint code
npm run install:all             # Install all dependencies (root + server)
```

---

## 🌐 Nginx Configuration (VPS Deployment)

Create `/etc/nginx/sites-available/reem-resort`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

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
        
        # Timeouts
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }
}
```

Enable site:
```bash
ln -s /etc/nginx/sites-available/reem-resort /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

---

## 🔒 SSL Setup (Let's Encrypt)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com -d www.your-domain.com
```

Auto-renewal is configured automatically. Test with:
```bash
certbot renew --dry-run
```

---

## 📊 Monitoring

### PM2 Monitoring
```bash
pm2 status                  # Check app status
pm2 logs reem-resort        # View logs
pm2 monit                   # Real-time monitoring
pm2 restart reem-resort     # Restart app
pm2 stop reem-resort        # Stop app
pm2 delete reem-resort      # Remove from PM2
```

### Application Logs
```bash
# View last 100 lines
pm2 logs reem-resort --lines 100

# Follow logs in real-time
pm2 logs reem-resort --lines 0

# Save logs to file
pm2 logs reem-resort > logs.txt
```

---

## 🗄️ Database Management

### Backup Database
```bash
mysqldump -u reemresort_admin -p reemresort_hotel_db > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
mysql -u reemresort_admin -p reemresort_hotel_db < backup_20240101.sql
```

### Connect to Database
```bash
mysql -h 216.104.47.118 -u reemresort_admin -p reemresort_hotel_db
```

---

## 🔄 Updates & Maintenance

### Update Application
```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install
cd server && npm install && cd ..

# Build frontend
npm run build

# Restart application
pm2 restart reem-resort
```

### Update Dependencies
```bash
# Check for outdated packages
npm outdated

# Update packages
npm update

# Update server packages
cd server && npm update && cd ..
```

---

## 🆘 Troubleshooting

### Application Won't Start
1. Check environment variables: `cat server/.env`
2. Check database connection: Test credentials
3. Check port availability: `lsof -i :4000`
4. Check logs: `pm2 logs reem-resort`

### Database Connection Error
1. Verify MySQL credentials in `.env`
2. Check MySQL server is running
3. Check firewall allows port 3306
4. Test connection: `mysql -h HOST -u USER -p`

### 404 Errors on Page Refresh
1. Check Nginx configuration has fallback to index.html
2. Restart Nginx: `systemctl restart nginx`
3. Check server is serving static files properly

### PDF Generation Not Working
1. Check browser console for errors
2. Verify invoice data is loading: Check Network tab
3. Test in different browser
4. Check parseFloat() is handling numbers correctly

---

## 📞 Support

For deployment support, refer to:
- **DEPLOYMENT_GUIDE.md** - Comprehensive deployment instructions
- **DEPLOYMENT_CHECKLIST.md** - Step-by-step checklist
- **API_DOCUMENTATION.md** - API endpoints and usage

---

## 🔐 Security Notes

1. **Never commit .env files** - Already in .gitignore
2. **Use strong passwords** - For database and admin accounts
3. **Enable HTTPS** - Use Let's Encrypt SSL certificates
4. **Regular backups** - Automate daily database backups
5. **Update dependencies** - Check for security updates monthly
6. **Monitor logs** - Watch for suspicious activity
7. **CORS configuration** - Restrict to your domain in production

---

## 📝 Version Information

- **Node.js**: 18+
- **React**: 19.1.1
- **Express**: 4.x
- **MySQL**: 2.x
- **Vite**: 7.1.14 (rolldown-vite)

---

**Last Updated:** 2024  
**Project Status:** Production Ready ✅
