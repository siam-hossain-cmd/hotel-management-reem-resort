// Master Admin Creation Utility
// This utility creates admin users in Firebase Auth and Firestore

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config.js';

// Pre-defined master admin
const MASTER_ADMIN_DATA = {
  email: 'admin@reemresort.com',
  password: 'admin123',
  name: 'Master Administrator',
  role: 'MasterAdmin'
};

// Create master admin user in Firebase Auth and Firestore
const createMasterAdminUser = async () => {
  try {
    console.log('🚀 Creating Master Admin user...');
    console.log(`📧 Email: ${MASTER_ADMIN_DATA.email}`);
    
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      MASTER_ADMIN_DATA.email,
      MASTER_ADMIN_DATA.password
    );
    
    const user = userCredential.user;
    console.log(`✅ Firebase Auth user created with UID: ${user.uid}`);
    
    // Create user profile in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      email: MASTER_ADMIN_DATA.email,
      name: MASTER_ADMIN_DATA.name,
      role: MASTER_ADMIN_DATA.role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin_script',
      isActive: true
    });
    
    console.log('✅ User profile created in Firestore');
    console.log('🎉 Master Admin user created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log(`   Email: ${MASTER_ADMIN_DATA.email}`);
    console.log(`   Password: ${MASTER_ADMIN_DATA.password}`);
    
    return { success: true, user, uid: user.uid };
  } catch (error) {
    console.error('❌ Error creating Master Admin:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('⚠️  User already exists in Firebase Auth');
      console.log('✅ You can use the existing credentials to login');
      return { success: true, message: 'User already exists' };
    }
    
    return { success: false, error: error.message };
  }
};

// Generic function to add any master admin
const addMasterAdmin = async (email, name, password = 'admin123', uid = null) => {
  try {
    console.log(`🚀 Creating Master Admin: ${name} (${email})`);
    
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user profile in Firestore
    const userDocRef = doc(db, 'users', uid || user.uid);
    await setDoc(userDocRef, {
      email: email,
      name: name,
      role: 'MasterAdmin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'manual_script',
      isActive: true
    });
    
    console.log('✅ Master admin user created successfully!');
    return { success: true, user, uid: user.uid };
  } catch (error) {
    console.error('❌ Error creating master admin:', error);
    return { success: false, error: error.message };
  }
};

// Browser console friendly version
window.createMasterAdmin = createMasterAdminUser;
window.addMasterAdmin = addMasterAdmin;

// Export for module use
export { createMasterAdminUser, addMasterAdmin };
export default createMasterAdminUser;