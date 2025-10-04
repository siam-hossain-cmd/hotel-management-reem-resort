#!/usr/bin/env node

// Fix FullAdmin canViewCustomers Permission Issue
// This script specifically fixes the permission mapping issue for FullAdmin users

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

// Updated FullAdmin permissions - ensuring ALL necessary permissions are included
const FULL_ADMIN_PERMISSIONS = [
  // Dashboard
  'view_dashboard',
  'view_analytics',
  
  // Invoice permissions (canViewInvoices, canCreateInvoices, etc.)
  'create_invoice',
  'view_invoices',
  'edit_invoices',
  'delete_invoices',
  'export_invoices',
  
  // Customer permissions (canViewCustomers, canEditCustomers, etc.)
  'view_customers',
  'create_customers',
  'edit_customers',
  'delete_customers',
  
  // Room permissions
  'view_rooms',
  'create_rooms',
  'edit_rooms',
  'delete_rooms',
  'upload_rooms',
  'manage_room_inventory',
  
  // User permissions (limited for FullAdmin)
  'view_users',
  
  // Report permissions
  'view_reports',
  'create_reports',
  'export_reports',
  'view_financial_reports',
  
  // Additional business permissions
  'manage_billing',
  'configure_taxes',
  'manage_discounts',
  
  // These are the EXACT permission strings that AuthContext checks for
  'canViewInvoices',
  'canViewCustomers',
  'canCreateInvoices',
  'canEditInvoices',
  'canEditCustomers',
  'canViewRooms',
  'canEditRooms'
];

async function fixFullAdminPermissions() {
  try {
    console.log('🔧 Fixing FullAdmin canViewCustomers permission issue...');
    
    // Find the specific FullAdmin user (siam2@gmail.com)
    const usersQuery = query(collection(db, 'users'), where('email', '==', 'siam2@gmail.com'));
    const snapshot = await getDocs(usersQuery);
    
    if (snapshot.empty) {
      console.log('❌ FullAdmin user siam2@gmail.com not found');
      return;
    }
    
    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;
    
    console.log(`\n📋 Found FullAdmin user: ${userData.email}`);
    console.log(`   Role: ${userData.role}`);
    console.log(`   isActive: ${userData.isActive}`);
    console.log(`   Current permissions: ${userData.permissions?.length || 0}`);
    
    // Check specific permissions that are failing
    const currentPermissions = userData.permissions || [];
    const missingPermissions = FULL_ADMIN_PERMISSIONS.filter(perm => !currentPermissions.includes(perm));
    
    console.log('\n🔍 Permission Analysis:');
    console.log(`   canViewCustomers in current permissions: ${currentPermissions.includes('canViewCustomers') ? '✅' : '❌'}`);
    console.log(`   view_customers in current permissions: ${currentPermissions.includes('view_customers') ? '✅' : '❌'}`);
    console.log(`   canViewInvoices in current permissions: ${currentPermissions.includes('canViewInvoices') ? '✅' : '❌'}`);
    console.log(`   view_invoices in current permissions: ${currentPermissions.includes('view_invoices') ? '✅' : '❌'}`);
    
    if (missingPermissions.length > 0) {
      console.log(`\n⚠️ Missing ${missingPermissions.length} permissions:`);
      missingPermissions.forEach(perm => console.log(`   - ${perm}`));
    }
    
    console.log(`\n💾 Updating user with comprehensive permissions...`);
    
    // Update with the complete permission set
    await updateDoc(doc(db, 'users', userId), {
      permissions: FULL_ADMIN_PERMISSIONS,
      isActive: true,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'fulladmin-canViewCustomers-fix',
      role: 'FullAdmin' // Ensure role is correct
    });
    
    console.log(`✅ Updated user permissions (${FULL_ADMIN_PERMISSIONS.length} total)`);
    
    // Verify the update
    const verifyQuery = query(collection(db, 'users'), where('email', '==', 'siam2@gmail.com'));
    const verifySnapshot = await getDocs(verifyQuery);
    const verifiedData = verifySnapshot.docs[0].data();
    
    console.log('\n✅ VERIFICATION:');
    console.log(`   canViewCustomers: ${verifiedData.permissions?.includes('canViewCustomers') ? '✅' : '❌'}`);
    console.log(`   view_customers: ${verifiedData.permissions?.includes('view_customers') ? '✅' : '❌'}`);
    console.log(`   canViewInvoices: ${verifiedData.permissions?.includes('canViewInvoices') ? '✅' : '❌'}`);
    console.log(`   view_invoices: ${verifiedData.permissions?.includes('view_invoices') ? '✅' : '❌'}`);
    console.log(`   Total permissions: ${verifiedData.permissions?.length}`);
    
    console.log('\n🎉 SUCCESS! FullAdmin permissions fixed');
    console.log('📋 Next steps:');
    console.log('   1. User should logout and login again');
    console.log('   2. Clear browser cache if needed');
    console.log('   3. Try accessing /customers and /invoices pages');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error fixing FullAdmin permissions:', error);
    process.exit(1);
  }
}

// Run the script
console.log('🔥 FullAdmin canViewCustomers Permission Fix');
console.log('===========================================\n');

fixFullAdminPermissions();