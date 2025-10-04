import React from 'react';
import { Users, Shield, UserCog, ArrowRight, Settings, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminManagement = () => {
  const { user, isMasterAdmin, isAnyAdmin } = useAuth();

  if (!isMasterAdmin()) {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You don't have permission to access admin management.</p>
      </div>
    );
  }

  return (
    <div className="admin-management">
      <div className="page-header">
        <div>
          <h1><Shield size={32} /> Admin Management</h1>
          <p>Manage system administration and user access controls</p>
        </div>
      </div>

      <div className="admin-cards">
        <div className="admin-card">
          <div className="card-icon user-management">
            <UserCog size={32} />
          </div>
          <div className="card-content">
            <h3>User Management</h3>
            <p>Create, edit, and manage admin users with different access levels</p>
            <ul>
              <li>Create Master, Full, Edit, and View admins</li>
              <li>Assign role-based permissions</li>
              <li>Manage user access levels</li>
            </ul>
            <Link to="/users" className="btn btn-primary">
              <UserCog size={20} />
              Manage Users
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="admin-card">
          <div className="card-icon reports">
            <BarChart3 size={32} />
          </div>
          <div className="card-content">
            <h3>System Reports</h3>
            <p>View comprehensive system analytics and user activity reports</p>
            <ul>
              <li>User activity tracking</li>
              <li>Login and access logs</li>
              <li>System performance metrics</li>
            </ul>
            <Link to="/reports" className="btn btn-primary">
              <BarChart3 size={20} />
              View Reports
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="admin-card">
          <div className="card-icon settings">
            <Settings size={32} />
          </div>
          <div className="card-content">
            <h3>System Settings</h3>
            <p>Configure system-wide settings and preferences</p>
            <ul>
              <li>Security configurations</li>
              <li>Application settings</li>
              <li>System maintenance</li>
            </ul>
            <Link to="/settings" className="btn btn-primary">
              <Settings size={20} />
              System Settings
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="admin-card">
          <div className="card-icon dashboard">
            <Users size={32} />
          </div>
          <div className="card-content">
            <h3>Dashboard Overview</h3>
            <p>Monitor system status and key performance indicators</p>
            <ul>
              <li>Active user sessions</li>
              <li>System health status</li>
              <li>Recent activities</li>
            </ul>
            <Link to="/dashboard" className="btn btn-primary">
              <Users size={20} />
              View Dashboard
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      <div className="admin-info">
        <div className="current-admin">
          <h3>Current Admin Session</h3>
          <div className="admin-details">
            <div className="detail-item">
              <strong>Name:</strong> {user?.name || 'Unknown'}
            </div>
            <div className="detail-item">
              <strong>Email:</strong> {user?.email || 'Unknown'}
            </div>
            <div className="detail-item">
              <strong>Role:</strong> 
              <span className={`role-badge ${user?.role?.toLowerCase()}`}>
                <Shield size={14} />
                {user?.role || 'Unknown'}
              </span>
            </div>
            <div className="detail-item">
              <strong>Access Level:</strong> Master Administrator (Full System Control)
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <Link to="/users" className="action-btn">
              <UserCog size={20} />
              Add New Admin
            </Link>
            <Link to="/reports" className="action-btn">
              <BarChart3 size={20} />
              View Activity Logs
            </Link>
            <Link to="/settings" className="action-btn">
              <Settings size={20} />
              Configure System
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminManagement;