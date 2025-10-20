# 🚀 cPanel Deployment Instructions - FINAL STEPS

## ✅ Files Updated & Ready

Your project has been updated with cPanel-compatible configuration!

### **Changes Made:**
1. ✅ `server/db.js` - Updated to work with cPanel environment variables
2. ✅ `src/firebase/config.js` - Fixed syntax error
3. ✅ Frontend rebuilt successfully

---

## 📤 Upload Updated Files to cPanel

### **Method 1: Replace Updated Files via File Manager**

You only need to update these specific files:

1. **Upload `server/db.js`**
   - Go to `/home/reemresort/public_html/admin/server/`
   - Delete old `db.js`
   - Upload new `db.js` from your local project

2. **Upload new `dist/` folder**
   - Go to `/home/reemresort/public_html/admin/`
   - Delete old `dist/` folder
   - Upload new `dist/` folder (entire folder)

---

## ⚙️ cPanel Node.js Configuration

### **Required Environment Variables:**

Go to **cPanel → Node.js → ADMIN.REEMRESORT.COM**

Make sure these are set **EXACTLY** as shown:

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `NODE_ENV` | `production` | ✅ Must be set |
| `PORT` | `4000` | ⚠️ NOT 0! |
| `MYSQL_HOST` | `localhost` | ⚠️ NOT 216.104.47.118! |
| `MYSQL_PORT` | `3306` | ✅ Standard port |
| `MYSQL_USER` | `reemresort_admin` | ✅ Your username |
| `MYSQL_PASSWORD` | `tyrfaz-Jojgij-mirge6` | ✅ Your password |
| `MYSQL_DATABASE` | `reemresort_hotel_db` | ✅ Your database |
| `FRONTEND_URL` | `https://admin.reemresort.com` | ✅ Your domain |

### **Other Settings:**

| Setting | Value |
|---------|-------|
| **Node.js version** | 18.20.5 (or latest 18.x) |
| **Application mode** | Production |
| **Application root** | `public_html/admin` |
| **Application URL** | `admin.reemresort.com` |
| **Application startup file** | `server/index.js` |

---

## 🔧 Database Configuration

### **Step 1: Verify Database Exists**

Go to **cPanel → MySQL Databases**

Check:
- ✅ Database `reemresort_hotel_db` exists
- ✅ User `reemresort_admin` exists
- ✅ User is assigned to database with **ALL PRIVILEGES**

### **Step 2: Add Localhost Access**

Go to **cPanel → Remote MySQL**

Add these hosts if not already added:
- `localhost`
- `127.0.0.1`

---

## 🚀 Deployment Steps

### **1. Upload Updated Files**

Upload these to cPanel:
- ✅ `server/db.js` (updated version)
- ✅ `dist/` folder (freshly built)

### **2. Update Environment Variables**

In **cPanel → Node.js**:
- ⚠️ Change `MYSQL_HOST` from `216.104.47.118` to `localhost`
- ⚠️ Change `PORT` from `0` to `4000`
- ✅ Verify all other variables are correct

### **3. Install Dependencies**

Click **"Run NPM Install"** button

Wait for it to complete (may take 2-3 minutes)

### **4. Restart Application**

Click **"RESTART"** button

Wait 10-20 seconds for app to start

### **5. Test Application**

Visit: `https://admin.reemresort.com`

**Should see:**
- ✅ Application loads without errors
- ✅ NO "Failed to connect to database" error
- ✅ Can view rooms, bookings, etc.

**Test API Health:**
```
https://admin.reemresort.com/_health
```

Should return:
```json
{"ok":true,"ts":1729XXXXXXXXX}
```

---

## 🔍 Troubleshooting

### **If Still Getting "Failed to connect to database":**

#### **Check 1: View Logs in cPanel Terminal**

```bash
# Go to cPanel → Terminal, then run:
cd /home/reemresort/public_html/admin

# Check if app is running
ps aux | grep node

# View recent logs
tail -50 /home/reemresort/logs/passenger.log 2>/dev/null

# Or check stderr.log in app directory
cat stderr.log 2>/dev/null
```

#### **Check 2: Test Database Connection**

In cPanel Terminal:
```bash
mysql -h localhost -u reemresort_admin -p
```

Enter password: `tyrfaz-Jojgij-mirge6`

If successful:
```sql
USE reemresort_hotel_db;
SHOW TABLES;
SELECT COUNT(*) FROM rooms;
EXIT;
```

#### **Check 3: Verify Environment Variables Are Loading**

Create test file `/home/reemresort/public_html/admin/test-env.js`:

```javascript
console.log('Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MYSQL_HOST:', process.env.MYSQL_HOST);
console.log('MYSQL_USER:', process.env.MYSQL_USER);
console.log('MYSQL_DATABASE:', process.env.MYSQL_DATABASE);
console.log('MYSQL_PASSWORD:', process.env.MYSQL_PASSWORD ? '***SET***' : '***NOT SET***');
```

Run in Terminal:
```bash
cd /home/reemresort/public_html/admin
node test-env.js
```

---

## ✅ Success Checklist

Before considering deployment complete:

- [ ] Updated `server/db.js` uploaded to cPanel
- [ ] New `dist/` folder uploaded to cPanel
- [ ] `MYSQL_HOST` set to `localhost` (not 216.104.47.118)
- [ ] `PORT` set to `4000` (not 0)
- [ ] All environment variables set correctly
- [ ] `localhost` added to Remote MySQL hosts
- [ ] Dependencies installed (Run NPM Install clicked)
- [ ] Application restarted
- [ ] `https://admin.reemresort.com` loads successfully
- [ ] No "Failed to connect to database" error
- [ ] Can view rooms/bookings/invoices
- [ ] API health check returns `{"ok":true}`
- [ ] Can login with Firebase authentication
- [ ] All features work correctly

---

## 📊 Expected Console Output (When Working)

When you restart the app, in the logs you should see:

```
🔄 Attempting to connect to MySQL database...
📍 Host: localhost:3306
📊 Database: reemresort_hotel_db
👤 User: reemresort_admin
🔑 Password: ***set***
🌍 Environment: production
⏳ Testing database connection...
✅ MySQL pool created and tested successfully!
🚀 Server running in PRODUCTION mode
📡 Server listening on port 4000
🌐 Serving frontend from: /home/reemresort/public_html/admin/dist
```

---

## 🆘 Common Errors & Solutions

### **Error: "ECONNREFUSED"**
**Cause:** Can't connect to MySQL
**Solution:** 
- Change `MYSQL_HOST` to `localhost`
- Verify MySQL is running
- Check Remote MySQL has `localhost` allowed

### **Error: "ER_ACCESS_DENIED_ERROR"**
**Cause:** Wrong username/password
**Solution:** 
- Double-check `MYSQL_USER` and `MYSQL_PASSWORD`
- Verify user exists in MySQL Databases
- Check user is assigned to database

### **Error: "ER_BAD_DB_ERROR"**
**Cause:** Database doesn't exist
**Solution:** 
- Check database name spelling
- Create database if it doesn't exist
- Verify `MYSQL_DATABASE` is correct

### **Error: "Port 4000 already in use"**
**Cause:** App already running or port conflict
**Solution:** 
- Stop and restart the app in cPanel
- Change PORT to different number (e.g., 4001)

---

## 📞 Need More Help?

1. **Check passenger.log:**
   ```bash
   tail -100 /home/reemresort/logs/passenger.log
   ```

2. **Check MySQL connection:**
   ```bash
   mysql -h localhost -u reemresort_admin -p reemresort_hotel_db
   ```

3. **Verify files uploaded:**
   ```bash
   ls -la /home/reemresort/public_html/admin/
   ls -la /home/reemresort/public_html/admin/server/
   ls -la /home/reemresort/public_html/admin/dist/
   ```

---

**Good luck with your deployment! 🚀**

The key changes are:
- `MYSQL_HOST` must be `localhost` (not the external IP)
- `PORT` must be `4000` (not 0)
- Environment variables are set in cPanel Node.js interface

Once these are correct, everything should work!
