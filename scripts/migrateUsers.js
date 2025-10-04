// Script to migrate users from old document structure to new UID-based structure
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

// Firebase config (replace with your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyA1lgNhs_MSTkMyA2nhRvi3vHf6KeHS-nE",
  authDomain: "invoice-reem-resort.firebaseapp.com",
  projectId: "invoice-reem-resort",
  storageBucket: "invoice-reem-resort.firebasestorage.app",
  messagingSenderId: "483324573465",
  appId: "1:483324573465:web:d668568deffec4ba94f788"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateUsers() {
  console.log('🔄 Starting user migration...');
  
  try {
    // Get all users from the collection
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.map(doc => ({
      docId: doc.id,
      ...doc.data()
    }));
    
    console.log(`📊 Found ${users.length} users to check`);
    
    let migrated = 0;
    let skipped = 0;
    
    for (const user of users) {
      // Check if document ID is not the same as UID
      if (user.docId !== user.uid) {
        console.log(`🔧 Migrating user: ${user.email} (${user.docId} → ${user.uid})`);
        
        // Create new document with UID as ID
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          role: user.role,
          name: user.name,
          createdAt: user.createdAt,
          updatedAt: new Date().toISOString(),
          createdBy: user.createdBy,
          status: user.status || 'active'
        });
        
        // Delete old document
        await deleteDoc(doc(db, 'users', user.docId));
        
        migrated++;
        console.log(`✅ Migrated user: ${user.email}`);
      } else {
        console.log(`⏭️ Skipping user: ${user.email} (already correct structure)`);
        skipped++;
      }
    }
    
    console.log(`✅ Migration complete!`);
    console.log(`📊 Migrated: ${migrated} users`);
    console.log(`📊 Skipped: ${skipped} users`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run migration
migrateUsers().then(() => {
  console.log('🎉 Migration script finished');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Migration script failed:', error);
  process.exit(1);
});