// Script to add missing permissions to existing users in Firestore
// Run this in browser console on the Reem Resort application

(async function addMissingPermissions() {
    console.log('🔧 Adding Missing Permissions to Existing Users');
    console.log('================================================');
    
    try {
        // Import Firebase functions
        const { collection, getDocs, doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        // Try to get Firebase instances from the app
        let db;
        
        // Method 1: Check if Firebase is available globally
        if (window.firebase) {
            db = window.firebase.db;
        }
        
        // Method 2: Try accessing from modules
        if (!db && window.db) {
            db = window.db;
        }
        
        if (!db) {
            console.error('❌ Cannot access Firestore instance');
            console.log('Make sure you are running this on the Reem Resort application page');
            return;
        }
        
        // Define role permissions mapping
        const ROLE_PERMISSIONS = {
            'MasterAdmin': [
                'view_dashboard', 'view_analytics', 'create_invoice', 'view_invoices', 'edit_invoices', 'delete_invoices',
                'export_invoices', 'view_customers', 'create_customers', 'edit_customers', 'delete_customers',
                'view_rooms', 'create_rooms', 'edit_rooms', 'delete_rooms', 'upload_rooms', 'manage_room_inventory',
                'view_users', 'create_users', 'edit_users', 'delete_users', 'manage_roles', 'view_reports',
                'create_reports', 'export_reports', 'view_financial_reports', 'manage_settings', 'view_logs',
                'backup_data', 'restore_data', 'manage_billing', 'configure_taxes', 'manage_discounts',
                'access_api', 'view_audit_logs', 'manage_security', 'reset_passwords'
            ],
            'FullAdmin': [
                'view_dashboard', 'view_analytics', 'create_invoice', 'view_invoices', 'edit_invoices', 'delete_invoices',
                'export_invoices', 'view_customers', 'create_customers', 'edit_customers', 'delete_customers',
                'view_rooms', 'create_rooms', 'edit_rooms', 'delete_rooms', 'upload_rooms', 'manage_room_inventory',
                'view_reports', 'create_reports', 'export_reports', 'view_financial_reports', 'manage_billing',
                'configure_taxes', 'manage_discounts', 'access_api'
            ],
            'EditAdmin': [
                'view_dashboard', 'create_invoice', 'view_invoices', 'edit_invoices', 'export_invoices',
                'view_customers', 'create_customers', 'edit_customers', 'view_rooms', 'create_rooms', 'edit_rooms',
                'view_reports', 'create_reports', 'export_reports'
            ],
            'ViewAdmin': [
                'view_dashboard', 'view_invoices', 'view_customers', 'view_rooms', 'view_reports', 'export_reports'
            ],
            'FrontDesk': [
                'view_dashboard', 'create_invoice', 'view_invoices', 'edit_invoices', 'view_customers',
                'create_customers', 'edit_customers', 'view_rooms'
            ],
            // Legacy role mapping
            'admin': [
                'view_dashboard', 'view_analytics', 'create_invoice', 'view_invoices', 'edit_invoices', 'delete_invoices',
                'export_invoices', 'view_customers', 'create_customers', 'edit_customers', 'delete_customers',
                'view_rooms', 'create_rooms', 'edit_rooms', 'delete_rooms', 'upload_rooms', 'manage_room_inventory',
                'view_users', 'create_users', 'edit_users', 'delete_users', 'manage_roles', 'view_reports',
                'create_reports', 'export_reports', 'view_financial_reports', 'manage_settings', 'view_logs',
                'backup_data', 'restore_data', 'manage_billing', 'configure_taxes', 'manage_discounts',
                'access_api', 'view_audit_logs', 'manage_security', 'reset_passwords'
            ]
        };
        
        // Get all users from Firestore
        console.log('📋 Fetching all users from Firestore...');
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const users = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log(`👥 Found ${users.length} users`);
        
        let updated = 0;
        let skipped = 0;
        let errors = 0;
        
        for (const userData of users) {
            try {
                console.log(`\n👤 Processing user: ${userData.email || userData.name || userData.id}`);
                console.log(`   Role: ${userData.role || 'No role'}`);
                console.log(`   Has permissions: ${userData.permissions ? 'Yes' : 'No'}`);
                
                // Check if user needs permissions update
                const userRole = userData.role;
                const expectedPermissions = ROLE_PERMISSIONS[userRole];
                
                if (!userRole) {
                    console.log(`   ⚠️  User has no role assigned, skipping`);
                    skipped++;
                    continue;
                }
                
                if (!expectedPermissions) {
                    console.log(`   ⚠️  Unknown role '${userRole}', skipping`);
                    skipped++;
                    continue;
                }
                
                // Check if permissions are missing or different
                const needsUpdate = !userData.permissions || 
                                  !Array.isArray(userData.permissions) ||
                                  userData.permissions.length !== expectedPermissions.length ||
                                  !expectedPermissions.every(permission => userData.permissions.includes(permission));
                
                if (needsUpdate) {
                    console.log(`   🔧 Updating permissions for role: ${userRole}`);
                    console.log(`   📝 Adding ${expectedPermissions.length} permissions`);
                    
                    // Update user document with correct permissions
                    const userDocRef = doc(db, 'users', userData.id);
                    await updateDoc(userDocRef, {
                        permissions: expectedPermissions,
                        updatedAt: new Date().toISOString(),
                        updatedBy: 'permissions_migration_script',
                        permissionsUpdated: true
                    });
                    
                    console.log(`   ✅ Updated successfully`);
                    updated++;
                } else {
                    console.log(`   ✅ Permissions already correct, skipping`);
                    skipped++;
                }
                
            } catch (error) {
                console.error(`   ❌ Error updating user ${userData.email || userData.id}:`, error);
                errors++;
            }
        }
        
        console.log('\n🎉 Migration completed!');
        console.log('========================');
        console.log(`✅ Users updated: ${updated}`);
        console.log(`⏭️  Users skipped: ${skipped}`);
        console.log(`❌ Errors: ${errors}`);
        console.log(`👥 Total users: ${users.length}`);
        
        if (updated > 0) {
            console.log('\n🔄 Refresh the application to see the changes');
        }
        
    } catch (error) {
        console.error('❌ Error running permissions migration:', error);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Make sure you are on the Reem Resort application page');
        console.log('2. Check that Firebase is properly loaded');
        console.log('3. Make sure you have permission to access Firestore');
    }
})();

// Instructions:
console.log('📖 PERMISSIONS MIGRATION SCRIPT');
console.log('================================');
console.log('This script will:');
console.log('1. Find all users in Firestore');
console.log('2. Check if they have proper permissions for their role');
console.log('3. Add missing permissions based on their role');
console.log('4. Update the database with correct permissions');
console.log('');
console.log('💡 Safe to run multiple times - it will skip users who already have correct permissions');