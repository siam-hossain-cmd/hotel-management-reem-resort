# 📋 CyberPanel Deployment Checklist

## ✅ Configuration Complete (Done on Local)

- [x] Updated `server/.env` with CyberPanel credentials
- [x] Updated `server/.env.example` 
- [x] Updated `server/.env.production.example`
- [x] Fixed hardcoded credentials in scripts
- [x] Created deployment script (`deploy-cyberpanel.sh`)
- [x] Created test connection script
- [x] Created documentation files

---

## 🚀 Pre-Deployment (Do These on CyberPanel Server)

### Database Setup
- [ ] SSH into CyberPanel server
- [ ] Login to MySQL: `mysql -u root -p`
- [ ] Create database:
  ```sql
  CREATE DATABASE IF NOT EXISTS admin_reemresort;
  ```
- [ ] Create user:
  ```sql
  CREATE USER IF NOT EXISTS 'admin_reem'@'localhost' IDENTIFIED BY 'jFm@@qC2MGdGb7h-';
  ```
- [ ] Grant permissions:
  ```sql
  GRANT ALL PRIVILEGES ON admin_reemresort.* TO 'admin_reem'@'localhost';
  FLUSH PRIVILEGES;
  EXIT;
  ```
- [ ] Test connection:
  ```bash
  mysql -u admin_reem -p admin_reemresort
  ```

### Node.js Setup (via CyberPanel)
- [ ] Go to: CyberPanel → List Websites
- [ ] Select your domain → Manage
- [ ] Enable Node.js application
- [ ] Set Node version (14.x or higher recommended)
- [ ] Note the application path

---

## 📦 Deployment Steps

### 1. Upload Files
- [ ] Upload project via FTP/SFTP to your domain directory
  - Or: `git clone https://github.com/siam-hossain-cmd/invoice-reel-resort.git`
- [ ] Verify all files uploaded correctly
- [ ] Check that `.env` file is present in `/server/` directory

### 2. Install Dependencies
```bash
cd /path/to/your/project

# Install root dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```
- [ ] Root dependencies installed
- [ ] Server dependencies installed
- [ ] No errors during installation

### 3. Configure Environment
- [ ] Edit `server/.env` if needed
- [ ] Verify database credentials:
  ```bash
  cat server/.env | grep MYSQL_
  ```
- [ ] Should show:
  - `MYSQL_HOST=localhost`
  - `MYSQL_USER=admin_reem`
  - `MYSQL_DATABASE=admin_reemresort`

### 4. Test Database Connection
```bash
cd server
node scripts/test_connection.js
```
- [ ] Connection successful ✅
- [ ] Can see database info
- [ ] If fails, check credentials and MySQL service

### 5. Initialize Database
```bash
cd server
node scripts/run_migrations.js
```
- [ ] Migrations ran successfully
- [ ] All tables created:
  - [ ] rooms
  - [ ] customers
  - [ ] bookings
  - [ ] booking_charges
  - [ ] invoices
  - [ ] payments

### 6. Build Frontend
```bash
cd /path/to/your/project
npm run build
```
- [ ] Build completed successfully
- [ ] `dist/` folder created
- [ ] No build errors

### 7. Install PM2 (if not installed)
```bash
npm install -g pm2
```
- [ ] PM2 installed
- [ ] Can run: `pm2 --version`

### 8. Start Application
```bash
cd /path/to/your/project
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```
- [ ] Application started
- [ ] PM2 shows "online" status
- [ ] No errors in logs

---

## 🧪 Testing

### Backend API Tests
```bash
# Test health endpoint (if you have one)
curl http://localhost:4000/health

# Test rooms endpoint
curl http://localhost:4000/api/rooms

# Check if server responds
curl http://localhost:4000
```
- [ ] Backend responds on port 4000
- [ ] API endpoints work
- [ ] No 500 errors

### Database Tests
```bash
mysql -u admin_reem -p admin_reemresort -e "SHOW TABLES;"
```
- [ ] All tables visible
- [ ] Can query tables
- [ ] No permission errors

### Application Logs
```bash
pm2 logs reem-resort
```
- [ ] No connection errors
- [ ] Database connected successfully
- [ ] Server listening on port 4000

### Frontend Test (if applicable)
- [ ] Can access website
- [ ] Pages load correctly
- [ ] Can view rooms
- [ ] Can create bookings
- [ ] Can generate invoices

---

## 🔧 Configuration (CyberPanel Interface)

### Node.js Application Settings
- [ ] Application name: reem-resort
- [ ] Application path: /path/to/project/server/index.js
- [ ] Port: 4000
- [ ] Environment: production

### Web Server Configuration
- [ ] Point domain to application
- [ ] Configure reverse proxy (if needed)
- [ ] SSL certificate installed
- [ ] HTTPS working

---

## 🔐 Security

- [ ] `.env` file has correct permissions (600 or 640)
  ```bash
  chmod 600 server/.env
  ```
- [ ] Database password is strong
- [ ] MySQL only accepts localhost connections
- [ ] Firewall configured properly
- [ ] SSL/HTTPS enabled on domain
- [ ] `.env` not in public directory

---

## 💾 Backup Setup

### Initial Backup
```bash
mysqldump -u admin_reem -p admin_reemresort > backup_initial.sql
```
- [ ] Initial backup created
- [ ] Backup file saved securely

### Scheduled Backups (Optional)
```bash
# Add to crontab for daily backups at 2 AM
0 2 * * * mysqldump -u admin_reem -p'jFm@@qC2MGdGb7h-' admin_reemresort > /backups/db_$(date +\%Y\%m\%d).sql
```
- [ ] Automated backup configured
- [ ] Backup directory exists
- [ ] Old backups cleaned up periodically

---

## 📊 Monitoring

### PM2 Monitoring
```bash
pm2 monit
pm2 status
pm2 logs reem-resort
```
- [ ] Application running
- [ ] CPU/Memory usage normal
- [ ] No repeated errors in logs

### Database Monitoring
```bash
# Check database size
mysql -u admin_reem -p admin_reemresort -e "
SELECT 
  table_name,
  table_rows,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.TABLES
WHERE table_schema = 'admin_reemresort';"
```
- [ ] Database size reasonable
- [ ] Tables have expected row counts

---

## 🐛 Troubleshooting Checklist

If something doesn't work:

### Database Connection Issues
- [ ] MySQL service running: `systemctl status mysql`
- [ ] Credentials correct in `.env`
- [ ] User has permissions: `SHOW GRANTS FOR 'admin_reem'@'localhost';`
- [ ] Database exists: `SHOW DATABASES;`

### Application Not Starting
- [ ] PM2 installed and working
- [ ] Port 4000 not in use: `lsof -i :4000`
- [ ] Dependencies installed
- [ ] No syntax errors: `node server/index.js`

### Frontend Issues
- [ ] Build completed: check `dist/` folder
- [ ] Static files served correctly
- [ ] API calls pointing to correct URL

### Performance Issues
- [ ] Check PM2 logs for errors
- [ ] Monitor server resources
- [ ] Check database query performance
- [ ] Increase connection pool if needed

---

## ✅ Final Verification

### Essential Tests
- [ ] Can add a room
- [ ] Can create a customer
- [ ] Can make a booking
- [ ] Invoice generates automatically
- [ ] Can record a payment
- [ ] Reports load correctly
- [ ] All CRUD operations work

### Data Verification
```bash
# Count records in each table
mysql -u admin_reem -p admin_reemresort -e "
SELECT 'rooms' as table_name, COUNT(*) as count FROM rooms
UNION ALL SELECT 'customers', COUNT(*) FROM customers
UNION ALL SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL SELECT 'invoices', COUNT(*) FROM invoices
UNION ALL SELECT 'payments', COUNT(*) FROM payments;"
```
- [ ] Tables have expected data
- [ ] Relationships working correctly

---

## 📝 Post-Deployment

### Documentation
- [ ] Note down server access details
- [ ] Save database credentials securely
- [ ] Document any custom configurations
- [ ] Update team on new deployment

### User Access
- [ ] Test user login (if applicable)
- [ ] Verify permissions work
- [ ] Train users on new system

### Maintenance Plan
- [ ] Schedule regular backups
- [ ] Plan for updates
- [ ] Set up monitoring alerts
- [ ] Document maintenance procedures

---

## 🎉 Launch Checklist

Ready to go live?

- [ ] All tests passing
- [ ] Backups configured
- [ ] Monitoring in place
- [ ] SSL/HTTPS working
- [ ] Performance acceptable
- [ ] Users trained
- [ ] Documentation complete

---

## 📞 Emergency Contacts & Commands

### Restart Application
```bash
pm2 restart reem-resort
```

### Stop Application
```bash
pm2 stop reem-resort
```

### View Logs
```bash
pm2 logs reem-resort --lines 100
```

### Restore Database
```bash
mysql -u admin_reem -p admin_reemresort < backup.sql
```

### Check MySQL Status
```bash
systemctl status mysql
```

---

## 📚 Reference Documents

Created documentation files:
- `CYBERPANEL_DATABASE_SETUP.md` - Complete setup guide
- `CYBERPANEL_QUICK_START.md` - Quick commands
- `DATABASE_MIGRATION_COMPLETE.md` - Migration summary
- `SYSTEM_ARCHITECTURE.md` - System overview
- `deploy-cyberpanel.sh` - Automated deployment script

---

**Deployment Date**: _____________  
**Deployed By**: _____________  
**Server**: CyberPanel  
**Status**: ⏳ Pending / ✅ Complete

---

**Notes**:
- Keep this checklist for future reference
- Check off items as you complete them
- Note any issues or customizations
- Update documentation with any changes

Good luck with your deployment! 🚀
