# 🔄 Data Flow - Complete System Trace

## Where Does Data Come From?

Your Reem Resort system follows this complete data flow:

---

## 📊 Complete Data Flow Chain

```
┌─────────────────────────────────────────────────────────────────┐
│                      1. USER INTERACTION                         │
│                    (Browser - React Frontend)                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ User clicks button
                             │ (e.g., "View Rooms", "Create Booking")
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     2. REACT COMPONENTS                          │
│  Location: /src/pages/*.jsx                                     │
│  Examples:                                                      │
│  • Rooms.jsx        - Room management UI                        │
│  • Bookings.jsx     - Booking list UI                           │
│  • Dashboard.jsx    - Dashboard with stats                      │
│  • Reports.jsx      - Financial reports                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Component calls API service
                             │ Example: api.getRooms()
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      3. API SERVICE LAYER                        │
│  File: /src/services/api.js                                     │
│  Purpose: Centralized API communication                         │
│                                                                  │
│  API Base URL:                                                  │
│  • Development: /api (proxied via Vite)                         │
│  • Production: https://admin.reemresort.com/api                 │
│                                                                  │
│  Functions:                                                     │
│  • getRooms() → fetch('/api/rooms')                             │
│  • getBookings() → fetch('/api/bookings')                       │
│  • createBooking(data) → POST '/api/bookings'                   │
│  • getInvoices() → fetch('/api/invoices')                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP Request (GET/POST/PUT/DELETE)
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    4. BACKEND API SERVER                         │
│  File: /server/index.js (Express Server)                        │
│  Port: 4000 (configurable via .env)                             │
│                                                                  │
│  Middleware Stack:                                              │
│  1. CORS - Allows cross-origin requests                         │
│  2. JSON Parser - Parses request bodies                         │
│  3. URL Encoded - Parses form data                              │
│  4. Firebase Auth (optional) - Validates tokens                 │
│                                                                  │
│  Routes Registered:                                             │
│  • /api/rooms       → routes/rooms.js                           │
│  • /api/bookings    → routes/bookings.js                        │
│  • /api/customers   → routes/customers.js                       │
│  • /api/invoices    → routes/invoices.js                        │
│  • /api/payments    → routes/payments.js                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Route handler processes request
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      5. ROUTE HANDLERS                           │
│  Location: /server/routes/*.js                                  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /server/routes/rooms.js                                 │  │
│  │  • GET /api/rooms - List all rooms                       │  │
│  │  • GET /api/rooms/:id - Get specific room               │  │
│  │  • GET /api/rooms/available - Get available rooms       │  │
│  │  • POST /api/rooms - Create new room                    │  │
│  │  • PUT /api/rooms/:id - Update room                     │  │
│  │  • PUT /api/rooms/:id/status - Update status            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /server/routes/bookings.js                              │  │
│  │  • GET /api/bookings - List all bookings                 │  │
│  │  • GET /api/bookings/:id - Get specific booking          │  │
│  │  • POST /api/bookings - Create new booking               │  │
│  │  • PUT /api/bookings/:id/status - Update status          │  │
│  │  • POST /api/bookings/:id/charges - Add charge           │  │
│  │  • GET /api/bookings/:id/summary - Get full summary      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /server/routes/invoices.js                              │  │
│  │  • GET /api/invoices - List all invoices                 │  │
│  │  • GET /api/invoices/:id - Get specific invoice          │  │
│  │  • GET /api/invoices/booking/:id - Get by booking        │  │
│  │  • POST /api/invoices - Create invoice                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Executes SQL queries
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   6. DATABASE CONNECTION                         │
│  File: /server/db.js                                            │
│  Library: mysql2/promise                                        │
│                                                                  │
│  Connection Pool Configuration:                                 │
│  • Host: process.env.MYSQL_HOST (localhost on CyberPanel)      │
│  • Port: process.env.MYSQL_PORT (3306)                          │
│  • User: process.env.MYSQL_USER (admin_reem)                    │
│  • Password: process.env.MYSQL_PASSWORD                         │
│  • Database: process.env.MYSQL_DATABASE (admin_reemresort)      │
│  • Connection Limit: 10                                         │
│  • Timeout: 10 seconds                                          │
│                                                                  │
│  Functions:                                                     │
│  • initDb() - Initializes connection pool                       │
│  • getPool() - Returns existing pool                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ SQL Query (SELECT/INSERT/UPDATE)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  7. CYBERPANEL MYSQL DATABASE                    │
│  Database: admin_reemresort                                     │
│  User: admin_reem                                               │
│  Host: localhost (on CyberPanel server)                         │
│                                                                  │
│  📁 Database Tables:                                            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  rooms                                                   │  │
│  │  • id, room_number, room_type, capacity                  │  │
│  │  • rate, status, meta, created_at, updated_at            │  │
│  │  Purpose: Store all room information                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  customers                                               │  │
│  │  • id, first_name, last_name, email, phone               │  │
│  │  • address, id_type, id_number, created_at               │  │
│  │  Purpose: Store customer/guest information               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  bookings                                                │  │
│  │  • id, customer_id, room_id, checkin_date                │  │
│  │  • checkout_date, total_amount, status                   │  │
│  │  • base_amount, discount_percentage, tax_percentage      │  │
│  │  • special_requests, created_at, updated_at              │  │
│  │  Purpose: Store reservation/booking records              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  booking_charges                                         │  │
│  │  • id, booking_id, charge_type, description              │  │
│  │  • amount, quantity, created_at                          │  │
│  │  Purpose: Additional charges (food, laundry, etc.)       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  invoices                                                │  │
│  │  • id, booking_id, invoice_number, issue_date            │  │
│  │  • due_date, subtotal, tax, total, paid_amount           │  │
│  │  • due_amount, status, created_at, updated_at            │  │
│  │  Purpose: Store invoice records                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  payments                                                │  │
│  │  • id, booking_id, invoice_id, amount                    │  │
│  │  • payment_method, payment_date, processed_at            │  │
│  │  • notes, created_at                                     │  │
│  │  Purpose: Track payment transactions                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Returns query results
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    8. RESPONSE SENT BACK                         │
│  Data flows back through the same chain:                        │
│  Database → db.js → Route Handler → Express → API → React       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Example: View All Rooms

### Step-by-Step Flow:

```
1. USER ACTION
   └─ User clicks "Rooms" in navigation

2. REACT COMPONENT (Rooms.jsx)
   └─ useEffect(() => { loadRooms(); }, []);

3. API CALL
   └─ const result = await api.getRooms();

4. API SERVICE (api.js)
   └─ fetch('/api/rooms')

5. BACKEND SERVER (index.js)
   └─ Routes to: /api/rooms → roomsRouter

6. ROUTE HANDLER (routes/rooms.js)
   └─ router.get('/', async (req, res) => { ... })

7. DATABASE QUERY
   └─ const [rows] = await pool.query('SELECT * FROM rooms ORDER BY room_number');

8. CYBERPANEL MYSQL
   └─ Executes query on admin_reemresort.rooms table

9. RETURN DATA
   └─ res.json({ success: true, rooms: rows });

10. FRONTEND RECEIVES
    └─ setRooms(result.rooms);

11. UI UPDATES
    └─ React renders room list on screen
```

---

## 🔍 Example: Create a Booking

### Step-by-Step Flow:

```
1. USER ACTION
   └─ User fills form and clicks "Create Booking"

2. REACT COMPONENT (CreateBooking.jsx)
   └─ handleSubmit(bookingData)

3. API CALL
   └─ const result = await api.createBooking(bookingData);

4. API SERVICE (api.js)
   └─ fetch('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData)
      })

5. BACKEND SERVER (index.js)
   └─ POST /api/bookings → bookingsRouter

6. ROUTE HANDLER (routes/bookings.js)
   └─ router.post('/', async (req, res) => { ... })

7. TRANSACTION STARTS
   └─ const conn = await pool.getConnection();
   └─ await conn.beginTransaction();

8. DATABASE OPERATIONS (Multiple queries in transaction)
   
   Step A: Create/Find Customer
   └─ INSERT INTO customers (first_name, last_name, email...) VALUES (...)
   └─ Returns: customer_id
   
   Step B: Create Booking
   └─ INSERT INTO bookings (customer_id, room_id, checkin_date...) VALUES (...)
   └─ Returns: booking_id
   
   Step C: Add Charges (if any)
   └─ INSERT INTO booking_charges (booking_id, charge_type...) VALUES (...)
   
   Step D: Create Invoice
   └─ INSERT INTO invoices (booking_id, invoice_number...) VALUES (...)
   
   Step E: Update Room Status
   └─ UPDATE rooms SET status = 'occupied' WHERE id = ?

9. COMMIT TRANSACTION
   └─ await conn.commit();

10. RETURN SUCCESS
    └─ res.json({ success: true, booking_id: result.insertId });

11. FRONTEND RECEIVES
    └─ Shows success message, redirects to bookings list

12. UI UPDATES
    └─ New booking appears in the list
```

---

## 📍 Data Sources Summary

### Current Data Location: **CyberPanel MySQL Database**

| Data Type | Table | Source |
|-----------|-------|--------|
| Rooms | `rooms` | Added via frontend form → API → MySQL |
| Customers | `customers` | Created during booking process |
| Bookings | `bookings` | Created via booking form |
| Charges | `booking_charges` | Added via booking or charge form |
| Invoices | `invoices` | Auto-generated when booking created |
| Payments | `payments` | Recorded via payment form |

### Configuration Source: **Environment Variables**

```
File: /server/.env

MYSQL_HOST=localhost                    ← Where to connect
MYSQL_USER=admin_reem                   ← Database user
MYSQL_PASSWORD=jFm@@qC2MGdGb7h-        ← Database password
MYSQL_DATABASE=admin_reemresort         ← Database name
```

---

## 🔄 Data Flow for Each Feature

### 🏨 Room Management
```
Frontend: src/pages/Rooms.jsx
   ↓
API: src/services/api.js → api.getRooms()
   ↓
Backend: server/routes/rooms.js → GET /api/rooms
   ↓
Database: server/db.js → SELECT * FROM rooms
   ↓
MySQL: admin_reemresort.rooms table
```

### 📅 Booking System
```
Frontend: src/pages/CreateBooking.jsx
   ↓
API: src/services/api.js → api.createBooking()
   ↓
Backend: server/routes/bookings.js → POST /api/bookings
   ↓
Database: server/db.js → INSERT INTO bookings, customers
   ↓
MySQL: admin_reemresort.bookings, customers tables
```

### 🧾 Invoice System
```
Frontend: src/pages/Invoices.jsx
   ↓
API: src/services/api.js → api.getInvoices()
   ↓
Backend: server/routes/invoices.js → GET /api/invoices
   ↓
Database: server/db.js → SELECT * FROM invoices
   ↓
MySQL: admin_reemresort.invoices table
```

### 💰 Payment System
```
Frontend: Payment form component
   ↓
API: src/services/api.js → api.addPayment()
   ↓
Backend: server/routes/payments.js → POST /api/payments
   ↓
Database: server/db.js → INSERT INTO payments
   ↓
MySQL: admin_reemresort.payments table
```

### 📊 Reports
```
Frontend: src/pages/Reports.jsx
   ↓
API: Multiple calls (getBookings, getRooms, etc.)
   ↓
Backend: Multiple routes (bookings, rooms, invoices)
   ↓
Database: Multiple queries (JOIN operations)
   ↓
MySQL: Aggregates data from multiple tables
```

---

## 🔐 Authentication Flow (Optional - Firebase)

```
User Login
   ↓
Firebase Authentication
   ↓
Returns: ID Token
   ↓
Stored in: Browser (localStorage/sessionStorage)
   ↓
Sent with requests: Authorization: Bearer <token>
   ↓
Backend validates: verifyFirebaseToken middleware
   ↓
Grants access to protected routes
```

---

## 📦 Dependencies

### Frontend Dependencies
```json
{
  "react": "UI framework",
  "react-router-dom": "Client-side routing",
  "firebase": "Authentication (optional)",
  "vite": "Build tool"
}
```

### Backend Dependencies
```json
{
  "express": "Web server framework",
  "mysql2": "MySQL database driver",
  "dotenv": "Environment variables",
  "cors": "Cross-origin requests"
}
```

---

## 🎯 Key Points

1. **All data is stored in CyberPanel MySQL database** (`admin_reemresort`)
2. **Backend API (Express) connects to MySQL** using credentials from `.env`
3. **Frontend (React) calls backend API** via `/api/*` endpoints
4. **No hardcoded data** - everything comes from the database
5. **Real-time updates** - data fetched on page load and after actions
6. **Transactional operations** - bookings use transactions for data integrity

---

## 🔧 How to Verify Data Source

### Check Backend Connection
```bash
cd server
node scripts/test_connection.js
```

### Check Database Tables
```bash
mysql -u admin_reem -p admin_reemresort
SHOW TABLES;
SELECT COUNT(*) FROM rooms;
SELECT COUNT(*) FROM bookings;
```

### Check API Response
```bash
curl http://localhost:4000/api/rooms
curl http://localhost:4000/api/bookings
```

### Check Frontend Network Calls
1. Open browser DevTools (F12)
2. Go to Network tab
3. Perform any action (view rooms, create booking)
4. See API calls to `/api/*` endpoints

---

**Summary**: All data comes from your **CyberPanel MySQL database** (`admin_reemresort`) through the **Express API** (`/api/*` endpoints) consumed by your **React frontend**. No external data sources, all self-contained! ✅
