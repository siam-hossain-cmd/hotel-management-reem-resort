#!/usr/bin/env node

/**
 * Master Admin Setup Utility
 * 
 * One-time setup script to create the master admin account and initialize
 * the system configuration. This script should only be run once during
 * initial system setup.
 * 
 * SECURITY NOTE: This script has elevated privileges and should be:
 * - Run only during initial setup
 * - Deleted after successful setup
 * - Never deployed to production environments
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// =============================================================================
// CONFIGURATION
// =============================================================================

const MASTER_ADMIN_CONFIG = {
  email: 'master@reemresort.com', // This account CANNOT login directly
  name: 'System Master Administrator',
  role: 'masterAdmin' // Special system role
};

const SYSTEM_CONFIG = {
  systemName: 'Reem Resort Invoice System',
  version: '2.0.0',
  allowRegistration: false,
  requireEmailVerification: true,
  sessionTimeout: 480, // 8 hours in minutes
  maxLoginAttempts: 5,
  invoiceNumberFormat: 'INV-{YYYY}-{MM}-{####}',
  defaultCurrency: 'USD',
  taxRate: 10.0,
  features: {
    enableUserManagement: true,
    enableReports: true,
    enableRoomManagement: true,
    enableHistoryTracking: true
  }
};

const DEFAULT_ROLES = {
  admin: {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Full system access with user management capabilities',
    level: 10,
    defaultPermissions: {
      canCreateInvoices: true,
      canEditInvoices: true,
      canDeleteInvoices: true,
      canViewReports: true,
      canManageRooms: true,
      canManageUsers: true,
      canViewHistory: true,
      canExportData: true
    },
    allowedRoutes: [
      '/dashboard', '/invoices', '/create-invoice', '/customers', 
      '/rooms', '/reports', '/users', '/history', '/settings'
    ],
    dashboardWidgets: [
      'stats', 'recent-invoices', 'recent-customers', 'room-status', 
      'revenue-chart', 'user-activity', 'security-alerts'
    ],
    isSystemRole: true
  },
  user: {
    name: 'user',
    displayName: 'User',
    description: 'Standard user with limited access to basic functions',
    level: 1,
    defaultPermissions: {
      canCreateInvoices: true,
      canEditInvoices: false,
      canDeleteInvoices: false,
      canViewReports: false,
      canManageRooms: false,
      canManageUsers: false,
      canViewHistory: false,
      canExportData: false
    },
    allowedRoutes: [
      '/dashboard', '/invoices', '/create-invoice', '/customers'
    ],
    dashboardWidgets: [
      'my-stats', 'my-recent-invoices', 'recent-customers'
    ],
    isSystemRole: true
  }
};

// =============================================================================
// SETUP CLASS
// =============================================================================

class MasterAdminSetup {
  constructor() {
    this.adminApp = null;
    this.db = null;
    this.auth = null;
    this.rl = null;
  }

  async init() {
    console.log('🚀 Reem Resort Invoice System - Master Admin Setup');
    console.log('==================================================\n');
    
    // Initialize readline interface
    this.rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });

    try {
      // Initialize Firebase Admin SDK
      await this.initializeFirebase();
      
      // Run setup wizard
      await this.runSetupWizard();
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    } finally {
      if (this.rl) {
        this.rl.close();
      }
    }
  }

  async initializeFirebase() {
    try {
      console.log('🔧 Initializing Firebase Admin SDK...');
      
      // Try to load service account key
      const possiblePaths = [
        join(__dirname, 'serviceAccountKey.json'),
        join(__dirname, 'firebase-admin-key.json'),
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
        throw new Error('Service account key required');
      }

      console.log(`✅ Found service account key: ${keyPath}`);
      
      this.adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });

      this.db = admin.firestore();
      this.auth = admin.auth();

      console.log('✅ Firebase Admin SDK initialized successfully\n');
      
    } catch (error) {
      throw new Error(`Firebase initialization failed: ${error.message}`);
    }
  }

  async runSetupWizard() {
    console.log('🧙‍♂️ Master Admin Setup Wizard');
    console.log('===============================\n');

    // Step 1: Confirm setup
    const confirmSetup = await this.askQuestion(
      '⚠️  This will create a master admin account and initialize the system.\n' +
      '   This should only be done ONCE during initial setup.\n' +
      '   Continue? (yes/no): '
    );

    if (confirmSetup.toLowerCase() !== 'yes') {
      console.log('❌ Setup cancelled');
      return;
    }

    // Step 2: Check if already initialized
    const isInitialized = await this.checkIfSystemInitialized();
    if (isInitialized) {
      console.log('⚠️  System appears to be already initialized.');
      const forceSetup = await this.askQuestion('   Force re-initialization? (yes/no): ');
      
      if (forceSetup.toLowerCase() !== 'yes') {
        console.log('❌ Setup cancelled');
        return;
      }
    }

    // Step 3: Create master admin account
    await this.createMasterAdminAccount();

    // Step 4: Initialize system configuration
    await this.initializeSystemConfig();

    // Step 5: Create default roles
    await this.createDefaultRoles();

    // Step 6: Create initial admin user
    await this.createInitialAdminUser();

    // Step 7: Setup complete
    await this.displaySetupComplete();
  }

  async checkIfSystemInitialized() {
    try {
      const systemDoc = await this.db.collection('system').doc('settings').get();
      return systemDoc.exists;
    } catch (error) {
      return false;
    }
  }

  async createMasterAdminAccount() {
    console.log('\n🔐 Creating Master Admin Account...');
    
    try {
      // Create Firebase Auth user (but it cannot login)
      const userRecord = await this.auth.createUser({
        email: MASTER_ADMIN_CONFIG.email,
        password: this.generateSecurePassword(),
        displayName: MASTER_ADMIN_CONFIG.name,
        disabled: true // Account is disabled - cannot login
      });

      console.log(`✅ Master admin account created with UID: ${userRecord.uid}`);
      console.log(`📧 Email: ${MASTER_ADMIN_CONFIG.email}`);
      console.log('🔒 Account Status: DISABLED (Cannot login directly)');

      return userRecord.uid;

    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log('⚠️  Master admin email already exists');
        
        // Get existing user
        const userRecord = await this.auth.getUserByEmail(MASTER_ADMIN_CONFIG.email);
        
        // Ensure it's disabled
        if (!userRecord.disabled) {
          await this.auth.updateUser(userRecord.uid, { disabled: true });
          console.log('🔒 Disabled existing master admin account');
        }
        
        return userRecord.uid;
      } else {
        throw error;
      }
    }
  }

  async initializeSystemConfig() {
    console.log('\n⚙️  Initializing System Configuration...');
    
    try {
      // Get master admin UID
      const masterAdminUser = await this.auth.getUserByEmail(MASTER_ADMIN_CONFIG.email);
      
      const systemSettings = {
        ...SYSTEM_CONFIG,
        masterAdminUID: masterAdminUser.uid,
        masterAdminEmail: MASTER_ADMIN_CONFIG.email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        setupVersion: '2.0.0',
        setupDate: new Date().toISOString()
      };

      await this.db.collection('system').doc('settings').set(systemSettings);
      
      console.log('✅ System configuration initialized');
      console.log(`🔑 Master Admin UID: ${masterAdminUser.uid}`);

    } catch (error) {
      throw new Error(`System configuration failed: ${error.message}`);
    }
  }

  async createDefaultRoles() {
    console.log('\n👥 Creating Default Roles...');
    
    try {
      const batch = this.db.batch();

      for (const [roleKey, roleConfig] of Object.entries(DEFAULT_ROLES)) {
        const roleData = {
          ...roleConfig,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const roleRef = this.db.collection('roles').doc(roleKey);
        batch.set(roleRef, roleData);

        console.log(`✅ Role created: ${roleConfig.displayName} (${roleKey})`);
      }

      await batch.commit();
      console.log('✅ All default roles created successfully');

    } catch (error) {
      throw new Error(`Role creation failed: ${error.message}`);
    }
  }

  async createInitialAdminUser() {
    console.log('\n👤 Creating Initial Admin User...');
    
    // Get admin details
    const adminEmail = await this.askQuestion('   Admin Email: ');
    const adminName = await this.askQuestion('   Admin Name: ');
    const adminPassword = await this.askQuestion('   Admin Password: ', true);

    try {
      // Create Firebase Auth user
      const userRecord = await this.auth.createUser({
        email: adminEmail,
        password: adminPassword,
        displayName: adminName,
        emailVerified: true
      });

      // Create Firestore profile
      const userProfile = {
        uid: userRecord.uid,
        email: adminEmail,
        name: adminName,
        role: 'admin',
        department: 'System Administration',
        isActive: true,
        isEmailVerified: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: null,
        createdBy: 'system-setup',
        permissions: DEFAULT_ROLES.admin.defaultPermissions
      };

      await this.db.collection('users').doc(userRecord.uid).set(userProfile);

      // Log the creation
      const historyEntry = {
        actionId: this.generateActionId(),
        action: 'system_initialized',
        description: 'System initialized with master admin and first admin user',
        userId: 'system-setup',
        userEmail: 'system',
        userRole: 'system',
        targetType: 'system',
        targetId: 'initialization',
        targetName: 'System Setup',
        changes: {
          after: {
            masterAdminCreated: true,
            firstAdminCreated: true,
            adminEmail: adminEmail
          }
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        success: true,
        riskLevel: 'medium'
      };

      await this.db.collection('history').add(historyEntry);

      console.log(`✅ Admin user created successfully`);
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🆔 UID: ${userRecord.uid}`);

      return { email: adminEmail, uid: userRecord.uid };

    } catch (error) {
      throw new Error(`Admin user creation failed: ${error.message}`);
    }
  }

  async displaySetupComplete() {
    console.log('\n🎉 SETUP COMPLETE!');
    console.log('==================\n');
    
    console.log('✅ Master Admin Account Created (DISABLED - Cannot login)');
    console.log('✅ System Configuration Initialized');
    console.log('✅ Default Roles Created');
    console.log('✅ Initial Admin User Created');
    console.log('✅ Activity Logging Initialized');
    
    console.log('\n📋 IMPORTANT SECURITY NOTES:');
    console.log('==============================');
    console.log('1. Master Admin account CANNOT login directly (by design)');
    console.log('2. Only regular admin users can login to the system');
    console.log('3. All activities are logged for security monitoring');
    console.log('4. Delete this setup script from production environments');
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('===============');
    console.log('1. Test login with your admin account');
    console.log('2. Review system settings in the admin panel');
    console.log('3. Create additional user accounts as needed');
    console.log('4. Configure Firebase security rules');
    console.log('5. DELETE this setup script for security');
    
    console.log('\n⚠️  REMEMBER: This setup script should be DELETED after successful setup!');
  }

  // Utility methods
  askQuestion(question, hideInput = false) {
    return new Promise((resolve) => {
      if (hideInput) {
        // For password input (simplified - in production use proper password masking)
        this.rl.question(question, (answer) => {
          resolve(answer);
        });
      } else {
        this.rl.question(question, (answer) => {
          resolve(answer);
        });
      }
    });
  }

  generateSecurePassword() {
    // Generate a random secure password for master admin (which won't be used)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 32; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  generateActionId() {
    return 'setup_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  const setup = new MasterAdminSetup();
  
  try {
    await setup.init();
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default MasterAdminSetup;