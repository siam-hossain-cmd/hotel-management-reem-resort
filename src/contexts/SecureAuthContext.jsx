/**
 * Secure Authentication Context
 * 
 * React context that provides secure authentication state and methods
 * with proper role-based access control and activity tracking.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import secureAuthService from '../services/secureAuthService';
import activityTracker, { ACTIVITY_TYPES } from '../services/activityTracker';

const SecureAuthContext = createContext();

export const useAuth = () => {
  const context = useContext(SecureAuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a SecureAuthProvider');
  }
  return context;
};

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

export const SecureAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        console.log('🚀 Initializing Secure Authentication...');
        
        // Set up auth state listener
        const unsubscribe = secureAuthService.onAuthStateChange((authenticatedUser) => {
          if (mounted) {
            setUser(authenticatedUser);
            setPermissions(secureAuthService.getUserPermissions());
            setLoading(false);
            
            if (authenticatedUser) {
              console.log('✅ User authenticated:', authenticatedUser.email);
              console.log('🔑 Role:', authenticatedUser.role);
              console.log('🛡️ Permissions:', secureAuthService.getUserPermissions());
            } else {
              console.log('ℹ️ No authenticated user');
            }
          }
        });

        // Initialize the auth service
        if (!secureAuthService.initialized) {
          await secureAuthService.init();
        }
        
        return unsubscribe;
      } catch (error) {
        console.error('❌ Auth initialization failed:', error);
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

  // ---------------------------------------------------------------------------
  // AUTHENTICATION METHODS
  // ---------------------------------------------------------------------------

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      console.log('🔐 Attempting secure login for:', email);
      
      const result = await secureAuthService.signIn(email, password);
      
      if (result.success) {
        console.log('✅ Login successful');
        // Note: User state will be updated by the auth state listener
        return { success: true, user: result.user };
      } else {
        console.error('❌ Login failed:', result.error);
        setError(result.error);
        return { success: false, error: result.error, code: result.code };
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
      
      // Log logout activity before signing out
      if (user) {
        await activityTracker.logAuth(user.uid, ACTIVITY_TYPES.LOGOUT);
      }
      
      const result = await secureAuthService.signOut();
      
      if (result.success) {
        setUser(null);
        setPermissions(null);
        setError(null);
        console.log('✅ Logout successful');
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const createUser = async (userData) => {
    try {
      if (!hasPermission('canManageUsers')) {
        throw new Error('Insufficient permissions to create users');
      }

      setError(null);
      console.log('👤 Creating new user:', userData.email);
      
      const result = await secureAuthService.createUser(userData, user.uid);
      
      if (result.success) {
        console.log('✅ User created successfully');
        return { success: true, user: result.user };
      } else {
        console.error('❌ User creation failed:', result.error);
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ User creation error:', error);
      const errorMessage = error.message || 'Failed to create user';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // ---------------------------------------------------------------------------
  // ROLE & PERMISSION METHODS
  // ---------------------------------------------------------------------------

  const hasRole = (role) => {
    return user && user.role === role;
  };

  const isAdmin = () => hasRole(ROLES.ADMIN);
  const isUser = () => hasRole(ROLES.USER);

  const hasPermission = (permission) => {
    if (!permissions) return false;
    return permissions[permission] === true;
  };

  const canPerformAction = (action) => {
    if (!user) return false;

    const actionPermissions = {
      'create_invoice': ['canCreateInvoices'],
      'edit_invoice': ['canEditInvoices'],
      'delete_invoice': ['canDeleteInvoices'],
      'view_reports': ['canViewReports'],
      'manage_rooms': ['canManageRooms'],
      'manage_users': ['canManageUsers'],
      'view_history': ['canViewHistory'],
      'export_data': ['canExportData']
    };

    const requiredPermissions = actionPermissions[action];
    if (!requiredPermissions) return false;

    return requiredPermissions.every(permission => hasPermission(permission));
  };

  // ---------------------------------------------------------------------------
  // UTILITY METHODS
  // ---------------------------------------------------------------------------

  const getUserDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const getUserRoleDisplay = () => {
    if (user?.role === ROLES.ADMIN) return 'Administrator';
    if (user?.role === ROLES.USER) return 'User';
    return 'Unknown';
  };

  const getDashboardData = () => {
    return {
      canViewStats: hasPermission('canViewReports'),
      canViewAllInvoices: hasPermission('canEditInvoices') || hasPermission('canDeleteInvoices'),
      canManageSystem: hasPermission('canManageUsers') || hasPermission('canManageRooms'),
      showAdvancedFeatures: isAdmin()
    };
  };

  const getNavigationItems = () => {
    const baseItems = [
      { path: '/dashboard', label: 'Dashboard', icon: 'Home' }
    ];

    const conditionalItems = [
      { 
        path: '/invoices', 
        label: 'Invoices', 
        icon: 'FileText',
        condition: hasPermission('canCreateInvoices') || hasPermission('canEditInvoices')
      },
      { 
        path: '/create-invoice', 
        label: 'Create Invoice', 
        icon: 'Plus',
        condition: hasPermission('canCreateInvoices')
      },
      { 
        path: '/customers', 
        label: 'Customers', 
        icon: 'Users',
        condition: hasPermission('canCreateInvoices')
      },
      { 
        path: '/rooms', 
        label: 'Rooms', 
        icon: 'Bed',
        condition: hasPermission('canManageRooms') || hasPermission('canCreateInvoices')
      },
      { 
        path: '/reports', 
        label: 'Reports', 
        icon: 'BarChart',
        condition: hasPermission('canViewReports')
      },
      { 
        path: '/users', 
        label: 'User Management', 
        icon: 'Shield',
        condition: hasPermission('canManageUsers')
      },
      { 
        path: '/history', 
        label: 'Activity History', 
        icon: 'Clock',
        condition: hasPermission('canViewHistory')
      },
      { 
        path: '/settings', 
        label: 'Settings', 
        icon: 'Settings',
        condition: isAdmin()
      }
    ];

    return [
      ...baseItems,
      ...conditionalItems.filter(item => item.condition)
    ];
  };

  // ---------------------------------------------------------------------------
  // CONTEXT VALUE
  // ---------------------------------------------------------------------------

  const value = {
    // State
    user,
    permissions,
    isAuthenticated: !!user,
    loading,
    error,

    // Authentication methods
    login,
    logout,
    createUser,

    // Role checking
    hasRole,
    isAdmin,
    isUser,

    // Permission checking
    hasPermission,
    canPerformAction,

    // Utility methods
    getUserDisplayName,
    getUserRoleDisplay,
    getDashboardData,
    getNavigationItems,

    // Constants
    ROLES
  };

  return (
    <SecureAuthContext.Provider value={value}>
      {children}
    </SecureAuthContext.Provider>
  );
};

export default SecureAuthContext;