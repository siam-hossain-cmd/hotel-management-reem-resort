/**
 * Firestore Database Schema for Reem Resort Invoice System
 * 
 * This defines the complete database structure with proper role hierarchy,
 * security controls, and activity tracking.
 */

// =============================================================================
// COLLECTIONS STRUCTURE
// =============================================================================

/**
 * 1. USERS COLLECTION
 * Path: /users/{uid}
 * Purpose: Store user profiles and role information
 */
const usersSchema = {
  // Document ID is Firebase Auth UID
  uid: "string", // Firebase Auth UID (redundant but useful for queries)
  email: "string", // User's email address
  name: "string", // Full display name
  role: "admin | user", // Only admin or user roles (NO masterAdmin here)
  
  // Profile information
  profileImage: "string?", // Optional profile picture URL
  phone: "string?", // Optional phone number
  department: "string?", // e.g., "Front Desk", "Management"
  
  // Timestamps
  createdAt: "timestamp", // When account was created
  updatedAt: "timestamp", // Last profile update
  lastLogin: "timestamp", // Last successful login
  
  // Status
  isActive: "boolean", // Account active/inactive
  isEmailVerified: "boolean", // Email verification status
  
  // Metadata
  createdBy: "string", // UID of who created this account
  permissions: {
    // Granular permissions for fine-grained control
    canCreateInvoices: "boolean",
    canEditInvoices: "boolean",
    canDeleteInvoices: "boolean",
    canViewReports: "boolean",
    canManageRooms: "boolean",
    canManageUsers: "boolean", // Only for admins
    canViewHistory: "boolean",
    canExportData: "boolean"
  }
};

/**
 * 2. SYSTEM COLLECTION
 * Path: /system/settings
 * Purpose: Store system-wide configuration and master admin reference
 */
const systemSchema = {
  // Master Admin Control (CRITICAL SECURITY)
  masterAdminUID: "string", // The ONE master admin UID (read-only reference)
  masterAdminEmail: "string", // For identification only
  
  // System Settings
  systemName: "Reem Resort Invoice System",
  version: "1.0.0",
  
  // Security Settings
  allowRegistration: "boolean", // Whether new users can register
  requireEmailVerification: "boolean",
  sessionTimeout: "number", // Minutes
  maxLoginAttempts: "number",
  
  // Invoice Settings
  invoiceNumberFormat: "string", // e.g., "INV-{YYYY}-{MM}-{####}"
  defaultCurrency: "string", // e.g., "USD"
  taxRate: "number", // Default tax percentage
  
  // Timestamps
  createdAt: "timestamp",
  updatedAt: "timestamp",
  lastBackup: "timestamp?",
  
  // Feature Flags
  features: {
    enableUserManagement: "boolean",
    enableReports: "boolean",
    enableRoomManagement: "boolean",
    enableHistoryTracking: "boolean"
  }
};

/**
 * 3. HISTORY COLLECTION
 * Path: /history/{actionId}
 * Purpose: Track all user activities and system changes
 */
const historySchema = {
  // Action Information
  actionId: "string", // Unique action identifier
  action: "string", // e.g., "login", "create_invoice", "update_user", "delete_room"
  description: "string", // Human-readable description
  
  // User Information
  userId: "string", // UID of user who performed action
  userEmail: "string", // Email for easier identification
  userRole: "string", // Role at time of action
  
  // Target Information (what was affected)
  targetType: "string", // e.g., "invoice", "user", "room", "system"
  targetId: "string?", // ID of affected resource
  targetName: "string?", // Name/title of affected resource
  
  // Action Details
  changes: {
    before: "object?", // Previous state (for updates/deletes)
    after: "object?", // New state (for creates/updates)
    fields: "array?" // List of changed fields
  },
  
  // Metadata
  timestamp: "timestamp", // When action occurred
  ipAddress: "string?", // User's IP address
  userAgent: "string?", // Browser/device info
  
  // Status
  success: "boolean", // Whether action succeeded
  errorMessage: "string?", // Error details if failed
  
  // Risk Level (for security monitoring)
  riskLevel: "low | medium | high | critical"
};

/**
 * 4. USER_SESSIONS COLLECTION
 * Path: /userSessions/{sessionId}
 * Purpose: Track active user sessions for security
 */
const userSessionsSchema = {
  sessionId: "string", // Unique session identifier
  userId: "string", // User's UID
  userEmail: "string",
  
  // Session Details
  createdAt: "timestamp", // Login time
  lastActivity: "timestamp", // Last activity time
  expiresAt: "timestamp", // When session expires
  
  // Device Information
  ipAddress: "string",
  userAgent: "string",
  deviceType: "desktop | mobile | tablet",
  
  // Status
  isActive: "boolean",
  terminatedAt: "timestamp?",
  terminationReason: "logout | timeout | admin_revoke | security_breach"
};

/**
 * 5. ROLES COLLECTION
 * Path: /roles/{roleName}
 * Purpose: Define role capabilities and permissions
 */
const rolesSchema = {
  name: "string", // Role name: "admin" or "user"
  displayName: "string", // Human-friendly name
  description: "string", // Role description
  level: "number", // Hierarchy level (1=user, 10=admin, 100=master)
  
  // Default Permissions
  defaultPermissions: {
    canCreateInvoices: "boolean",
    canEditInvoices: "boolean",
    canDeleteInvoices: "boolean",
    canViewReports: "boolean",
    canManageRooms: "boolean",
    canManageUsers: "boolean",
    canViewHistory: "boolean",
    canExportData: "boolean"
  },
  
  // UI Access
  allowedRoutes: "array", // List of routes this role can access
  dashboardWidgets: "array", // Which dashboard widgets to show
  
  // Metadata
  createdAt: "timestamp",
  updatedAt: "timestamp",
  isSystemRole: "boolean" // Whether this is a built-in role
};

// =============================================================================
// ROLE HIERARCHY & PERMISSIONS
// =============================================================================

const ROLE_HIERARCHY = {
  // Level 100: Master Admin (SYSTEM ONLY - cannot login directly)
  masterAdmin: {
    level: 100,
    displayName: "Master Administrator",
    description: "System master account - manages everything",
    canLogin: false, // CRITICAL: Cannot login directly
    purpose: "System control and admin role assignment only"
  },
  
  // Level 10: Admin (Full access except master admin functions)
  admin: {
    level: 10,
    displayName: "Administrator",
    description: "Full system access and user management",
    canLogin: true,
    permissions: {
      canCreateInvoices: true,
      canEditInvoices: true,
      canDeleteInvoices: true,
      canViewReports: true,
      canManageRooms: true,
      canManageUsers: true,
      canViewHistory: true,
      canExportData: true
    }
  },
  
  // Level 1: User (Limited access)
  user: {
    level: 1,
    displayName: "User",
    description: "Standard user with limited access",
    canLogin: true,
    permissions: {
      canCreateInvoices: true,
      canEditInvoices: false, // Can only edit own invoices
      canDeleteInvoices: false,
      canViewReports: false,
      canManageRooms: false,
      canManageUsers: false,
      canViewHistory: false, // Can only see own history
      canExportData: false
    }
  }
};

// =============================================================================
// SECURITY RULES PREVIEW
// =============================================================================

const securityRulesPreview = `
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // System collection - VERY RESTRICTED
    match /system/{document} {
      allow read: if isAdmin(request.auth.uid);
      allow write: if isMasterAdminFunction(); // Only through cloud functions
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isOwnerOrAdmin(userId, request.auth.uid);
      allow create: if isAdmin(request.auth.uid);
      allow update: if isOwnerOrAdmin(userId, request.auth.uid) && !isRoleChange();
      allow delete: if isAdmin(request.auth.uid) && !isMasterAdmin(userId);
    }
    
    // History collection
    match /history/{actionId} {
      allow read: if isAdmin(request.auth.uid) || isOwnHistory(request.auth.uid);
      allow create: if isAuthenticated();
      allow update, delete: if false; // History is immutable
    }
    
    // Roles collection
    match /roles/{roleId} {
      allow read: if isAuthenticated();
      allow write: if false; // Only through cloud functions
    }
  }
}`;

export {
  usersSchema,
  systemSchema,
  historySchema,
  userSessionsSchema,
  rolesSchema,
  ROLE_HIERARCHY,
  securityRulesPreview
};