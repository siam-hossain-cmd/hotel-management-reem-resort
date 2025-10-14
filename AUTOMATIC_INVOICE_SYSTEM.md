# 🧾 Automatic Invoice & Payment Integration System

## Overview
Complete implementation of automatic invoice creation and payment-driven updates for the REEM RESORT booking system.

---

## ✅ **Implementation Complete**

### 🎯 Core Features

1. **Auto-Create Invoice on Booking Creation**
   - ✅ When a new booking is created, invoice is automatically generated
   - ✅ Invoice includes: booking_id, customer_id, total, paid, due, status
   - ✅ Status starts as 'issued' (unpaid)

2. **Auto-Create Invoice on View (if missing)**
   - ✅ When viewing a booking without an invoice, it's automatically created
   - ✅ Calculates all values from booking data
   - ✅ Seamless experience - no errors

3. **Auto-Update Invoice on Payment**
   - ✅ When payment is added, invoice is automatically updated
   - ✅ Updates: `paid = paid + payment_amount`
   - ✅ Updates: `due = total - paid`
   - ✅ Updates: `status = 'paid' | 'partial' | 'issued'`

4. **Display Invoice with Payment History**
   - ✅ Shows all payments with dates and times
   - ✅ Shows all charges with dates
   - ✅ Shows current total, paid, due amounts
   - ✅ Shows invoice status badge

---

## 📊 Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    CREATE BOOKING                           │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
        ┌───────────────┐
        │   Bookings    │
        │   Table       │
        │               │
        │ • id          │
        │ • customer_id │
        │ • room_id     │
        │ • total_amount│
        └───────┬───────┘
                │
                │ 🆕 AUTO-CREATE INVOICE
                ▼
        ┌───────────────┐
        │   Invoices    │
        │   Table       │
        │               │
        │ • booking_id  │◄─────┐
        │ • customer_id │      │
        │ • total       │      │
        │ • paid: 0.00  │      │ 🔄 AUTO-UPDATE
        │ • due: total  │      │    ON PAYMENT
        │ • status      │      │
        └───────┬───────┘      │
                │              │
                │              │
                ▼              │
        ┌───────────────┐      │
        │   Payments    │──────┘
        │   Table       │
        │               │
        │ • booking_id  │
        │ • amount      │
        │ • method      │
        │ • created_at  │
        └───────────────┘
```

---

## 🔧 Technical Implementation

### Backend Files Modified

#### 1. **server/routes/bookings.js**
- ✅ Auto-creates invoice when booking is created
- Creates invoice with calculated total
- Links invoice to booking via `booking_id`

```javascript
// Auto-create invoice on booking creation
const invoiceNumber = `INV${Date.now()}...`;
const [invoiceResult] = await conn.query(
  `INSERT INTO invoices (invoice_number, booking_id, customer_id, 
   issued_at, total, paid, due, currency, status, created_at)
   VALUES (?, ?, ?, NOW(), ?, 0.00, ?, 'BDT', 'issued', NOW())`,
  [invoiceNumber, bookingId, customer_id, total_amount, total_amount]
);
```

#### 2. **server/routes/payments.js**
- ✅ Auto-updates invoice when payment is added
- Calculates new paid and due amounts
- Updates invoice status based on payment

```javascript
// 🧾 AUTO-UPDATE INVOICE
const [invoices] = await conn.query(
  'SELECT id FROM invoices WHERE booking_id = ?',
  [booking_id]
);

if (invoices.length > 0) {
  // Update existing invoice
  await conn.query(
    'UPDATE invoices SET paid = ?, due = ?, status = ?, updated_at = NOW() 
     WHERE id = ?',
    [totalPaid, dueAmount, invoiceStatus, invoiceId]
  );
} else {
  // 🆕 AUTO-CREATE if missing
  await conn.query(
    `INSERT INTO invoices (invoice_number, booking_id, customer_id, 
     issued_at, total, paid, due, currency, status, created_at, updated_at)
     VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, NOW(), NOW())`,
    [invoiceNumber, booking_id, customerId, totalAmount, totalPaid, 
     dueAmount, 'BDT', invoiceStatus]
  );
}
```

#### 3. **server/routes/invoices.js**
- ✅ Auto-creates invoice when viewing booking without one
- Returns invoice with all payment history
- Returns invoice with all charge history

```javascript
// 🆕 AUTO-CREATE INVOICE if not found
if (invoices.length === 0) {
  console.log(`⚠️ No invoice found for booking ${booking_id} - Auto-creating...`);
  
  // Get booking details
  const [bookings] = await conn.query(`
    SELECT b.*, c.first_name, c.last_name, 
    (SELECT SUM(p.amount) FROM payments p WHERE p.booking_id = b.id) as paid_amount
    FROM bookings b
    LEFT JOIN customers c ON b.customer_id = c.id
    WHERE b.id = ?
  `, [booking_id]);
  
  // Create invoice with proper paid/due calculation
  // ... (full implementation in code)
}
```

### Database Schema Updates

#### Invoices Table Structure
```sql
CREATE TABLE invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  booking_id INT NOT NULL,
  customer_id INT,
  
  -- Financial fields
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total DECIMAL(12,2) DEFAULT 0.00,
  paid DECIMAL(12,2) DEFAULT 0.00,    -- ⭐ AUTO-UPDATED
  due DECIMAL(12,2) DEFAULT 0.00,     -- ⭐ AUTO-CALCULATED
  currency VARCHAR(10) DEFAULT 'BDT',
  
  -- Status: 'issued', 'partial', 'paid'
  status VARCHAR(20) DEFAULT 'issued', -- ⭐ AUTO-UPDATED
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);
```

---

## 🎬 User Workflows

### Workflow 1: Create New Booking
```
1. User fills booking form
2. User adds initial payment (optional)
3. Clicks "Save & Confirm Booking"

Backend:
✅ Creates booking in MySQL
✅ Creates invoice automatically
✅ Saves payment if provided
✅ Invoice status: 
   - 'paid' if payment >= total
   - 'partial' if payment > 0
   - 'issued' if no payment
```

### Workflow 2: View Booking (with invoice)
```
1. User clicks "View" on booking
2. Clicks "View Invoice" or "Print Invoice"

Backend:
✅ Finds invoice by booking_id
✅ Returns invoice with:
   - All payments (with dates)
   - All charges (with dates)
   - Current total, paid, due
   - Status badge
```

### Workflow 3: View Booking (without invoice)
```
1. User clicks "View" on old booking
2. Clicks "View Invoice"

Backend:
⚠️ Invoice not found
✅ AUTO-CREATES invoice from booking data
✅ Calculates paid from payments table
✅ Calculates due = total - paid
✅ Sets appropriate status
✅ Returns newly created invoice
```

### Workflow 4: Add Payment
```
1. User clicks "Add Payment" in booking view
2. Enters amount, method, reference
3. Clicks "Save Payment"

Backend:
✅ Saves payment to payments table
✅ Finds invoice by booking_id
✅ Updates invoice.paid += payment_amount
✅ Updates invoice.due = total - paid
✅ Updates invoice.status:
   - 'paid' if due <= 0
   - 'partial' if paid > 0
   - 'issued' if paid = 0
✅ Returns updated totals
```

---

## 💻 Code Examples

### Creating a Booking (Frontend)
```javascript
const bookingData = {
  first_name, last_name, email, phone,
  room_number, room_type,
  checkin_date, checkout_date,
  total_amount: 5000,
  payments: [
    { amount: 2000, method: 'cash', notes: 'Initial deposit' }
  ]
};

const result = await api.createBooking(bookingData);
// ✅ Booking created
// ✅ Invoice auto-created with paid=2000, due=3000, status='partial'
```

### Adding a Payment (Frontend)
```javascript
const result = await api.addPayment({
  booking_id: 123,
  amount: 1500,
  method: 'card',
  reference: 'TXN456789'
});

// ✅ Payment saved
// ✅ Invoice auto-updated: paid=3500, due=1500, status='partial'
```

### Viewing Invoice (Frontend)
```javascript
const result = await api.getInvoiceByBookingId(booking_id);

if (result.success) {
  const invoice = result.invoice;
  console.log('Total:', invoice.total);
  console.log('Paid:', invoice.paid);
  console.log('Due:', invoice.due);
  console.log('Status:', invoice.status); // 'issued', 'partial', or 'paid'
  console.log('Payments:', invoice.payments); // Array with dates
  console.log('Charges:', invoice.charges); // Array with dates
}

// ✅ If no invoice exists, it's auto-created and returned
```

---

## 🧪 Testing Scenarios

### Test 1: New Booking with Payment
```bash
1. Create booking with ৳5000 total
2. Add ৳2000 initial payment
3. Check invoice:
   ✅ total = 5000
   ✅ paid = 2000
   ✅ due = 3000
   ✅ status = 'partial'
```

### Test 2: Add Payment to Existing Booking
```bash
1. Add ৳1500 payment to booking from Test 1
2. Check invoice:
   ✅ paid = 3500 (2000 + 1500)
   ✅ due = 1500 (5000 - 3500)
   ✅ status = 'partial'
```

### Test 3: Complete Payment
```bash
1. Add ৳1500 payment to booking from Test 2
2. Check invoice:
   ✅ paid = 5000 (3500 + 1500)
   ✅ due = 0 (5000 - 5000)
   ✅ status = 'paid'
```

### Test 4: View Old Booking (No Invoice)
```bash
1. View booking created before invoice system
2. Click "View Invoice"
3. Check result:
   ✅ Invoice auto-created
   ✅ total = booking.total_amount
   ✅ paid = SUM of all payments
   ✅ due = total - paid
   ✅ status = calculated from paid/total
```

---

## 📈 Status Logic

```javascript
// Invoice Status Calculation
if (due <= 0) {
  status = 'paid';       // Fully paid
} else if (paid > 0) {
  status = 'partial';    // Partially paid
} else {
  status = 'issued';     // Unpaid
}
```

---

## 🚀 Deployment Checklist

- [x] Add `paid` and `due` columns to invoices table
- [x] Update booking creation to auto-create invoice
- [x] Update payment route to auto-update invoice
- [x] Update invoice route to auto-create if missing
- [x] Test all workflows end-to-end
- [x] Document API endpoints
- [x] Add payment history display
- [x] Add charge history display
- [x] Add print invoice functionality

---

## 📡 API Endpoints Summary

### POST /api/bookings
- Creates booking
- ✅ **Auto-creates invoice**
- Returns booking with booking_reference

### POST /api/payments
- Adds payment to booking
- ✅ **Auto-updates invoice (paid, due, status)**
- ✅ **Auto-creates invoice if missing**
- Returns payment with updated totals

### GET /api/invoices/booking/:booking_id
- Gets invoice by booking ID
- ✅ **Auto-creates invoice if missing**
- Returns invoice with payments and charges

---

## 🎯 Key Benefits

1. **Zero Manual Work** - Invoices create and update automatically
2. **Always Accurate** - Paid/due amounts calculated from source of truth (payments table)
3. **No Errors** - Missing invoices are auto-created seamlessly
4. **Real-time Updates** - Status updates immediately when payment is added
5. **Complete History** - All payments and charges tracked with timestamps
6. **Print Ready** - Invoice can be printed with all details

---

## 🔍 Debugging Tips

### Check if invoice exists
```sql
SELECT * FROM invoices WHERE booking_id = 123;
```

### Check invoice status
```sql
SELECT 
  i.id, i.invoice_number, i.status,
  i.total, i.paid, i.due,
  (i.total - i.paid) as calculated_due
FROM invoices i
WHERE i.booking_id = 123;
```

### Check payments for booking
```sql
SELECT 
  booking_id,
  SUM(amount) as total_paid
FROM payments
WHERE booking_id = 123 AND status = 'completed'
GROUP BY booking_id;
```

### Verify invoice matches payments
```sql
SELECT 
  i.booking_id,
  i.paid as invoice_paid,
  COALESCE(SUM(p.amount), 0) as actual_paid
FROM invoices i
LEFT JOIN payments p ON i.booking_id = p.booking_id AND p.status = 'completed'
WHERE i.booking_id = 123
GROUP BY i.booking_id, i.paid;
```

---

## 📞 Support

**Servers:**
- Frontend: http://localhost:5174
- Backend: http://localhost:4000

**Database:**
- Host: 216.104.47.118
- Database: reemresort_hotel_db
- Tables: bookings, invoices, payments, booking_charges

---

**Last Updated:** October 14, 2025  
**Version:** 3.0.0 - Automatic Invoice System  
**Status:** ✅ Production Ready
