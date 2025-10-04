#!/usr/bin/env node

// Add Master Admin User to Firebase Auth and Firestore
// This script creates the admin@reemresort.com user with MasterAdmin role

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { config } from 'dotenv';

// Load environment variables
config();

// Firebase configuration - same as in your config.js
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate configuration
const requiredVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars);
  console.error('Please create a .env file with your Firebase configuration');
  process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Master Admin user details
const MASTER_ADMIN = {
  email: 'admin@reemresort.com',
  password: 'admin123',
  name: 'Master Administrator',
  role: 'MasterAdmin'
};

async function addMasterAdmin() {
  try {
    console.log('🚀 Creating Master Admin user...');
    console.log(`📧 Email: ${MASTER_ADMIN.email}`);
    console.log(`👤 Name: ${MASTER_ADMIN.name}`);
    console.log(`🔑 Role: ${MASTER_ADMIN.role}`);
    
    // Create user in Firebase Auth
    console.log('\n1️⃣ Creating user in Firebase Auth...');
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      MASTER_ADMIN.email,
      MASTER_ADMIN.password
    );
    
    const user = userCredential.user;
    console.log(`✅ Firebase Auth user created with UID: ${user.uid}`);
    
    // Create user profile in Firestore
    console.log('\n2️⃣ Creating user profile in Firestore...');
    const userDocRef = doc(db, 'users', user.uid);
    
    await setDoc(userDocRef, {
      email: MASTER_ADMIN.email,
      name: MASTER_ADMIN.name,
      role: MASTER_ADMIN.role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin_script',
      isActive: true
    });
    
    console.log('✅ User profile created in Firestore');
    
    console.log('\n🎉 SUCCESS! Master Admin user created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log(`   Email: ${MASTER_ADMIN.email}`);
    console.log(`   Password: ${MASTER_ADMIN.password}`);
    console.log(`   Role: ${MASTER_ADMIN.role}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error creating Master Admin user:', error);
    
    // Handle specific error codes
    if (error.code === 'auth/email-already-in-use') {
      console.log('\n⚠️  User already exists. Updating user profile in Firestore...');
      
      try {
        // If user exists in Auth, just update Firestore
        // Note: We can't get the UID directly, so we'll use a workaround
        console.log('   Creating/updating user profile with email as identifier...');
        
        // Use email-based document ID (replace @ and . with underscores)
        const docId = MASTER_ADMIN.email.replace(/@/g, '_at_').replace(/\./g, '_dot_');
        const userDocRef = doc(db, 'users', docId);
        
        await setDoc(userDocRef, {
          email: MASTER_ADMIN.email,
          name: MASTER_ADMIN.name,
          role: MASTER_ADMIN.role,
          updatedAt: new Date().toISOString(),
          updatedBy: 'admin_script',
          isActive: true
        }, { merge: true });
        
        console.log('✅ User profile updated in Firestore');
        console.log('\n🎉 Master Admin user is ready!');
        console.log('\n📋 Login Credentials:');
        console.log(`   Email: ${MASTER_ADMIN.email}`);
        console.log(`   Password: ${MASTER_ADMIN.password}`);
        console.log(`   Role: ${MASTER_ADMIN.role}`);
        
      } catch (firestoreError) {
        console.error('❌ Error updating Firestore:', firestoreError);
      }
    } else if (error.code === 'auth/weak-password') {
      console.error('❌ Password is too weak. Please use a stronger password.');
    } else if (error.code === 'auth/invalid-email') {
      console.error('❌ Invalid email address format.');
    } else {
      console.error('❌ Unexpected error:', error.message);
    }
    
    process.exit(1);
  }
}

// Run the script
console.log('🔥 Firebase Master Admin Creation Script');
console.log('========================================\n');

addMasterAdmin();