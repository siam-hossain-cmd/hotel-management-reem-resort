# Pricing Fix Summary

## Issue
Invoice invoices show incorrect pricing calculations because:
1. The invoice displays room's base `rate` instead of the booking's actual calculated per-night price
2. Discounts and VAT calculations are wrong
3. Two different invoices for the same room show different prices

## Root Cause
The invoice auto-creation code calculates `pricePerNight` from booking data, but the database query doesn't fetch the booking's `base_amount`, `discount_percentage`, and `discount_amount` columns that were added to the bookings table.

## Solution Required
Update all SQL queries in `server/routes/invoices.js` to include booking pricing columns:
- `b.base_amount`
- `b.discount_percentage`
- `b.discount_amount`

These columns already exist in the database (confirmed by migration).

## Files to Fix
- `/server/routes/invoices.js` - Add booking pricing columns to all SELECT queries

## SQL Changes Needed
```sql
-- ADD TO ALL QUERIES:
b.base_amount,
b.discount_percentage,
b.discount_amount,
```

This will allow the invoice to display:
- Correct per-night price (calculated from base_amount / nights)
- Correct discount percentages
- Correct discount amounts
- Proper VAT calculations
