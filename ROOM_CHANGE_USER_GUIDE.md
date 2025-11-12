# Room Change Feature - User Guide

## Quick Start Guide

### When to Use Room Change
Use this feature when you need to move a checked-in guest to a different room due to:
- 🔧 Maintenance issues in current room
- 👤 Guest request for upgrade/downgrade
- 🚨 Emergency situations
- 🏠 Better room availability

## Step-by-Step Instructions

### 1. Navigate to Bookings Page
- Go to the **Bookings** section from the main menu
- Find the guest who needs a room change
- **Important**: Guest must be **CHECKED IN** (not just confirmed or checked out)

### 2. Click "Change Room" Button
- Look for the **"Change Room"** button (orange/yellow color)
- It appears next to the "Check Out" button
- Button is only visible for checked-in bookings

### 3. View Current Booking Details
The modal will show:
```
Current Booking Information
├─ Guest Name: John Doe
├─ Current Room: 101 - Deluxe
├─ Room Type: Deluxe
├─ Current Rate: ৳5,000/night
├─ Check-in Date: 20/01/2025
├─ Check-out Date: 25/01/2025
└─ Remaining Nights: 3
```

### 4. Select New Room
Available rooms are displayed in a grid layout:

**Room Card Example (Same Price)**:
```
┌─────────────────────────┐
│ ✓ Room 102              │ ← Shows checkmark when selected
│ Deluxe                  │
│ ৳5,000/night            │
│ Capacity: 2 guests      │
│ ─────────────────────── │
│ Same Price              │ ← Green background
│ No price change         │
└─────────────────────────┘
```

**Room Card Example (Upgrade)**:
```
┌─────────────────────────┐
│ Room 203                │
│ Suite                   │
│ ৳8,000/night            │
│ Capacity: 4 guests      │
│ ─────────────────────── │
│ +৳9,000 Upgrade         │ ← Red background
│ For remaining 3 nights  │
└─────────────────────────┘
```

**Room Card Example (Downgrade)**:
```
┌─────────────────────────┐
│ Room 105                │
│ Standard                │
│ ৳3,500/night            │
│ Capacity: 2 guests      │
│ ─────────────────────── │
│ -৳4,500 Credit          │ ← Green background
│ For remaining 3 nights  │
└─────────────────────────┘
```

### 5. Select Change Reason
Choose from dropdown:
- **Maintenance Issue** - For repairs, cleaning, or room problems
- **Guest Request** - When guest asks for different room
- **Room Upgrade** - Offering better room to guest
- **Room Downgrade** - Moving to lower category room
- **Emergency** - Urgent situations requiring immediate change
- **Other** - Any other reason not listed above

### 6. Add Notes (Optional)
Add any additional context:
```
Example: "Guest reported AC not working. Maintenance scheduled
for tomorrow. Moving guest to similar room on same floor."
```

### 7. Review Change Summary
Before confirming, you'll see:
```
Change Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
From Room:     101 - Deluxe
               ↓
To Room:       203 - Suite

Nights Affected: 3 nights
Price Adjustment: +৳9,000 (Upgrade)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 8. Confirm Change
- Click **"Confirm Change Room"** button
- System will:
  - ✅ Update booking to new room
  - ✅ Add price adjustment to charges
  - ✅ Mark old room as available
  - ✅ Mark new room as occupied
  - ✅ Save change history
  - ✅ Record who made the change and when

### 9. Verify Change
After successful change:
- Booking list refreshes automatically
- Guest now shows in new room number
- Old room appears as "Available" in Rooms page
- New room shows as "Occupied"
- Invoice includes price adjustment in charges

## Understanding Price Calculations

### Formula
```
Price Adjustment = (New Room Rate - Old Room Rate) × Remaining Nights
```

### Examples

**Example 1: Upgrade**
```
Current Room: ৳5,000/night
New Room: ৳8,000/night
Remaining Nights: 3

Calculation:
(৳8,000 - ৳5,000) × 3 = ৳9,000 additional charge
```

**Example 2: Downgrade**
```
Current Room: ৳5,000/night
New Room: ৳3,500/night
Remaining Nights: 4

Calculation:
(৳3,500 - ৳5,000) × 4 = -৳6,000 credit to guest
```

**Example 3: Same Price**
```
Current Room: ৳5,000/night (Deluxe, Room 101)
New Room: ৳5,000/night (Deluxe, Room 102)
Remaining Nights: 2

Calculation:
(৳5,000 - ৳5,000) × 2 = ৳0 no price change
```

## Financial Impact

### For Upgrades (Positive Amount)
- Amount **added** to booking charges
- Increases total amount due
- Shown as **"Room Change - Upgrade"** in charges
- Guest owes more money

### For Downgrades (Negative Amount)
- Amount **subtracted** from booking charges
- Decreases total amount due
- Shown as **"Room Change - Downgrade"** in charges
- Guest receives credit

### For Same Price
- No charge added
- Total amount unchanged
- Change still recorded in history

## Common Scenarios

### Scenario 1: AC Breakdown
```
Problem: AC not working in Room 101
Solution:
1. Click "Change Room" for the guest
2. Select similar available room (e.g., Room 102)
3. Reason: "Maintenance Issue"
4. Notes: "AC breakdown, guest moved to similar room"
5. Confirm change
```

### Scenario 2: Guest Birthday Surprise
```
Situation: Guest celebrating birthday, offer upgrade
Solution:
1. Click "Change Room"
2. Select higher category room (Suite)
3. Reason: "Room Upgrade"
4. Notes: "Complimentary upgrade for birthday celebration"
5. If complimentary, adjust price manually later
6. Confirm change
```

### Scenario 3: Guest Wants Smaller Room
```
Request: Guest finds room too large, wants downgrade
Solution:
1. Click "Change Room"
2. Select smaller room with lower rate
3. Reason: "Guest Request"
4. Notes: "Guest requested smaller, more affordable room"
5. Confirm change (credit will be applied automatically)
```

## What Gets Tracked

### Change History Includes
- ✅ Date and time of change
- ✅ Who made the change (your email)
- ✅ From which room (number, type, rate)
- ✅ To which room (number, type, rate)
- ✅ How many nights affected
- ✅ Price adjustment amount
- ✅ Reason for change
- ✅ Any notes added

### Where to View History
- Full history stored in database
- View in booking details
- Appears in invoice (future enhancement)
- Available in reports (future enhancement)

## Important Notes

### ⚠️ Restrictions
- Can only change rooms for **CHECKED-IN** guests
- Cannot change to the **same room** (no point!)
- Cannot change to **occupied rooms**
- Cannot undo a change (would need another change)

### 💡 Best Practices
- Always add detailed notes explaining the reason
- Verify room availability before promising guest
- Inform housekeeping team about room status changes
- Update guest about new room number promptly
- Check that new room matches guest preferences
- For complimentary upgrades, note "Complimentary" clearly

### 🔒 Permissions
- Requires **"update_booking"** permission
- All changes are logged with user email
- Master Admin can see all change history
- Cannot be deleted or hidden

## Troubleshooting

### "Button Not Showing"
**Problem**: Don't see "Change Room" button
**Solutions**:
- ✅ Check guest is in "Checked In" status
- ✅ Verify you have "update_booking" permission
- ✅ Try refreshing the page
- ✅ Check you're on the Bookings page

### "No Rooms Available"
**Problem**: Modal shows "No rooms available"
**Solutions**:
- ✅ Check room availability for remaining dates
- ✅ Verify rooms aren't all occupied
- ✅ Try marking rooms as "Available" if they're ready
- ✅ Consider extending into different date ranges

### "Price Seems Wrong"
**Problem**: Price adjustment doesn't match expectation
**Solutions**:
- ✅ Check remaining nights calculation
- ✅ Verify room rates are correct
- ✅ Remember: calculation is automatic based on remaining nights
- ✅ Formula: (New Rate - Old Rate) × Remaining Nights

### "Change Failed"
**Problem**: Error message after clicking confirm
**Solutions**:
- ✅ Check internet connection
- ✅ Verify room is still available
- ✅ Ensure booking is still checked-in
- ✅ Try refreshing and attempting again
- ✅ Contact technical support if persists

## Tips for Success

### 1. Plan Ahead
- Check room availability before promising guests
- Consider maintenance schedules
- Keep some rooms available for emergencies

### 2. Communication
- Inform guest promptly about room change
- Provide new room number clearly
- Explain any price changes transparently
- Follow up to ensure guest is satisfied

### 3. Documentation
- Always fill in the reason dropdown
- Add detailed notes explaining context
- Keep track of frequent change reasons
- Review change history regularly

### 4. Financial Management
- Verify price adjustments with guest
- Process refunds promptly for downgrades
- Collect additional payment for upgrades
- Update invoices accordingly

## FAQ

**Q: Can I change rooms multiple times for one booking?**
A: Yes! Each change is tracked in the history. However, use this sparingly as it can confuse guests.

**Q: What happens to the old room?**
A: It's automatically marked as "Available" and can be assigned to new guests.

**Q: Can I change room on check-out day?**
A: Yes, but the remaining nights will be less, affecting the price adjustment.

**Q: What if I select wrong room by mistake?**
A: You'll need to do another room change to move them back. Cannot undo.

**Q: Does this affect the invoice?**
A: Yes, price adjustments appear in booking charges and affect total amount.

**Q: Can I change confirmed bookings?**
A: No, guest must be checked in first. Use edit booking for pre-check-in changes.

**Q: What if guest already paid in full?**
A: For upgrades, they owe more. For downgrades, process refund manually.

**Q: Is there a limit to price adjustments?**
A: No limit, but large adjustments may require approval based on hotel policy.

---

**Need Help?**
- Technical Issues: Contact system administrator
- Policy Questions: Check with management
- Feature Requests: Submit through feedback system

**Last Updated**: January 23, 2025
**Version**: 1.0.0
