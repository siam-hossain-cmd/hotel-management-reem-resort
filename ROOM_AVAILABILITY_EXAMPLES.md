# Room Availability Logic - Visual Examples

## Example 1: Single Booking

### Scenario
**Booking**: Room 101, October 17-20, 2025

### Date-by-Date Breakdown
```
Oct 15 (Fri)  →  ✅ Room 101 AVAILABLE
Oct 16 (Sat)  →  ✅ Room 101 AVAILABLE
Oct 17 (Sun)  →  🔒 Room 101 OCCUPIED (Check-in day)
Oct 18 (Mon)  →  🔒 Room 101 OCCUPIED
Oct 19 (Tue)  →  🔒 Room 101 OCCUPIED
Oct 20 (Wed)  →  ✅ Room 101 AVAILABLE (Check-out day - guest leaves)
Oct 21 (Thu)  →  ✅ Room 101 AVAILABLE
```

### Logic
- `checkInDate = 2025-10-17`
- `checkOutDate = 2025-10-20`
- Room is occupied if: `selectedDate >= checkInDate AND selectedDate < checkOutDate`

---

## Example 2: Multiple Bookings Same Room

### Scenario
**Booking 1**: Room 101, Oct 17-20  
**Booking 2**: Room 101, Oct 20-23 (starts when Booking 1 ends)

### Timeline
```
Oct 17  →  🔒 OCCUPIED (Guest A)
Oct 18  →  🔒 OCCUPIED (Guest A)
Oct 19  →  🔒 OCCUPIED (Guest A)
Oct 20  →  🔒 OCCUPIED (Guest B checks in when A checks out)
Oct 21  →  🔒 OCCUPIED (Guest B)
Oct 22  →  🔒 OCCUPIED (Guest B)
Oct 23  →  ✅ AVAILABLE (Guest B checks out)
```

### Result
✅ No gap - Perfect consecutive bookings!

---

## Example 3: Multiple Rooms on Same Date

### Scenario
**Date Selected**: October 18, 2025

**Bookings**:
1. Room 101: Oct 17-20 (Status: confirmed)
2. Room 102: Oct 15-18 (Status: confirmed)
3. Room 206: Oct 18-22 (Status: checked-in)
4. Room 207: Oct 16-19 (Status: confirmed)
5. Room 301: Oct 10-15 (Status: cancelled)
6. Room 302: No booking

### Dashboard Display on Oct 18
```
🟢 AVAILABLE ROOMS (2)
├─ 102  (Booking ends today - checkout day)
└─ 302  (No bookings)

🔴 OCCUPIED ROOMS (3)
├─ 101  (Occupied Oct 17-20)
├─ 206  (Occupied Oct 18-22)
└─ 207  (Occupied Oct 16-19)

⚠️ MAINTENANCE ROOMS (0)
```

---

## Example 4: Edge Cases

### Case A: Check-in Day
```
Booking: Oct 17-20
Select: Oct 17
Result: 🔒 OCCUPIED (Guest checking in today)
```

### Case B: Check-out Day
```
Booking: Oct 17-20
Select: Oct 20
Result: ✅ AVAILABLE (Guest checking out - room free for new booking)
```

### Case C: Day Before Check-in
```
Booking: Oct 17-20
Select: Oct 16
Result: ✅ AVAILABLE (Booking hasn't started yet)
```

### Case D: Day After Check-out
```
Booking: Oct 17-20
Select: Oct 21
Result: ✅ AVAILABLE (Booking already ended)
```

---

## Example 5: Booking Status Impact

### Scenario
Room 101 has multiple bookings with different statuses on Oct 18:

```
Booking A: Oct 17-20, Status: "confirmed"     → 🔒 COUNTS as occupied
Booking B: Oct 17-20, Status: "checked-in"    → 🔒 COUNTS as occupied
Booking C: Oct 17-20, Status: "cancelled"     → ✅ IGNORED
Booking D: Oct 17-20, Status: "completed"     → ✅ IGNORED
Booking E: Oct 17-20, Status: "pending"       → ✅ IGNORED
```

**Result**: Room 101 shows as OCCUPIED if ANY active booking (confirmed/checked-in) covers Oct 18

---

## Example 6: Real-World Scenario

### Your Hotel (6 rooms)

**Room Inventory**:
- 101: Deluxe Double
- 102: Deluxe Twin
- 206: Premium Quadruple (Connecting)
- 207: Premium Quadruple (Connecting)
- 301: Premium Quadruple (Connecting)
- 302: Premium Quadruple (Connecting)

**Today: October 16, 2025**

**Active Bookings**:
1. Room 101: Oct 15 - Oct 18 (Confirmed)
2. Room 102: Oct 16 - Oct 19 (Checked-in)
3. Room 206: Oct 14 - Oct 17 (Confirmed)
4. Room 207: Oct 16 - Oct 20 (Checked-in)

### Dashboard View - Oct 16 (Today)

```
🟢 AVAILABLE ROOMS (2)
├─ 301  Premium Quadruple (Connecting)
└─ 302  Premium Quadruple (Connecting)

🔴 OCCUPIED ROOMS (4)
├─ 101  Deluxe Double
├─ 102  Deluxe Twin
├─ 206  Premium Quadruple (Connecting)
└─ 207  Premium Quadruple (Connecting)

Occupancy Rate: 67% (4/6 rooms)
```

### Dashboard View - Oct 18

```
🟢 AVAILABLE ROOMS (4)
├─ 101  Deluxe Double      (Booking ends today)
├─ 206  Premium Quadruple  (Booking ended yesterday)
├─ 301  Premium Quadruple  (No bookings)
└─ 302  Premium Quadruple  (No bookings)

🔴 OCCUPIED ROOMS (2)
├─ 102  Deluxe Twin        (Ends Oct 19)
└─ 207  Premium Quadruple  (Ends Oct 20)

Occupancy Rate: 33% (2/6 rooms)
```

---

## Example 7: Preventing Double Bookings

### Scenario
Guest wants to book Room 101 for Oct 19-22

**Existing Bookings for Room 101**:
- Booking A: Oct 17-20
- Booking B: Oct 23-25

### Check Availability
```javascript
isRoomAvailableForRange('101', '2025-10-19', '2025-10-22', bookings)

Checks:
1. Does Oct 19-22 overlap with Oct 17-20?
   → YES (Oct 19 overlaps)
   → ❌ NOT AVAILABLE

Alternative:
isRoomAvailableForRange('101', '2025-10-20', '2025-10-23', bookings)

Checks:
1. Does Oct 20-23 overlap with Oct 17-20?
   → NO (Oct 20 is checkout day of existing booking)
2. Does Oct 20-23 overlap with Oct 23-25?
   → NO (Oct 23 is checkout day of requested booking)
   → ✅ AVAILABLE
```

---

## Code Reference

### The Core Logic (JavaScript)
```javascript
// From src/utils/roomAvailability.js

const isDateInBookingRange = (selectedDate, checkInDate, checkOutDate) => {
  const selected = normalizeDate(selectedDate);  // Set time to 00:00:00
  const checkIn = normalizeDate(checkInDate);
  const checkOut = normalizeDate(checkOutDate);
  
  // Room is occupied if: checkIn <= selected < checkOut
  // Note: < not <= for checkOut (checkout day is available)
  return selected >= checkIn && selected < checkOut;
};
```

### Why Normalize Dates?
```javascript
// WITHOUT normalization (WRONG)
'2025-10-18T10:30:00' >= '2025-10-18T00:00:00'  // TRUE
'2025-10-18T10:30:00' < '2025-10-20T00:00:00'   // TRUE
// Result: Correct by luck

// WITH normalization (CORRECT)
'2025-10-18T00:00:00' >= '2025-10-18T00:00:00'  // TRUE
'2025-10-18T00:00:00' < '2025-10-20T00:00:00'   // TRUE
// Result: Always correct, regardless of time
```

---

## Testing Checklist

- [ ] Single booking shows correctly across date range
- [ ] Multiple bookings on same room handled correctly
- [ ] Checkout day shows as available
- [ ] Check-in day shows as occupied
- [ ] Consecutive bookings have no gaps
- [ ] Cancelled bookings are ignored
- [ ] Multiple rooms display correctly for same date
- [ ] Room status (maintenance) handled separately
- [ ] Date selector updates availability dynamically
- [ ] Console shows correct debug information

---

**Remember**: 
- Check-in day: **OCCUPIED** ✅
- Check-out day: **AVAILABLE** ✅
- This allows back-to-back bookings with no gaps!
