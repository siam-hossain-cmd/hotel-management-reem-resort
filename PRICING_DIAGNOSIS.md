# Invoice Pricing Issue - Diagnosis

## Problem
Two invoices for the same room (207) show different per-night prices:
- Invoice 1 (PREVIEW): ৳5000/night, total ৳2255 (with discount)
- Invoice 2 (INV3964110XQ): ৳2480.50/night, total ৳2480.50

## Data Flow
1. **Booking Creation** → Calculates `base_amount`, `discount_amount`, stores in `bookings` table
2. **Invoice Auto-Creation** → Reads from `bookings.base_amount`, calculates `price_per_night = base_amount / nights`
3. **Invoice Display** → Shows `invoice_items.price_per_night`

## Root Cause Analysis

### Hypothesis 1: Bookings have different `base_amount` values
- Booking 1: `base_amount` = ৳5000, `total_amount` = ৳2255
- Booking 2: `base_amount` = ৳2480.50, `total_amount` = ৳2480.50

**Why this might happen:**
- Booking 1 was created WITH a discount → `base_amount` = original price, `total_amount` = after discount
- Booking 2 was created WITHOUT discount → `base_amount` = `total_amount`

### Hypothesis 2: Room 207's base rate changed between bookings
- First booking: Room rate was ৳5000
- Second booking: Room rate was ৳2480.50

### Hypothesis 3: Invoice items were created incorrectly
- The `invoice_items.price_per_night` was saved wrong during auto-creation

## What We Need to Check

### 1. Check booking #32 (first invoice):
```sql
SELECT id, base_amount, discount_amount, discount_percentage, total_amount 
FROM bookings WHERE id = 32;
```

### 2. Check booking #33 (second invoice):
```sql
SELECT id, base_amount, discount_amount, discount_percentage, total_amount 
FROM bookings WHERE id = 33;
```

### 3. Check Room 207's rate:
```sql
SELECT id, room_number, rate FROM rooms WHERE room_number = '207';
```

### 4. Check invoice items:
```sql
SELECT invoice_id, price_per_night, base_amount, discount_amount, amount 
FROM invoice_items WHERE invoice_id IN (29, 30);
```

## Expected Behavior

### If booking has discount:
- `base_amount` = original room price
- `discount_amount` = discount in currency
- `total_amount` = base_amount - discount_amount
- `price_per_night` (in invoice) = base_amount / nights

### Example:
```
Room rate: ৳5000/night
Nights: 1
Discount: 10% = ৳500
base_amount: ৳5000
discount_amount: ৳500
total_amount: ৳4500
price_per_night (displayed): ৳5000 ✅
```

## Frontend Display Logic

The PDF shows:
- **Per Night**: From `invoice_items.price_per_night` (should be base rate)
- **Original Room Charges**: From `base_amount * nights`
- **Total Discount Applied**: From `discount_amount`  
- **Room Charges After Discount**: `base_amount - discount_amount`
- **Final Total**: After adding VAT and charges

## Solution

The pricing columns are now in the database. We need to:

1. ✅ **Verify bookings table has correct data**
   - Run SQL queries above to check actual values

2. ✅ **Ensure invoice auto-creation uses correct fields**
   - Line 322-326 in invoices.js already does this:
   ```javascript
   const baseAmount = parseFloat(booking.base_amount) || totalAmount;
   const discountAmount = parseFloat(booking.discount_amount) || 0;
   const pricePerNight = totalNights > 0 ? baseAmount / totalNights : baseAmount;
   ```

3. ✅ **Ensure frontend displays from invoice_items**
   - Line 497 in Bookings.jsx already does this:
   ```javascript
   perNightCost: parseFloat(item.price_per_night || perNightCost)
   ```

## Next Steps

1. **Create a new test booking** with room 207
2. **Apply a 10% discount**
3. **View the invoice immediately**
4. **Check if pricing displays correctly**
5. **Refresh and view invoice again** (from history)
6. **Verify pricing remains consistent**

If the new booking works correctly, the issue is with **old invoice data** that was created before the pricing columns existed.

## Fix for Old Invoices

If old invoices are wrong, we can update them:

```sql
-- Update invoice_items with correct price_per_night from rooms table
UPDATE invoice_items ii
JOIN invoices i ON ii.invoice_id = i.id
JOIN bookings b ON i.booking_id = b.id
JOIN rooms r ON b.room_id = r.id
SET ii.price_per_night = r.rate
WHERE ii.price_per_night IS NULL OR ii.price_per_night = 0;
```

Or recalculate from booking data:

```sql
UPDATE invoice_items ii
JOIN invoices i ON ii.invoice_id = i.id
JOIN bookings b ON i.booking_id = b.id
SET 
  ii.price_per_night = CASE 
    WHEN ii.total_nights > 0 THEN b.base_amount / ii.total_nights
    ELSE b.base_amount
  END,
  ii.base_amount = b.base_amount,
  ii.discount_amount = b.discount_amount,
  ii.discount_percentage = b.discount_percentage;
```
