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
    const roomsPath = path.join(__dirname, 'rooms.json');
    
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

async function uploadRoomsToFirestore() {
  try {
    console.log('🚀 Starting upload process...');
    
    // Read the rooms.json file
    const roomsFilePath = path.join(__dirname, 'src', 'data', 'rooms.json');
    const roomsData = JSON.parse(fs.readFileSync(roomsFilePath, 'utf8'));
    
    console.log(`📄 Found ${roomsData.rooms?.length || 0} rooms and ${roomsData.roomTypes?.length || 0} room types`);

    let uploadedRooms = 0;
    let uploadedRoomTypes = 0;
    let errors = [];

    // Upload room types first
    if (roomsData.roomTypes && roomsData.roomTypes.length > 0) {
      console.log('\n📝 Uploading room types...');
      
      for (const roomType of roomsData.roomTypes) {
        try {
          const docRef = doc(db, 'roomTypes', roomType.id);
          await setDoc(docRef, {
            ...roomType,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          });
          uploadedRoomTypes++;
          console.log(`✅ Room type uploaded: ${roomType.name} (${roomType.id})`);
        } catch (error) {
          const errorMsg = `❌ Error uploading room type ${roomType.id}: ${error.message}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }
    }

    // Upload rooms
    if (roomsData.rooms && roomsData.rooms.length > 0) {
      console.log('\n🏨 Uploading rooms...');
      
      for (const room of roomsData.rooms) {
        try {
          const docRef = doc(db, 'rooms', room.id);
          await setDoc(docRef, {
            ...room,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          });
          uploadedRooms++;
          console.log(`✅ Room uploaded: ${room.roomNumber} - ${room.type} (${room.id})`);
        } catch (error) {
          const errorMsg = `❌ Error uploading room ${room.id}: ${error.message}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }
    }

    // Summary
    console.log('\n📊 Upload Summary:');
    console.log(`✅ Room Types Uploaded: ${uploadedRoomTypes}/${roomsData.roomTypes?.length || 0}`);
    console.log(`✅ Rooms Uploaded: ${uploadedRooms}/${roomsData.rooms?.length || 0}`);
    
    if (errors.length > 0) {
      console.log(`❌ Errors: ${errors.length}`);
      errors.forEach(error => console.log(`   ${error}`));
    } else {
      console.log('🎉 All data uploaded successfully!');
    }

    // Optional: Create additional collections for the invoice system
    console.log('\n🔧 Setting up additional collections...');
    
    // Create a sample invoice collection structure
    const sampleInvoice = {
      id: 'SAMPLE_INVOICE',
      customerInfo: {
        name: 'Sample Customer',
        email: 'sample@example.com',
        phone: '+880123456789',
        nid: '1234567890123',
        address: 'Sample Address, Dhaka, Bangladesh'
      },
      items: [
        {
          roomId: roomsData.rooms?.[0]?.id || 'R001',
          roomNumber: roomsData.rooms?.[0]?.roomNumber || '101',
          checkInDate: '2025-01-15',
          checkOutDate: '2025-01-17',
          totalNights: 2,
          perNightCost: roomsData.rooms?.[0]?.pricePerNight || 2500,
          guestCount: 2,
          amount: (roomsData.rooms?.[0]?.pricePerNight || 2500) * 2
        }
      ],
      additionalCharges: [],
      payments: [],
      subtotal: (roomsData.rooms?.[0]?.pricePerNight || 2500) * 2,
      additionalTotal: 0,
      tax: ((roomsData.rooms?.[0]?.pricePerNight || 2500) * 2) * 0.1,
      taxRate: 10,
      total: ((roomsData.rooms?.[0]?.pricePerNight || 2500) * 2) * 1.1,
      totalPaid: 0,
      dueAmount: ((roomsData.rooms?.[0]?.pricePerNight || 2500) * 2) * 1.1,
      status: 'draft',
      invoiceDate: '2025-01-15',
      dueDate: '2025-01-30',
      adminName: 'System Admin',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    try {
      const invoiceRef = doc(db, 'invoices', 'SAMPLE_INVOICE');
      await setDoc(invoiceRef, sampleInvoice);
      console.log('✅ Sample invoice structure created');
    } catch (error) {
      console.log(`❌ Error creating sample invoice: ${error.message}`);
    }

    console.log('\n🎯 Setup Complete! Your Firestore database is ready for the invoice system.');
    console.log('\n📋 Collections created:');
    console.log('   • rooms - Hotel room data');
    console.log('   • roomTypes - Room type definitions');
    console.log('   • invoices - Invoice documents (with sample)');
    
    process.exit(0);

  } catch (error) {
    console.error('💥 Fatal error during upload:', error.message);
    process.exit(1);
  }
}

// Run the upload
uploadRoomsToFirestore();