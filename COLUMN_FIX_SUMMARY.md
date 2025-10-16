# Database Column Name Fix - Summary

## Issue Discovered
The SQL queries in `server/routes/invoices.js` were using incorrect column names that didn't match the actual database schema.

## Root Cause
The database schema (`server/migrations/init.sql`) uses different column names than what was being queried:

### Incorrect Assumptions vs Actual Schema

| Table | Incorrect Column Name | Actual Column Name |
|-------|---------------------|-------------------|
| bookings | `booking_number` | `booking_reference` |
| bookings | `base_amount` | ❌ Doesn't exist |
| bookings | `discount_percentage` | ❌ Doesn't exist |
| bookings | `discount_amount` | ❌ Doesn't exist |
| rooms | `price_per_night` | `rate` |

### What the Schema Actually Contains

**bookings table:**
```sql
CREATE TABLE bookings (
  id BIGINT,
  booking_reference VARCHAR(64) UNIQUE,  -- NOT booking_number
  customer_id BIGINT,
  room_id BIGINT,
  status VARCHAR(32),
  checkin_date DATE,
  checkout_date DATE,
  total_amount DECIMAL(12,2),           -- Only this, no base_amount or discount fields
  currency CHAR(3),
  created_at DATETIME,
  updated_at DATETIME
);
```

**rooms table:**
```sql
CREATE TABLE rooms (
  id BIGINT,
  room_number VARCHAR(50),
  room_type VARCHAR(100),
  capacity INT,
  rate DECIMAL(12,2),                    -- NOT price_per_night
  status VARCHAR(50),
  meta JSON,
  created_at DATETIME
);
```

**customers table:**
```sql
CREATE TABLE customers (
  id BIGINT,
  external_id VARCHAR(128),
  first_name VARCHAR(128),
  last_name VARCHAR(128),
  email VARCHAR(255),
  phone VARCHAR(64),
  address TEXT,                          -- Added via add_customer_fields.js
  nid VARCHAR(50),                       -- Added via add_customer_fields.js
  created_at DATETIME,
  updated_at DATETIME
);
```

## Changes Made

### Files Modified: `server/routes/invoices.js`

#### 1. GET /api/invoices/:id (Line ~160-185)
**Changed SQL columns:**
```sql
-- BEFORE
b.booking_number,
b.base_amount,
b.discount_percentage,
b.discount_amount,
r.price_per_night

-- AFTER  
b.booking_reference,
-- removed non-existent columns
r.rate
```

#### 2. GET /api/invoices/booking/:booking_id (Line ~385-407)
**Changed SQL columns:** (same as above)

#### 3. Auto-create invoice re-fetch (Line ~505-525)
**Changed SQL columns:** (same as above)

#### 4. Response object mapping (Line ~298-318)
**Changed response fields:**
```javascript
// BEFORE
booking_number: invoiceData.booking_number,
base_amount: invoiceData.base_amount,
discount_percentage: invoiceData.discount_percentage,
discount_amount: invoiceData.discount_amount,
price_per_night: invoiceData.price_per_night,

// AFTER
booking_reference: invoiceData.booking_reference,
// removed non-existent fields
rate: invoiceData.rate,
```

#### 5. Second response object (Line ~597-620)
**Changed response fields:** (same as above)

## Testing Instructions

### 1. Check Existing Invoices
```bash
# Navigate to Invoices page
http://localhost:5174/invoices

# Click on any existing invoice
# Verify the following displays correctly:
- ✅ Guest name (not "Guest" or "undefined")
- ✅ Email, phone, address, NID
- ✅ Room number
- ✅ Check-in and check-out dates
- ✅ Booking reference (instead of booking number)
- ✅ Room rate (instead of price per night)
```

### 2. View Invoice from Booking
```bash
# Navigate to Bookings page
http://localhost:5174/bookings

# Click "View Invoice" on any booking
# If no invoice exists, you'll get a prompt to create one
# Verify data displays correctly after creation
```

### 3. Database Verification
```sql
-- Check actual column names
DESCRIBE bookings;
DESCRIBE rooms;
DESCRIBE customers;

-- Verify JOIN data
SELECT 
  i.invoice_number,
  b.booking_reference,
  c.first_name,
  c.last_name,
  r.room_number,
  r.rate
FROM invoices i
LEFT JOIN bookings b ON i.booking_id = b.id
LEFT JOIN customers c ON b.customer_id = c.id
LEFT JOIN rooms r ON b.room_id = r.id
LIMIT 5;
```

## What Was NOT Changed

The following remain unaffected because they don't need changes:
- ✅ `invoices` table columns are correct
- ✅ `customers` table has `address` and `nid` (added via migration)
- ✅ Frontend PDF generator doesn't reference incorrect columns
- ✅ Frontend components don't hard-code column names

## Server Status

✅ **Backend:** Running on port 4000 (http://localhost:4000)  
✅ **Frontend:** Running on port 5174 (http://localhost:5174)  
✅ **Network Access:** http://192.168.0.5:5174  
✅ **Database:** Connected to 216.104.47.118:3306

## Next Steps

1. **Test invoice display** - Click on any invoice to verify data shows correctly
2. **Test auto-create** - Click "View Invoice" on a booking without an invoice
3. **Check for remaining issues** - Let me know if any fields still show "undefined" or "N/A"

## Related Documentation

- `INVOICE_FIX_COMPLETE.md` - Original JOIN query fix
- `API_DOCUMENTATION.md` - API endpoints
- `server/migrations/init.sql` - Database schema
- `server/add_customer_fields.js` - Customer table extensions
