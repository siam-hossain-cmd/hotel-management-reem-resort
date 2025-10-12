import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../firebase/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const ROLES = {
  MASTER_ADMIN: 'MasterAdmin',
  FULL_ADMIN: 'FullAdmin',
  ADMIN: 'Admin', // Renamed from EditAdmin
  FRONT_DESK: 'FrontDesk'
};

// Comprehensive permissions system
export const PERMISSIONS = {
  // Dashboard permissions
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_ANALYTICS: 'view_analytics',
  
  // Invoice permissions
  CREATE_INVOICE: 'create_invoice',
  VIEW_INVOICES: 'view_invoices',
  EDIT_INVOICES: 'edit_invoices',
  DELETE_INVOICES: 'delete_invoices',
  EXPORT_INVOICES: 'export_invoices',
  
  // Customer permissions
  VIEW_CUSTOMERS: 'view_customers',
  CREATE_CUSTOMERS: 'create_customers',
  EDIT_CUSTOMERS: 'edit_customers',
  DELETE_CUSTOMERS: 'delete_customers',
  
  // Room permissions
  VIEW_ROOMS: 'view_rooms',
  CREATE_ROOMS: 'create_rooms',
  EDIT_ROOMS: 'edit_rooms',
  DELETE_ROOMS: 'delete_rooms',
  UPLOAD_ROOMS: 'upload_rooms',
  MANAGE_ROOM_INVENTORY: 'manage_room_inventory',
  
  // Booking permissions
  VIEW_BOOKINGS: 'view_bookings',
  CREATE_BOOKING: 'create_booking',
  EDIT_BOOKINGS: 'edit_bookings',
  DELETE_BOOKING: 'delete_booking',
  MANAGE_BOOKINGS: 'manage_bookings',
  CONFIRM_BOOKINGS: 'confirm_bookings',
  CANCEL_BOOKINGS: 'cancel_bookings',
  CHECKIN_GUESTS: 'checkin_guests',
  CHECKOUT_GUESTS: 'checkout_guests',
  MANAGE_PAYMENTS: 'manage_payments',
  GENERATE_INVOICE: 'generate_invoice',
  
  // User management permissions
  VIEW_USERS: 'view_users',
  CREATE_USERS: 'create_users',
  EDIT_USERS: 'edit_users',
  DELETE_USERS: 'delete_users',
  MANAGE_ROLES: 'manage_roles',
  
  // Reports permissions
  VIEW_REPORTS: 'view_reports',
  CREATE_REPORTS: 'create_reports',
  EXPORT_REPORTS: 'export_reports',
  VIEW_FINANCIAL_REPORTS: 'view_financial_reports',
  
  // System permissions
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_LOGS: 'view_logs',
  BACKUP_DATA: 'backup_data',
  RESTORE_DATA: 'restore_data',
  
  // Advanced permissions
  MANAGE_BILLING: 'manage_billing',
  CONFIGURE_TAXES: 'configure_taxes',
  MANAGE_DISCOUNTS: 'manage_discounts',
  ACCESS_API: 'access_api',
  
  // Security permissions
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  MANAGE_SECURITY: 'manage_security',
  RESET_PASSWORDS: 'reset_passwords'
};

// Role-based permission mappings
export const ROLE_PERMISSIONS = {
  [ROLES.MASTER_ADMIN]: [
    // Full access to everything
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.CREATE_INVOICE,
    PERMISSIONS.VIEW_INVOICES,
    PERMISSIONS.EDIT_INVOICES,
    PERMISSIONS.DELETE_INVOICES,
    PERMISSIONS.EXPORT_INVOICES,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.CREATE_CUSTOMERS,
    PERMISSIONS.EDIT_CUSTOMERS,
    PERMISSIONS.DELETE_CUSTOMERS,
    PERMISSIONS.VIEW_ROOMS,
    PERMISSIONS.CREATE_ROOMS,
    PERMISSIONS.EDIT_ROOMS,
    PERMISSIONS.DELETE_ROOMS,
    PERMISSIONS.UPLOAD_ROOMS,
    PERMISSIONS.MANAGE_ROOM_INVENTORY,
    PERMISSIONS.VIEW_BOOKINGS,
    PERMISSIONS.CREATE_BOOKING,
    PERMISSIONS.EDIT_BOOKINGS,
    PERMISSIONS.DELETE_BOOKING,
    PERMISSIONS.MANAGE_BOOKINGS,
    PERMISSIONS.CONFIRM_BOOKINGS,
    PERMISSIONS.CANCEL_BOOKINGS,
    PERMISSIONS.CHECKIN_GUESTS,
    PERMISSIONS.CHECKOUT_GUESTS,
    PERMISSIONS.MANAGE_PAYMENTS,
    PERMISSIONS.GENERATE_INVOICE,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.CREATE_USERS,
    PERMISSIONS.EDIT_USERS,
    PERMISSIONS.DELETE_USERS,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.CREATE_REPORTS,
    PERMISSIONS.EXPORT_REPORTS,
    PERMISSIONS.VIEW_FINANCIAL_REPORTS,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.VIEW_LOGS,
    PERMISSIONS.BACKUP_DATA,
    PERMISSIONS.RESTORE_DATA,
    PERMISSIONS.MANAGE_BILLING,
    PERMISSIONS.CONFIGURE_TAXES,
    PERMISSIONS.MANAGE_DISCOUNTS,
    PERMISSIONS.ACCESS_API,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.MANAGE_SECURITY,
    PERMISSIONS.RESET_PASSWORDS
  ],
  
  [ROLES.FULL_ADMIN]: [
    // Full access except user management and security
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.CREATE_INVOICE,
    PERMISSIONS.VIEW_INVOICES,
    PERMISSIONS.EDIT_INVOICES,
    PERMISSIONS.DELETE_INVOICES,
    PERMISSIONS.EXPORT_INVOICES,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.CREATE_CUSTOMERS,
    PERMISSIONS.EDIT_CUSTOMERS,
    PERMISSIONS.DELETE_CUSTOMERS,
    PERMISSIONS.VIEW_ROOMS,
    PERMISSIONS.CREATE_ROOMS,
    PERMISSIONS.EDIT_ROOMS,
    PERMISSIONS.DELETE_ROOMS,
    PERMISSIONS.UPLOAD_ROOMS,
    PERMISSIONS.MANAGE_ROOM_INVENTORY,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.CREATE_REPORTS,
    PERMISSIONS.EXPORT_REPORTS,
    PERMISSIONS.VIEW_FINANCIAL_REPORTS,
    PERMISSIONS.MANAGE_BILLING,
    PERMISSIONS.CONFIGURE_TAXES,
    PERMISSIONS.MANAGE_DISCOUNTS,
    PERMISSIONS.ACCESS_API
  ],
  
  [ROLES.ADMIN]: [
    // Admin role (formerly EditAdmin) - can create and edit but not delete
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.CREATE_INVOICE,
    PERMISSIONS.VIEW_INVOICES,
    PERMISSIONS.EDIT_INVOICES,
    PERMISSIONS.EXPORT_INVOICES,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.CREATE_CUSTOMERS,
    PERMISSIONS.EDIT_CUSTOMERS,
    PERMISSIONS.VIEW_ROOMS,
    PERMISSIONS.CREATE_ROOMS,
    PERMISSIONS.EDIT_ROOMS,
    PERMISSIONS.VIEW_BOOKINGS,
    PERMISSIONS.CREATE_BOOKING,
    PERMISSIONS.EDIT_BOOKINGS,
    PERMISSIONS.MANAGE_BOOKINGS,
    PERMISSIONS.CONFIRM_BOOKINGS,
    PERMISSIONS.CANCEL_BOOKINGS,
    PERMISSIONS.CHECKIN_GUESTS,
    PERMISSIONS.CHECKOUT_GUESTS,
    PERMISSIONS.MANAGE_PAYMENTS,
    PERMISSIONS.GENERATE_INVOICE,
    PERMISSIONS.VIEW_REPORTS, // Added: Admin should be able to view reports
    PERMISSIONS.CREATE_REPORTS,
    PERMISSIONS.EXPORT_REPORTS
  ],
  

  [ROLES.FRONT_DESK]: [
    // Front desk staff - view access plus booking management
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_INVOICES,
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.VIEW_ROOMS,
    PERMISSIONS.VIEW_BOOKINGS,
    PERMISSIONS.CREATE_BOOKING,
    PERMISSIONS.CONFIRM_BOOKINGS,
    PERMISSIONS.CHECKIN_GUESTS,
    PERMISSIONS.CHECKOUT_GUESTS,
    PERMISSIONS.VIEW_REPORTS
  ]
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        console.log('🚀 Initializing Firebase Auth...');
        
        // Set up auth state listener directly with authService
        const unsubscribe = authService.onAuthStateChange((firebaseUser) => {
          if (mounted) {
            console.log('🔄 Auth state changed:', firebaseUser);
            setUser(firebaseUser);
            setLoading(false);
            if (firebaseUser) {
              console.log('✅ User authenticated:', firebaseUser.email);
              console.log('🏷️ User role:', firebaseUser.role);
            } else {
              console.log('ℹ️ No authenticated user');
            }
          }
        });

        // Only initialize auth service if not already initialized
        if (!authService.initialized) {
          await authService.init();
        }
        
        return unsubscribe;
      } catch (error) {
        console.error('❌ Firebase Auth initialization failed:', error);
        if (mounted) {
          setError(error.message);
          setLoading(false);
        }
      }
    };

    let unsubscribe;
    initializeAuth().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      console.log('🔐 Attempting login for:', email);
      
      const result = await authService.signIn(email, password);
      
      if (result.success) {
        console.log('✅ Login successful');
        
        // Get the current user data from authService and update state immediately
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          console.log('✅ User state updated immediately:', currentUser.email);
        }
        
        return { success: true, user: result.user };
      } else {
        console.error('❌ Login failed:', result.error);
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      const errorMessage = error.message || 'Login failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Logging out...');
      await authService.signOut();
      setUser(null);
      console.log('✅ Logout successful');
      return { success: true };
    } catch (error) {
      console.error('❌ Logout error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const hasRole = (role) => {
    if (!user) return false;
    
    // Handle backward compatibility - treat 'admin' as 'MasterAdmin'
    const userRole = user.role === 'admin' ? ROLES.MASTER_ADMIN : user.role;
    
    // Master Admin variations should all match MasterAdmin role
    if (role === ROLES.MASTER_ADMIN) {
      return userRole === ROLES.MASTER_ADMIN || user.role === 'admin' || user.role === 'masterAdmin';
    }
    
    return userRole === role;
  };

  const isMasterAdmin = () => hasRole(ROLES.MASTER_ADMIN);
  const isFullAdmin = () => hasRole(ROLES.FULL_ADMIN);
  const isRegularAdmin = () => hasRole(ROLES.ADMIN); // New Admin role (formerly EditAdmin)
  const isFrontDesk = () => hasRole(ROLES.FRONT_DESK);

  // Helper functions for admin levels
  const isAnyAdmin = () => isMasterAdmin() || isFullAdmin() || isRegularAdmin();
  const canEdit = () => isMasterAdmin() || isFullAdmin() || isRegularAdmin();
  const canDelete = () => isMasterAdmin() || isFullAdmin();
  const canManageUsers = () => isMasterAdmin();
  const canViewReports = () => isAnyAdmin();

  // Enhanced permission checking
  const hasPermission = (permission) => {
    if (!user) return false;
    
    // Handle backward compatibility - treat 'admin' as 'MasterAdmin'
    const userRole = user.role === 'admin' ? ROLES.MASTER_ADMIN : user.role;
    
    // Master Admin always has all permissions (including variations)
    if (userRole === ROLES.MASTER_ADMIN || user.role === 'admin' || user.role === 'masterAdmin') {
      return true;
    }
    
    // Handle legacy camelCase permissions (canViewInvoices, etc.)
    const legacyPermissionMap = {
      'canCreateInvoices': PERMISSIONS.CREATE_INVOICE,
      'canViewInvoices': PERMISSIONS.VIEW_INVOICES,
      'canViewCustomers': PERMISSIONS.VIEW_CUSTOMERS,
      'canViewRooms': PERMISSIONS.VIEW_ROOMS,
      'canEditInvoices': PERMISSIONS.EDIT_INVOICES,
      'canEditRooms': PERMISSIONS.EDIT_ROOMS,
      'canEditCustomers': PERMISSIONS.EDIT_CUSTOMERS,
      'canDeleteInvoices': PERMISSIONS.DELETE_INVOICES,
      'canDeleteRooms': PERMISSIONS.DELETE_ROOMS,
      'canDeleteCustomers': PERMISSIONS.DELETE_CUSTOMERS,
      'canViewReports': PERMISSIONS.VIEW_REPORTS,
      'canCreateReports': PERMISSIONS.CREATE_REPORTS,
      'canManageUsers': PERMISSIONS.MANAGE_ROLES,
      'canCreateUsers': PERMISSIONS.CREATE_USERS
    };
    
    // Convert legacy permission to actual permission if needed
    const actualPermission = legacyPermissionMap[permission] || permission;
    
    // Check if user has custom permissions array (stored in Firebase)
    if (user.permissions && Array.isArray(user.permissions)) {
      return user.permissions.includes(actualPermission);
    }
    
    // Fall back to role-based permissions
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    return rolePermissions.includes(actualPermission);
  };

  const hasAnyPermission = (permissions) => {
    if (!Array.isArray(permissions)) return false;
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions) => {
    if (!Array.isArray(permissions)) return false;
    return permissions.every(permission => hasPermission(permission));
  };

  const getUserPermissions = () => {
    if (!user) return [];
    
    // Handle backward compatibility - treat 'admin' as 'MasterAdmin'
    const userRole = user.role === 'admin' ? ROLES.MASTER_ADMIN : user.role;
    
    // Return custom permissions if available, otherwise role-based permissions
    return user.permissions || ROLE_PERMISSIONS[userRole] || [];
  };

  // Enhanced role-based checks with permissions
  const canPerformAction = (action) => {
    if (!user) return false;

    // Map legacy actions to new permissions
    const actionPermissionMap = {
      // Basic viewing actions
      'view_dashboard': PERMISSIONS.VIEW_DASHBOARD,
      'view_invoices': PERMISSIONS.VIEW_INVOICES,
      'view_customers': PERMISSIONS.VIEW_CUSTOMERS,
      'view_rooms': PERMISSIONS.VIEW_ROOMS,
      
      // Creation actions
      'create_invoice': PERMISSIONS.CREATE_INVOICE,
      'create_customers': PERMISSIONS.CREATE_CUSTOMERS,
      'create_rooms': PERMISSIONS.CREATE_ROOMS,
      
      // Edit actions
      'edit_invoice': PERMISSIONS.EDIT_INVOICES,
      'edit_rooms': PERMISSIONS.EDIT_ROOMS,
      'edit_customers': PERMISSIONS.EDIT_CUSTOMERS,
      
      // Delete actions
      'delete_invoice': PERMISSIONS.DELETE_INVOICES,
      'delete_rooms': PERMISSIONS.DELETE_ROOMS,
      'delete_customers': PERMISSIONS.DELETE_CUSTOMERS,
      
      // Booking actions
      'view_bookings': PERMISSIONS.VIEW_BOOKINGS,
      'create_booking': PERMISSIONS.CREATE_BOOKING,
      'edit_bookings': PERMISSIONS.EDIT_BOOKINGS,
      'delete_booking': PERMISSIONS.DELETE_BOOKING,
      'manage_bookings': PERMISSIONS.MANAGE_BOOKINGS,
      'confirm_bookings': PERMISSIONS.CONFIRM_BOOKINGS,
      'cancel_bookings': PERMISSIONS.CANCEL_BOOKINGS,
      'checkin_guests': PERMISSIONS.CHECKIN_GUESTS,
      'checkout_guests': PERMISSIONS.CHECKOUT_GUESTS,
      'manage_payments': PERMISSIONS.MANAGE_PAYMENTS,
      'generate_invoice': PERMISSIONS.GENERATE_INVOICE,
      
      // Management actions
      'manage_users': PERMISSIONS.MANAGE_ROLES,
      'create_admin': PERMISSIONS.CREATE_USERS,
      'delete_users': PERMISSIONS.DELETE_USERS,
      'upload_rooms': PERMISSIONS.UPLOAD_ROOMS,
      
      // Reports
      'view_reports': PERMISSIONS.VIEW_REPORTS,
      'export_data': PERMISSIONS.EXPORT_REPORTS
    };

    const requiredPermission = actionPermissionMap[action];
    if (requiredPermission) {
      return hasPermission(requiredPermission);
    }

    // Legacy fallback for unmapped actions
    switch (action) {
      case 'view_dashboard':
      case 'view_invoices':
      case 'view_customers':
      case 'view_rooms':
      case 'view_bookings':
        return true; // All authenticated users can view basic data
      
      case 'create_invoice':
      case 'create_customers':
      case 'create_booking':
        return hasPermission(PERMISSIONS.CREATE_INVOICE) || hasPermission(PERMISSIONS.CREATE_CUSTOMERS) || hasPermission(PERMISSIONS.CREATE_BOOKING);
      
      case 'edit_invoice':
      case 'edit_rooms':
      case 'edit_customers':
      case 'edit_bookings':
        return canEdit();
      
      case 'delete_invoice':
      case 'delete_rooms':
      case 'delete_customers':
      case 'delete_booking':
      case 'upload_rooms':
        return canDelete();
      
      case 'manage_bookings':
      case 'confirm_bookings':
      case 'cancel_bookings':
      case 'checkin_guests':
      case 'checkout_guests':
      case 'manage_payments':
      case 'generate_invoice':
        return hasPermission(PERMISSIONS.MANAGE_BOOKINGS) || hasPermission(PERMISSIONS.CONFIRM_BOOKINGS) || canEdit();
      
      case 'manage_users':
      case 'create_admin':
      case 'delete_users':
        return canManageUsers();
      
      case 'view_reports':
        return canViewReports();
      
      default:
        return false;
    }
  };

  // Legacy permission compatibility method
  const hasLegacyPermission = (permission) => {
    if (!user) return false;
    
    // Handle backward compatibility - treat 'admin' as 'MasterAdmin'
    const userRole = user.role === 'admin' ? ROLES.MASTER_ADMIN : user.role;
    
    // Master Admin always has all permissions (including variations)
    if (userRole === ROLES.MASTER_ADMIN || user.role === 'admin' || user.role === 'masterAdmin') {
      return true;
    }
    
    // Check user role levels
    const isMaster = userRole === ROLES.MASTER_ADMIN;
    const isFull = userRole === ROLES.FULL_ADMIN;
    const isAdminRole = userRole === ROLES.ADMIN; // Renamed from isEdit
    const isAnyAdminRole = isMaster || isFull || isAdminRole;
    
    // Map legacy permissions to new system
    const legacyPermissionMap = {
      // Basic viewing permissions - all users including front desk
      'canCreateInvoices': hasPermission(PERMISSIONS.CREATE_INVOICE),
      'canViewInvoices': hasPermission(PERMISSIONS.VIEW_INVOICES),
      'canViewCustomers': hasPermission(PERMISSIONS.VIEW_CUSTOMERS),
      'canViewRooms': hasPermission(PERMISSIONS.VIEW_ROOMS),
      
      // Edit permissions
      'canEditInvoices': hasPermission(PERMISSIONS.EDIT_INVOICES),
      'canEditRooms': hasPermission(PERMISSIONS.EDIT_ROOMS),
      'canEditCustomers': hasPermission(PERMISSIONS.EDIT_CUSTOMERS),
      
      // Delete permissions
      'canDeleteInvoices': hasPermission(PERMISSIONS.DELETE_INVOICES),
      'canDeleteRooms': hasPermission(PERMISSIONS.DELETE_ROOMS),
      'canDeleteCustomers': hasPermission(PERMISSIONS.DELETE_CUSTOMERS),
      
      // Management permissions
      'canManageRooms': hasPermission(PERMISSIONS.MANAGE_ROOM_INVENTORY),
      'canManageUsers': hasPermission(PERMISSIONS.MANAGE_ROLES),
      'canCreateUsers': hasPermission(PERMISSIONS.CREATE_USERS),
      
      // Reporting permissions
      'canViewReports': hasPermission(PERMISSIONS.VIEW_REPORTS),
      'canViewHistory': hasPermission(PERMISSIONS.VIEW_LOGS),
      'canExportData': hasPermission(PERMISSIONS.EXPORT_REPORTS)
    };
    
    return legacyPermissionMap[permission] || false;
  };

  const getDemoCredentials = () => [
    {
      name: 'Master Administrator',
      email: 'admin@reemresort.com',
      password: 'admin123'
    },
    {
      name: 'Master Administrator (New)',
      email: 'masteradmin@reemresort.com',
      password: 'admin123'
    },
    {
      name: 'Full Access Admin',
      email: 'fulladmin@reemresort.com',
      password: 'admin123'
    },
    {
      name: 'Edit Admin',
      email: 'editadmin@reemresort.com',
      password: 'admin123'
    },
    {
      name: 'View Only Admin',
      email: 'viewadmin@reemresort.com',
      password: 'admin123'
    },
    {
      name: 'Front Desk Staff',
      email: 'frontdesk@reemresort.com',
      password: 'frontdesk123'
    }
  ];

  // Compatibility methods for components expecting SecureAuthContext interface
  const isAdmin = () => isAnyAdmin();

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    error,
    login,
    logout,
    getIdToken: authService.getIdToken,
    hasRole,
    isMasterAdmin,
    isFullAdmin,
    isRegularAdmin, // New Admin role (formerly EditAdmin)
    isFrontDesk,
    isAnyAdmin,
    canEdit,
    canDelete,
    canManageUsers,
    canViewReports,
    isAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasLegacyPermission,
    getUserPermissions,
    canPerformAction,
    getDemoCredentials,
    ROLES,
    PERMISSIONS,
    ROLE_PERMISSIONS
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;