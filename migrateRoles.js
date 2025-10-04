#!/usr/bin/env node

// Role Migration Script
// This script updates the role structure:
// 1. Remove ViewAdmin role
// 2. Rename EditAdmin to Admin 
// 3. Update FrontDesk permissions

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

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

// New role permissions
const NEW_ROLE_PERMISSIONS = {
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
  'Admin': [ // New Admin role (formerly EditAdmin)
    'view_dashboard', 'create_invoice', 'view_invoices', 'edit_invoices', 'export_invoices',
    'view_customers', 'create_customers', 'edit_customers', 'view_rooms', 'create_rooms',
    'edit_rooms', 'view_reports', 'create_reports', 'export_reports',
    'canViewInvoices', 'canViewCustomers', 'canCreateInvoices', 'canEditInvoices', 'canEditCustomers'
  ],
  'FrontDesk': [ // Updated FrontDesk - view only, no create/edit/delete
    'view_dashboard', 'view_invoices', 'view_customers', 'view_rooms', 'view_reports',
    'canViewInvoices', 'canViewCustomers'
  ]
};

async function migrateRoles() {
  try {
    console.log('🔄 Starting role migration...');
    console.log('📋 Changes:');
    console.log('   • Remove ViewAdmin role');
    console.log('   • Rename EditAdmin → Admin');
    console.log('   • Update FrontDesk permissions (view only)');
    
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    if (usersSnapshot.empty) {
      console.log('📭 No users found');
      return;
    }
    
    console.log(`\n👥 Found ${usersSnapshot.size} users to process\n`);
    
    let migratedCount = 0;
    let deletedCount = 0;
    let updatedCount = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      console.log(`📋 Processing: ${userData.email || 'No email'}`);
      console.log(`   Current role: ${userData.role}`);
      
      if (userData.role === 'ViewAdmin') {
        // Option 1: Delete ViewAdmin users
        console.log('   ❌ ViewAdmin role being removed - CONVERTING TO FRONT DESK');
        
        await updateDoc(doc(db, 'users', userId), {
          role: 'FrontDesk',
          permissions: NEW_ROLE_PERMISSIONS['FrontDesk'],
          lastUpdated: new Date().toISOString(),
          updatedBy: 'role-migration-script',
          migrationNote: 'Converted from ViewAdmin to FrontDesk'
        });
        
        console.log('   ✅ Converted ViewAdmin → FrontDesk');
        migratedCount++;
        
      } else if (userData.role === 'EditAdmin') {
        // Rename EditAdmin to Admin
        console.log('   🔄 Renaming EditAdmin → Admin');
        
        await updateDoc(doc(db, 'users', userId), {
          role: 'Admin',
          permissions: NEW_ROLE_PERMISSIONS['Admin'],
          lastUpdated: new Date().toISOString(),
          updatedBy: 'role-migration-script',
          migrationNote: 'Renamed from EditAdmin to Admin'
        });
        
        console.log('   ✅ Renamed EditAdmin → Admin');
        migratedCount++;
        
      } else if (userData.role === 'FrontDesk') {
        // Update FrontDesk permissions
        console.log('   🔄 Updating FrontDesk permissions (view only)');
        
        await updateDoc(doc(db, 'users', userId), {
          permissions: NEW_ROLE_PERMISSIONS['FrontDesk'],
          lastUpdated: new Date().toISOString(),
          updatedBy: 'role-migration-script',
          migrationNote: 'Updated to view-only permissions'
        });
        
        console.log('   ✅ Updated FrontDesk permissions');
        updatedCount++;
        
      } else if (['MasterAdmin', 'FullAdmin'].includes(userData.role)) {
        // Update permissions for existing admin roles
        console.log(`   🔄 Updating ${userData.role} permissions`);
        
        await updateDoc(doc(db, 'users', userId), {
          permissions: NEW_ROLE_PERMISSIONS[userData.role],
          lastUpdated: new Date().toISOString(),
          updatedBy: 'role-migration-script'
        });
        
        console.log(`   ✅ Updated ${userData.role} permissions`);
        updatedCount++;
        
      } else {
        console.log('   ➡️ Unknown role, skipping');
      }
      
      console.log(''); // Empty line for readability
    }
    
    console.log('📊 MIGRATION SUMMARY:');
    console.log(`✅ Role migrations: ${migratedCount}`);
    console.log(`✅ Permission updates: ${updatedCount}`);
    console.log(`📝 Total users processed: ${usersSnapshot.size}`);
    
    console.log('\n🎉 Role migration completed!');
    console.log('\n📋 New Role Structure:');
    console.log('   • MasterAdmin - Full system access');
    console.log('   • FullAdmin - Full admin except user management'); 
    console.log('   • Admin - Create/edit access (formerly EditAdmin)');
    console.log('   • FrontDesk - View only access');
    console.log('\n🔄 Users should logout and login again to see changes');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error during role migration:', error);
    process.exit(1);
  }
}

// Run the script
console.log('🔥 Role Structure Migration Script');
console.log('==================================\n');

migrateRoles();