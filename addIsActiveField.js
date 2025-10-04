#!/usr/bin/env node

// Add isActive field to existing users who don't have it
// This script updates existing user documents to include the isActive field

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// Firebase configuration - same as in your config.js
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

async function addIsActiveField() {
  try {
    console.log('🔍 Scanning all users for missing isActive field...');
    
    // Get all users
    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    
    if (usersSnapshot.empty) {
      console.log('📭 No users found in Firestore');
      return;
    }
    
    console.log(`👥 Found ${usersSnapshot.size} users`);
    
    let updatedCount = 0;
    let alreadyHasField = 0;
    
    // Process each user
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      console.log(`\n📋 Checking user: ${userData.email || 'No email'}`);
      console.log(`   Role: ${userData.role || 'No role'}`);
      console.log(`   Current isActive: ${userData.isActive !== undefined ? userData.isActive : 'MISSING'}`);
      
      // Check if isActive field is missing or undefined
      if (userData.isActive === undefined) {
        console.log(`   ➕ Adding isActive field...`);
        
        // Default to true for admin roles, false for others
        const defaultActive = ['MasterAdmin', 'FullAdmin', 'admin', 'masterAdmin'].includes(userData.role);
        
        await updateDoc(doc(db, 'users', userId), {
          isActive: defaultActive,
          lastUpdated: new Date().toISOString(),
          updatedBy: 'isActive-field-script'
        });
        
        console.log(`   ✅ Set isActive: ${defaultActive}`);
        updatedCount++;
        
      } else {
        console.log(`   ✅ Already has isActive field`);
        alreadyHasField++;
      }
    }
    
    console.log('\n📊 SUMMARY:');
    console.log(`✅ Users updated: ${updatedCount}`);
    console.log(`✅ Users already had field: ${alreadyHasField}`);
    console.log(`📝 Total users processed: ${usersSnapshot.size}`);
    
    if (updatedCount > 0) {
      console.log('\n🎉 SUCCESS! All users now have isActive field');
      console.log('🔄 Users may need to refresh their browsers to see changes');
    } else {
      console.log('\n✨ All users already had the isActive field');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error adding isActive field:', error);
    process.exit(1);
  }
}

// Run the script
console.log('🔥 Firebase isActive Field Addition Script');
console.log('==========================================\n');

addIsActiveField();