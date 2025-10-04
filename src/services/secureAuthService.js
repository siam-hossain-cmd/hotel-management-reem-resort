/**
 * Secure Authentication Service
 * 
 * Implements role-based authentication with proper security controls,
 * master admin protection, and activity tracking.
 */

import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { ROLE_HIERARCHY } from '../database/schema';

// =============================================================================
// CONSTANTS & CONFIGURATION
// =============================================================================

export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
  // Note: No MASTER_ADMIN here - it's system-only
};

export const ACTION_TYPES = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  LOGIN_FAILED: 'login_failed',
  ACCOUNT_CREATED: 'account_created',
  PROFILE_UPDATED: 'profile_updated',
  ROLE_CHANGED: 'role_changed',
  PERMISSION_CHANGED: 'permission_changed'
};

export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// =============================================================================
// SECURE AUTHENTICATION SERVICE
// =============================================================================

class SecureAuthService {
  constructor() {
    this.currentUser = null;
    this.userPermissions = null;
    this.authStateListeners = [];
    this.initialized = false;
    this.sessionId = null;
  }

  // ---------------------------------------------------------------------------
  // INITIALIZATION
  // ---------------------------------------------------------------------------

  async init() {
    if (this.initialized) {
      return Promise.resolve(this.currentUser);
    }

    return new Promise((resolve) => {
      console.log('🔧 Initializing Secure Auth Service...');
      
      const timeout = setTimeout(() => {
        console.warn('⚠️ Auth initialization timeout');
        this.initialized = true;
        resolve(null);
      }, 3000);

      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        clearTimeout(timeout);
        
        try {
          if (firebaseUser) {
            console.log('✅ Firebase user found:', firebaseUser.email);
            
            // Check if this is a master admin trying to login
            const isMasterAdmin = await this.checkIfMasterAdmin(firebaseUser.uid);
            if (isMasterAdmin) {
              console.error('🚫 Master Admin cannot login directly');
              await this.logActivity(firebaseUser.uid, ACTION_TYPES.LOGIN_FAILED, {
                reason: 'Master admin login blocked',
                riskLevel: RISK_LEVELS.CRITICAL
              });
              await signOut(auth);
              this.currentUser = null;
              this.initialized = true;
              this.notifyListeners(null);
              resolve(null);
              return;
            }
            
            // Get user profile and permissions
            const userProfile = await this.getUserProfile(firebaseUser.uid);
            if (userProfile) {
              this.currentUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                emailVerified: firebaseUser.emailVerified,
                ...userProfile
              };
              
              // Load user permissions
              this.userPermissions = await this.loadUserPermissions(firebaseUser.uid);
              
              // Update last login
              await this.updateLastLogin(firebaseUser.uid);
              
              // Create session
              this.sessionId = await this.createUserSession(firebaseUser.uid);
              
              // Log successful login
              await this.logActivity(firebaseUser.uid, ACTION_TYPES.LOGIN, {
                sessionId: this.sessionId,
                riskLevel: RISK_LEVELS.LOW
              });
              
            } else {
              console.warn('⚠️ User profile not found in Firestore');
              this.currentUser = null;
            }
          } else {
            console.log('ℹ️ No authenticated user');
            if (this.currentUser) {
              // Log logout
              await this.logActivity(this.currentUser.uid, ACTION_TYPES.LOGOUT, {
                sessionId: this.sessionId,
                riskLevel: RISK_LEVELS.LOW
              });
            }
            this.currentUser = null;
            this.userPermissions = null;
            this.sessionId = null;
          }
          
          this.initialized = true;
          this.notifyListeners(this.currentUser);
          resolve(this.currentUser);
          
        } catch (error) {
          console.error('❌ Auth state change error:', error);
          this.initialized = true;
          resolve(null);
        }
      });
      
      this.unsubscribe = unsubscribe;
    });
  }

  // ---------------------------------------------------------------------------
  // AUTHENTICATION METHODS
  // ---------------------------------------------------------------------------

  async signIn(email, password) {
    try {
      console.log('🔐 Attempting secure sign in for:', email);
      
      // Check if this email is the master admin
      const isMasterAdminEmail = await this.checkIfMasterAdminEmail(email);
      if (isMasterAdminEmail) {
        console.error('🚫 Master Admin email cannot be used for direct login');
        await this.logActivity(null, ACTION_TYPES.LOGIN_FAILED, {
          email: email,
          reason: 'Master admin email blocked',
          riskLevel: RISK_LEVELS.CRITICAL
        });
        return {
          success: false,
          error: 'Access denied. This account cannot login directly.',
          code: 'auth/master-admin-blocked'
        };
      }
      
      // Attempt Firebase authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('✅ Firebase authentication successful');
      
      // Additional security checks will be handled by onAuthStateChanged
      return { 
        success: true, 
        user: user,
        message: 'Login successful'
      };
      
    } catch (error) {
      console.error('❌ Sign in error:', error);
      
      // Log failed login attempt
      await this.logActivity(null, ACTION_TYPES.LOGIN_FAILED, {
        email: email,
        reason: error.message,
        errorCode: error.code,
        riskLevel: this.assessLoginRiskLevel(error.code)
      });
      
      return { 
        success: false, 
        error: this.getErrorMessage(error.code),
        code: error.code
      };
    }
  }

  async signOut() {
    try {
      if (this.currentUser) {
        // Terminate session
        if (this.sessionId) {
          await this.terminateUserSession(this.sessionId, 'logout');
        }
        
        // Log logout will be handled by onAuthStateChanged
      }
      
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error('❌ Sign out error:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  async createUser(userData, createdByUid) {
    try {
      console.log('👤 Creating new user:', userData.email);
      
      // Validate role
      if (!USER_ROLES[userData.role.toUpperCase()]) {
        throw new Error(`Invalid role: ${userData.role}`);
      }
      
      // Check if creator has permission
      if (!await this.hasPermission(createdByUid, 'canManageUsers')) {
        throw new Error('Insufficient permissions to create users');
      }
      
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      
      const user = userCredential.user;
      
      // Create user profile in Firestore
      const userProfile = {
        uid: user.uid,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        department: userData.department || '',
        phone: userData.phone || '',
        isActive: true,
        isEmailVerified: user.emailVerified,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: null,
        createdBy: createdByUid,
        permissions: this.getDefaultPermissions(userData.role)
      };
      
      await setDoc(doc(db, 'users', user.uid), userProfile);
      
      // Log user creation
      await this.logActivity(createdByUid, ACTION_TYPES.ACCOUNT_CREATED, {
        targetType: 'user',
        targetId: user.uid,
        targetName: userData.name,
        changes: { after: userProfile },
        riskLevel: RISK_LEVELS.MEDIUM
      });
      
      console.log('✅ User created successfully');
      return { 
        success: true, 
        user: userProfile,
        uid: user.uid
      };
      
    } catch (error) {
      console.error('❌ User creation error:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // ---------------------------------------------------------------------------
  // USER PROFILE & PERMISSIONS
  // ---------------------------------------------------------------------------

  async getUserProfile(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  async loadUserPermissions(uid) {
    try {
      const userProfile = await this.getUserProfile(uid);
      if (userProfile && userProfile.permissions) {
        return userProfile.permissions;
      }
      
      // Fallback to default permissions based on role
      return this.getDefaultPermissions(userProfile?.role || 'user');
    } catch (error) {
      console.error('Error loading user permissions:', error);
      return this.getDefaultPermissions('user');
    }
  }

  getDefaultPermissions(role) {
    const roleConfig = ROLE_HIERARCHY[role];
    return roleConfig ? roleConfig.permissions : {
      canCreateInvoices: false,
      canEditInvoices: false,
      canDeleteInvoices: false,
      canViewReports: false,
      canManageRooms: false,
      canManageUsers: false,
      canViewHistory: false,
      canExportData: false
    };
  }

  // ---------------------------------------------------------------------------
  // SECURITY CHECKS
  // ---------------------------------------------------------------------------

  async checkIfMasterAdmin(uid) {
    try {
      const systemDoc = await getDoc(doc(db, 'system', 'settings'));
      if (systemDoc.exists()) {
        const data = systemDoc.data();
        return data.masterAdminUID === uid;
      }
      return false;
    } catch (error) {
      console.error('Error checking master admin status:', error);
      return false;
    }
  }

  async checkIfMasterAdminEmail(email) {
    try {
      const systemDoc = await getDoc(doc(db, 'system', 'settings'));
      if (systemDoc.exists()) {
        const data = systemDoc.data();
        return data.masterAdminEmail === email;
      }
      return false;
    } catch (error) {
      console.error('Error checking master admin email:', error);
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // PERMISSIONS & AUTHORIZATION
  // ---------------------------------------------------------------------------

  hasPermission(permission) {
    if (!this.userPermissions) return false;
    return this.userPermissions[permission] === true;
  }

  async hasPermission(uid, permission) {
    try {
      const permissions = await this.loadUserPermissions(uid);
      return permissions[permission] === true;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  isAdmin() {
    return this.currentUser?.role === USER_ROLES.ADMIN;
  }

  isUser() {
    return this.currentUser?.role === USER_ROLES.USER;
  }

  canManageUsers() {
    return this.isAdmin() && this.hasPermission('canManageUsers');
  }

  // ---------------------------------------------------------------------------
  // SESSION MANAGEMENT
  // ---------------------------------------------------------------------------

  async createUserSession(uid) {
    try {
      const sessionData = {
        sessionId: this.generateSessionId(),
        userId: uid,
        userEmail: this.currentUser.email,
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent,
        deviceType: this.getDeviceType(),
        isActive: true
      };
      
      await addDoc(collection(db, 'userSessions'), sessionData);
      return sessionData.sessionId;
    } catch (error) {
      console.error('Error creating user session:', error);
      return null;
    }
  }

  async terminateUserSession(sessionId, reason) {
    try {
      const sessionsQuery = query(
        collection(db, 'userSessions'),
        where('sessionId', '==', sessionId),
        where('isActive', '==', true)
      );
      
      const snapshot = await getDocs(sessionsQuery);
      snapshot.forEach(async (doc) => {
        await updateDoc(doc.ref, {
          isActive: false,
          terminatedAt: serverTimestamp(),
          terminationReason: reason
        });
      });
    } catch (error) {
      console.error('Error terminating session:', error);
    }
  }

  // ---------------------------------------------------------------------------
  // ACTIVITY LOGGING
  // ---------------------------------------------------------------------------

  async logActivity(userId, action, details = {}) {
    try {
      const activityData = {
        actionId: this.generateActionId(),
        action: action,
        description: this.getActionDescription(action, details),
        userId: userId || 'anonymous',
        userEmail: userId ? (await this.getUserProfile(userId))?.email : details.email || 'unknown',
        userRole: userId ? (await this.getUserProfile(userId))?.role : 'unknown',
        targetType: details.targetType || 'system',
        targetId: details.targetId || null,
        targetName: details.targetName || null,
        changes: details.changes || null,
        timestamp: serverTimestamp(),
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent,
        success: details.success !== false,
        errorMessage: details.reason || details.errorMessage || null,
        riskLevel: details.riskLevel || RISK_LEVELS.LOW
      };
      
      await addDoc(collection(db, 'history'), activityData);
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  // ---------------------------------------------------------------------------
  // UTILITY METHODS
  // ---------------------------------------------------------------------------

  async updateLastLogin(uid) {
    try {
      await updateDoc(doc(db, 'users', uid), {
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  notifyListeners(user) {
    this.authStateListeners.forEach(listener => {
      try {
        listener(user);
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }

  onAuthStateChange(callback) {
    this.authStateListeners.push(callback);
    
    if (this.initialized) {
      callback(this.currentUser);
    }
    
    return () => {
      this.authStateListeners = this.authStateListeners.filter(
        listener => listener !== callback
      );
    };
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getUserPermissions() {
    return this.userPermissions;
  }

  // ---------------------------------------------------------------------------
  // HELPER METHODS
  // ---------------------------------------------------------------------------

  assessLoginRiskLevel(errorCode) {
    switch (errorCode) {
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return RISK_LEVELS.MEDIUM;
      case 'auth/too-many-requests':
        return RISK_LEVELS.HIGH;
      case 'auth/master-admin-blocked':
        return RISK_LEVELS.CRITICAL;
      default:
        return RISK_LEVELS.LOW;
    }
  }

  getActionDescription(action, details) {
    switch (action) {
      case ACTION_TYPES.LOGIN:
        return 'User logged in successfully';
      case ACTION_TYPES.LOGOUT:
        return 'User logged out';
      case ACTION_TYPES.LOGIN_FAILED:
        return `Login failed: ${details.reason || 'Unknown error'}`;
      case ACTION_TYPES.ACCOUNT_CREATED:
        return `Created user account: ${details.targetName}`;
      default:
        return `Performed action: ${action}`;
    }
  }

  generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  generateActionId() {
    return 'act_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async getClientIP() {
    try {
      // In a real app, you'd get this from your server
      return 'client-ip-unknown';
    } catch {
      return 'unknown';
    }
  }

  getDeviceType() {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
      return 'mobile';
    } else if (/tablet|ipad/i.test(userAgent)) {
      return 'tablet';
    }
    return 'desktop';
  }

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
      case 'auth/master-admin-blocked':
        return 'Access denied. This account cannot login directly.';
      default:
        return 'Authentication failed. Please try again.';
    }
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.authStateListeners = [];
  }
}

// Create and export singleton instance
const secureAuthService = new SecureAuthService();
export default secureAuthService;