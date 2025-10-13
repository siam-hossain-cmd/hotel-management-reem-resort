import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  where,
  serverTimestamp,
  and
} from 'firebase/firestore';
import { db } from './config';
import authService from './authService';
import { api } from '../services/api';

export const bookingService = {
  // Collection reference
  getBookingsCollection: () => collection(db, 'bookings'),

  // Create new booking
  createBooking: async (bookingData) => {
    try {
      // Validate booking data
      const validateData = (obj, path = '') => {
        for (const [key, value] of Object.entries(obj)) {
          if (value === undefined) {
            console.warn(`Found undefined value at ${path}.${key}`);
            return false;
          }
          if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            if (!validateData(value, `${path}.${key}`)) {
              return false;
            }
          }
        }
        return true;
      };
      
      if (!validateData(bookingData)) {
        throw new Error('Booking data contains undefined values');
      }
      
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const bookingWithTimestamp = {
        ...bookingData,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'confirmed', // confirmed instead of pending - when booking is completed it's automatically confirmed
        paymentStatus: 'unpaid' // unpaid, partial, paid, refunded
      };
      
      console.log('Creating booking with data:', JSON.stringify(bookingWithTimestamp, null, 2));
      
      const docRef = await addDoc(bookingService.getBookingsCollection(), bookingWithTimestamp);
      console.log('Booking created with ID:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating booking:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all bookings
  getAllBookings: async () => {
    try {
      const q = query(
        bookingService.getBookingsCollection(), 
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const bookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { success: true, bookings };
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return { success: false, error: error.message, bookings: [] };
    }
  },

  // Get bookings by status
  getBookingsByStatus: async (status) => {
    try {
      const q = query(
        bookingService.getBookingsCollection(),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const bookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { success: true, bookings };
    } catch (error) {
      console.error('Error fetching bookings by status:', error);
      return { success: false, error: error.message, bookings: [] };
    }
  },

  // Check room availability for date range
  checkRoomAvailability: async (roomNumber, checkInDate, checkOutDate, excludeBookingId = null) => {
    try {
      // Get all bookings for the room that overlap with the requested dates
      const q = query(
        bookingService.getBookingsCollection(),
        where('roomNumber', '==', roomNumber),
        where('status', 'in', ['confirmed', 'paid', 'checked-in'])
      );
      
      const snapshot = await getDocs(q);
      const existingBookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter out the current booking if we're updating
      const relevantBookings = existingBookings.filter(booking => 
        booking.id !== excludeBookingId
      );

      // Check for date overlaps
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);

      const hasConflict = relevantBookings.some(booking => {
        const existingCheckIn = new Date(booking.checkInDate);
        const existingCheckOut = new Date(booking.checkOutDate);
        
        // Check if dates overlap
        return (checkIn < existingCheckOut && checkOut > existingCheckIn);
      });

      return { success: true, available: !hasConflict, conflicts: hasConflict ? relevantBookings : [] };
    } catch (error) {
      console.error('Error checking room availability:', error);
      return { success: false, error: error.message, available: false };
    }
  },

  // Get available rooms for date range
  getAvailableRooms: async (checkInDate, checkOutDate, roomType = null) => {
    try {
      // First get all rooms (assuming we have room data)
      // For now, we'll use a simple approach - you might want to create a separate rooms collection
      const allRoomNumbers = Array.from({ length: 50 }, (_, i) => `${i + 101}`); // Rooms 101-150
      
      const availableRooms = [];
      
      for (const roomNumber of allRoomNumbers) {
        const availabilityCheck = await bookingService.checkRoomAvailability(
          roomNumber, 
          checkInDate, 
          checkOutDate
        );
        
        if (availabilityCheck.success && availabilityCheck.available) {
          availableRooms.push({
            roomNumber,
            roomType: roomType || 'Standard', // Default room type
            pricePerNight: 100, // Default price - you can customize this
            amenities: ['WiFi', 'AC', 'TV'] // Default amenities
          });
        }
      }

      return { success: true, rooms: availableRooms };
    } catch (error) {
      console.error('Error getting available rooms:', error);
      return { success: false, error: error.message, rooms: [] };
    }
  },

  // Update booking
  updateBooking: async (id, updateData) => {
    try {
      const bookingRef = doc(db, 'bookings', id);
      const dataWithTimestamp = {
        ...updateData,
        updatedAt: serverTimestamp()
      };
      await updateDoc(bookingRef, dataWithTimestamp);
      console.log('Booking updated:', id);
      return { success: true };
    } catch (error) {
      console.error('Error updating booking:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete booking
  deleteBooking: async (id) => {
    try {
      // Use API to delete from MySQL backend
      const result = await api.deleteBooking(id);
      console.log('API deleteBooking result:', result);
      return result;
    } catch (error) {
      console.error('Error deleting booking via API, falling back to Firestore:', error);
      try {
        await deleteDoc(doc(db, 'bookings', id));
        console.log('Booking deleted via Firestore fallback:', id);
        return { success: true };
      } catch (fallbackError) {
        console.error('Error deleting booking via Firestore fallback:', fallbackError);
        return { success: false, error: fallbackError.message };
      }
    }
  },

  // Confirm booking
  confirmBooking: async (id) => {
    return await bookingService.updateBooking(id, { 
      status: 'confirmed',
      confirmedAt: serverTimestamp()
    });
  },

  // Mark as paid
  markAsPaid: async (id, paymentDetails = {}) => {
    return await bookingService.updateBooking(id, { 
      status: 'paid',
      paymentStatus: 'paid',
      paidAt: serverTimestamp(),
      paymentDetails
    });
  },

  // Check in guest
  checkIn: async (id) => {
    return await bookingService.updateBooking(id, { 
      status: 'checked-in',
      checkedInAt: serverTimestamp()
    });
  },

  // Check out guest
  checkOut: async (id) => {
    return await bookingService.updateBooking(id, { 
      status: 'checked-out',
      checkedOutAt: serverTimestamp()
    });
  },

  // Get recent bookings
  getRecentBookings: async (limit = 10) => {
    try {
      const q = query(
        bookingService.getBookingsCollection(),
        orderBy('createdAt', 'desc'),
        // Note: Firestore doesn't have a direct limit() function in this context
        // We'll limit in memory for now
      );
      const snapshot = await getDocs(q);
      const bookings = snapshot.docs.slice(0, limit).map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { success: true, bookings };
    } catch (error) {
      console.error('Error fetching recent bookings:', error);
      return { success: false, error: error.message, bookings: [] };
    }
  },

  // Get bookings by specific date
  getBookingsByDate: async (startDate, endDate = null) => {
    try {
      const targetDate = endDate || startDate;
      const q = query(
        bookingService.getBookingsCollection(),
        orderBy('checkInDate', 'desc')
      );
      const snapshot = await getDocs(q);
      
      const bookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(booking => {
        const checkIn = new Date(booking.checkInDate);
        const checkOut = new Date(booking.checkOutDate);
        const start = new Date(startDate);
        const end = new Date(targetDate);
        
        // Check if booking overlaps with the date range
        return (checkIn <= end && checkOut > start);
      });
      
      return { success: true, bookings };
    } catch (error) {
      console.error('Error fetching bookings by date:', error);
      return { success: false, error: error.message, bookings: [] };
    }
  },

  // Cancel booking
  cancelBooking: async (id, reason = '') => {
    return await bookingService.updateBooking(id, { 
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
      cancellationReason: reason
    });
  }
};

export default bookingService;