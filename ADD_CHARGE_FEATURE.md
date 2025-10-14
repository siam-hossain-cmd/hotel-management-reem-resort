# Add Charge Feature Implementation (Enhanced with Dropdown)

## Overview
Successfully implemented an enhanced "Add Charge" feature with a dropdown menu for common charge types. The feature automatically updates the booking's total amount and includes suggested amounts for common charges.

## ✨ New Enhancement: Dropdown Menu

### Common Charge Types with Suggested Amounts:

1. **Early Check-in Fee** - ৳500 (suggested)
2. **Late Check-out Fee** - ৳500 (suggested)
3. **Extra Bed / Rollaway Bed** - ৳800 (suggested)
4. **Room Upgrade Charges** - ৳1,000 (suggested)
5. **Smoking Fee (Non-smoking Room)** - ৳2,000 (suggested)
6. **Damages or Missing Items** - Amount to be specified
7. **Room Service** - Amount to be specified
8. **Minibar Items** - Amount to be specified
9. **Laundry Service** - Amount to be specified
10. **Extra Towels** - ৳100 (suggested)
11. **Extra Cleaning** - ৳300 (suggested)
12. **Others (Custom)** - Shows custom description field

### User Experience Improvements:

- **Quick Selection**: Select from common charges instead of typing
- **Auto-fill Amount**: Suggested amounts pre-filled for common charges
- **Custom Option**: "Others (Custom)" option for unique charges
- **Conditional UI**: Custom description field only shows when needed
- **Professional Look**: Styled dropdown with arrow icon

## Implementation Details

### 1. Database (MySQL)
**Table Created:** `booking_charges`

**Schema:**
```sql
CREATE TABLE booking_charges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    INDEX idx_booking_id (booking_id)
);
```

**Migration File:** `server/migrations/add_booking_charges.sql`

### 2. Backend API (Node.js/Express)

**File:** `server/routes/bookings.js`

**New Endpoints:**

1. **POST /bookings/:id/charges**
   - Adds a new charge to a booking
   - Validates description and amount
   - Updates booking's total_amount automatically
   - Returns success message with charge details

2. **GET /bookings/:id/charges**
   - Retrieves all charges for a specific booking
   - Returns charges ordered by creation date (newest first)

**Features:**
- Transaction support (BEGIN/COMMIT/ROLLBACK)
- Input validation
- Automatic total amount recalculation
- Error handling with appropriate HTTP status codes

### 3. Frontend API Service

**File:** `src/services/api.js`

**New Methods:**
- `addBookingCharge(bookingId, chargeData)` - POST request to add charge
- `getBookingCharges(bookingId)` - GET request to fetch charges

### 4. Frontend UI (React)

**File:** `src/pages/Bookings.jsx`

**New Components:**

1. **Add Charge Button**
   - Located in the Actions column of each booking row
   - Icon: DollarSign
   - Color: Amber/Yellow theme

2. **Add Charge Modal**
   - Shows booking summary (reference, guest, room, current total)
   - Form fields:
     - Description (text input, required)
     - Amount (number input, required, min: 0.01)
   - Real-time preview of new total
   - Save and Cancel buttons

**New State Variables:**
```javascript
const [showAddChargeModal, setShowAddChargeModal] = useState(false);
const [bookingForCharge, setBookingForCharge] = useState(null);
const [chargeDescription, setChargeDescription] = useState('');
const [chargeAmount, setChargeAmount] = useState('');
const [chargeType, setChargeType] = useState('');
const [showCustomDescription, setShowCustomDescription] = useState(false);

// Common charge types with suggested amounts
const commonChargeTypes = [
  { label: 'Select charge type...', value: '', amount: 0 },
  { label: 'Early Check-in Fee', value: 'Early Check-in Fee', amount: 500 },
  { label: 'Late Check-out Fee', value: 'Late Check-out Fee', amount: 500 },
  { label: 'Extra Bed / Rollaway Bed', value: 'Extra Bed / Rollaway Bed', amount: 800 },
  { label: 'Room Upgrade Charges', value: 'Room Upgrade Charges', amount: 1000 },
  { label: 'Smoking Fee (Non-smoking Room)', value: 'Smoking Fee (Non-smoking Room)', amount: 2000 },
  { label: 'Damages or Missing Items', value: 'Damages or Missing Items', amount: 0 },
  { label: 'Room Service', value: 'Room Service', amount: 0 },
  { label: 'Minibar Items', value: 'Minibar Items', amount: 0 },
  { label: 'Laundry Service', value: 'Laundry Service', amount: 0 },
  { label: 'Extra Towels', value: 'Extra Towels', amount: 100 },
  { label: 'Extra Cleaning', value: 'Extra Cleaning', amount: 300 },
  { label: 'Others (Custom)', value: 'custom', amount: 0 }
];
```

**New Handler Functions:**
- `handleAddChargeClick(booking)` - Opens modal
- `handleCloseAddChargeModal()` - Closes modal and resets form
- `handleChargeTypeChange(e)` - Handles dropdown selection and auto-fills
- `handleSaveCharge()` - Validates and submits charge

### 5. CSS Styling

**File:** `src/booking.css`

**New Styles:**
```css
.action-btn.charge - Amber colored button
.booking-info-summary - Modal summary section
.form-group - Form field grouping
.form-control - Input field styling
```

## Enhanced Usage Flow (with Dropdown)

1. User views bookings list
2. Clicks "Add Charge" button on any booking
3. Modal opens with booking details
4. **User selects from dropdown:**
   - **Option A: Select predefined charge** (e.g., "Late Check-out Fee")
     - Description auto-filled: "Late Check-out Fee"
     - Amount auto-filled: ৳500.00 (can be edited)
   - **Option B: Select "Others (Custom)"**
     - Custom description field appears
     - User types custom description
     - User enters amount
5. System shows preview of new total in real-time
6. User clicks "Save Charge"
7. Backend:
   - Validates input
   - Inserts charge record
   - Updates booking total_amount
   - Returns success
8. Frontend:
   - Shows success message with new total
   - Reloads bookings to show updated total
   - Closes modal

## Example Scenarios

### Scenario 1: Predefined Charge - Late Check-out
- User selects: "Late Check-out Fee" from dropdown
- Auto-filled: ৳500.00
- Current booking total: ৳3,095.40
- New total preview: ৳3,595.40
- Click Save ✅

### Scenario 2: Predefined Charge - Smoking Fee
- User selects: "Smoking Fee (Non-smoking Room)" from dropdown
- Auto-filled: ৳2,000.00
- Current booking total: ৳4,141.50
- New total preview: ৳6,141.50
- Click Save ✅

### Scenario 3: Custom Charge
- User selects: "Others (Custom)" from dropdown
- Custom field appears
- User types: "Pet cleaning fee"
- User enters: ৳750.00
- Current booking total: ৳1,570.80
- New total preview: ৳2,320.80
- Click Save ✅

### Scenario 2: Add Minibar Charge
- Current booking total: ৳4141.50
- Add charge: "Minibar items" - ৳350.00
- New total: ৳4491.50

## Error Handling

1. **Missing Fields**: Alert shown if description or amount is empty
2. **Invalid Amount**: Alert shown if amount is not a positive number
3. **Booking Not Found**: 404 response from backend
4. **Database Error**: 500 response with error message
5. **Network Error**: Caught and displayed to user

## Database Relationships

```
bookings (1) ─── (many) booking_charges
  └─ id                   └─ booking_id (FK)
```

**ON DELETE CASCADE**: When a booking is deleted, all its charges are automatically deleted.

## API Request/Response Examples

### Add Charge Request
```http
POST /api/bookings/123/charges
Content-Type: application/json

{
  "description": "Extra towels",
  "amount": 50.00
}
```

### Add Charge Response
```json
{
  "success": true,
  "message": "Charge added successfully",
  "charge": {
    "id": 45,
    "booking_id": 123,
    "description": "Extra towels",
    "amount": 50.00
  }
}
```

### Get Charges Request
```http
GET /api/bookings/123/charges
```

### Get Charges Response
```json
{
  "success": true,
  "charges": [
    {
      "id": 45,
      "booking_id": 123,
      "description": "Extra towels",
      "amount": 50.00,
      "created_at": "2025-10-14T14:30:00.000Z"
    },
    {
      "id": 44,
      "booking_id": 123,
      "description": "Room service",
      "amount": 200.00,
      "created_at": "2025-10-14T12:00:00.000Z"
    }
  ]
}
```

## Testing Checklist

- [x] Database table created successfully
- [x] Backend API endpoint handles POST requests
- [x] Backend validates input correctly
- [x] Backend updates booking total_amount
- [x] Frontend button appears in actions column
- [x] Frontend modal opens and closes properly
- [x] Frontend form validation works
- [x] Frontend shows real-time total preview
- [x] Success message displays after save
- [x] Bookings list refreshes with updated total
- [x] CSS styling applied correctly

## Future Enhancements (Optional)

1. **View Charges History**: Add a button to view all charges for a booking
2. **Edit/Delete Charges**: Allow modification or removal of existing charges
3. **Charge Categories**: Dropdown for common charge types
4. **Charge Reports**: Generate reports showing all charges by date range
5. **Charge Notes**: Add optional notes field for additional context
6. **Charge Approval**: Require manager approval for charges above a threshold
7. **Charge Notifications**: Email guest when charges are added

## Files Modified

1. `server/migrations/add_booking_charges.sql` (NEW)
2. `server/routes/bookings.js` (MODIFIED)
3. `src/services/api.js` (MODIFIED)
4. `src/pages/Bookings.jsx` (MODIFIED)
5. `src/booking.css` (MODIFIED)

## Technical Notes

- Uses MySQL transactions for data consistency
- Foreign key constraint ensures referential integrity
- Decimal(10,2) ensures precise financial calculations
- Real-time preview prevents calculation errors
- All monetary values displayed in BDT (৳)

## Deployment Notes

1. Run the migration SQL file on production database
2. Deploy backend code (server/routes/bookings.js)
3. Deploy frontend code (src files)
4. Clear browser cache for users to see new feature
5. Test thoroughly with production data

---

**Implementation Date:** October 14, 2025
**Status:** ✅ Complete and Ready for Testing
**Developer:** AI Assistant
