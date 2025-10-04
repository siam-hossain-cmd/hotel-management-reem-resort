// Script to fix user role in Firestore
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';

// Firebase config (use your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyAKD8aUKSj6cPP8jjdZUlI0VG9A_uYaFvo",
  authDomain: "reem-resort-invoice.firebaseapp.com",
  projectId: "reem-resort-invoice",
  storageBucket: "reem-resort-invoice.firebasestorage.app",
  messagingSenderId: "970079718698",
  appId: "1:970079718698:web:d6b7ae0b9a9e7a7f8bd35a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixUserRole() {
  try {
    console.log('🔧 Starting user role fix...');
    
    // Query for users with email masteradmin@reemresort.com
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', 'masteradmin@reemresort.com'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('❌ No user found with email masteradmin@reemresort.com');
      return;
    }
    
    // Update each matching user
    for (const docSnapshot of querySnapshot.docs) {
      const userData = docSnapshot.data();
      console.log('👤 Found user:', userData);
      
      if (userData.role !== 'MasterAdmin') {
        console.log('🔄 Updating user role from', userData.role, 'to MasterAdmin');
        
        await updateDoc(doc(db, 'users', docSnapshot.id), {
          role: 'MasterAdmin',
          updatedAt: new Date().toISOString()
        });
        
        console.log('✅ User role updated successfully!');
      } else {
        console.log('✅ User already has correct role');
      }
    }
    
  } catch (error) {
    console.error('❌ Error fixing user role:', error);
  }
}

// Run the fix
fixUserRole().then(() => {
  console.log('🎉 User role fix completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});