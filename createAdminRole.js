#!/usr/bin/env node

/**
 * Firebase Admin SDK Script to Create MasterAdmin Role
 * 
 * This script creates a Firestore document for an existing Firebase Auth user
 * and assigns them the MasterAdmin role.
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Admin user details
const ADMIN_EMAIL = 'admin@reemresort.com';
const ADMIN_ROLE = 'MasterAdmin';
const ADMIN_NAME = 'Master Administrator';

async function initializeFirebaseAdmin() {
  try {
    // Try to load service account key from different possible locations
    const possiblePaths = [
      join(__dirname, 'serviceAccountKey.json'),
      join(__dirname, 'firebase-admin-key.json'),
      join(__dirname, 'firebase-service-account.json'),
      join(__dirname, 'config', 'serviceAccountKey.json')
    ];

    let serviceAccount = null;
    let keyPath = null;

    for (const path of possiblePaths) {
      try {
        serviceAccount = JSON.parse(readFileSync(path, 'utf8'));
        keyPath = path;
        break;
      } catch (error) {
        // Continue to next path
      }
    }

    if (!serviceAccount) {
      console.log('📝 Service account key not found. Please follow these steps:');
      console.log('');
      console.log('1. Go to Firebase Console > Project Settings > Service Accounts');
      console.log('2. Click "Generate new private key"');
      console.log('3. Save the downloaded JSON file as "serviceAccountKey.json" in this directory');
      console.log('4. Run this script again');
      console.log('');
      console.log('Alternative: Set GOOGLE_APPLICATION_CREDENTIALS environment variable');
      
      // Try using Application Default Credentials
      console.log('🔄 Trying Application Default Credentials...');
      admin.initializeApp();
      return;
    }

    console.log(`✅ Found service account key: ${keyPath}`);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error.message);
    
    // Fallback to environment variables
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      console.log('🔄 Trying environment credentials...');
      admin.initializeApp();
    } else {
      throw error;
    }
  }
}

async function getUserByEmail(email) {
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    return userRecord;
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`❌ User with email ${email} not found in Firebase Auth`);
      console.log('Please make sure you have created this user in Firebase Auth first');
      return null;
    }
    throw error;
  }
}

async function createUserProfile(uid, userData) {
  try {
    const db = admin.firestore();
    const userDocRef = db.collection('users').doc(uid);
    
    // Check if document already exists
    const existingDoc = await userDocRef.get();
    
    if (existingDoc.exists) {
      console.log('📝 User profile already exists. Updating...');
      await userDocRef.update({
        ...userData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: 'admin_script'
      });
      console.log('✅ User profile updated successfully');
    } else {
      console.log('📝 Creating new user profile...');
      await userDocRef.set({
        ...userData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: 'admin_script'
      });
      console.log('✅ User profile created successfully');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error creating/updating user profile:', error);
    return false;
  }
}

async function createMasterAdmin() {
  try {
    console.log('🚀 Creating MasterAdmin role for admin@reemresort.com');
    console.log('================================================');
    
    // Initialize Firebase Admin SDK
    await initializeFirebaseAdmin();
    
    // Get user from Firebase Auth
    console.log(`🔍 Looking up user: ${ADMIN_EMAIL}`);
    const userRecord = await getUserByEmail(ADMIN_EMAIL);
    
    if (!userRecord) {
      console.log('');
      console.log('💡 To create this user in Firebase Auth, you can:');
      console.log('1. Use Firebase Console > Authentication > Users > Add User');
      console.log('2. Or use Firebase Admin SDK to create the user programmatically');
      process.exit(1);
    }
    
    console.log(`✅ Found user with UID: ${userRecord.uid}`);
    console.log(`📧 Email: ${userRecord.email}`);
    console.log(`🆔 UID: ${userRecord.uid}`);
    
    // Create user profile in Firestore
    const userProfileData = {
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      role: ADMIN_ROLE,
      isActive: true
    };
    
    console.log('');
    console.log('📝 Creating user profile in Firestore...');
    const success = await createUserProfile(userRecord.uid, userProfileData);
    
    if (success) {
      console.log('');
      console.log('🎉 SUCCESS! MasterAdmin role assigned successfully!');
      console.log('');
      console.log('📋 User Details:');
      console.log(`   Email: ${ADMIN_EMAIL}`);
      console.log(`   Role: ${ADMIN_ROLE}`);
      console.log(`   Name: ${ADMIN_NAME}`);
      console.log(`   UID: ${userRecord.uid}`);
      console.log('');
      console.log('✅ The user can now login with full admin privileges');
    } else {
      console.log('❌ Failed to create user profile');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Make sure Firebase Admin SDK is properly configured');
    console.log('2. Verify service account key has proper permissions');
    console.log('3. Check that the user exists in Firebase Auth');
    process.exit(1);
  }
}

// Check if running as module or script
if (import.meta.url === `file://${process.argv[1]}`) {
  createMasterAdmin()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export default createMasterAdmin;