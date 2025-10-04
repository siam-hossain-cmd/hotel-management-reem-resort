// Upload script to upload ALL rooms from rooms.json to Firestore
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
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

// Room type pricing for Reem Resort
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
  return 2;
};

// Get amenities based on room type
const getRoomAmenities = (roomType) => {
  const baseAmenities = ["Air Conditioning", "WiFi", "TV", "Private Bathroom"];
  
  if (roomType.includes('Premium') || roomType.includes('Royal')) {
    return [...baseAmenities, "Mini Fridge", "Balcony", "Room Service", "Premium Toiletries"];
  }
  if (roomType.includes('Family') || roomType.includes('Suit')) {
    return [...baseAmenities, "Mini Fridge", "Living Area", "Kitchenette", "Extra Space"];
  }
  if (roomType.includes('Deluxe')) {
    return [...baseAmenities, "Mini Fridge", "Balcony"];
  }
  
  return baseAmenities;
};

async function uploadAllRoomsToFirestore() {
  try {
    console.log('🚀 Starting room data upload to Firestore...');
    console.log('📂 Reading your rooms.json file...');
    
    // Read your actual rooms.json file
    const roomsPath = path.join(__dirname, 'src', 'data', 'rooms.json');
    
    if (!fs.existsSync(roomsPath)) {
      throw new Error('rooms.json file not found! Make sure it exists in the project root.');
    }
    
    const roomsData = JSON.parse(fs.readFileSync(roomsPath, 'utf8'));
    
    if (!roomsData.rooms) {
      throw new Error('Invalid rooms.json format! Expected "rooms" property.');
    }
    
    const totalRooms = Object.keys(roomsData.rooms).length;
    console.log(`📚 Found ${totalRooms} rooms in your rooms.json file`);
    
    // Convert your room structure to Firestore format
    const roomsArray = Object.entries(roomsData.rooms).map(([key, room]) => {
      const roomType = room.roomType;
      const roomNumber = room.roomNo;
      const pricePerNight = roomTypePricing[roomType] || 3000;
      const capacity = getRoomCapacity(roomType);
      const amenities = getRoomAmenities(roomType);
      const floor = Math.floor(parseInt(roomNumber) / 100);
      
      return {
        id: `R${roomNumber}`,
        roomNumber: roomNumber,
        type: roomType,
        floor: floor,
        capacity: capacity,
        pricePerNight: pricePerNight,
        amenities: amenities,
        status: 'available',
        bedType: capacity > 2 ? 'Multiple Beds' : 'Double Bed',
        viewType: floor >= 6 ? 'City View' : floor >= 4 ? 'Partial Sea View' : 'Garden View',
        size: `${20 + (capacity * 8)} sqm`,
        description: `${roomType} at Reem Resort with modern amenities.`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });
    
    console.log(`🏗️ Converted ${roomsArray.length} rooms to Firestore format`);
    
    // Create room types
    const roomTypesSet = new Set(roomsArray.map(room => room.type));
    const roomTypesArray = Array.from(roomTypesSet).map(type => ({
      id: type.toLowerCase().replace(/\s+/g, '-'),
      name: type,
      basePrice: roomTypePricing[type] || 3000,
      description: `${type} accommodation at Reem Resort`,
      capacity: getRoomCapacity(type),
      amenities: getRoomAmenities(type)
    }));
    
    console.log(`📋 Found ${roomTypesArray.length} unique room types:`);
    roomTypesArray.forEach(type => {
      const count = roomsArray.filter(room => room.type === type.name).length;
      console.log(`   • ${type.name}: ${count} rooms (৳${type.basePrice}/night)`);
    });
    
    // Upload room types first
    console.log('\n🏨 Uploading room types...');
    for (const roomType of roomTypesArray) {
      const typeRef = doc(collection(db, 'roomTypes'), roomType.id);
      await setDoc(typeRef, roomType);
      console.log(`   ✅ Uploaded: ${roomType.name}`);
    }
    
    // Upload rooms in batches
    console.log('\n🏠 Uploading rooms...');
    const batchSize = 450;
    let uploadedCount = 0;
    
    for (let i = 0; i < roomsArray.length; i += batchSize) {
      const batch = writeBatch(db);
      const currentBatch = roomsArray.slice(i, i + batchSize);
      
      console.log(`   📦 Uploading batch ${Math.floor(i/batchSize) + 1}: Rooms ${i + 1} to ${Math.min(i + batchSize, roomsArray.length)}`);
      
      currentBatch.forEach((room) => {
        const roomRef = doc(collection(db, 'rooms'), room.id);
        batch.set(roomRef, room);
      });
      
      await batch.commit();
      uploadedCount += currentBatch.length;
      console.log(`   ✅ Uploaded ${currentBatch.length} rooms (Total: ${uploadedCount}/${roomsArray.length})`);
    }
    
    // Create summary
    const summary = {
      totalRooms: uploadedCount,
      totalRoomTypes: roomTypesArray.length,
      uploadedAt: new Date().toISOString(),
      hotelName: 'Reem Resort',
      roomTypeBreakdown: {}
    };
    
    roomTypesSet.forEach(type => {
      summary.roomTypeBreakdown[type] = roomsArray.filter(room => room.type === type).length;
    });
    
    await setDoc(doc(db, 'metadata', 'roomsUpload'), summary);
    
    console.log('\n🎉 Upload Complete!');
    console.log('==========================================');
    console.log(`✅ Successfully uploaded ${uploadedCount} rooms`);
    console.log(`✅ Successfully uploaded ${roomTypesArray.length} room types`);
    console.log(`🏨 Hotel: Reem Resort`);
    
    console.log('\n📊 Room Type Summary:');
    Object.entries(summary.roomTypeBreakdown).forEach(([type, count]) => {
      console.log(`   • ${type}: ${count} rooms`);
    });
    
    console.log('\n🔥 All your Reem Resort rooms are now live in Firestore!');
    
  } catch (error) {
    console.error('❌ Error uploading rooms:', error);
    if (error.message.includes('PERMISSION_DENIED')) {
      console.error('💡 Please update Firebase security rules to allow writes');
      console.error('💡 Go to Firebase Console → Firestore → Rules and update them');
    }
    process.exit(1);
  }
}

// Run the upload
uploadAllRoomsToFirestore();