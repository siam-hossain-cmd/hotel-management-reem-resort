import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';

// User roles
export const USER_ROLES = {
  MASTER_ADMIN: 'MasterAdmin',
  FULL_ADMIN: 'FullAdmin',
  ADMIN: 'Admin',
  FRONT_DESK: 'FrontDesk'
};

// Demo users - these will be created in Firebase Auth automatically
const DEMO_USERS = {
  'admin@reemresort.com': {
    email: 'admin@reemresort.com',
    password: 'admin123',
    role: USER_ROLES.MASTER_ADMIN,
    name: 'Master Admin'
  },
  'masteradmin@reemresort.com': {
    email: 'masteradmin@reemresort.com',
    password: 'admin123',
    role: USER_ROLES.MASTER_ADMIN,
    name: 'Master Administrator'
  },
  'fulladmin@reemresort.com': {
    email: 'fulladmin@reemresort.com',
    password: 'admin123',
    role: USER_ROLES.FULL_ADMIN,
    name: 'Full Access Admin'
  },
  'editadmin@reemresort.com': {
    email: 'editadmin@reemresort.com',
    password: 'admin123',
    role: USER_ROLES.EDIT_ADMIN,
    name: 'Edit Admin'
  },
  'viewadmin@reemresort.com': {
    email: 'viewadmin@reemresort.com',
    password: 'admin123',
    role: USER_ROLES.VIEW_ADMIN,
    name: 'View Only Admin'
  },
  'frontdesk@reemresort.com': {
    email: 'frontdesk@reemresort.com',
    password: 'frontdesk123',
    role: USER_ROLES.FRONT_DESK,
    name: 'Front Desk User'
  }
};

class AuthService {
  constructor() {
    this.currentUser = null;
    this.authStateListeners = [];
    this.initialized = false;
  }

  // Initialize auth state listener with improved error handling
  init() {
    // If already initialized, return existing state
    if (this.initialized) {
      return Promise.resolve(this.currentUser);
    }

    return new Promise((resolve) => {
      console.log('🔧 Initializing Firebase Auth...');
      
      // Set a reasonable timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        console.warn('⚠️ Firebase Auth timeout - proceeding without auth');
        this.initialized = true;
        resolve(null);
      }, 1500); // Reduced from 3000ms to 1500ms

      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        clearTimeout(timeout);
        
        try {
          if (firebaseUser) {
            console.log('✅ Firebase user found:', firebaseUser.email);
            // Get user data from Firestore
            const userDoc = await this.getUserData(firebaseUser.uid);
            this.currentUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              ...userDoc
            };
          } else {
            console.log('❌ No Firebase user found');
            this.currentUser = null;
          }
          
          this.initialized = true;
          // Notify all listeners
          this.authStateListeners.forEach(listener => listener(this.currentUser));
          resolve(this.currentUser);
        } catch (error) {
          console.error('❌ Firebase Auth error:', error);
          this.initialized = true;
          resolve(null);
        }
      });
      
      // Store unsubscribe function
      this.unsubscribe = unsubscribe;
    });
  }

  // Add auth state listener
  onAuthStateChange(callback) {
    this.authStateListeners.push(callback);
    
    // If already initialized, call immediately
    if (this.initialized) {
      callback(this.currentUser);
    }
    
    // Return unsubscribe function
    return () => {
      this.authStateListeners = this.authStateListeners.filter(listener => listener !== callback);
    };
  }

  // Get user data from Firestore
  async getUserData(uid) {
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        return userDoc.data();
      }
      
      // If user document doesn't exist, check if it's a legacy user with different ID structure
      console.log('ℹ️ User document not found for UID:', uid);
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // Create user profile in Firestore
  async createUserProfile(uid, userData) {
    try {
      // Import role permissions (we'll need to define these or import from AuthContext)
      const ROLE_PERMISSIONS = {
        [USER_ROLES.MASTER_ADMIN]: [
          'view_dashboard', 'view_analytics', 'create_invoice', 'view_invoices', 'edit_invoices', 'delete_invoices',
          'export_invoices', 'view_customers', 'create_customers', 'edit_customers', 'delete_customers',
          'view_rooms', 'create_rooms', 'edit_rooms', 'delete_rooms', 'upload_rooms', 'manage_room_inventory',
          'view_users', 'create_users', 'edit_users', 'delete_users', 'manage_roles', 'view_reports',
          'create_reports', 'export_reports', 'view_financial_reports', 'manage_settings', 'view_logs',
          'backup_data', 'restore_data', 'manage_billing', 'configure_taxes', 'manage_discounts',
          'access_api', 'view_audit_logs', 'manage_security', 'reset_passwords'
        ],
        [USER_ROLES.FULL_ADMIN]: [
          'view_dashboard', 'view_analytics', 'create_invoice', 'view_invoices', 'edit_invoices', 'delete_invoices',
          'export_invoices', 'view_customers', 'create_customers', 'edit_customers', 'delete_customers',
          'view_rooms', 'create_rooms', 'edit_rooms', 'delete_rooms', 'upload_rooms', 'manage_room_inventory',
          'view_reports', 'create_reports', 'export_reports', 'view_financial_reports', 'manage_billing',
          'configure_taxes', 'manage_discounts', 'access_api'
        ],
        [USER_ROLES.ADMIN]: [
          'view_dashboard', 'create_invoice', 'view_invoices', 'edit_invoices', 'export_invoices',
          'view_customers', 'create_customers', 'edit_customers', 'view_rooms', 'create_rooms', 'edit_rooms',
          'view_reports', 'create_reports', 'export_reports',
          'canViewInvoices', 'canViewCustomers', 'canCreateInvoices', 'canEditInvoices', 'canEditCustomers'
        ],
        [USER_ROLES.FRONT_DESK]: [
          'view_dashboard', 'view_invoices', 'view_customers', 'view_rooms', 'view_reports',
          'canViewInvoices', 'canViewCustomers'
        ]
      };
      
      const rolePermissions = ROLE_PERMISSIONS[userData.role] || [];
      
      const userDocRef = doc(db, 'users', uid);
      await setDoc(userDocRef, {
        uid: uid, // Ensure UID is included in the document
        ...userData,
        permissions: rolePermissions, // Add role-based permissions
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active', // Ensure user is active by default
        lastLogin: null,
        loginCount: 0
      }, { merge: true }); // Use merge to update existing documents
      return true;
    } catch (error) {
      console.error('Error creating user profile:', error);
      return false;
    }
  }

  // Enhanced sign in with automatic user creation for demo accounts
  async signIn(email, password) {
    try {
      console.log('🔐 Attempting Firebase sign in for:', email);
      
      // Check if it's a demo user
      const demoUser = DEMO_USERS[email];
      
      if (demoUser && demoUser.password === password) {
        // Try to sign in first
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          console.log('✅ Demo user signed in successfully');
          
          // Update current user immediately
          let userDoc = await this.getUserData(userCredential.user.uid);
          
          // Check if user role needs to be fixed/updated
          if (!userDoc || userDoc.role !== demoUser.role) {
            console.log('🔧 Fixing user role from', userDoc?.role, 'to', demoUser.role);
            await this.createUserProfile(userCredential.user.uid, {
              email: email,
              role: demoUser.role,
              name: demoUser.name
            });
            userDoc = await this.getUserData(userCredential.user.uid);
          }
          
          this.currentUser = {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            ...userDoc
          };
          
          // Notify all listeners immediately
          this.authStateListeners.forEach(listener => listener(this.currentUser));
          
          return { success: true, user: userCredential.user };
        } catch (signInError) {
          console.log('🔧 Demo user not found, creating account...');
          
          if (signInError.code === 'auth/user-not-found') {
            // Create the demo user account
            try {
              const userCredential = await createUserWithEmailAndPassword(auth, email, password);
              await this.createUserProfile(userCredential.user.uid, {
                email: email,
                role: demoUser.role,
                name: demoUser.name
              });
              console.log('✅ Demo user created and signed in');
              
              // Update current user immediately after creation
              this.currentUser = {
                uid: userCredential.user.uid,
                email: email,
                role: demoUser.role,
                name: demoUser.name
              };
              
              // Notify all listeners immediately
              this.authStateListeners.forEach(listener => listener(this.currentUser));
              
              return { success: true, user: userCredential.user };
            } catch (createError) {
              console.error('❌ Failed to create demo user:', createError);
              return { success: false, error: 'Failed to create demo account' };
            }
          }
          
          return { success: false, error: this.getErrorMessage(signInError.code) };
        }
      }

      // Regular Firebase sign in for non-demo users
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Regular user signed in successfully');
      
      // Update current user immediately for regular users too
      const userDoc = await this.getUserData(userCredential.user.uid);
      this.currentUser = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        ...userDoc
      };
      
      // Notify all listeners immediately
      this.authStateListeners.forEach(listener => listener(this.currentUser));
      
      return { success: true, user: userCredential.user };
      
    } catch (error) {
      console.error('❌ Sign in error:', error);
      return { 
        success: false, 
        error: this.getErrorMessage(error.code) 
      };
    }
  }

  // Sign out
  async signOut() {
    try {
      await signOut(auth);
      this.currentUser = null;
      console.log('✅ User signed out successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Sign out error:', error);
      return { 
        success: false, 
        error: this.getErrorMessage(error.code) 
      };
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.currentUser;
  }

  // Check if user has specific role
  hasRole(role) {
    return this.currentUser && this.currentUser.role === role;
  }

  // Check if user is Master Admin
  isMasterAdmin() {
    return this.hasRole(USER_ROLES.MASTER_ADMIN);
  }

  // Check if user is Front Desk
  isFrontDesk() {
    return this.hasRole(USER_ROLES.FRONT_DESK);
  }

  // Check if user can edit rooms
  canEditRooms() {
    return this.isMasterAdmin();
  }

  // Check if user can manage invoices
  canManageInvoices() {
    return this.isAuthenticated(); // Both roles can manage invoices
  }

  // Get user permissions
  getPermissions() {
    if (!this.currentUser) return {};

    return {
      canViewDashboard: true,
      canCreateInvoice: true,
      canViewInvoices: true,
      canViewRooms: true,
      canEditRooms: this.canEditRooms(),
      canUploadRooms: this.canEditRooms(),
      canManageUsers: this.isMasterAdmin(),
      canViewReports: this.isMasterAdmin()
    };
  }

  // Get error message
  getErrorMessage(errorCode) {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password.';
      case 'auth/invalid-email':
        return 'Invalid email address format.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      default:
        return 'Authentication failed. Please try again.';
    }
  }

  // Get demo credentials (for development)
  getDemoCredentials() {
    return Object.values(DEMO_USERS).map(user => ({
      email: user.email,
      password: user.password,
      role: user.role,
      name: user.name
    }));
  }

  // Cleanup
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.authStateListeners = [];
  }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;