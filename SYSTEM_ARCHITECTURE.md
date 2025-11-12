# 🗺️ System Architecture - CyberPanel Configuration

## Database Configuration Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    REEM RESORT SYSTEM                        │
│                  (Full Stack Application)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
                              ▼
        ┌──────────────────────────────────────────┐
        │         FRONTEND (React + Vite)          │
        │  ├─ Room Management                      │
        │  ├─ Booking System                       │
        │  ├─ Customer Management                  │
        │  ├─ Invoice Generation                   │
        │  └─ Reports & Analytics                  │
        └──────────────────────────────────────────┘
                              │
                              │ HTTP/HTTPS
                              ▼
        ┌──────────────────────────────────────────┐
        │      BACKEND (Node.js + Express)         │
        │  ├─ /api/rooms                           │
        │  ├─ /api/bookings                        │
        │  ├─ /api/customers                       │
        │  ├─ /api/invoices                        │
        │  └─ /api/payments                        │
        └──────────────────────────────────────────┘
                              │
                              │ mysql2
                              ▼
        ┌──────────────────────────────────────────┐
        │    CYBERPANEL MYSQL DATABASE             │
        │                                           │
        │  Database: admin_reemresort              │
        │  User:     admin_reem                    │
        │  Host:     localhost                     │
        │  Port:     3306                          │
        │                                           │
        │  Tables:                                 │
        │  ├─ rooms                                │
        │  ├─ customers                            │
        │  ├─ bookings                             │
        │  ├─ booking_charges                      │
        │  ├─ invoices                             │
        │  └─ payments                             │
        └──────────────────────────────────────────┘
```

---

## File Configuration Map

```
📦 Project Root
│
├─ 📄 server/.env                          ✅ UPDATED
│   └─ MYSQL_HOST=localhost
│   └─ MYSQL_USER=admin_reem
│   └─ MYSQL_PASSWORD=jFm@@qC2MGdGb7h-
│   └─ MYSQL_DATABASE=admin_reemresort
│
├─ 📄 server/.env.example                  ✅ UPDATED
│   └─ Template with new credentials
│
├─ 📄 server/.env.production.example       ✅ UPDATED
│   └─ Production template
│
├─ 📄 server/db.js                         ✅ VERIFIED
│   └─ Uses process.env.MYSQL_*
│
├─ 📄 server/scripts/test_connection.js    ✅ CREATED
│   └─ Tests database connection
│
├─ 📄 server/scripts/run_migrations.js     ✅ VERIFIED
│   └─ Creates all database tables
│
├─ 📄 deploy-cyberpanel.sh                 ✅ CREATED
│   └─ Automated deployment script
│
├─ 📄 CYBERPANEL_DATABASE_SETUP.md         ✅ CREATED
│   └─ Complete setup guide
│
├─ 📄 CYBERPANEL_QUICK_START.md            ✅ CREATED
│   └─ Quick reference guide
│
└─ 📄 DATABASE_MIGRATION_COMPLETE.md       ✅ CREATED
    └─ Migration summary
```

---

## Data Flow Diagram

```
┌─────────────┐
│   USER      │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. Request (Search Rooms, Book, etc.)
       ▼
┌─────────────────────────────────────┐
│    FRONTEND (Port 5173/80/443)      │
│  React Components + UI              │
└──────┬──────────────────────────────┘
       │
       │ 2. API Call (fetch/axios)
       ▼
┌─────────────────────────────────────┐
│    BACKEND API (Port 4000)          │
│  Express Routes + Business Logic    │
└──────┬──────────────────────────────┘
       │
       │ 3. Database Query
       │    (SELECT, INSERT, UPDATE)
       ▼
┌─────────────────────────────────────┐
│  CYBERPANEL MYSQL                   │
│  Database: admin_reemresort         │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Tables:                     │  │
│  │  • rooms                     │  │
│  │  • customers                 │  │
│  │  • bookings                  │  │
│  │  • booking_charges           │  │
│  │  • invoices                  │  │
│  │  • payments                  │  │
│  └──────────────────────────────┘  │
└──────┬──────────────────────────────┘
       │
       │ 4. Return Data
       ▼
┌─────────────────────────────────────┐
│    BACKEND API                      │
│  Format Response (JSON)             │
└──────┬──────────────────────────────┘
       │
       │ 5. Send Response
       ▼
┌─────────────────────────────────────┐
│    FRONTEND                         │
│  Update UI with Data                │
└──────┬──────────────────────────────┘
       │
       │ 6. Display to User
       ▼
┌─────────────┐
│   USER      │
│  (Browser)  │
└─────────────┘
```

---

## Feature → Database Mapping

### 🏨 Room Management
```
Frontend Component: AddRoomForm.jsx, Room pages
         ↓
API Endpoint: /api/rooms
         ↓
Database Table: rooms
         ↓
Columns: id, room_number, type, price, amenities, status, etc.
```

### 📅 Booking System
```
Frontend Component: Booking pages
         ↓
API Endpoints: /api/bookings, /api/bookings/:id
         ↓
Database Tables: bookings, booking_charges, customers
         ↓
Creates: Booking record + Associated charges + Customer info
```

### 🧾 Invoice System
```
Frontend Component: Invoice pages
         ↓
API Endpoints: /api/invoices, /api/invoices/:id
         ↓
Database Tables: invoices, bookings, booking_charges, payments
         ↓
Generates: Invoice with all charges, payments, and balance
```

### 💰 Payment System
```
Frontend Component: Payment forms
         ↓
API Endpoint: /api/payments
         ↓
Database Tables: payments, invoices
         ↓
Updates: Payment records + Invoice paid/due amounts
```

---

## Deployment Flow

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Prepare CyberPanel Server                          │
│  • Create database: admin_reemresort                        │
│  • Create user: admin_reem                                  │
│  • Grant permissions                                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Upload Project Files                               │
│  • Via FTP/SFTP/Git                                         │
│  • Include server/.env with credentials                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Install Dependencies                               │
│  • npm install                                              │
│  • cd server && npm install                                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: Test Database Connection                           │
│  • node scripts/test_connection.js                          │
│  • Should show "Connection successful"                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: Run Database Migrations                            │
│  • node scripts/run_migrations.js                           │
│  • Creates all tables and schema                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 6: Build Frontend                                     │
│  • npm run build                                            │
│  • Creates dist/ folder                                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 7: Start Application                                  │
│  • pm2 start ecosystem.config.cjs                           │
│  • pm2 save                                                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 8: Verify & Test                                      │
│  • pm2 status                                               │
│  • pm2 logs reem-resort                                     │
│  • Test API endpoints                                       │
│  • Test frontend features                                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
                        ✅ LIVE!
```

---

## Environment Variables Flow

```
CyberPanel Server
       │
       ├─ System Environment (optional)
       │   └─ Can set via CyberPanel interface
       │
       ├─ .env file (recommended)
       │   └─ /server/.env
       │       ├─ MYSQL_HOST=localhost
       │       ├─ MYSQL_PORT=3306
       │       ├─ MYSQL_USER=admin_reem
       │       ├─ MYSQL_PASSWORD=jFm@@qC2MGdGb7h-
       │       └─ MYSQL_DATABASE=admin_reemresort
       │
       ├─ Loaded by dotenv
       │   └─ server/db.js
       │       └─ dotenv.config()
       │
       ├─ Used by application
       │   └─ process.env.MYSQL_*
       │       ├─ db.js (connection pool)
       │       ├─ routes/*.js (all routes)
       │       └─ scripts/*.js (utilities)
       │
       └─ Connects to MySQL
           └─ admin_reemresort database
```

---

## Security & Best Practices

```
✅ DO's:
  • Keep .env file secure
  • Use environment variables
  • Regular database backups
  • Monitor PM2 logs
  • Update dependencies
  • Use SSL/HTTPS in production

❌ DON'Ts:
  • Commit .env to version control
  • Hardcode credentials in files
  • Expose database to public internet
  • Use weak passwords
  • Skip backups
  • Ignore error logs
```

---

## Quick Command Reference

```bash
# Test Connection
cd server && node scripts/test_connection.js

# Run Migrations
cd server && node scripts/run_migrations.js

# Start Application
pm2 start ecosystem.config.cjs

# View Logs
pm2 logs reem-resort

# Restart
pm2 restart reem-resort

# Backup Database
mysqldump -u admin_reem -p admin_reemresort > backup.sql

# Restore Database
mysql -u admin_reem -p admin_reemresort < backup.sql
```

---

**System Status**: ✅ Fully Configured for CyberPanel  
**Database**: admin_reemresort  
**Ready to Deploy**: YES
