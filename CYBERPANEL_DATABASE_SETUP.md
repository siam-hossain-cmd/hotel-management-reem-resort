# CyberPanel Database Configuration

## Database Credentials

The system is now configured to use the CyberPanel MySQL database:

- **Database Name**: `admin_reemresort`
- **Database User**: `admin_reem`
- **Password**: `jFm@@qC2MGdGb7h-`
- **Host**: `localhost` (on CyberPanel server)
- **Port**: `3306`

## Configuration Files Updated

The following files have been updated with the new database credentials:

1. ✅ `/server/.env` - Main environment configuration
2. ✅ `/server/.env.example` - Example environment file
3. ✅ `/server/.env.production.example` - Production environment example

## Database Migration Steps

### 1. Export Data from Old cPanel Database

If you need to migrate existing data from the old cPanel database:

```bash
# Export from old cPanel database
mysqldump -h 216.104.47.118 -u reemresort_admin -p reemresort_hotel_db > old_cpanel_backup.sql
```

### 2. Set Up New Database on CyberPanel

On your CyberPanel server, ensure the database and user are created:

```bash
# Connect to MySQL
mysql -u root -p

# Create database if not exists
CREATE DATABASE IF NOT EXISTS admin_reemresort;

# Create user if not exists
CREATE USER IF NOT EXISTS 'admin_reem'@'localhost' IDENTIFIED BY 'jFm@@qC2MGdGb7h-';

# Grant privileges
GRANT ALL PRIVILEGES ON admin_reemresort.* TO 'admin_reem'@'localhost';
FLUSH PRIVILEGES;

EXIT;
```

### 3. Initialize Database Schema

Run the database migrations to create all necessary tables:

```bash
cd server

# Run all migrations
node scripts/run_migrations.js
```

This will create the following tables:
- `rooms` - Room management
- `bookings` - Booking records
- `customers` - Customer information
- `booking_charges` - Additional charges for bookings
- `invoices` - Invoice records
- `payments` - Payment transactions

### 4. Import Old Data (Optional)

If you have a backup from the old database:

```bash
# Import data to new CyberPanel database
mysql -u admin_reem -p admin_reemresort < old_cpanel_backup.sql
```

### 5. Verify Database Connection

Test the connection:

```bash
# From server directory
node -e "import('./db.js').then(db => db.initDb()).then(() => console.log('✅ Connected!')).catch(err => console.error('❌ Error:', err))"
```

## Starting the Application

### Development Mode

```bash
# Install dependencies if needed
cd server
npm install

# Start the server
npm run dev
```

### Production Mode with PM2

```bash
# From project root
pm2 start ecosystem.config.cjs

# Or restart if already running
pm2 restart reem-resort

# View logs
pm2 logs reem-resort
```

## Database Structure

The system manages the following core entities:

### Rooms
- Room types, numbers, pricing
- Availability tracking
- Amenities and features

### Bookings
- Check-in/check-out dates
- Room assignments
- Guest information
- Pricing and charges
- Status tracking (pending, confirmed, checked-in, checked-out, cancelled)

### Invoices
- Automatic invoice generation
- Payment tracking
- Due amount calculation
- VAT/Tax calculations

### Payments
- Payment records
- Payment methods
- Transaction history

### Booking Charges
- Additional charges per booking
- Charge types (Food, Laundry, Transport, etc.)
- Individual pricing and quantities

## Important Notes

### Security
- The database password contains special characters (`@`), ensure they are properly escaped in connection strings
- Keep `.env` file secure and never commit to version control
- The `.env` file is already in `.gitignore`

### Performance
- Connection pool is configured with 10 connections
- Adjust `MYSQL_CONNECTION_LIMIT` in `.env` if needed

### Backup
Always backup your database before major changes:

```bash
mysqldump -u admin_reem -p admin_reemresort > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Troubleshooting

### Connection Issues

If you get connection errors:

1. **Check credentials**: Verify username, password, and database name
2. **Check MySQL service**: `systemctl status mysql`
3. **Check firewall**: Ensure MySQL port 3306 is accessible
4. **Check MySQL logs**: `tail -f /var/log/mysql/error.log`

### Access Denied

```bash
# Re-grant permissions
mysql -u root -p
GRANT ALL PRIVILEGES ON admin_reemresort.* TO 'admin_reem'@'localhost';
FLUSH PRIVILEGES;
```

### Database Not Found

```bash
# Create the database
mysql -u root -p
CREATE DATABASE admin_reemresort;
```

## Environment Variables Reference

Required environment variables in `/server/.env`:

```bash
# Server Configuration
PORT=4000
NODE_ENV=production

# Database Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=admin_reem
MYSQL_PASSWORD=jFm@@qC2MGdGb7h-
MYSQL_DATABASE=admin_reemresort

# Optional: Firebase (if needed)
# FIREBASE_SERVICE_ACCOUNT_JSON=...
```

## Next Steps

1. ✅ Database configuration updated
2. ⏳ Deploy to CyberPanel server
3. ⏳ Run database migrations
4. ⏳ Import existing data (if needed)
5. ⏳ Test all features (rooms, bookings, invoices)
6. ⏳ Restart application with PM2

## Contact & Support

If you encounter any issues:
- Check the server logs: `pm2 logs reem-resort`
- Check database logs: `tail -f /var/log/mysql/error.log`
- Verify all environment variables are set correctly
- Ensure MySQL service is running

---

**Last Updated**: November 11, 2025
**Database Type**: MySQL
**Panel**: CyberPanel
**Environment**: Production
