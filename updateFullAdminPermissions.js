#!/usr/bin/env node

// Update FullAdmin permissions script
// This script ensures FullAdmin users have the correct permissions in Firestore

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';

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

// FullAdmin permissions - matches AuthContext.jsx
const FULL_ADMIN_PERMISSIONS = [
  'view_dashboard',
  'view_analytics',
  'create_invoice',
  'view_invoices',
  'edit_invoices',
  'delete_invoices',
  'export_invoices',
  'view_customers',
  'create_customers',
  'edit_customers',
  'delete_customers',
  'view_rooms',
  'create_rooms',
  'edit_rooms',
  'delete_rooms',
  'upload_rooms',
  'manage_room_inventory',
  'view_users',
  'view_reports',
  'create_reports',
  'export_reports',
  'view_financial_reports',
  'manage_billing',
  'configure_taxes',
  'manage_discounts'
];

async function updateFullAdminPermissions() {
  try {
    console.log('🔧 Updating FullAdmin permissions...');
    
    // Find all FullAdmin users
    const usersQuery = query(collection(db, 'users'), where('role', '==', 'FullAdmin'));
    const snapshot = await getDocs(usersQuery);
    
    if (snapshot.empty) {
      console.log('📭 No FullAdmin users found');
      return;
    }
    
    console.log(`👥 Found ${snapshot.size} FullAdmin user(s)`);
    
    let updatedCount = 0;
    
    for (const userDoc of snapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      console.log(`\n📋 Processing FullAdmin: ${userData.email}`);
      console.log(`   Current permissions: ${userData.permissions?.length || 0}/${FULL_ADMIN_PERMISSIONS.length}`);
      console.log(`   isActive: ${userData.isActive}`);
      
      // Check if permissions are correct
      const hasCorrectPermissions = userData.permissions && 
        Array.isArray(userData.permissions) && 
        FULL_ADMIN_PERMISSIONS.every(perm => userData.permissions.includes(perm)) &&
        userData.permissions.length === FULL_ADMIN_PERMISSIONS.length;
      
      if (!hasCorrectPermissions) {
        console.log(`   ➕ Updating permissions...`);
        
        await updateDoc(doc(db, 'users', userId), {
          permissions: FULL_ADMIN_PERMISSIONS,
          isActive: true, // Ensure FullAdmin is active
          lastUpdated: new Date().toISOString(),
          updatedBy: 'fulladmin-permissions-fix'
        });
        
        console.log(`   ✅ Updated with ${FULL_ADMIN_PERMISSIONS.length} permissions`);
        updatedCount++;
        
        // Log specific permissions that matter for this issue
        console.log(`   📋 Key permissions added:`);
        console.log(`      - view_invoices: ✅`);
        console.log(`      - view_customers: ✅`);
        console.log(`      - create_invoice: ✅`);
        console.log(`      - edit_invoices: ✅`);
        console.log(`      - edit_customers: ✅`);
        
      } else {
        console.log(`   ✅ Already has correct permissions`);
      }
    }
    
    console.log('\n📊 SUMMARY:');
    console.log(`✅ FullAdmin users updated: ${updatedCount}`);
    console.log(`📝 Total FullAdmin users: ${snapshot.size}`);
    
    if (updatedCount > 0) {
      console.log('\n🎉 SUCCESS! FullAdmin permissions updated');
      console.log('🔄 Users should refresh their browsers to see invoice and customer access');
      console.log('\n📋 FullAdmin users now have access to:');
      console.log('   • View Invoices');
      console.log('   • Create Invoices');
      console.log('   • Edit Invoices');
      console.log('   • View Customers');
      console.log('   • Create Customers');
      console.log('   • Edit Customers');
      console.log('   • View/Edit Rooms');
      console.log('   • View Reports');
    } else {
      console.log('\n✨ All FullAdmin users already had correct permissions');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error updating FullAdmin permissions:', error);
    process.exit(1);
  }
}

// Run the script
console.log('🔥 FullAdmin Permissions Update Script');
console.log('=====================================\n');

updateFullAdminPermissions();