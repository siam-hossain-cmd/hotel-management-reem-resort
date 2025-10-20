# 🚀 Render Backend + cPanel Frontend Deployment

## ✅ Configuration Complete!

Your project is now configured for a **split deployment**:
- **Backend:** Render (https://hotel-management-reem-resort-1.onrender.com)
- **Frontend:** cPanel (https://admin.reemresort.com)

---

## 📦 What Was Updated

### ✅ **Frontend API Configuration** (`src/services/api.js`)

```javascript
// Now points to Render backend in production
const API_BASE = import.meta.env.PROD 
  ? 'https://hotel-management-reem-resort-1.onrender.com/api'
  : '/api';
```

### ✅ **New Build Generated**
- Fresh `dist` folder created with Render backend URL
- Build size: ~1.9 MB (gzipped: ~513 KB)
- Ready to upload to cPanel

---

## 🎯 Deployment Steps for cPanel

### **Option 1: Upload via cPanel File Manager** (Recommended)

1. **Log into cPanel**
   - URL: https://admin.reemresort.com:2083

2. **Open File Manager**
   - Navigate to: `/home/reemresort/public_html/admin/`

3. **Backup Old Files** (Optional)
   ```
   Create a folder: backup_old_dist
   Move current files to backup folder
   ```

4. **Upload New Dist Folder**
   - Click **Upload** button
   - Upload ALL files from your local `dist` folder:
     - `index.html`
     - `assets/` folder (contains all CSS/JS files)
   
5. **Set Permissions**
   - Select all uploaded files
   - Change permissions to `644` for files
   - Change permissions to `755` for folders

6. **Test**
   - Visit: https://admin.reemresort.com
   - Login and check if data loads from Render backend

---

### **Option 2: Upload via FTP** (Alternative)

1. **Connect to FTP**
   - Host: ftp.reemresort.com
   - Username: reemresort
   - Password: (your cPanel password)
   - Port: 21

2. **Navigate to Directory**
   ```
   /home/reemresort/public_html/admin/
   ```

3. **Upload Dist Contents**
   - Upload all files from local `dist/` folder
   - Make sure `assets/` folder is uploaded completely

---

### **Option 3: Via Terminal/SSH** (Advanced)

```bash
# Zip the dist folder locally
cd "/Users/siamhossain/Project/REEM RESORT"
zip -r dist.zip dist/

# Upload to cPanel (using FTP or SCP)
# Then SSH into cPanel:

ssh reemresort@admin.reemresort.com

# Navigate to directory
cd /home/reemresort/public_html/admin/

# Backup old files
mkdir backup_old_dist
mv *.html backup_old_dist/
mv assets backup_old_dist/

# Extract new dist
unzip ~/dist.zip
mv dist/* .
rmdir dist

# Set permissions
chmod 644 *.html
chmod 755 assets
chmod 644 assets/*
```

---

## 🔧 Backend Configuration on Render

Make sure your Render backend has these **Environment Variables** set:

```env
NODE_ENV=production
PORT=10000
MYSQL_HOST=216.104.47.118
MYSQL_PORT=3306
MYSQL_USER=reemresort_admin
MYSQL_PASSWORD=tyrfaz-Jojgij-mirge6
MYSQL_DATABASE=reemresort_hotel_db
FRONTEND_URL=https://admin.reemresort.com
```

### **Important Render Settings:**

1. **Enable CORS** - Your backend needs to allow requests from `admin.reemresort.com`
2. **Keep Alive** - Render free tier may sleep after 15 min inactivity
3. **Database Connection** - Ensure Render can connect to your MySQL server

---

## 🔒 CORS Configuration (Important!)

Your Render backend needs to accept requests from your cPanel frontend. 

Check your `server/index.js` has this CORS setup:

```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'https://admin.reemresort.com',
    'http://localhost:5173' // for local development
  ],
  credentials: true
}));
```

If you need to update this, redeploy on Render after making changes.

---

## ✅ Verification Checklist

After uploading to cPanel:

- [ ] Visit https://admin.reemresort.com
- [ ] Check browser console for errors (F12)
- [ ] Verify API calls go to `hotel-management-reem-resort-1.onrender.com`
- [ ] Test login functionality
- [ ] Test data loading (Rooms, Bookings, Invoices)
- [ ] Test creating/editing records
- [ ] Check network tab for CORS errors

---

## 🐛 Troubleshooting

### **Problem: CORS Error**
```
Access to fetch at 'https://hotel-management-reem-resort-1.onrender.com/api/rooms' 
from origin 'https://admin.reemresort.com' has been blocked by CORS policy
```

**Solution:**
1. Update `server/index.js` CORS config
2. Redeploy on Render
3. Clear browser cache

---

### **Problem: API Not Responding**
```
Failed to fetch
```

**Solution:**
1. Check if Render backend is awake (visit directly)
2. Verify environment variables on Render
3. Check Render logs for errors
4. Ensure database credentials are correct

---

### **Problem: "No data" or Empty Lists**
```
Frontend loads but shows empty bookings/rooms
```

**Solution:**
1. Open browser DevTools (F12)
2. Check Network tab - see if API calls are successful
3. Verify backend database connection
4. Check if data exists in MySQL database

---

### **Problem: Login Not Working**
```
Firebase authentication fails
```

**Solution:**
1. Verify Firebase config in `src/firebase/config.js`
2. Check Firebase Console - ensure domain is authorized
3. Add `admin.reemresort.com` to Firebase Authorized Domains

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────┐
│           User Browser                           │
└──────────────┬──────────────────────────────────┘
               │
               │ HTTPS
               ▼
┌─────────────────────────────────────────────────┐
│    cPanel Frontend (admin.reemresort.com)       │
│    - Static HTML/CSS/JS (dist folder)           │
│    - React Application                           │
└──────────────┬──────────────────────────────────┘
               │
               │ API Calls
               ▼
┌─────────────────────────────────────────────────┐
│    Render Backend                                │
│    (hotel-management-reem-resort-1.onrender.com)│
│    - Node.js + Express                           │
│    - REST API                                    │
└──────────────┬──────────────────────────────────┘
               │
               │ MySQL Connection
               ▼
┌─────────────────────────────────────────────────┐
│    MySQL Database (216.104.47.118:3306)        │
│    - reemresort_hotel_db                        │
│    - All application data                       │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Quick Upload Commands

### **Prepare for Upload:**
```bash
cd "/Users/siamhossain/Project/REEM RESORT"

# Verify dist folder exists
ls -la dist/

# Optional: Create zip for easier upload
zip -r dist.zip dist/
```

### **What to Upload:**
```
dist/
├── index.html          ← Upload this
└── assets/             ← Upload entire folder
    ├── index-*.css     ← All CSS files
    ├── index-*.js      ← All JS files
    └── *.js            ← All other JS files
```

---

## 📝 Post-Deployment

### **Commit Changes to Git:**
```bash
cd "/Users/siamhossain/Project/REEM RESORT"

git add src/services/api.js
git commit -m "Update API to use Render backend URL"
git push origin main
```

### **Monitor Backend:**
- **Render Dashboard:** https://dashboard.render.com
- **View Logs:** Click on your service → Logs tab
- **Keep Alive:** Consider pinging service every 10 min to prevent sleep

### **Monitor Frontend:**
- Check browser console for errors
- Monitor API response times
- Test all major features

---

## 💡 Tips

1. **First Load May Be Slow** - Render free tier sleeps after inactivity
2. **Keep Backend Awake** - Use a service like UptimeRobot to ping every 5-10 min
3. **Cache Busting** - Clear browser cache after uploading new dist
4. **Test Locally First** - Run `npm run dev` locally to test changes

---

## 🎉 You're Ready!

Your application is now configured for production deployment:
- ✅ Frontend API updated to use Render backend
- ✅ Fresh build generated
- ✅ Ready to upload to cPanel

**Next Step:** Upload the `dist` folder contents to cPanel and test!

---

*Last Updated: October 21, 2025*  
*Backend: Render | Frontend: cPanel | Database: MySQL*
