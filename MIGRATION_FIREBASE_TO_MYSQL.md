# Invoice Migration: Firebase → MySQL

## Summary
Migrated the invoice system from **Firebase Firestore** to **MySQL** database to enable better integration with payments, charges, and bookings. This allows the system to show **payment dates with charges** and maintain referential integrity.

---

## Why MySQL Instead of Firebase?

✅ **Better Data Relationships** - Foreign keys link invoices to bookings, charges, and payments  
✅ **Payment Tracking** - Payments table shows dates alongside charges  
✅ **Real-time Calculations** - Paid/due amounts auto-calculate from payments  
✅ **Query Performance** - JOIN operations for complex reports  
✅ **Data Integrity** - Transactions ensure atomic operations  
✅ **Single Database** - All data in one place (bookings, charges, payments, invoices)

---

## Changes Made

### 1. **Database Schema** (MySQL)

Created two new tables:

#### `invoices` Table
```sql
CREATE TABLE invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    booking_id INT NOT NULL,
    
    -- Customer Information
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_address TEXT,
    customer_nid VARCHAR(50),
    
    -- Invoice Details
    invoice_date DATE NOT NULL,
    due_date DATE,
    
    -- Financial Summary
    base_amount DECIMAL(10, 2) DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    subtotal DECIMAL(10, 2) DEFAULT 0.00,
    additional_charges_total DECIMAL(10, 2) DEFAULT 0.00,
    tax_rate DECIMAL(5, 2) DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) DEFAULT 0.00,
    due_amount DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Status
    status ENUM('unpaid', 'partial', 'paid', 'cancelled') DEFAULT 'unpaid',
    
    -- Notes and Terms
    notes TEXT,
    terms TEXT,
    
    -- Metadata
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);
```

#### `invoice_items` Table
```sql
CREATE TABLE invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    
    -- Room Details
    room_number VARCHAR(10),
    room_type VARCHAR(50),
    check_in_date DATE,
    check_out_date DATE,
    total_nights INT DEFAULT 1,
    guest_count INT DEFAULT 1,
    
    -- Pricing
    price_per_night DECIMAL(10, 2) DEFAULT 0.00,
    base_amount DECIMAL(10, 2) DEFAULT 0.00,
    discount_percentage DECIMAL(5, 2) DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    amount DECIMAL(10, 2) NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);
```

**Note:** `booking_charges` and `payments` tables already exist and link via `booking_id`

---

### 2. **Backend API** (`server/routes/invoices.js`)

Completely rebuilt the invoices API:

#### **POST /api/invoices** - Create Invoice
```javascript
{
  booking_id: 123,
  customer_name: "John Doe",
  customer_email: "john@example.com",
  customer_phone: "+880123456789",
  customer_address: "Dhaka, Bangladesh",
  customer_nid: "1234567890",
  invoice_date: "2025-10-14",
  due_date: "2025-10-20",
  items: [{
    room_number: "101",
    room_type: "Deluxe",
    check_in_date: "2025-10-15",
    check_out_date: "2025-10-18",
    total_nights: 3,
    guest_count: 2,
    price_per_night: 1500.00,
    base_amount: 4500.00,
    discount_percentage: 10,
    discount_amount: 450.00,
    amount: 4050.00
  }],
  notes: "Special requests...",
  terms: "Payment due within 30 days",
  created_by: "admin@resort.com"
}
```

**Features:**
- ✅ Auto-generates invoice number (INV-timestamp)
- ✅ Calculates totals from items
- ✅ Fetches additional charges from `booking_charges`
- ✅ Fetches payments from `payments` table
- ✅ Calculates paid/due amounts automatically
- ✅ Determines status (unpaid/partial/paid)
- ✅ Uses transactions for atomicity
- ✅ Inserts invoice + items in single transaction

#### **GET /api/invoices/:id** - Get Invoice by ID
Returns:
```javascript
{
  success: true,
  invoice: {
    id: 1,
    invoice_number: "INV-1729123456",
    booking_id: 123,
    // ... all invoice fields
    items: [...],      // Invoice items
    charges: [...],    // Additional charges with dates
    payments: [...]    // Payments with dates
  }
}
```

#### **GET /api/invoices/booking/:booking_id** - Get Latest Invoice by Booking
- Returns most recent invoice for a booking
- Orders by `created_at DESC`
- Includes items, charges, and **payments with dates**

#### **GET /api/invoices** - Get All Invoices
- Joins with `bookings` table
- Returns booking reference and room details

#### **PATCH /api/invoices/:id/status** - Update Status
```javascript
{ status: "paid" }
```

#### **DELETE /api/invoices/:id** - Delete Invoice

---

### 3. **Frontend API Service** (`src/services/api.js`)

Added invoice methods:

```javascript
// Get all invoices
await api.getInvoices()

// Create new invoice
await api.createInvoice({
  booking_id,
  customer_name,
  customer_email,
  items: [...],
  ...
})

// Get invoice by ID
await api.getInvoice(id)
await api.getInvoiceById(id) // Alias

// Get latest invoice by booking ID
await api.getInvoiceByBookingId(bookingId)
```

---

### 4. **Bookings Page** (`src/pages/Bookings.jsx`)

Updated to use MySQL API:

#### **handleViewInvoice()**
```javascript
// Now fetches from MySQL API
const invoiceResult = await api.getInvoiceByBookingId(booking.id);

if (invoiceResult.success) {
  window.location.href = `/invoices?id=${invoiceResult.invoice.id}`;
} else {
  // Offer to create invoice for old bookings
  if (confirm('Create invoice now?')) {
    await createInvoiceForBooking(booking);
  }
}
```

#### **createInvoiceForBooking()**
- Creates invoice in MySQL format
- Fetches booking details via API
- Calculates nights, amounts, discounts
- Saves to MySQL using `api.createInvoice()`

#### **loadBookings()**
```javascript
// Fetch invoices from MySQL instead of Firebase
const invoiceResult = await api.getInvoices();
const invoices = invoiceResult.success ? invoiceResult.invoices : [];

// Match invoices to bookings by booking_id
const relatedInvoice = invoices.find(inv => inv.booking_id === booking.id);
```

**Removed:** Firebase imports (`invoiceService from '../firebase/invoiceService'`)

---

### 5. **Create Booking Page** (`src/pages/CreateBooking.jsx`)

Updated invoice creation:

#### **Before (Firebase)**
```javascript
const invoiceToSave = {
  bookingId: bookingResult.id,
  customerInfo: { ... },
  items: [...],
  ...
};
await invoiceService.createInvoice(invoiceToSave);
```

#### **After (MySQL)**
```javascript
const invoiceData = {
  booking_id: bookingResult.id,
  customer_name: "John Doe",
  customer_email: "john@example.com",
  items: [{
    room_number: "101",
    room_type: "Deluxe",
    check_in_date: "2025-10-15",
    check_out_date: "2025-10-18",
    total_nights: 3,
    price_per_night: 1500,
    base_amount: 4500,
    discount_percentage: 10,
    discount_amount: 450,
    amount: 4050
  }],
  notes: "...",
  terms: "...",
  created_by: "admin"
};
await api.createInvoice(invoiceData);
```

**Removed:** Firebase imports

---

## Data Flow

### Creating a Booking with Invoice

```
1. User creates booking → bookings table (MySQL)
2. System creates invoice → invoices + invoice_items tables (MySQL)
3. Invoice links to booking via booking_id
4. Additional charges → booking_charges table
5. Payments → payments table
6. Invoice totals auto-calculate from:
   - invoice_items (room charges with discounts)
   - booking_charges (additional services)
   - payments (amounts paid with dates)
```

### Viewing an Invoice

```
1. User clicks "View Invoice" on booking
2. System queries: GET /api/invoices/booking/:booking_id
3. Backend fetches:
   - Invoice details
   - Invoice items (rooms)
   - booking_charges (additional charges with dates)
   - payments (payment history with dates)
4. Returns complete invoice with payment timeline
```

### Adding a Payment

```
1. User adds payment → payments table
2. Payment includes: amount, method, date, reference
3. Invoice auto-updates:
   - paid_amount = SUM(payments)
   - due_amount = total_amount - paid_amount
   - status = unpaid | partial | paid
4. Payment appears in invoice with date
```

---

## Benefits of MySQL Implementation

### 1. **Payment Tracking with Dates** ✅
```sql
SELECT 
  p.amount,
  p.method,
  p.created_at as payment_date,
  p.reference,
  p.notes
FROM payments p
WHERE p.booking_id = 123
ORDER BY p.created_at DESC;
```

### 2. **Charge Tracking with Dates** ✅
```sql
SELECT 
  bc.description,
  bc.amount,
  bc.created_at as charge_date
FROM booking_charges bc
WHERE bc.booking_id = 123
ORDER BY bc.created_at DESC;
```

### 3. **Real-time Calculations** ✅
```sql
-- Auto-calculated during invoice creation
paid_amount = (SELECT SUM(amount) FROM payments WHERE booking_id = ?)
additional_charges = (SELECT SUM(amount) FROM booking_charges WHERE booking_id = ?)
due_amount = total_amount - paid_amount
```

### 4. **Referential Integrity** ✅
```sql
-- Cascading deletes
DELETE FROM bookings WHERE id = 123;
-- Auto-deletes: invoices, invoice_items, booking_charges, payments
```

### 5. **Complex Reports** ✅
```sql
-- Revenue by date range
SELECT 
  DATE(i.invoice_date) as date,
  SUM(i.total_amount) as revenue,
  SUM(i.paid_amount) as collected,
  SUM(i.due_amount) as outstanding
FROM invoices i
WHERE i.invoice_date BETWEEN '2025-10-01' AND '2025-10-31'
GROUP BY DATE(i.invoice_date);
```

---

## Migration Steps (Already Completed)

1. ✅ Created MySQL tables (`invoices`, `invoice_items`)
2. ✅ Built backend API routes (`server/routes/invoices.js`)
3. ✅ Updated frontend API service (`src/services/api.js`)
4. ✅ Updated Bookings page (`src/pages/Bookings.jsx`)
5. ✅ Updated CreateBooking page (`src/pages/CreateBooking.jsx`)
6. ✅ Tested invoice creation and retrieval

---

## Testing Checklist

### ✅ Create New Booking
- [ ] Go to "Create Booking"
- [ ] Select room, enter guest info
- [ ] Add discount if needed
- [ ] Add additional charges
- [ ] Add payments
- [ ] Click "Save & Confirm Booking"
- [ ] Verify invoice created in MySQL
- [ ] Check invoice_number generated

### ✅ View Invoice
- [ ] Go to Bookings page
- [ ] Click "View" on a booking
- [ ] Click "View Invoice" button
- [ ] Verify invoice displays
- [ ] Check payment dates shown
- [ ] Check charge dates shown

### ✅ Create Invoice for Old Booking
- [ ] View booking without invoice
- [ ] Click "View Invoice"
- [ ] Click "OK" on confirmation
- [ ] Verify invoice created
- [ ] Check all data populated correctly

### ✅ Add Payment
- [ ] View booking
- [ ] Click "Add Payment"
- [ ] Enter amount, method, reference
- [ ] Save payment
- [ ] View invoice
- [ ] Verify payment shows with date

---

## Database Structure

```
bookings (MySQL)
  ├─> invoices (MySQL) ← invoice_number, customer_info, totals
  │     └─> invoice_items (MySQL) ← room details, pricing
  ├─> booking_charges (MySQL) ← additional charges with dates
  └─> payments (MySQL) ← payment history with dates
```

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/invoices | Create invoice |
| GET | /api/invoices | Get all invoices |
| GET | /api/invoices/:id | Get invoice by ID |
| GET | /api/invoices/booking/:booking_id | Get latest invoice by booking |
| PATCH | /api/invoices/:id/status | Update status |
| DELETE | /api/invoices/:id | Delete invoice |

---

## Files Modified

1. **server/migrations/create_invoices_table.sql** - Database schema
2. **server/scripts/create_invoices_table.js** - Migration script
3. **server/routes/invoices.js** - API routes (rebuilt)
4. **src/services/api.js** - Added invoice methods
5. **src/pages/Bookings.jsx** - MySQL integration
6. **src/pages/CreateBooking.jsx** - MySQL integration

---

## Next Steps (Optional Enhancements)

1. **Invoice PDF Generation** - Generate PDF from MySQL data
2. **Email Invoices** - Send invoice to customer email
3. **Payment Receipts** - Generate receipt after payment
4. **Invoice Templates** - Custom designs
5. **Bulk Operations** - Create multiple invoices
6. **Invoice History** - Track changes/versions
7. **Automated Reminders** - Email overdue invoices

---

**Migration Complete!** ✅

All invoices now stored in MySQL with full payment and charge tracking.

---
**Date:** October 14, 2025  
**Version:** 2.0.0
