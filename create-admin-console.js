// Browser Console Script to Create Master Admin
// Copy and paste this script into your browser's developer console
// while on the Reem Resort application page

(async function createMasterAdmin() {
    console.log('🚀 Master Admin Creation Script');
    console.log('================================');
    
    try {
        // Import Firebase functions dynamically
        const { createUserWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        // Try to access the existing Firebase instances from the app
        let auth, db;
        
        // Method 1: Try to access from window/global scope
        if (window.firebase) {
            auth = window.firebase.auth;
            db = window.firebase.db;
        }
        
        // Method 2: Try to access from app modules if available
        if (!auth && window.auth) {
            auth = window.auth;
            db = window.db;
        }
        
        if (!auth || !db) {
            console.error('❌ Cannot access Firebase Auth or Firestore instances');
            console.log('Please make sure you are on the Reem Resort application page');
            return;
        }
        
        const adminData = {
            email: 'admin@reemresort.com',
            password: 'admin123',
            name: 'Master Administrator',
            role: 'MasterAdmin'
        };
        
        console.log(`📧 Creating admin user: ${adminData.email}`);
        
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, adminData.email, adminData.password);
        const user = userCredential.user;
        
        console.log(`✅ Firebase Auth user created with UID: ${user.uid}`);
        
        // Create user profile in Firestore
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
            email: adminData.email,
            name: adminData.name,
            role: adminData.role,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'console_script',
            isActive: true
        });
        
        console.log('✅ User profile created in Firestore');
        console.log('🎉 SUCCESS! Master Admin user created successfully!');
        console.log('\n📋 Login Credentials:');
        console.log(`   Email: ${adminData.email}`);
        console.log(`   Password: ${adminData.password}`);
        console.log(`   Role: ${adminData.role}`);
        console.log(`   UID: ${user.uid}`);
        
    } catch (error) {
        console.error('❌ Error creating Master Admin:', error);
        
        if (error.code === 'auth/email-already-in-use') {
            console.log('⚠️  User already exists in Firebase Auth');
            console.log('✅ You can use these credentials to login:');
            console.log('   Email: admin@reemresort.com');
            console.log('   Password: admin123');
        } else if (error.code === 'auth/weak-password') {
            console.error('❌ Password is too weak');
        } else if (error.code === 'auth/invalid-email') {
            console.error('❌ Invalid email format');
        } else {
            console.error('❌ Error details:', error.message);
        }
    }
})();

// Alternative method using the app's existing authService if available
if (window.authService) {
    console.log('🔄 Alternative method using existing authService...');
    
    // The existing authService already handles demo user creation
    // Try to sign in with admin credentials - it will create the user if it doesn't exist
    window.authService.signIn('admin@reemresort.com', 'admin123')
        .then(result => {
            if (result.success) {
                console.log('✅ Admin user ready! You can now login with:');
                console.log('   Email: admin@reemresort.com');
                console.log('   Password: admin123');
            } else {
                console.error('❌ Failed to create/login admin user:', result.error);
            }
        })
        .catch(error => {
            console.error('❌ Error with authService:', error);
        });
}