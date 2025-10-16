# Room Availability System - Implementation Guide

## 📋 Overview

This document explains the date-wise room availability logic implemented in the Reem Resort Management System.

## 🎯 Goal

When a booking is created (e.g., Oct 17 to Oct 20, 2025), the system should:
- Mark that room as **OCCUPIED** for Oct 17, 18, 19
- Mark that room as **AVAILABLE** for Oct 20 (checkout day)
- Display correct availability when any date is selected in the calendar

## 🏗️ Architecture

### Files Structure

```
src/
├── pages/
│   └── Dashboard.jsx           # Main dashboard with date selector
├── utils/
│   ├── roomAvailability.js     # Core availability logic (NEW)
│   └── testRoomAvailability.js # Test suite (NEW)
└── services/
    └── api.js                  # API calls
```

## 📐 Core Logic

### Date Range Rule

**A room is occupied if: `checkInDate <= selectedDate < checkOutDate`**

Example:
- Booking: Oct 17 to Oct 20
- Occupied on: Oct 17, 18, 19 ✅
- Available on: Oct 20 ✅ (checkout day - guest leaves in morning)

### Implementation

```javascript
// From src/utils/roomAvailability.js

export const isDateInBookingRange = (selectedDate, checkInDate, checkOutDate) => {
  const selected = normalizeDate(selectedDate);
  const checkIn = normalizeDate(checkInDate);
  const checkOut = normalizeDate(checkOutDate);
  
  // Room is occupied if: checkIn <= selected < checkOut
  return selected >= checkIn && selected < checkOut;
};
```

## 🔧 Key Functions

### 1. `normalizeDate(date)`
Normalizes dates to 00:00:00 to avoid time-zone issues.

```javascript
const normalized = normalizeDate('2025-10-18');
// Returns: Thu Oct 18 2025 00:00:00
```

### 2. `getOccupiedRoomNumbers(bookings, selectedDate)`
Returns array of room numbers occupied on a specific date.

```javascript
const occupied = getOccupiedRoomNumbers(bookings, '2025-10-18');
// Returns: ['101', '206', '207']
```

### 3. `categorizeRoomsByDate(allRooms, bookings, selectedDate)`
Categorizes all rooms into available, booked, and maintenance.

```javascript
const { availableRooms, bookedRooms, maintenanceRooms } = 
  categorizeRoomsByDate(rooms, bookings, selectedDate);
```

### 4. `isRoomAvailableForRange(roomNumber, checkIn, checkOut, bookings)`
Checks if a room is available for a date range (prevents double booking).

```javascript
const isAvailable = isRoomAvailableForRange('101', '2025-10-21', '2025-10-23', bookings);
```

## 🎨 User Interface

### Date Selector
- Horizontal scrollable row showing 30 days
- Click any date to see availability for that date
- Selected date highlighted in blue
- Today's date marked with orange badge

### Room Display
- **Green cards**: Available rooms
- **Red cards**: Occupied rooms
- **Orange cards**: Maintenance rooms

## 🧪 Testing

### Run Unit Tests

Open browser console and run:

```javascript
// Run predefined test suite
testRoomAvailability();

// Test with your actual database
testWithActualData(api);
```

### Manual Testing Scenarios

#### Scenario 1: Basic Booking
1. Create booking: Room 101, Oct 17-20
2. Select Oct 18 in calendar → Room 101 should show as **Occupied** (Red)
3. Select Oct 20 in calendar → Room 101 should show as **Available** (Green)
4. Select Oct 21 in calendar → Room 101 should show as **Available** (Green)

#### Scenario 2: Multiple Bookings
1. Create bookings:
   - Room 101: Oct 17-20
   - Room 102: Oct 18-22
   - Room 206: Oct 16-19
2. Select Oct 18:
   - Occupied: 101, 102, 206 (Red)
   - Available: 207, 301, 302 (Green)

#### Scenario 3: Consecutive Bookings
1. Create bookings:
   - Guest A: Room 101, Oct 17-20
   - Guest B: Room 101, Oct 20-23
2. Select Oct 19 → Room 101 occupied by Guest A
3. Select Oct 20 → Room 101 occupied by Guest B
4. No gap between bookings ✅

## 🔍 Debugging

### Console Logs

The Dashboard shows detailed logs:

```
📅 Selected date: 2025-10-18
📋 Total bookings: 5
🔒 Occupied room numbers: ['101', '206', '207']
✅ Available rooms: 3 ['102', '301', '302']
🔒 Booked rooms: 3 ['101', '206', '207']
🔧 Maintenance rooms: 0
```

### Common Issues

**Issue**: All rooms show as available even with bookings

**Solutions**:
1. Check booking status: Only `confirmed`, `checked-in`, `checked_in` are counted
2. Check date fields: System handles both `checkin_date` and `checkInDate`
3. Check room fields: System handles both `room_number` and `roomNumber`
4. Verify booking dates are properly stored in database

**Issue**: Wrong rooms showing as occupied

**Solutions**:
1. Check console logs for date comparison
2. Verify date format in database (should be YYYY-MM-DD)
3. Check for cancelled bookings (should be excluded)

## 📊 Database Schema

### Bookings Table
```sql
CREATE TABLE bookings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  room_id INT,
  customer_id INT,
  checkin_date DATE NOT NULL,
  checkout_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'confirmed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);
```

### Valid Booking Statuses
- `confirmed` - Booking confirmed, not checked in yet
- `checked-in` or `checked_in` - Guest currently in room
- `cancelled` - Booking cancelled (excluded from availability)
- `completed` - Booking completed (excluded from availability)

## 🚀 API Integration

### Get Bookings
```javascript
const bookingsResult = await api.getBookings();
const bookings = bookingsResult.success ? bookingsResult.bookings : [];
```

### Get Rooms
```javascript
const roomsResult = await api.getRooms();
const rooms = roomsResult.success ? roomsResult.rooms : [];
```

## 📱 Responsive Design

- Desktop: Shows full date row with large cards
- Tablet: Responsive grid, smaller date cards
- Mobile: Touch-scrollable date row, compact room cards

## ✅ Verification Checklist

- [ ] Bookings are created with correct check-in/check-out dates
- [ ] Date selector shows 30 days from today
- [ ] Clicking a date updates room availability
- [ ] Occupied rooms show in red section
- [ ] Available rooms show in green section
- [ ] Checkout day shows room as available
- [ ] Multiple bookings handled correctly
- [ ] Cancelled bookings excluded from availability
- [ ] Console shows correct debug information
- [ ] Mobile view works properly

## 🔄 Future Enhancements

1. **Guest Information**: Show guest names on occupied room cards
2. **Booking Timeline**: Visual timeline showing booking duration
3. **Quick Book**: Click available room to create booking
4. **Date Range Picker**: Select check-in/check-out range visually
5. **Occupancy Chart**: Graph showing occupancy trends
6. **Room Filtering**: Filter by room type or floor
7. **Export Report**: Download availability report as PDF/Excel

## 📞 Support

For issues or questions:
1. Check console logs for detailed debugging info
2. Run test suite: `testRoomAvailability()`
3. Verify database data format
4. Check API responses in Network tab

---

**Last Updated**: October 16, 2025  
**Version**: 1.0.0  
**Author**: Reem Resort Development Team
