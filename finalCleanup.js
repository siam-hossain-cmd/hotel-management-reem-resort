#!/usr/bin/env node

// Final cleanup script to ensure all EditAdmin and ViewAdmin references are removed
// and verify the new role structure is working properly

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

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

// Final role permissions (cleaned up)
const FINAL_ROLE_PERMISSIONS = {
  'MasterAdmin': [
    'view_dashboard', 'view_analytics', 'create_invoice', 'view_invoices', 'edit_invoices',
    'delete_invoices', 'export_invoices', 'view_customers', 'create_customers', 'edit_customers',
    'delete_customers', 'view_rooms', 'create_rooms', 'edit_rooms', 'delete_rooms',
    'upload_rooms', 'manage_room_inventory', 'view_users', 'create_users', 'edit_users',
    'delete_users', 'manage_roles', 'view_reports', 'create_reports', 'export_reports',
    'view_financial_reports', 'manage_settings', 'view_logs', 'backup_data', 'restore_data',
    'manage_billing', 'configure_taxes', 'manage_discounts', 'access_api', 'view_audit_logs',
    'manage_security', 'reset_passwords',
    'canViewInvoices', 'canViewCustomers', 'canCreateInvoices', 'canEditInvoices', 'canEditCustomers'
  ],
  'FullAdmin': [
    'view_dashboard', 'view_analytics', 'create_invoice', 'view_invoices', 'edit_invoices',
    'delete_invoices', 'export_invoices', 'view_customers', 'create_customers', 'edit_customers',
    'delete_customers', 'view_rooms', 'create_rooms', 'edit_rooms', 'delete_rooms',
    'upload_rooms', 'manage_room_inventory', 'view_users', 'view_reports', 'create_reports',
    'export_reports', 'view_financial_reports', 'manage_billing', 'configure_taxes', 'manage_discounts',
    'canViewInvoices', 'canViewCustomers', 'canCreateInvoices', 'canEditInvoices', 'canEditCustomers'
  ],
  'Admin': [
    'view_dashboard', 'create_invoice', 'view_invoices', 'edit_invoices', 'export_invoices',
    'view_customers', 'create_customers', 'edit_customers', 'view_rooms', 'create_rooms',
    'edit_rooms', 'view_reports', 'create_reports', 'export_reports',
    'canViewInvoices', 'canViewCustomers', 'canCreateInvoices', 'canEditInvoices', 'canEditCustomers'
  ],
  'FrontDesk': [
    'view_dashboard', 'view_invoices', 'view_customers', 'view_rooms', 'view_reports',
    'canViewInvoices', 'canViewCustomers'
  ]
};

async function finalCleanup() {
  try {
    console.log('🧹 Starting final cleanup and verification...');
    
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    if (usersSnapshot.empty) {
      console.log('📭 No users found');
      return;
    }
    
    console.log(`\n👥 Found ${usersSnapshot.size} users\n`);
    
    let cleanedCount = 0;
    let errorCount = 0;
    const roleStats = {
      'MasterAdmin': 0,
      'FullAdmin': 0,
      'Admin': 0,
      'FrontDesk': 0,
      'Unknown': 0
    };
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      console.log(`📋 Processing: ${userData.email || 'No email'}`);
      console.log(`   Current role: ${userData.role}`);
      
      // Check for old role names and convert them
      let newRole = userData.role;
      let needsUpdate = false;
      
      if (userData.role === 'EditAdmin') {
        newRole = 'Admin';
        needsUpdate = true;
        console.log('   🔄 Converting EditAdmin → Admin');
      } else if (userData.role === 'ViewAdmin') {
        newRole = 'FrontDesk';
        needsUpdate = true;
        console.log('   🔄 Converting ViewAdmin → FrontDesk');
      }
      
      // Verify permissions are correct for the role
      const expectedPermissions = FINAL_ROLE_PERMISSIONS[newRole];
      if (!expectedPermissions) {
        console.log(`   ⚠️ Unknown role: ${newRole}`);
        roleStats['Unknown']++;
        errorCount++;
        continue;
      }
      
      const hasCorrectPermissions = userData.permissions && 
        Array.isArray(userData.permissions) && 
        expectedPermissions.every(perm => userData.permissions.includes(perm)) &&
        userData.permissions.length === expectedPermissions.length;
      
      if (needsUpdate || !hasCorrectPermissions) {
        console.log(`   💾 Updating user...`);
        
        await updateDoc(doc(db, 'users', userId), {
          role: newRole,
          permissions: expectedPermissions,
          isActive: true,
          lastUpdated: new Date().toISOString(),
          updatedBy: 'final-cleanup-script'
        });
        
        console.log(`   ✅ Updated to ${newRole} with ${expectedPermissions.length} permissions`);
        cleanedCount++;
      } else {
        console.log(`   ✅ Already correct`);
      }
      
      roleStats[newRole] = (roleStats[newRole] || 0) + 1;
      console.log(''); // Empty line for readability
    }
    
    console.log('📊 FINAL CLEANUP SUMMARY:');
    console.log(`✅ Users cleaned up: ${cleanedCount}`);
    console.log(`❌ Errors encountered: ${errorCount}`);
    console.log(`📝 Total users processed: ${usersSnapshot.size}`);
    
    console.log('\n📋 ROLE DISTRIBUTION:');
    Object.entries(roleStats).forEach(([role, count]) => {
      if (count > 0) {
        console.log(`   ${role}: ${count} user(s)`);
      }
    });
    
    console.log('\n🎉 Final cleanup completed!');
    console.log('\n📋 CURRENT ROLE STRUCTURE:');
    console.log('   • MasterAdmin - Full system access + user management');
    console.log('   • FullAdmin - Full access except user management');
    console.log('   • Admin - Create/edit invoices, customers, rooms (formerly EditAdmin)');
    console.log('   • FrontDesk - View only access (cannot create/edit/delete)');
    
    console.log('\n✅ OLD ROLES COMPLETELY REMOVED:');
    console.log('   ❌ EditAdmin (converted to Admin)');
    console.log('   ❌ ViewAdmin (converted to FrontDesk)');
    
    console.log('\n🔄 Users should logout and login to see the changes');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error during final cleanup:', error);
    process.exit(1);
  }
}

// Run the script
console.log('🔥 Final Role Cleanup & Verification Script');
console.log('==========================================\n');

finalCleanup();