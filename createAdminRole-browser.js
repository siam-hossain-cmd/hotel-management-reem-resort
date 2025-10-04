// Browser Console Script to Create MasterAdmin Role
// Copy and paste this into your browser's console while on the Reem Resort application

(async function createAdminRole() {
    console.log('🚀 Creating MasterAdmin Role for admin@reemresort.com');
    console.log('===================================================');
    
    try {
        // Import Firebase functions
        const { doc, setDoc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const { getAuth, getUserByEmail } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        
        // Try to get Firebase instances from the app
        let auth, db;
        
        // Method 1: Check if Firebase is available globally
        if (window.firebase) {
            auth = window.firebase.auth;
            db = window.firebase.db;
        }
        
        // Method 2: Try accessing from modules
        if (!auth && window.auth) {
            auth = window.auth;
            db = window.db;
        }
        
        // Method 3: Try to import from the app's Firebase config
        if (!auth) {
            try {
                const firebaseModule = await import('./src/firebase/config.js');
                auth = firebaseModule.auth;
                db = firebaseModule.db;
            } catch (e) {
                console.log('Could not import from config, trying alternative...');
            }
        }
        
        if (!auth || !db) {
            console.error('❌ Cannot access Firebase Auth or Firestore instances');
            console.log('Make sure you are running this on the Reem Resort application page');
            console.log('Alternative: Use the createAdminRole.js script with Firebase Admin SDK');
            return;
        }

        // Define Master Admin permissions
        const masterAdminPermissions = [
            'view_dashboard', 'view_analytics', 'create_invoice', 'view_invoices', 'edit_invoices', 'delete_invoices',
            'export_invoices', 'view_customers', 'create_customers', 'edit_customers', 'delete_customers',
            'view_rooms', 'create_rooms', 'edit_rooms', 'delete_rooms', 'upload_rooms', 'manage_room_inventory',
            'view_users', 'create_users', 'edit_users', 'delete_users', 'manage_roles', 'view_reports',
            'create_reports', 'export_reports', 'view_financial_reports', 'manage_settings', 'view_logs',
            'backup_data', 'restore_data', 'manage_billing', 'configure_taxes', 'manage_discounts',
            'access_api', 'view_audit_logs', 'manage_security', 'reset_passwords'
        ];
        
        const adminEmail = 'admin@reemresort.com';
        const adminData = {
            email: adminEmail,
            name: 'Master Administrator',
            role: 'MasterAdmin',
            permissions: masterAdminPermissions, // Add permissions array
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'browser_console_script',
            status: 'active',
            lastLogin: null,
            loginCount: 0
        };
        
        console.log(`📧 Processing admin user: ${adminEmail}`);
        
        // Since we can't get Firebase Auth UID from email in client-side code,
        // we'll create the document with a known pattern or use the current user's UID
        
        // Method 1: If user is currently logged in, use their UID
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.email === adminEmail) {
            console.log(`✅ Found current user: ${currentUser.email}`);
            console.log(`🆔 UID: ${currentUser.uid}`);
            
            const userDocRef = doc(db, 'users', currentUser.uid);
            
            // Check if document exists
            const docSnap = await getDoc(userDocRef);
            
            if (docSnap.exists()) {
                console.log('📝 User profile exists. Updating role...');
                await setDoc(userDocRef, {
                    ...docSnap.data(),
                    role: 'MasterAdmin',
                    permissions: masterAdminPermissions, // Add permissions array
                    updatedAt: new Date().toISOString(),
                    updatedBy: 'browser_console_script'
                }, { merge: true });
            } else {
                console.log('📝 Creating new user profile...');
                await setDoc(userDocRef, adminData);
            }
            
            console.log('✅ MasterAdmin role assigned successfully!');
            console.log('📋 User Details:');
            console.log(`   Email: ${adminEmail}`);
            console.log(`   Role: MasterAdmin`);
            console.log(`   UID: ${currentUser.uid}`);
            
        } else {
            // Method 2: Create with email-based document ID
            console.log('⚠️  Current user is not the admin user');
            console.log('📝 Creating user profile with email-based ID...');
            
            // Create a safe document ID from email
            const docId = adminEmail.replace(/@/g, '_at_').replace(/\./g, '_dot_');
            const userDocRef = doc(db, 'users', docId);
            
            await setDoc(userDocRef, {
                ...adminData,
                documentId: docId,
                note: 'Created with email-based ID. Update with actual UID when user logs in.'
            });
            
            console.log('✅ User profile created with email-based ID');
            console.log('📋 Profile Details:');
            console.log(`   Email: ${adminEmail}`);
            console.log(`   Role: MasterAdmin`);
            console.log(`   Document ID: ${docId}`);
            console.log('');
            console.log('⚠️  Note: This creates a temporary profile.');
            console.log('   The user should log in to create the proper UID-based profile.');
        }
        
        console.log('');
        console.log('🎉 Admin role assignment completed!');
        console.log('');
        console.log('Next steps:');
        console.log('1. The user can now login with admin@reemresort.com');
        console.log('2. They will have full MasterAdmin privileges');
        console.log('3. If using email-based ID, the profile will be recreated with proper UID on first login');
        
    } catch (error) {
        console.error('❌ Error creating admin role:', error);
        console.log('');
        console.log('🔧 Troubleshooting:');
        console.log('1. Make sure you are on the Reem Resort application page');
        console.log('2. Check that Firebase is properly loaded');
        console.log('3. Try logging in as the admin user first, then run this script');
        console.log('4. Alternative: Use the Node.js script with Firebase Admin SDK');
    }
})();

// Instructions for use:
console.log('📖 INSTRUCTIONS:');
console.log('================');
console.log('1. Open the Reem Resort application in your browser');
console.log('2. Open Developer Tools (F12)');
console.log('3. Go to Console tab');
console.log('4. Copy and paste this entire script');
console.log('5. Press Enter to execute');
console.log('');
console.log('💡 TIP: If you get Firebase access errors, try:');
console.log('   - Log in as admin@reemresort.com first');
console.log('   - Or use the Node.js script: npm run create-admin');