# ✅ VAT/TAX STORAGE FIX COMPLETE

## Problem Summary
When creating a booking with VAT (10%), the immediate invoice PDF showed correct data:
- ✅ VAT: 10% (৳608)
- ✅ Discount: ৳1520
- ✅ Per night cost: Correct pricing

But when viewing the same booking from the Bookings page, the invoice showed:
- ❌ VAT: 0% (৳0)
- ❌ Discount breakdown: Missing details

## Root Cause
The database was **not storing** tax/VAT information when bookings were created. The immediate view worked because the frontend calculated VAT before displaying, but this data was never saved to the database. When viewing from the Bookings page, the system tried to retrieve tax data from the database, but found nothing.

## Solution Implemented

### 1. ✅ Database Schema Updated
Added tax fields to both `bookings` and `invoices` tables:

**Bookings Table:**
- `tax_rate` DECIMAL(5,2) - Tax rate as percentage (e.g., 10.00 for 10%)
- `tax_amount` DECIMAL(10,2) - Calculated tax amount in currency
- `subtotal_amount` DECIMAL(10,2) - Amount before tax (after discount)

**Invoices Table:**
- `tax_rate` DECIMAL(5,2) - Tax rate as percentage
- `tax_amount` DECIMAL(10,2) - Calculated tax amount

### 2. ✅ Frontend Updated (CreateBookingNew.jsx)
Now sends complete tax information to backend:
```javascript
const bookingData = {
  // ... other fields
  total_amount: finalAmount,              // Grand total with VAT
  base_amount: bookingDetails.total_amount,  // Original room cost
  discount_percentage: bookingDetails.discount_percentage || 0,
  discount_amount: bookingDetails.discount_amount || 0,
  subtotal_amount: bookingDetails.subtotal_before_vat || bookingDetails.total_amount,
  tax_rate: vatRate,                      // VAT rate (e.g., 10)
  tax_amount: bookingDetails.vat_amount || 0,  // VAT amount
  // ... other fields
};
```

### 3. ✅ Backend Updated (routes/bookings.js)
Now accepts and stores tax data:
- Extracts `subtotal_amount`, `tax_rate`, `tax_amount` from request
- Stores in `bookings` table during INSERT
- Also stores in `invoices` table for consistency

### 4. ✅ Backend Updated (routes/invoices.js)
Now returns tax data in all GET queries:
- Added `tax_rate`, `tax_amount` to SELECT queries
- Includes both invoice's and booking's tax fields
- Auto-creates invoices with tax data from bookings

### 5. ✅ Frontend Updated (Bookings.jsx)
Transform function now uses stored tax data:
```javascript
// Prefer booking's tax fields (more accurate), fallback to invoice's
const storedTaxRate = parseFloat(invoice.booking_tax_rate || invoice.tax_rate || 0);
const storedTaxAmount = parseFloat(invoice.booking_tax_amount || invoice.tax_amount || 0);
```

## Data Flow - Before Fix
```
CREATE BOOKING → Frontend calculates VAT → Displays correct invoice
                                         ↓
                                   Database stores: ❌ No tax data
                                         ↓
VIEW FROM BOOKINGS → Retrieves from database → ❌ No tax data → Shows VAT 0%
```

## Data Flow - After Fix
```
CREATE BOOKING → Frontend calculates VAT → Sends to backend with tax data
                                         ↓
                                   Database stores: ✅ tax_rate, tax_amount, subtotal_amount
                                         ↓
VIEW FROM BOOKINGS → Retrieves from database → ✅ Has tax data → Shows correct VAT 10%
```

## Migration Applied
File: `server/migrations/add_tax_fields.sql`
- Added 3 columns to `bookings` table
- Added 2 columns to `invoices` table
- Updated existing records to have `subtotal_amount = total_amount`

## Testing Instructions
1. ✅ Create a new booking with:
   - Room rate: ৳7000/night
   - Discount: 20%
   - VAT: 10%
   - Number of nights: 2

2. ✅ Verify immediate invoice shows:
   - Base: ৳14,000
   - Discount (20%): -৳2,800
   - Subtotal: ৳11,200
   - VAT (10%): ৳1,120
   - **Total: ৳12,320**

3. ✅ Navigate to Bookings page

4. ✅ View the same booking's invoice

5. ✅ Verify it shows **identical** data:
   - Same discount breakdown
   - Same VAT rate (10%)
   - Same VAT amount (৳1,120)
   - Same total (৳12,320)

## Files Modified
1. `server/migrations/add_tax_fields.sql` - Database schema
2. `server/scripts/add_tax_fields.js` - Migration runner
3. `server/routes/bookings.js` - Store tax data
4. `server/routes/invoices.js` - Retrieve tax data
5. `src/pages/CreateBookingNew.jsx` - Send tax data
6. `src/pages/Bookings.jsx` - Use stored tax data

## Result
✅ **FIXED**: Invoices now show consistent data regardless of viewing context!
- ✅ VAT displays correctly as 10%
- ✅ VAT amount calculated and displayed
- ✅ Discount breakdown shows properly
- ✅ Per night cost accurate
- ✅ All financial calculations match booking creation
