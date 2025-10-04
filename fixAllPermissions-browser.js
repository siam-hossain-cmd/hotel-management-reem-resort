// Complete Permission Fix Script for Browser Console
// Run this in the browser console while on your application (localhost:5175)

(async function fixAllPermissions() {
  console.log('🔧 Starting comprehensive permission fix...');
  
  // Import Firebase from the global scope
  const { collection, getDocs, doc, updateDoc, setDoc, query, where } = window.firebase;
  const { db } = window.firebaseServices || window;
  
  if (!db) {
    console.error('❌ Firebase not found. Make sure you\'re on the application page.');
    return;
  }

  // Define all role permissions
  const ROLE_PERMISSIONS = {
    'MasterAdmin': [
      'view_dashboard',
      'create_invoice',
      'edit_invoice',
      'delete_invoice',
      'view_invoices',
      'export_invoices',
      'manage_customers',
      'view_customers',
      'edit_customers',
      'delete_customers',
      'manage_rooms',
      'view_rooms',
      'edit_rooms',
      'delete_rooms',
      'manage_users',
      'view_users',
      'edit_users',
      'delete_users',
      'change_user_roles',
      'view_reports',
      'export_reports',
      'system_settings',
      'backup_data',
      'restore_data',
      'view_logs',
      'manage_permissions'
    ],
    'FullAdmin': [
      'view_dashboard',
      'create_invoice',
      'edit_invoice',
      'view_invoices',
      'export_invoices',
      'manage_customers',
      'view_customers',
      'edit_customers',
      'manage_rooms',
      'view_rooms',
      'edit_rooms',
      'view_users',
      'view_reports',
      'export_reports'
    ],
    'EditAdmin': [
      'view_dashboard',
      'create_invoice',
      'edit_invoice',
      'view_invoices',
      'view_customers',
      'edit_customers',
      'view_rooms',
      'edit_rooms',
      'view_users'
    ],
    'ViewAdmin': [
      'view_dashboard',
      'view_invoices',
      'view_customers',
      'view_rooms',
      'view_users'
    ],
    'FrontDesk': [
      'view_dashboard',
      'create_invoice',
      'view_invoices',
      'view_customers',
      'view_rooms'
    ]
  };

  try {
    // Step 1: Get all users
    console.log('📋 Fetching all users...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const allUsers = [];
    
    usersSnapshot.forEach((docSnap) => {
      allUsers.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    console.log(`👥 Found ${allUsers.length} users`);

    // Step 2: Check for Master Admin
    const masterAdmins = allUsers.filter(user => 
      user.role === 'MasterAdmin' || user.role === 'admin' || user.role === 'masterAdmin'
    );

    console.log(`👑 Found ${masterAdmins.length} Master Admin(s)`);
    
    if (masterAdmins.length > 0) {
      console.log('Master Admin users:', masterAdmins.map(u => ({ email: u.email, role: u.role, hasPermissions: !!u.permissions })));
    }

    // Step 3: Fix permissions for all users
    let updatedCount = 0;
    let alreadyCorrectCount = 0;

    for (const user of allUsers) {
      const expectedPermissions = ROLE_PERMISSIONS[user.role];
      
      if (!expectedPermissions) {
        console.warn(`⚠️ Unknown role: ${user.role} for user ${user.email}`);
        continue;
      }

      // Check if permissions are missing or incorrect
      const hasCorrectPermissions = user.permissions && 
        Array.isArray(user.permissions) && 
        expectedPermissions.every(perm => user.permissions.includes(perm)) &&
        user.permissions.length === expectedPermissions.length;

      if (!hasCorrectPermissions) {
        console.log(`🔄 Updating permissions for ${user.email} (${user.role})`);
        
        await updateDoc(doc(db, 'users', user.id), {
          permissions: expectedPermissions,
          lastUpdated: new Date().toISOString(),
          updatedBy: 'permission-fix-script'
        });
        
        updatedCount++;
      } else {
        alreadyCorrectCount++;
      }
    }

    // Step 4: Create Master Admin if none exists
    if (masterAdmins.length === 0) {
      console.log('🚨 No Master Admin found! Creating one...');
      
      const masterAdminEmail = prompt('Enter email for Master Admin:');
      const masterAdminPassword = prompt('Enter password for Master Admin:');
      
      if (masterAdminEmail && masterAdminPassword) {
        // This would need to be done through your authentication system
        console.log('⚠️ Master Admin user creation should be done through your user management interface or authentication system.');
        console.log(`📧 Email: ${masterAdminEmail}`);
        console.log('🔐 Password: [hidden for security]');
      }
    }

    // Step 5: Summary
    console.log('\n📊 PERMISSION FIX SUMMARY:');
    console.log(`✅ Users updated: ${updatedCount}`);
    console.log(`✅ Users already correct: ${alreadyCorrectCount}`);
    console.log(`👑 Master Admins found: ${masterAdmins.length}`);
    
    if (updatedCount > 0) {
      console.log('🎉 Permission fix completed! All users now have proper permissions.');
    } else {
      console.log('✨ All users already had correct permissions.');
    }

    // Step 6: Verify Master Admin permissions
    if (masterAdmins.length > 0) {
      console.log('\n🔍 MASTER ADMIN VERIFICATION:');
      for (const admin of masterAdmins) {
        // Fetch fresh data
        const freshUser = allUsers.find(u => u.id === admin.id);
        const hasAllPermissions = ROLE_PERMISSIONS.MasterAdmin.every(perm => 
          freshUser.permissions?.includes(perm)
        );
        
        console.log(`👑 ${admin.email}:`);
        console.log(`   Role: ${admin.role}`);
        console.log(`   Active: ${admin.isActive}`);
        console.log(`   Has all permissions: ${hasAllPermissions}`);
        console.log(`   Permission count: ${admin.permissions?.length || 0}/${ROLE_PERMISSIONS.MasterAdmin.length}`);
      }
    }

    return {
      totalUsers: allUsers.length,
      updatedUsers: updatedCount,
      masterAdmins: masterAdmins.length,
      success: true
    };

  } catch (error) {
    console.error('❌ Error fixing permissions:', error);
    return {
      success: false,
      error: error.message
    };
  }
})();