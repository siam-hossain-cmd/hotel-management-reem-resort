import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA1lgNhs_MSTkMyA2nhRvi3vHf6KeHS-nE",
  authDomain: "invoice-reem-resort.firebaseapp.com",
  projectId: "invoice-reem-resort",
  storageBucket: "invoice-reem-resort.firebasestorage.app",
  messagingSenderId: "483324573465",
  appId: "1:483324573465:web:d668568deffec4ba94f788",
  measurementId: "G-T7T342052J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Room type pricing for Reem Resort (adjust these prices as needed)
const roomTypePricing = {
  "Premium Quadruple": 4500,
  "Deluxe Quadruple": 4000,
  "Deluxe Triple": 3500,
  "Deluxe Double": 3000,
  "Premium Deluxe Double": 3500,
  "Deluxe Twin": 3000,
  "Deluxe Double Queen": 3200,
  "Family Suits": 6000,
  "Royal Family Suit": 8000,
  "Rooftop Couple": 5000
};

// Get capacity based on room type
const getRoomCapacity = (roomType) => {
  if (roomType.includes('Quadruple')) return 4;
  if (roomType.includes('Triple')) return 3;
  if (roomType.includes('Double') || roomType.includes('Twin')) return 2;
  if (roomType.includes('Family') || roomType.includes('Suit')) return 6;
  if (roomType.includes('Couple')) return 2;
  return 2; // default
};

// Get amenities based on room type
const getRoomAmenities = (roomType) => {
  const baseAmenities = ["Air Conditioning", "WiFi", "TV", "Private Bathroom"];
  
  if (roomType.includes('Premium') || roomType.includes('Royal')) {
    return [...baseAmenities, "Mini Fridge", "Balcony", "Room Service", "Premium Toiletries", "Complimentary Breakfast"];
  }
  if (roomType.includes('Family') || roomType.includes('Suit')) {
    return [...baseAmenities, "Mini Fridge", "Living Area", "Kitchenette", "Extra Space", "Dining Area"];
  }
  if (roomType.includes('Deluxe')) {
    return [...baseAmenities, "Mini Fridge", "Balcony"];
  }
  
  return baseAmenities;
};

// Get bed configuration based on room type
const getBedType = (roomType) => {
  if (roomType.includes('Quadruple')) return 'Two Double Beds';
  if (roomType.includes('Triple')) return 'One Double + One Single';
  if (roomType.includes('Double Queen')) return 'Queen Bed';
  if (roomType.includes('Double')) return 'Double Bed';
  if (roomType.includes('Twin')) return 'Twin Beds';
  if (roomType.includes('Family') || roomType.includes('Suit')) return 'King Bed + Sofa Bed';
  if (roomType.includes('Couple')) return 'King Bed';
  return 'Double Bed';
};

// Get room view based on floor
const getRoomView = (roomNumber) => {
  const floor = Math.floor(parseInt(roomNumber) / 100);
  if (floor >= 8) return 'Rooftop View';
  if (floor >= 6) return 'City View';
  if (floor >= 4) return 'Partial Sea View';
  if (floor >= 2) return 'Garden View';
  return 'Ground View';
};

async function uploadRoomsToFirestore() {
  try {
    console.log('🚀 Starting room data upload to Firestore...');
    console.log('📂 Reading your actual rooms.json file...');
    
    // Read your actual rooms.json file
    const roomsPath = path.join(__dirname, '..', 'rooms.json');
    const roomsData = JSON.parse(fs.readFileSync(roomsPath, 'utf8'));
    
    const totalRooms = Object.keys(roomsData.rooms).length;
    console.log(`📚 Found ${totalRooms} rooms to upload from Reem Resort`);
    
    // Convert your room structure to Firestore format
    const roomsArray = Object.entries(roomsData.rooms).map(([key, room]) => {
      const roomType = room.roomType;
      const roomNumber = room.roomNo;
      const pricePerNight = roomTypePricing[roomType] || 3000;
      const capacity = getRoomCapacity(roomType);
      const amenities = getRoomAmenities(roomType);
      const bedType = getBedType(roomType);
      const viewType = getRoomView(roomNumber);
      const floor = Math.floor(parseInt(roomNumber) / 100);
      
      return {
        id: `R${roomNumber}`,
        roomNumber: roomNumber,
        type: roomType,
        floor: floor,
        capacity: capacity,
        pricePerNight: pricePerNight,
        amenities: amenities,
        status: 'available', // Default status
        bedType: bedType,
        viewType: viewType,
        size: `${20 + (capacity * 8)} sqm`, // Estimated size based on capacity
        description: `${roomType} at Reem Resort with modern amenities and ${viewType.toLowerCase()}.`,
        features: {
          hasBalcony: roomType.includes('Premium') || roomType.includes('Deluxe'),
          hasKitchenette: roomType.includes('Suit'),
          hasLivingArea: roomType.includes('Family') || roomType.includes('Suit'),
          smokingAllowed: false,
          petFriendly: false
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });
    
    console.log(`🏗️  Converted ${roomsArray.length} rooms to Firestore format`);
    
    // Create room types from unique types in your data
    const roomTypesSet = new Set(roomsArray.map(room => room.type));
    const roomTypesArray = Array.from(roomTypesSet).map(type => ({
      id: type.toLowerCase().replace(/\s+/g, '-'),
      name: type,
      basePrice: roomTypePricing[type] || 3000,
      description: `${type} accommodation at Reem Resort with quality amenities`,
      capacity: getRoomCapacity(type),
      amenities: getRoomAmenities(type),
      bedType: getBedType(type),
      features: {
        hasBalcony: type.includes('Premium') || type.includes('Deluxe'),
        hasKitchenette: type.includes('Suit'),
        hasLivingArea: type.includes('Family') || type.includes('Suit')
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    
    console.log(`📋 Found ${roomTypesArray.length} unique room types:`);
    roomTypesArray.forEach(type => {
      const count = roomsArray.filter(room => room.type === type.name).length;
      console.log(`   • ${type.name}: ${count} rooms (৳${type.basePrice}/night)`);
    });
    
    // Upload in batches (Firestore has a 500 document limit per batch)
    const batchSize = 450; // Safe batch size
    let uploadedRooms = 0;
    let uploadedTypes = 0;
    
    // Upload room types first
    console.log('\n🏨 Uploading room types...');
    const typeBatch = writeBatch(db);
    
    roomTypesArray.forEach((roomType) => {
      const typeRef = doc(collection(db, 'roomTypes'), roomType.id);
      typeBatch.set(typeRef, roomType);
    });
    
    await typeBatch.commit();
    uploadedTypes = roomTypesArray.length;
    console.log(`✅ Successfully uploaded ${uploadedTypes} room types`);
    
    // Upload rooms in batches
    console.log('\n🏠 Uploading rooms...');
    for (let i = 0; i < roomsArray.length; i += batchSize) {
      const batch = writeBatch(db);
      const currentBatch = roomsArray.slice(i, i + batchSize);
      
      console.log(`   � Batch ${Math.floor(i/batchSize) + 1}: Uploading rooms ${i + 1} to ${Math.min(i + batchSize, roomsArray.length)}`);
      
      currentBatch.forEach((room) => {
        const roomRef = doc(collection(db, 'rooms'), room.id);
        batch.set(roomRef, room);
      });
      
      await batch.commit();
      uploadedRooms += currentBatch.length;
      console.log(`   ✅ Uploaded ${currentBatch.length} rooms`);
    }
    
    // Create upload summary
    const summary = {
      totalRooms: uploadedRooms,
      totalRoomTypes: uploadedTypes,
      uploadedAt: new Date().toISOString(),
      hotelName: 'Reem Resort',
      roomTypeBreakdown: {},
      floorBreakdown: {},
      priceRange: {
        min: Math.min(...roomsArray.map(r => r.pricePerNight)),
        max: Math.max(...roomsArray.map(r => r.pricePerNight))
      }
    };
    
    // Calculate breakdowns
    roomTypesSet.forEach(type => {
      summary.roomTypeBreakdown[type] = roomsArray.filter(room => room.type === type).length;
    });
    
    const floors = [...new Set(roomsArray.map(room => room.floor))].sort();
    floors.forEach(floor => {
      summary.floorBreakdown[`Floor ${floor}`] = roomsArray.filter(room => room.floor === floor).length;
    });
    
    // Save upload summary
    await setDoc(doc(db, 'metadata', 'roomsUpload'), summary);
    
    console.log('\n🎉 Upload Complete!');
    console.log('==========================================');
    console.log(`✅ Successfully uploaded ${uploadedRooms} rooms`);
    console.log(`✅ Successfully uploaded ${uploadedTypes} room types`);
    console.log(`🏨 Hotel: Reem Resort`);
    console.log(`💰 Price range: ৳${summary.priceRange.min} - ৳${summary.priceRange.max} per night`);
    console.log(`🏢 Floors: ${floors.join(', ')}`);
    console.log('\n📊 Room Type Summary:');
    Object.entries(summary.roomTypeBreakdown).forEach(([type, count]) => {
      console.log(`   • ${type}: ${count} rooms`);
    });
    
    console.log('\n🔥 Your Reem Resort room data is now live in Firestore!');
    console.log('🌐 You can now use this data in your invoice system.');
    
  } catch (error) {
    console.error('❌ Error uploading rooms:', error);
    console.error('💡 Make sure you have updated Firebase security rules to allow writes');
    process.exit(1);
  }
}

// Run the upload
uploadRoomsToFirestore();