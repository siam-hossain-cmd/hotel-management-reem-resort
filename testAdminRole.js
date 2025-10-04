// Simple Admin Role Test Script
// This tests if the admin user can login and gets the proper role

(async function testAdminLogin() {
    console.log('🧪 Testing Admin Login and Role Assignment');
    console.log('==========================================');
    
    try {
        // Get the current page's authService if available
        if (window.authService) {
            console.log('✅ Found authService');
            
            const adminEmail = 'admin@reemresort.com';
            const adminPassword = 'admin123';
            
            console.log(`🔐 Testing login for: ${adminEmail}`);
            
            const result = await window.authService.signIn(adminEmail, adminPassword);
            
            if (result.success) {
                console.log('✅ Login successful!');
                
                // Check user data
                const currentUser = window.authService.getCurrentUser();
                if (currentUser) {
                    console.log('👤 User Details:');
                    console.log(`   Email: ${currentUser.email}`);
                    console.log(`   Role: ${currentUser.role}`);
                    console.log(`   Name: ${currentUser.name}`);
                    console.log(`   UID: ${currentUser.uid}`);
                    
                    if (currentUser.role === 'MasterAdmin') {
                        console.log('🎉 SUCCESS! User has MasterAdmin role');
                        console.log('✅ Admin role assignment is working correctly');
                    } else {
                        console.log('⚠️  User role is not MasterAdmin');
                        console.log('   Expected: MasterAdmin');
                        console.log(`   Actual: ${currentUser.role}`);
                    }
                } else {
                    console.log('⚠️  Could not get current user data');
                }
                
                // Check permissions
                console.log('');
                console.log('🔒 Permission Check:');
                console.log(`   Is Master Admin: ${window.authService.isMasterAdmin()}`);
                console.log(`   Can Edit Rooms: ${window.authService.canEditRooms()}`);
                console.log(`   Can Manage Users: ${window.authService.isMasterAdmin()}`);
                
            } else {
                console.error('❌ Login failed:', result.error);
            }
            
        } else {
            console.log('⚠️  authService not found on window object');
            console.log('   Make sure you are on the Reem Resort application page');
            console.log('   And that the application has fully loaded');
        }
        
    } catch (error) {
        console.error('❌ Error testing admin login:', error);
    }
})();

// Alternative: Manual verification steps
console.log('');
console.log('📋 MANUAL VERIFICATION STEPS:');
console.log('==============================');
console.log('1. Open the Reem Resort application: http://localhost:5176');
console.log('2. Try logging in with:');
console.log('   Email: admin@reemresort.com');
console.log('   Password: admin123');
console.log('3. If login succeeds, you should be redirected to the dashboard');
console.log('4. Check if you can access admin features like User Management');
console.log('');
console.log('If login works, the admin role is properly assigned!');