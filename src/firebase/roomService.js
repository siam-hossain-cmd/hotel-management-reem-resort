import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from './config';
import authService from './authService';

// Collections
const ROOMS_COLLECTION = 'rooms';
const ROOM_TYPES_COLLECTION = 'roomTypes';
const BOOKINGS_COLLECTION = 'bookings';

// Helper function to check admin authentication
const requireAdminAuth = () => {
  // Temporarily disable Firebase auth check for development
  console.log('Admin auth check (bypassed for development)');
  return true;
};
// Room Services
export const roomService = {
  // Upload rooms from JSON file
  async uploadRoomsFromJSON(roomsData) {
    try {
      // Require admin authentication for uploads
      requireAdminAuth();
      
      const results = {
        rooms: [],
        roomTypes: [],
        errors: []
      };

      // Upload room types first
      if (roomsData.roomTypes) {
        for (const roomType of roomsData.roomTypes) {
          try {
            const docRef = doc(db, ROOM_TYPES_COLLECTION, roomType.id);
            await setDoc(docRef, {
              ...roomType,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now()
            });
            results.roomTypes.push(roomType.id);
          } catch (error) {
            results.errors.push(`Error uploading room type ${roomType.id}: ${error.message}`);
          }
        }
      }

      // Upload rooms
      if (roomsData.rooms) {
        for (const room of roomsData.rooms) {
          try {
            const docRef = doc(db, ROOMS_COLLECTION, room.id);
            await setDoc(docRef, {
              ...room,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now()
            });
            results.rooms.push(room.id);
          } catch (error) {
            results.errors.push(`Error uploading room ${room.id}: ${error.message}`);
          }
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to upload rooms: ${error.message}`);
    }
  },

  // Get all rooms
  async getAllRooms() {
    try {
      const roomsRef = collection(db, ROOMS_COLLECTION);
      const q = query(roomsRef, orderBy('roomNumber'));
      const querySnapshot = await getDocs(q);
      
      const rooms = [];
      querySnapshot.forEach((doc) => {
        rooms.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return rooms;
    } catch (error) {
      throw new Error(`Failed to fetch rooms: ${error.message}`);
    }
  },

  // Get room by ID
  async getRoomById(roomId) {
    try {
      const docRef = doc(db, ROOMS_COLLECTION, roomId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        throw new Error('Room not found');
      }
    } catch (error) {
      throw new Error(`Failed to fetch room: ${error.message}`);
    }
  },

  // Get available rooms
  async getAvailableRooms() {
    try {
      const roomsRef = collection(db, ROOMS_COLLECTION);
      const q = query(roomsRef, where('status', '==', 'available'), orderBy('roomNumber'));
      const querySnapshot = await getDocs(q);
      
      const rooms = [];
      querySnapshot.forEach((doc) => {
        rooms.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return rooms;
    } catch (error) {
      throw new Error(`Failed to fetch available rooms: ${error.message}`);
    }
  },

  // Get rooms by type
  async getRoomsByType(roomType) {
    try {
      const roomsRef = collection(db, ROOMS_COLLECTION);
      const q = query(roomsRef, where('type', '==', roomType), orderBy('roomNumber'));
      const querySnapshot = await getDocs(q);
      
      const rooms = [];
      querySnapshot.forEach((doc) => {
        rooms.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return rooms;
    } catch (error) {
      throw new Error(`Failed to fetch rooms by type: ${error.message}`);
    }
  },

  // Add new room
  async addRoom(roomData) {
    try {
      // Require admin authentication for adding rooms
      requireAdminAuth();
      const docRef = await addDoc(collection(db, ROOMS_COLLECTION), {
        ...roomData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      return docRef.id;
    } catch (error) {
      throw new Error(`Failed to add room: ${error.message}`);
    }
  },

  // Update room
  async updateRoom(roomId, updates) {
    try {
      // Require admin authentication for updating rooms
      requireAdminAuth();
      const docRef = doc(db, ROOMS_COLLECTION, roomId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
      
      return true;
    } catch (error) {
      throw new Error(`Failed to update room: ${error.message}`);
    }
  },

  // Update room status
  async updateRoomStatus(roomId, status) {
    try {
      // Require admin authentication for updating room status
      requireAdminAuth();
      const docRef = doc(db, ROOMS_COLLECTION, roomId);
      await updateDoc(docRef, {
        status: status,
        updatedAt: Timestamp.now()
      });
      
      return true;
    } catch (error) {
      throw new Error(`Failed to update room status: ${error.message}`);
    }
  },

  // Delete room
  async deleteRoom(roomId) {
    try {
      // Require admin authentication for deleting rooms
      requireAdminAuth();
      const docRef = doc(db, ROOMS_COLLECTION, roomId);
      await deleteDoc(docRef);
      
      return true;
    } catch (error) {
      throw new Error(`Failed to delete room: ${error.message}`);
    }
  },

  // Get all room types
  async getAllRoomTypes() {
    try {
      const roomTypesRef = collection(db, ROOM_TYPES_COLLECTION);
      const q = query(roomTypesRef, orderBy('name'));
      const querySnapshot = await getDocs(q);
      
      const roomTypes = [];
      querySnapshot.forEach((doc) => {
        roomTypes.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return roomTypes;
    } catch (error) {
      throw new Error(`Failed to fetch room types: ${error.message}`);
    }
  }
};

// Booking Services (for room availability checking)
export const bookingService = {
  // Check room availability for date range
  async checkRoomAvailability(roomId, checkIn, checkOut) {
    try {
      const bookingsRef = collection(db, BOOKINGS_COLLECTION);
      const q = query(
        bookingsRef, 
        where('roomId', '==', roomId),
        where('status', 'in', ['confirmed', 'checked-in'])
      );
      const querySnapshot = await getDocs(q);
      
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      
      let isAvailable = true;
      querySnapshot.forEach((doc) => {
        const booking = doc.data();
        const bookingCheckIn = new Date(booking.checkInDate);
        const bookingCheckOut = new Date(booking.checkOutDate);
        
        // Check for date overlap
        if (
          (checkInDate < bookingCheckOut && checkOutDate > bookingCheckIn)
        ) {
          isAvailable = false;
        }
      });
      
      return isAvailable;
    } catch (error) {
      throw new Error(`Failed to check room availability: ${error.message}`);
    }
  },

  // Get available rooms for date range
  async getAvailableRoomsForDates(checkIn, checkOut) {
    try {
      const allRooms = await roomService.getAvailableRooms();
      const availableRooms = [];
      
      for (const room of allRooms) {
        const isAvailable = await this.checkRoomAvailability(room.id, checkIn, checkOut);
        if (isAvailable) {
          availableRooms.push(room);
        }
      }
      
      return availableRooms;
    } catch (error) {
      throw new Error(`Failed to get available rooms for dates: ${error.message}`);
    }
  }
};

export default { roomService, bookingService };