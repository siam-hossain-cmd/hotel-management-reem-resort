import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../firebase/config';
import { Users, Plus, Edit, Trash2, Shield, Eye, Settings, Crown } from 'lucide-react';
import PermissionsVisualization from '../components/PermissionsVisualization';

const UserManagement = () => {
  const { user, isMasterAdmin, ROLES, ROLE_PERMISSIONS, PERMISSIONS } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: ROLES.FRONT_DESK, // Changed default from VIEW_ADMIN to FRONT_DESK
    name: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id, // This will be the UID
        uid: doc.id, // Make sure we also have uid for consistency
        ...doc.data()
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        newUser.email, 
        newUser.password
      );
      
      // Get role-based permissions
      const rolePermissions = ROLE_PERMISSIONS[newUser.role] || [];
      
      // Prepare user data
      const userData = {
        uid: userCredential.user.uid,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
        permissions: rolePermissions, // Store permissions array
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user?.uid,
        status: 'active',
        isActive: true, // Immediately activate the account
        lastLogin: null,
        loginCount: 0
      };
      
      console.log('📝 Creating user with data:', userData);
      
      // Add user data to Firestore using UID as document ID
      await setDoc(doc(db, 'users', userCredential.user.uid), userData);

      console.log('✅ User created successfully in Firestore');
      alert(
        `✅ User created successfully!\n\n` +
        `📧 Email: ${newUser.email}\n` +
        `🔑 Password: ${newUser.password}\n` +
        `👤 Role: ${newUser.role}\n` +
        `📊 Permissions: ${rolePermissions.length} permissions\n\n` +
        `⚠️ IMPORTANT: Share these credentials with the user!\n` +
        `They can change their password in Settings after first login.`
      );
      setNewUser({ email: '', password: '', role: ROLES.FRONT_DESK, name: '' });
      setShowAddUser(false);
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      if (error.code === 'auth/email-already-in-use') {
        alert(
          '⚠️ Email Already Exists!\n\n' +
          `The email "${newUser.email}" is already registered in Firebase Auth.\n\n` +
          'This user already exists and can log in with their password.\n' +
          'If they forgot their password, you need to delete and recreate the user.'
        );
      } else {
        alert('Error creating user: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      // Get new role permissions
      const rolePermissions = ROLE_PERMISSIONS[newRole] || [];
      
      const userDoc = doc(db, 'users', userId);
      await updateDoc(userDoc, {
        role: newRole,
        permissions: rolePermissions, // Update permissions when role changes
        updatedAt: new Date().toISOString(),
        updatedBy: user?.uid
      });
      
      alert('User role and permissions updated successfully!');
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Error updating user role: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        alert('User deleted successfully!');
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user: ' + error.message);
      }
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case ROLES.MASTER_ADMIN:
        return <Crown className="role-icon master-admin" />;
      case ROLES.FULL_ADMIN:
        return <Shield className="role-icon full-admin" />;
      case ROLES.ADMIN: // Updated from EDIT_ADMIN
        return <Settings className="role-icon admin" />;
      case ROLES.FRONT_DESK:
        return <Eye className="role-icon front-desk" />;
      default:
        return <Users size={16} className="role-icon" />;
    }
  };

  const getRoleDescription = (role) => {
    switch (role) {
      case ROLES.MASTER_ADMIN:
        return 'Full system access + user management';
      case ROLES.FULL_ADMIN:
        return 'Full access to all features except user management';
      case ROLES.ADMIN:
      case 'Admin': // Handle both new and old references
      case ROLES.EDIT_ADMIN: // Backward compatibility
      case 'EditAdmin':
        return 'Can create and edit invoices, customers, and rooms';
      case ROLES.FRONT_DESK:
      case 'FrontDesk':
        return 'View only access - no create/edit/delete permissions';
      // Remove ViewAdmin references
      default:
        return 'Unknown role';
    }
  };

  if (!isMasterAdmin()) {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You don't have permission to manage users.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="user-management">
      <div className="page-header">
        <div>
          <h1><Users size={32} /> User Management</h1>
          <p>Manage admin users and their access levels</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddUser(true)}
        >
          <Plus size={20} />
          Add New Admin
        </button>
      </div>

      {/* Role Legend */}
      <div className="role-legend">
        <h3>Admin Access Levels</h3>
        <div className="role-cards">
          <div className="role-card master">
            <Crown size={24} />
            <h4>Master Admin</h4>
            <p>Complete system control including user management</p>
          </div>
          <div className="role-card full">
            <Shield size={24} />
            <h4>Full Admin</h4>
            <p>Full access to all features, can edit and delete</p>
          </div>
          <div className="role-card admin">
            <Settings size={24} />
            <h4>Admin</h4>
            <p>Can create, edit and delete content</p>
          </div>
          <div className="role-card frontdesk">
            <Eye size={24} />
            <h4>Front Desk Staff</h4>
            <p>View-only access to system data</p>
          </div>
        </div>
      </div>

      {showAddUser && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3><Plus size={24} /> Add New Admin User</h3>
              <button 
                className="close-btn"
                onClick={() => setShowAddUser(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddUser} className="modal-body">
              <div className="form-group">
                <label>Full Name:</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email Address:</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="admin@reemresort.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="form-group">
                <label>Password:</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="Minimum 6 characters"
                  required
                  minLength="6"
                  autoComplete="new-password"
                />
              </div>
              <div className="form-group">
                <label>Admin Level:</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  required
                >
                  <option value="FrontDesk">Front Desk (View Only)</option>
                  <option value="Admin">Admin (Create & Edit)</option>
                  <option value="FullAdmin">Full Admin (All Access)</option>
                  <option value="MasterAdmin">Master Admin (System Control)</option>
                </select>
                <small className="role-description">
                  {getRoleDescription(newUser.role)}
                </small>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Admin User'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowAddUser(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="users-list">
        <h3>Current Admin Users ({users.length})</h3>
        <div className="users-table">
          <div className="table-header">
            <div>Admin Details</div>
            <div>Access Level</div>
            <div>Status</div>
            <div>Actions</div>
          </div>
          {users.map(userItem => (
            <div key={userItem.id} className="table-row">
              <div className="user-details">
                <div className="user-name">{userItem.name}</div>
                <div className="user-email">{userItem.email}</div>
                <div className="user-meta">
                  {userItem.createdAt && (
                    <small>Created: {new Date(userItem.createdAt).toLocaleDateString()}</small>
                  )}
                </div>
              </div>
              <div className="user-role">
                <div className="role-selector">
                  {getRoleIcon(userItem.role)}
                  <select
                    value={userItem.role}
                    onChange={(e) => handleRoleChange(userItem.id, e.target.value)}
                    disabled={userItem.email === user?.email} // Can't change own role
                    className="role-select"
                  >
                    <option value="FrontDesk">Front Desk</option>
                    <option value="Admin">Admin</option>
                    <option value="FullAdmin">Full Admin</option>
                    <option value="MasterAdmin">Master Admin</option>
                  </select>
                </div>
                <small className="role-description">
                  {getRoleDescription(userItem.role)}
                </small>
                {userItem.permissions && (
                  <div className="permissions-count">
                    <small>Permissions: {userItem.permissions.length}</small>
                  </div>
                )}
              </div>
              <div className="user-status">
                <span className={`status-badge ${userItem.status || 'active'}`}>
                  {userItem.status || 'Active'}
                </span>
              </div>
              <div className="user-actions">
                {userItem.email !== user?.email && (
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteUser(userItem.id)}
                    title="Delete User"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                {userItem.email === user?.email && (
                  <span className="current-user-badge">You</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Permissions Visualization */}
      <PermissionsVisualization 
        ROLES={ROLES} 
        PERMISSIONS={PERMISSIONS} 
        ROLE_PERMISSIONS={ROLE_PERMISSIONS} 
      />
    </div>
  );
};

export default UserManagement;