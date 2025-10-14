# 📊 Booking View - Financial Breakdown

## What You'll See

When you click the **"View"** button on any booking, you'll now see a comprehensive financial breakdown:

---

## 📸 Visual Layout

```
┌────────────────────────────────────────────────────────────────┐
│                    Booking Details                      [X]    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Booking Ref: BK123456              Room: Room 101            │
│  Guest Name: John Doe               (Deluxe Suite)            │
│  Email: john@example.com            Check-in: Oct 15, 2025    │
│  Phone: +880 1234567890             Check-out: Oct 18, 2025   │
│                                     Nights: 3                  │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│  💰 Financial Breakdown                                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Base Room Price (3 nights):                     ৳9,000.00    │
│  ───────────────────────────────────────────────────────────   │
│  Discount (10%):                                   -৳900.00    │
│  ───────────────────────────────────────────────────────────   │
│  After Discount:                                  ৳8,100.00    │
│  ───────────────────────────────────────────────────────────   │
│                                                                │
│  📋 Additional Charges:                                        │
│     • Late Check-out Fee                          +৳500.00    │
│       Oct 14, 2025                                            │
│     • Extra Bed / Rollaway Bed                    +৳800.00    │
│       Oct 14, 2025                                            │
│     • Room Service                                +৳350.00    │
│       Oct 14, 2025                                            │
│  ───────────────────────────────────────────────────────────   │
│  Total Additional Charges:                       +৳1,650.00    │
│  ═══════════════════════════════════════════════════════════   │
│                                                                │
│  TOTAL AMOUNT:                                    ৳9,750.00    │
│  ═══════════════════════════════════════════════════════════   │
│                                                                │
│  Paid Amount:                                     ৳5,000.00    │
│  Due Balance:                                     ৳4,750.00    │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│  Booking Status: ✓ CHECKED-IN    Payment: ⚠️ PARTIAL          │
│  Booked On: Oct 12, 2025 2:30 PM                              │
│  Booked By: admin                                              │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                          [Close]   [Generate Invoice]          │
└────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Color Legend

### Financial Breakdown Sections:

| Section | Color | Meaning |
|---------|-------|---------|
| **Base Room Price** | Black | Original price before any adjustments |
| **Discount (%)** | 🔴 Red | Money saved by customer |
| **After Discount** | 🟢 Green | Price after applying discount |
| **Additional Charges** | 🟠 Orange | Extra costs added to booking |
| **Total Additional** | 🟡 Yellow | Sum of all extra charges |
| **TOTAL AMOUNT** | 🟢 Dark Green | Final amount to be paid |
| **Paid Amount** | 🟢 Green | Money already received |
| **Due Balance** | 🔴 Red | Money still owed |

---

## 🔍 What's Displayed

### 1️⃣ Always Shown:
- Guest information (name, email, phone)
- Room details (number, type)
- Check-in/Check-out dates
- Number of nights
- Total amount
- Booking & payment status

### 2️⃣ Conditionally Shown:

#### Base Room Price
✅ Shown if: `base_amount` exists in database  
Example: "Base Room Price (3 nights): ৳9,000.00"

#### Discount Section
✅ Shown if: `discount_percentage > 0`  
Displays:
- Discount percentage (e.g., "10%")
- Discount amount (e.g., "-৳900.00")
- Price after discount (e.g., "৳8,100.00")

❌ Hidden if: No discount applied

#### Additional Charges
✅ Shown if: Charges exist in `booking_charges` table  
Each charge shows:
- 📌 Description (e.g., "Late Check-out Fee")
- 💵 Amount (e.g., "+৳500.00")
- 📅 Date added (e.g., "Oct 14, 2025")

❌ Hidden if: No additional charges added

---

## 📝 Calculation Example

### Scenario: 3-Night Stay with Discount and Charges

**Room Details:**
- Room Type: Deluxe Suite
- Rate: ৳3,000 per night
- Nights: 3
- Discount: 10%

**Step-by-Step Calculation:**

```
1️⃣ Base Amount:
   ৳3,000 × 3 nights = ৳9,000.00

2️⃣ Discount:
   10% of ৳9,000 = ৳900.00
   ৳9,000 - ৳900 = ৳8,100.00

3️⃣ Additional Charges:
   Late Check-out Fee: +৳500.00
   Extra Bed: +৳800.00
   Room Service: +৳350.00
   Total Charges: +৳1,650.00

4️⃣ Final Total:
   ৳8,100 + ৳1,650 = ৳9,750.00

5️⃣ Payment Status:
   Paid: ৳5,000.00
   Due: ৳4,750.00
```

---

## 🎯 Quick Actions

### From Booking List:
- 👁️ **View** - Opens detailed breakdown modal
- 💵 **Add Charge** - Add extra charges to booking
- ✅ **Check In** - Check in guest (if confirmed)
- 🚪 **Check Out** - Check out guest (if checked in)
- 🧾 **Invoice** - Generate invoice (if paid)
- 🗑️ **Delete** - Remove booking

### From View Modal:
- 📄 **Generate Invoice** - Create printable invoice
- ❌ **Close** - Close modal

---

## 💡 Tips for Users

### When Viewing Bookings:
1. **Check the breakdown** before checkout
2. **Verify all charges** are correct
3. **Calculate due balance** for payment collection
4. **Review discount** if applied

### When Adding Charges:
1. **Select from dropdown** for common charges
2. **Use suggested amounts** as guidelines
3. **Add custom charge** if needed
4. **Total updates automatically** after saving

### When Creating Invoices:
1. **Ensure all charges** are added first
2. **Check payment status** is correct
3. **Review breakdown** one final time
4. **Generate invoice** for paid bookings

---

## 🔧 Technical Details

### Data Sources:
- **Base Info**: `bookings` table
- **Guest Info**: `customers` table
- **Room Info**: `rooms` table
- **Charges**: `booking_charges` table
- **Payments**: `payments` table

### API Endpoint:
```
GET /api/bookings/:id
```

**Response includes:**
```json
{
  "success": true,
  "booking": {
    "id": 1,
    "base_amount": 9000.00,
    "discount_percentage": 10.00,
    "discount_amount": 900.00,
    "total_amount": 9750.00,
    "charges": [
      {
        "id": 1,
        "description": "Late Check-out Fee",
        "amount": 500.00,
        "created_at": "2025-10-14T10:30:00Z"
      }
    ],
    "payments": [...],
    // ... other fields
  }
}
```

---

## ✅ Testing Instructions

### Test 1: View Booking WITHOUT Discount
1. Open bookings page
2. Click "View" on any booking
3. Should see:
   - ✅ Guest/Room info
   - ❌ No discount section
   - ✅ Additional charges (if any)
   - ✅ Total amount

### Test 2: View Booking WITH Discount
1. Create booking with 10% discount
2. Click "View" 
3. Should see:
   - ✅ Base amount
   - ✅ Discount (10%) = -৳XXX
   - ✅ After discount amount
   - ✅ Total

### Test 3: Add Charge and View
1. Click "Add Charge" on booking
2. Select "Late Check-out Fee"
3. Enter ৳500
4. Save
5. Click "View"
6. Should see charge in breakdown

---

## 📞 Need Help?

Check these files:
- `BOOKING_FINANCIAL_BREAKDOWN.md` - Full technical docs
- `BOOKING_CHARGES_FIX.md` - Charge feature setup
- `ADD_CHARGE_FEATURE.md` - Charge types guide

**Your servers are running at:**
- 🌐 Frontend: http://localhost:5173/
- 🔧 Backend: http://localhost:4000/

---

**Status**: ✅ READY TO USE

Go to http://localhost:5173/ and test it now! 🚀
