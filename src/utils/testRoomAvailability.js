/**
 * Test Suite for Room Availability Logic
 * Run this in browser console to verify the date-wise availability logic
 */

import {
  isDateInBookingRange,
  getOccupiedRoomNumbers,
  categorizeRoomsByDate,
  isRoomAvailableForRange,
  getDateRange,
  validateBookingDates
} from './roomAvailability';

/**
 * Run all tests
 */
export const runAvailabilityTests = () => {
  console.log('🧪 Starting Room Availability Tests...\n');
  
  let passedTests = 0;
  let failedTests = 0;
  
  // Test 1: Basic date range check
  console.log('📝 Test 1: Date within booking range (17-20 Oct)');
  const test1a = isDateInBookingRange('2025-10-18', '2025-10-17', '2025-10-20');
  const test1b = isDateInBookingRange('2025-10-17', '2025-10-17', '2025-10-20');
  const test1c = isDateInBookingRange('2025-10-19', '2025-10-17', '2025-10-20');
  const test1d = !isDateInBookingRange('2025-10-20', '2025-10-17', '2025-10-20'); // Checkout day is available
  const test1e = !isDateInBookingRange('2025-10-16', '2025-10-17', '2025-10-20');
  
  if (test1a && test1b && test1c && test1d && test1e) {
    console.log('✅ Test 1 PASSED');
    passedTests++;
  } else {
    console.log('❌ Test 1 FAILED');
    console.log('  Oct 18 in range:', test1a, '(should be true)');
    console.log('  Oct 17 in range:', test1b, '(should be true)');
    console.log('  Oct 19 in range:', test1c, '(should be true)');
    console.log('  Oct 20 in range:', test1d, '(should be false - checkout day)');
    console.log('  Oct 16 in range:', test1e, '(should be false)');
    failedTests++;
  }
  
  // Test 2: Get occupied rooms for a specific date
  console.log('\n📝 Test 2: Get occupied rooms for Oct 18');
  const mockBookings = [
    {
      id: 1,
      room_number: '101',
      checkin_date: '2025-10-17',
      checkout_date: '2025-10-20',
      status: 'confirmed'
    },
    {
      id: 2,
      room_number: '102',
      checkin_date: '2025-10-15',
      checkout_date: '2025-10-18', // Available on 18th
      status: 'confirmed'
    },
    {
      id: 3,
      room_number: '206',
      checkin_date: '2025-10-18',
      checkout_date: '2025-10-22',
      status: 'checked-in'
    },
    {
      id: 4,
      room_number: '207',
      checkin_date: '2025-10-16',
      checkout_date: '2025-10-19',
      status: 'confirmed'
    },
    {
      id: 5,
      room_number: '301',
      checkin_date: '2025-10-10',
      checkout_date: '2025-10-15',
      status: 'cancelled' // Should be ignored
    }
  ];
  
  const occupiedOnOct18 = getOccupiedRoomNumbers(mockBookings, '2025-10-18');
  const expectedOccupied = ['101', '206', '207'];
  const test2 = JSON.stringify(occupiedOnOct18.sort()) === JSON.stringify(expectedOccupied.sort());
  
  if (test2) {
    console.log('✅ Test 2 PASSED');
    console.log('  Occupied rooms on Oct 18:', occupiedOnOct18);
    passedTests++;
  } else {
    console.log('❌ Test 2 FAILED');
    console.log('  Expected:', expectedOccupied);
    console.log('  Got:', occupiedOnOct18);
    failedTests++;
  }
  
  // Test 3: Categorize all rooms
  console.log('\n📝 Test 3: Categorize all rooms for Oct 18');
  const mockRooms = [
    { id: 1, room_number: '101', room_type: 'Deluxe', status: 'available' },
    { id: 2, room_number: '102', room_type: 'Standard', status: 'available' },
    { id: 3, room_number: '206', room_type: 'Suite', status: 'available' },
    { id: 4, room_number: '207', room_type: 'Suite', status: 'available' },
    { id: 5, room_number: '301', room_type: 'Deluxe', status: 'maintenance' },
    { id: 6, room_number: '302', room_type: 'Standard', status: 'available' }
  ];
  
  const categorized = categorizeRoomsByDate(mockRooms, mockBookings, '2025-10-18');
  const test3a = categorized.bookedRooms.length === 3; // 101, 206, 207
  const test3b = categorized.availableRooms.length === 2; // 102, 302
  const test3c = categorized.maintenanceRooms.length === 1; // 301
  
  if (test3a && test3b && test3c) {
    console.log('✅ Test 3 PASSED');
    console.log('  Booked:', categorized.bookedRooms.map(r => r.room_number));
    console.log('  Available:', categorized.availableRooms.map(r => r.room_number));
    console.log('  Maintenance:', categorized.maintenanceRooms.map(r => r.room_number));
    passedTests++;
  } else {
    console.log('❌ Test 3 FAILED');
    console.log('  Booked rooms:', categorized.bookedRooms.length, '(expected 3)');
    console.log('  Available rooms:', categorized.availableRooms.length, '(expected 2)');
    console.log('  Maintenance rooms:', categorized.maintenanceRooms.length, '(expected 1)');
    failedTests++;
  }
  
  // Test 4: Check room availability for a new booking
  console.log('\n📝 Test 4: Check if Room 101 is available for Oct 21-23');
  const test4a = isRoomAvailableForRange('101', '2025-10-21', '2025-10-23', mockBookings);
  const test4b = !isRoomAvailableForRange('101', '2025-10-18', '2025-10-21', mockBookings); // Overlaps
  
  if (test4a && test4b) {
    console.log('✅ Test 4 PASSED');
    console.log('  Room 101 available Oct 21-23:', test4a);
    console.log('  Room 101 available Oct 18-21:', !test4b, '(overlaps with existing)');
    passedTests++;
  } else {
    console.log('❌ Test 4 FAILED');
    failedTests++;
  }
  
  // Test 5: Date range generation
  console.log('\n📝 Test 5: Generate date range Oct 17-20');
  const dateRange = getDateRange('2025-10-17', '2025-10-20');
  const test5 = dateRange.length === 3; // 17, 18, 19 (20 is exclusive)
  
  if (test5) {
    console.log('✅ Test 5 PASSED');
    console.log('  Dates:', dateRange.map(d => d.toISOString().split('T')[0]));
    passedTests++;
  } else {
    console.log('❌ Test 5 FAILED');
    console.log('  Expected 3 dates, got:', dateRange.length);
    failedTests++;
  }
  
  // Test 6: Date validation
  console.log('\n📝 Test 6: Validate booking dates');
  const test6a = validateBookingDates('2025-10-20', '2025-10-22').valid;
  const test6b = !validateBookingDates('2025-10-20', '2025-10-20').valid; // Same day
  const test6c = !validateBookingDates('2025-10-20', '2025-10-19').valid; // Checkout before checkin
  
  if (test6a && test6b && test6c) {
    console.log('✅ Test 6 PASSED');
    passedTests++;
  } else {
    console.log('❌ Test 6 FAILED');
    failedTests++;
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passedTests}/6`);
  console.log(`❌ Failed: ${failedTests}/6`);
  console.log('='.repeat(50));
  
  if (failedTests === 0) {
    console.log('🎉 All tests passed! Room availability logic is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Please review the logic.');
  }
  
  return { passedTests, failedTests };
};

/**
 * Test with your actual data
 * Run this in the dashboard after loading
 */
export const testWithActualData = async (api) => {
  console.log('🧪 Testing with actual database data...\n');
  
  try {
    const bookingsResult = await api.getBookings();
    const roomsResult = await api.getRooms();
    
    const bookings = bookingsResult.success ? bookingsResult.bookings : [];
    const rooms = roomsResult.success ? roomsResult.rooms : [];
    
    console.log('📋 Total bookings:', bookings.length);
    console.log('🏨 Total rooms:', rooms.length);
    
    // Test for today
    const today = new Date();
    console.log('\n📅 Testing for today:', today.toISOString().split('T')[0]);
    
    const result = categorizeRoomsByDate(rooms, bookings, today);
    
    console.log('\n📊 Results:');
    console.log('✅ Available:', result.availableRooms.length, result.availableRooms.map(r => r.room_number));
    console.log('🔒 Occupied:', result.bookedRooms.length, result.bookedRooms.map(r => r.room_number));
    console.log('🔧 Maintenance:', result.maintenanceRooms.length, result.maintenanceRooms.map(r => r.room_number));
    
    // Show which bookings are active today
    console.log('\n📋 Active bookings for today:');
    bookings.forEach(booking => {
      const checkIn = booking.checkin_date || booking.checkInDate;
      const checkOut = booking.checkout_date || booking.checkOutDate;
      const roomNum = booking.room_number || booking.roomNumber;
      
      if (isDateInBookingRange(today, checkIn, checkOut)) {
        console.log(`  Room ${roomNum}: ${checkIn} to ${checkOut} (${booking.status})`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error testing with actual data:', error);
  }
};

// Export for browser console
if (typeof window !== 'undefined') {
  window.testRoomAvailability = runAvailabilityTests;
  window.testWithActualData = testWithActualData;
}

export default {
  runAvailabilityTests,
  testWithActualData
};
