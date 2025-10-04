// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA1lgNhs_MSTkMyA2nhRvi3vHf6KeHS-nE",
  authDomain: "invoice-reem-resort.firebaseapp.com",
  projectId: "invoice-reem-resort",
  storageBucket: "invoice-reem-resort.firebasestorage.app",
  messagingSenderId: "483324573465",
  appId: "1:483324573465:web:d668568deffec4ba94f788",
  measurementId: "G-T7T342052J"
};

// Debug: Log Firebase configuration status
if (import.meta.env.DEV) {
  console.log('Firebase configuration loaded:', {
    apiKey: firebaseConfig.apiKey ? '✓ Loaded' : '✗ Missing',
    authDomain: firebaseConfig.authDomain ? '✓ Loaded' : '✗ Missing',
    projectId: firebaseConfig.projectId ? '✓ Loaded' : '✗ Missing',
    storageBucket: firebaseConfig.storageBucket ? '✓ Loaded' : '✗ Missing',
    messagingSenderId: firebaseConfig.messagingSenderId ? '✓ Loaded' : '✗ Missing',
    appId: firebaseConfig.appId ? '✓ Loaded' : '✗ Missing'
  });
}

// Validate Firebase configuration
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

if (missingFields.length > 0) {
  console.error('Missing required Firebase configuration fields:', missingFields);
  console.error('Please check your Firebase configuration');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;