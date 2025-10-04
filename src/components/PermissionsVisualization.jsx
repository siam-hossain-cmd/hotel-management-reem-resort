import React from 'react';
import { Shield, Crown, Edit3, Eye, Users } from 'lucide-react';

const PermissionsVisualization = ({ ROLES, PERMISSIONS, ROLE_PERMISSIONS }) => {
  const getRoleIcon = (role) => {
    switch (role) {
      case ROLES.MASTER_ADMIN:
        return <Crown size={20} />;
      case ROLES.FULL_ADMIN:
        return <Shield size={20} />;
      case ROLES.EDIT_ADMIN:
        return <Edit3 size={20} />;
      case ROLES.VIEW_ADMIN:
        return <Eye size={20} />;
      case ROLES.FRONT_DESK:
        return <Users size={20} />;
      default:
        return <Users size={20} />;
    }
  };

  const categorizePermissions = (permissions) => {
    const categories = {
      'Dashboard & Analytics': [],
      'Invoice Management': [],
      'Customer Management': [],
      'Room Management': [],
      'User Management': [],
      'Reports & Analytics': [],
      'System Administration': [],
      'Security & Audit': []
    };

    permissions.forEach(permission => {
      if (permission.includes('dashboard') || permission.includes('analytics')) {
        categories['Dashboard & Analytics'].push(permission);
      } else if (permission.includes('invoice')) {
        categories['Invoice Management'].push(permission);
      } else if (permission.includes('customer')) {
        categories['Customer Management'].push(permission);
      } else if (permission.includes('room')) {
        categories['Room Management'].push(permission);
      } else if (permission.includes('user') || permission.includes('role')) {
        categories['User Management'].push(permission);
      } else if (permission.includes('report')) {
        categories['Reports & Analytics'].push(permission);
      } else if (permission.includes('setting') || permission.includes('backup') || permission.includes('api') || permission.includes('billing')) {
        categories['System Administration'].push(permission);
      } else if (permission.includes('security') || permission.includes('audit') || permission.includes('log')) {
        categories['Security & Audit'].push(permission);
      }
    });

    return categories;
  };

  const formatPermissionName = (permission) => {
    return permission
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case ROLES.MASTER_ADMIN:
        return 'Master Admin';
      case ROLES.FULL_ADMIN:
        return 'Full Admin';
      case ROLES.EDIT_ADMIN:
        return 'Edit Admin';
      case ROLES.VIEW_ADMIN:
        return 'View Admin';
      case ROLES.FRONT_DESK:
        return 'Front Desk';
      default:
        return role;
    }
  };

  const getRoleClass = (role) => {
    return role.toLowerCase().replace('_', '');
  };

  return (
    <div className="role-permissions">
      <h3>🔐 Role-Based Permissions Structure</h3>
      
      {Object.entries(ROLE_PERMISSIONS).map(([role, permissions]) => {
        const categories = categorizePermissions(permissions);
        
        return (
          <div key={role} style={{ marginBottom: '2rem' }}>
            <div className={`role-badge expanded ${getRoleClass(role)}`}>
              {getRoleIcon(role)}
              <span>{getRoleDisplayName(role)} ({permissions.length} permissions)</span>
            </div>
            
            <div className="permissions-grid">
              {Object.entries(categories).map(([categoryName, categoryPermissions]) => {
                if (categoryPermissions.length === 0) return null;
                
                return (
                  <div key={categoryName} className="permission-category">
                    <h4>{categoryName}</h4>
                    <ul className="permission-list">
                      {categoryPermissions.map(permission => (
                        <li key={permission} className="permission-item">
                          {formatPermissionName(permission)}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      
      <div style={{ 
        background: '#f0f9ff', 
        border: '1px solid #0ea5e9', 
        borderRadius: '8px', 
        padding: '1rem', 
        marginTop: '2rem' 
      }}>
        <h4 style={{ color: '#0c4a6e', marginBottom: '0.5rem' }}>📋 Permission System Features:</h4>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#0c4a6e' }}>
          <li>✅ <strong>Role-based permissions</strong> automatically assigned</li>
          <li>✅ <strong>Custom permissions</strong> can be added per user</li>
          <li>✅ <strong>Firebase storage</strong> with real-time sync</li>
          <li>✅ <strong>Backward compatibility</strong> with existing system</li>
          <li>✅ <strong>Granular access control</strong> for all features</li>
        </ul>
      </div>
    </div>
  );
};

export default PermissionsVisualization;