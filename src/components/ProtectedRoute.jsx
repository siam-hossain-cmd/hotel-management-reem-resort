import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, AlertTriangle, Lock } from 'lucide-react';

const ProtectedRoute = ({ 
  children, 
  role = null, 
  permission = null, 
  requiresAny = false, // If true, user needs ANY of the specified permissions
  minAdminLevel = null // Specify minimum admin level required
}) => {
  const { user, loading, isAuthenticated, hasRole, hasPermission, isAdmin, ROLES } = useAuth();

  // Admin level hierarchy for checking minimum levels
  const adminLevels = {
    'admin': 5, // Backward compatibility for old admin role (highest level)
    'masterAdmin': 5, // Alternative master admin naming
    [ROLES.FRONT_DESK]: 1,
    [ROLES.ADMIN]: 2,
    [ROLES.FULL_ADMIN]: 3,
    [ROLES.MASTER_ADMIN]: 5 // Highest level
  };

  const hasMinAdminLevel = (minLevel) => {
    if (!user || !minLevel) return true;
    const userLevel = adminLevels[user.role] || 0;
    const requiredLevel = adminLevels[minLevel] || 0;
    return userLevel >= requiredLevel;
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner-large">
          <div className="spinner"></div>
          <p>Verifying access permissions...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user account is active
  if (user && !user.isActive) {
    return (
      <div className="access-denied">
        <div className="access-denied-content">
          <AlertTriangle size={48} color="#e53e3e" />
          <h1>Account Disabled</h1>
          <p>Your account has been disabled. Please contact an administrator.</p>
          <div className="access-denied-details">
            <p><strong>User:</strong> {user.email}</p>
            <p><strong>Status:</strong> Inactive</p>
          </div>
        </div>
      </div>
    );
  }

  // Master Admin bypass - Master Admin should have access to everything
  const isMasterAdmin = user?.role === 'MasterAdmin' || user?.role === 'admin' || user?.role === 'masterAdmin';
  
  if (isMasterAdmin) {
    // Master Admin bypasses all restrictions
    return children;
  }

  // Check minimum admin level requirement
  if (minAdminLevel && !hasMinAdminLevel(minAdminLevel)) {
    return (
      <div className="access-denied">
        <div className="access-denied-content">
          <Shield size={48} color="#e53e3e" />
          <h1>Insufficient Admin Level</h1>
          <p>You need a higher admin level to access this page.</p>
          <div className="access-denied-details">
            <p><strong>Your Level:</strong> {user?.role || 'Unknown'}</p>
            <p><strong>Required Level:</strong> {minAdminLevel} or higher</p>
          </div>
          <button 
            onClick={() => window.history.back()}
            className="btn btn-secondary"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Check role requirements (Master Admin bypassed above)
  if (role) {
    const hasRequiredRole = Array.isArray(role) 
      ? role.some(r => hasRole(r))
      : hasRole(role);
    
    if (!hasRequiredRole) {
      return (
        <div className="access-denied">
          <div className="access-denied-content">
            <Shield size={48} color="#e53e3e" />
            <h1>Insufficient Role</h1>
            <p>You don't have the required role to access this page.</p>
            <div className="access-denied-details">
              <p><strong>Your Role:</strong> {user?.role || 'Unknown'}</p>
              <p><strong>Required Role:</strong> {Array.isArray(role) ? role.join(' or ') : role}</p>
            </div>
            <button 
              onClick={() => window.history.back()}
              className="btn btn-secondary"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  // Check permission requirements (Master Admin bypassed above)
  if (permission) {
    const permissions = Array.isArray(permission) ? permission : [permission];
    const hasRequiredPermission = requiresAny
      ? permissions.some(p => hasPermission(p))
      : permissions.every(p => hasPermission(p));

    if (!hasRequiredPermission) {
      return (
        <div className="access-denied">
          <div className="access-denied-content">
            <Lock size={48} color="#e53e3e" />
            <h1>Access Denied</h1>
            <p>You don't have the required permissions to access this page.</p>
            <div className="access-denied-details">
              <p><strong>Your Role:</strong> {user?.role || 'Unknown'}</p>
              <p><strong>Required Permission:</strong> {Array.isArray(permission) ? permission.join(requiresAny ? ' or ' : ' and ') : permission}</p>
            </div>
            
            {/* Show hint for admins */}
            {isAdmin() && (
              <div className="admin-hint">
                <p><strong>Admin Note:</strong> Contact system administrator to adjust user permissions.</p>
              </div>
            )}
            
            <div className="access-denied-actions">
              <button 
                onClick={() => window.history.back()}
                className="btn btn-secondary"
              >
                Go Back
              </button>
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="btn btn-primary"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  // All checks passed - render the protected content
  return children;
};

export default ProtectedRoute;