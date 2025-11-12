# 🚀 CyberPanel Quick Start Guide

## ✅ Configuration Complete

Your system is now configured to use the **CyberPanel MySQL database**.

### 📊 Database Details
- **Database**: `admin_reemresort`
- **User**: `admin_reem`
- **Password**: `jFm@@qC2MGdGb7h-`
- **Host**: `localhost` (on CyberPanel server)

---

## 🎯 Quick Commands

### Test Database Connection
```bash
cd server
node scripts/test_connection.js
```

### Initialize Database
```bash
cd server
node scripts/run_migrations.js
```

### Start Development Server
```bash
# Install dependencies first (if not done)
npm install
cd server && npm install && cd ..

# Start backend
cd server
npm run dev

# In another terminal, start frontend
npm run dev
```

### Deploy to Production (CyberPanel)
```bash
# Use the automated deployment script
./deploy-cyberpanel.sh

# Or manually:
npm run build
cd server
pm2 start ../ecosystem.config.cjs
pm2 save
```

---

## 📋 Pre-Deployment Checklist

### On CyberPanel Server:

1. **Create Database** (if not exists)
```bash
mysql -u root -p
CREATE DATABASE admin_reemresort;
CREATE USER 'admin_reem'@'localhost' IDENTIFIED BY 'jFm@@qC2MGdGb7h-';
GRANT ALL PRIVILEGES ON admin_reemresort.* TO 'admin_reem'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

2. **Upload Project Files**
   - Upload via FTP/SFTP to your domain directory
   - Or use Git clone

3. **Install Node.js** (via CyberPanel)
   - Go to: CyberPanel → List Websites → Manage → Node.js
   - Enable Node.js for your domain
   - Set Node version (14.x or higher)

4. **Set Environment Variables**
   - Create `/server/.env` file with credentials
   - Or set via CyberPanel interface

5. **Install Dependencies**
```bash
npm install
cd server && npm install
```

6. **Initialize Database**
```bash
cd server
node scripts/run_migrations.js
```

7. **Build Frontend**
```bash
npm run build
```

8. **Start with PM2**
```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

---

## 🔧 Common Tasks

### Backup Database
```bash
mysqldump -u admin_reem -p admin_reemresort > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
mysql -u admin_reem -p admin_reemresort < backup_20241111.sql
```

### View Application Logs
```bash
pm2 logs reem-resort
```

### Restart Application
```bash
pm2 restart reem-resort
```

### Stop Application
```bash
pm2 stop reem-resort
```

### Monitor Application
```bash
pm2 monit
```

### Check Application Status
```bash
pm2 status
pm2 list
```

---

## 🗄️ Database Structure

The system will create these tables:

1. **rooms** - Room management
2. **customers** - Customer information
3. **bookings** - Booking records
4. **booking_charges** - Additional charges
5. **invoices** - Invoice management
6. **payments** - Payment tracking

---

## 🔍 Troubleshooting

### Connection Refused
```bash
# Check if MySQL is running
systemctl status mysql

# Start MySQL if needed
sudo systemctl start mysql
```

### Access Denied
```bash
# Reset user permissions
mysql -u root -p
GRANT ALL PRIVILEGES ON admin_reemresort.* TO 'admin_reem'@'localhost';
FLUSH PRIVILEGES;
```

### Port Already in Use
```bash
# Find process using port 4000
lsof -i :4000

# Kill the process
kill -9 <PID>

# Or change PORT in .env
```

### Application Not Starting
```bash
# Check logs
pm2 logs reem-resort

# Delete and restart
pm2 delete reem-resort
pm2 start ecosystem.config.cjs
```

---

## 🌐 Application URLs

### Development
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

### Production (CyberPanel)
- Frontend: `https://yourdomain.com`
- Backend API: `https://yourdomain.com/api`

---

## 📁 Important Files

### Configuration
- `/server/.env` - Environment variables
- `/server/db.js` - Database connection
- `/ecosystem.config.cjs` - PM2 configuration

### Database
- `/server/migrations/` - SQL migration files
- `/server/scripts/` - Database utility scripts

### Application
- `/server/index.js` - Backend entry point
- `/server/routes/` - API endpoints
- `/src/` - Frontend source code

---

## 🔐 Security Notes

1. **Never commit** `.env` file to version control
2. **Use strong passwords** for database
3. **Enable firewall** on production server
4. **Regular backups** of database
5. **Keep dependencies updated**

```bash
# Update dependencies
npm update
cd server && npm update
```

---

## 📞 Support Commands

### Get Database Info
```bash
mysql -u admin_reem -p admin_reemresort -e "SHOW TABLES;"
```

### Check Table Structure
```bash
mysql -u admin_reem -p admin_reemresort -e "DESCRIBE bookings;"
```

### Count Records
```bash
mysql -u admin_reem -p admin_reemresort -e "
SELECT 'rooms' as table_name, COUNT(*) as count FROM rooms
UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices;"
```

---

## 📈 Next Steps

1. ✅ Database configured
2. ⏳ Deploy to CyberPanel
3. ⏳ Run migrations
4. ⏳ Test all features
5. ⏳ Configure domain/SSL
6. ⏳ Setup automated backups

---

## 🎉 All Set!

Your application is now configured to use the CyberPanel database. The system handles:
- ✅ Room management
- ✅ Booking system
- ✅ Customer records
- ✅ Invoice generation
- ✅ Payment tracking
- ✅ Financial reports

**Need help?** Check the logs or documentation files in the project root.

---

**Last Updated**: November 11, 2025
