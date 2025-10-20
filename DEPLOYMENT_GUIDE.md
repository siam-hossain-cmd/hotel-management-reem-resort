# 🚀 Reem Resort System - Deployment Guide

## 📁 Project Structure

```
REEM RESORT/
│
├── src/                    # React Frontend Source
│   ├── components/
│   ├── pages/
│   ├── contexts/
│   ├── services/
│   ├── utils/
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
│
├── dist/                   # Frontend Build Output (after `npm run build`)
│
├── server/                 # Node.js Backend
│   ├── index.js           # Express server entry
│   ├── db.js              # MySQL connection
│   ├── package.json       # Backend dependencies
│   ├── .env               # Backend environment variables
│   ├── routes/
│   │   ├── bookings.js
│   │   ├── customers.js
│   │   ├── invoices.js
│   │   ├── payments.js
│   │   └── rooms.js
│   ├── middleware/
│   │   └── verifyFirebaseToken.js
│   └── migrations/
│       └── *.sql
│
├── public/                 # Static assets
├── package.json           # Root package.json (Frontend)
├── vite.config.js         # Vite configuration
├── index.html             # HTML entry point
└── README.md

```

## 🔧 Current Setup

✅ **Frontend (Root Level):**
- React 18 + Vite
- Source code in `src/`
- Built output goes to `dist/`
- Port: 5173 (development)

✅ **Backend (server/):**
- Node.js + Express
- Source code in `server/`
- Port: 4000

✅ **Database:**
- MySQL (Remote)
- Host: 216.104.47.118:3306
- Database: reemresort_hotel_db

---

## 📦 Step-by-Step Deployment Preparation

### **Step 1: Build Frontend for Production**

```bash
# In project root
npm run build
```

This creates an optimized production build in the `dist/` folder.

---

### **Step 2: Configure Backend to Serve Frontend**

Update `server/index.js` to serve the built React app:

```javascript
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes...
import bookingsRouter from './routes/bookings.js';
import customersRouter from './routes/customers.js';
// ... other routes

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/bookings', bookingsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/invoices', invoicesRouter);
// ... other routes

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../dist')));

// All other requests return the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
```

---

### **Step 3: Environment Variables**

**Create `server/.env.production`:**

```env
# Database Configuration
MYSQL_HOST=216.104.47.118
MYSQL_PORT=3306
MYSQL_USER=reemresort_admin
MYSQL_PASSWORD=tyrfaz-Jojgij-mirge6
MYSQL_DATABASE=reemresort_hotel_db

# Server Configuration
NODE_ENV=production
PORT=4000

# Firebase (if using)
FIREBASE_ADMIN_SDK=false
```

---

### **Step 4: Update Package Scripts**

**Root `package.json`:**

```json
{
  "name": "reem-resort-system",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "concurrently \"npm run dev-client\" \"npm run dev-server\"",
    "dev-client": "vite",
    "dev-server": "node server/index.js",
    "build": "vite build",
    "build:production": "npm run build && cd server && npm install --production",
    "start": "cd server && node index.js",
    "preview": "vite preview"
  }
}
```

**Server `package.json`:**

```json
{
  "name": "reem-resort-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  }
}
```

---

## 🌐 Deployment Options

### **Option 1: VPS/Dedicated Server (Recommended)**

**Services:** DigitalOcean, Linode, AWS EC2, Vultr

**Setup:**

```bash
# 1. Connect to server
ssh user@your-server-ip

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Clone repository
git clone https://github.com/siam-hossain-cmd/invoice-reel-resort.git
cd invoice-reel-resort

# 4. Install dependencies
npm install
cd server && npm install

# 5. Build frontend
cd ..
npm run build

# 6. Setup environment variables
cd server
nano .env  # Add production variables

# 7. Install PM2 (Process Manager)
sudo npm install -g pm2

# 8. Start application
pm2 start index.js --name "reem-resort"
pm2 save
pm2 startup

# 9. Setup Nginx as reverse proxy
sudo apt install nginx
sudo nano /etc/nginx/sites-available/reem-resort
```

**Nginx Configuration:**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

### **Option 2: Heroku**

```bash
# 1. Install Heroku CLI
# 2. Login
heroku login

# 3. Create app
heroku create reem-resort-system

# 4. Set environment variables
heroku config:set MYSQL_HOST=216.104.47.118
heroku config:set MYSQL_USER=reemresort_admin
# ... other variables

# 5. Deploy
git push heroku main
```

---

### **Option 3: Vercel (Frontend) + Railway (Backend)**

**Frontend on Vercel:**
```bash
npm install -g vercel
vercel --prod
```

**Backend on Railway:**
- Connect GitHub repo
- Deploy server/ directory
- Add environment variables
- Get production URL

---

### **Option 4: cPanel Hosting**

**Requirements:**
- Node.js support
- SSH access
- MySQL database (already have)

**Steps:**

1. **Build locally:**
```bash
npm run build
```

2. **Upload via cPanel File Manager or FTP:**
- Upload `dist/` folder
- Upload `server/` folder
- Upload `package.json` files

3. **Setup Node.js App in cPanel:**
- Go to "Setup Node.js App"
- Set application root: `server`
- Set application URL
- Set application startup file: `index.js`
- Add environment variables

4. **Point domain to Node.js app**

---

## 🔐 Security Checklist

- [ ] Environment variables secured
- [ ] MySQL user has minimum required permissions
- [ ] CORS configured for production domain
- [ ] HTTPS/SSL certificate installed
- [ ] API rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (using parameterized queries)
- [ ] Authentication tokens secured
- [ ] Error messages don't expose sensitive info

---

## 📊 Database Migration

```bash
# Connect to production MySQL
mysql -h 216.104.47.118 -u reemresort_admin -p reemresort_hotel_db

# Run migrations in order
source server/migrations/init.sql
source server/migrations/add_charges_payments_invoice_features.sql
# ... other migrations
```

---

## 🚦 Testing Production Build Locally

```bash
# Build frontend
npm run build

# Start backend (will serve frontend)
cd server
node index.js

# Open browser
http://localhost:4000
```

---

## 📝 Deployment Checklist

- [ ] Frontend built successfully (`npm run build`)
- [ ] Backend environment variables configured
- [ ] Database accessible from production server
- [ ] All dependencies installed
- [ ] SSL certificate configured
- [ ] Domain pointed to server
- [ ] PM2 or process manager running
- [ ] Nginx/Apache configured
- [ ] Firewall rules set
- [ ] Backups configured
- [ ] Monitoring setup (optional)

---

## 🔄 Continuous Deployment

**Using GitHub Actions:**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm install
    
    - name: Build frontend
      run: npm run build
    
    - name: Deploy to server
      uses: appleboy/scp-action@master
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        source: "dist/,server/"
        target: "/var/www/reem-resort/"
    
    - name: Restart server
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /var/www/reem-resort/server
          pm2 restart reem-resort
```

---

## 📞 Support

If you encounter issues:
1. Check server logs: `pm2 logs reem-resort`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify database connection
4. Check firewall rules
5. Verify environment variables

---

## 🎉 Post-Deployment

After successful deployment:
- ✅ Test all features (booking, invoicing, payments)
- ✅ Test user permissions
- ✅ Verify PDF generation
- ✅ Check reports and analytics
- ✅ Test on different devices
- ✅ Monitor performance
- ✅ Setup automated backups

---

**Your Reem Resort System is ready for production! 🚀**
