/**
 * Room Availability Helper Functions
 * Handles date-wise room availability logic for the hotel management system
 */

/**
 * Normalizes a date to the start of the day (00:00:00)
 * This ensures accurate date comparisons without time interference
 * @param {Date|string} date - The date to normalize
 * @returns {Date} - Normalized date at 00:00:00
 */
export const normalizeDate = (date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

/**
 * Checks if a selected date falls within a booking's date range
 * A room is occupied if: checkInDate <= selectedDate < checkOutDate
 * Note: Check-out date is exclusive (guest checks out in the morning)
 * 
 * Example:
 * - Booking: Oct 17 to Oct 20
 * - Room is occupied on: Oct 17, 18, 19
 * - Room is available on: Oct 20 (checkout day)
 * 
 * @param {Date|string} selectedDate - The date to check
 * @param {Date|string} checkInDate - Booking check-in date
 * @param {Date|string} checkOutDate - Booking check-out date
 * @returns {boolean} - True if the room is occupied on the selected date
 */
export const isDateInBookingRange = (selectedDate, checkInDate, checkOutDate) => {
  const selected = normalizeDate(selectedDate);
  const checkIn = normalizeDate(checkInDate);
  const checkOut = normalizeDate(checkOutDate);
  
  // Room is occupied if: checkIn <= selected < checkOut
  return selected >= checkIn && selected < checkOut;
};

/**
 * Checks if a booking is currently active (valid status)
 * @param {string} status - The booking status
 * @returns {boolean} - True if the booking should be considered for occupancy
 */
export const isValidBookingStatus = (status) => {
  const validStatuses = [
    'confirmed', 
    'checked-in', 
    'checked_in',
    'active'
  ];
  return validStatuses.includes(status?.toLowerCase());
};

/**
 * Gets all room numbers that are booked on a specific date
 * @param {Array} bookings - Array of booking objects
 * @param {Date|string} selectedDate - The date to check
 * @returns {Array<string>} - Array of room numbers that are occupied
 */
export const getOccupiedRoomNumbers = (bookings, selectedDate) => {
  const occupiedRooms = [];
  
  bookings.forEach(booking => {
    // Handle different field name conventions
    const checkInDateStr = booking.checkin_date || booking.checkInDate;
    const checkOutDateStr = booking.checkout_date || booking.checkOutDate;
    const roomNum = booking.room_number || booking.roomNumber;
    
    // Skip invalid bookings
    if (!checkInDateStr || !checkOutDateStr || !roomNum) {
      console.warn('⚠️ Invalid booking data:', booking);
      return;
    }
    
    // Check if booking is valid
    if (!isValidBookingStatus(booking.status)) {
      return;
    }
    
    // Check if selected date falls within booking range
    if (isDateInBookingRange(selectedDate, checkInDateStr, checkOutDateStr)) {
      occupiedRooms.push(roomNum);
    }
  });
  
  return occupiedRooms;
};

/**
 * Categorizes all rooms by their availability status for a specific date
 * @param {Array} allRooms - Array of all room objects
 * @param {Array} bookings - Array of booking objects
 * @param {Date|string} selectedDate - The date to check
 * @returns {Object} - Object with availableRooms, bookedRooms, and maintenanceRooms arrays
 */
export const categorizeRoomsByDate = (allRooms, bookings, selectedDate) => {
  // Get list of occupied room numbers for the selected date
  const occupiedRoomNumbers = getOccupiedRoomNumbers(bookings, selectedDate);
  
  // Categorize rooms
  const availableRooms = allRooms.filter(room => 
    room.status !== 'maintenance' && !occupiedRoomNumbers.includes(room.room_number)
  );
  
  const bookedRooms = allRooms.filter(room => 
    occupiedRoomNumbers.includes(room.room_number)
  );
  
  const maintenanceRooms = allRooms.filter(room => 
    room.status === 'maintenance'
  );
  
  return {
    availableRooms,
    bookedRooms,
    maintenanceRooms,
    occupiedRoomNumbers
  };
};

/**
 * Checks if a specific room is available for a date range
 * Useful for preventing double bookings
 * @param {string} roomNumber - The room number to check
 * @param {Date|string} requestedCheckIn - Requested check-in date
 * @param {Date|string} requestedCheckOut - Requested check-out date
 * @param {Array} existingBookings - Array of existing booking objects
 * @param {string} excludeBookingId - Optional booking ID to exclude (for updates)
 * @returns {boolean} - True if the room is available for the entire date range
 */
export const isRoomAvailableForRange = (
  roomNumber, 
  requestedCheckIn, 
  requestedCheckOut, 
  existingBookings,
  excludeBookingId = null
) => {
  const reqCheckIn = normalizeDate(requestedCheckIn);
  const reqCheckOut = normalizeDate(requestedCheckOut);
  
  // Check each existing booking
  for (const booking of existingBookings) {
    // Skip this booking if it's the one being updated
    if (excludeBookingId && booking.id === excludeBookingId) {
      continue;
    }
    
    // Get booking details
    const checkInDateStr = booking.checkin_date || booking.checkInDate;
    const checkOutDateStr = booking.checkout_date || booking.checkOutDate;
    const bookedRoom = booking.room_number || booking.roomNumber;
    
    // Skip if not the same room
    if (bookedRoom !== roomNumber) {
      continue;
    }
    
    // Skip invalid bookings
    if (!checkInDateStr || !checkOutDateStr) {
      continue;
    }
    
    // Skip cancelled bookings
    if (!isValidBookingStatus(booking.status)) {
      continue;
    }
    
    const existingCheckIn = normalizeDate(checkInDateStr);
    const existingCheckOut = normalizeDate(checkOutDateStr);
    
    // Check for date overlap
    // Two bookings overlap if:
    // requestedCheckIn < existingCheckOut AND requestedCheckOut > existingCheckIn
    const hasOverlap = reqCheckIn < existingCheckOut && reqCheckOut > existingCheckIn;
    
    if (hasOverlap) {
      return false; // Room is not available
    }
  }
  
  return true; // Room is available for the entire range
};

/**
 * Gets all dates between two dates (inclusive of start, exclusive of end)
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {Array<Date>} - Array of dates
 */
export const getDateRange = (startDate, endDate) => {
  const dates = [];
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);
  
  const current = new Date(start);
  while (current < end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
};

/**
 * Formats a date for display
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date string
 */
export const formatDateForDisplay = (date) => {
  const d = new Date(date);
  const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
  return d.toLocaleDateString('en-US', options);
};

/**
 * Validates booking dates
 * @param {Date|string} checkIn - Check-in date
 * @param {Date|string} checkOut - Check-out date
 * @returns {Object} - { valid: boolean, error: string }
 */
export const validateBookingDates = (checkIn, checkOut) => {
  const checkInDate = normalizeDate(checkIn);
  const checkOutDate = normalizeDate(checkOut);
  const today = normalizeDate(new Date());
  
  if (checkInDate < today) {
    return { valid: false, error: 'Check-in date cannot be in the past' };
  }
  
  if (checkOutDate <= checkInDate) {
    return { valid: false, error: 'Check-out date must be after check-in date' };
  }
  
  return { valid: true, error: null };
};

// Export all functions as default object
export default {
  normalizeDate,
  isDateInBookingRange,
  isValidBookingStatus,
  getOccupiedRoomNumbers,
  categorizeRoomsByDate,
  isRoomAvailableForRange,
  getDateRange,
  formatDateForDisplay,
  validateBookingDates
};
