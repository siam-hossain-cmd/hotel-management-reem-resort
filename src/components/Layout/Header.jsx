import React, { useState, useEffect } from 'react';
import { Bell, User, LogOut, Shield, UserCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const { user, logout, isAdmin, hasPermission, ROLES, isMasterAdmin } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    // Load actual notifications from database
    // For now, start with empty array until real notifications are implemented
    setNotifications([]);
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        await logout();
      } catch (error) {
        console.error('Logout failed:', error);
        alert('Logout failed. Please try again.');
      }
    }
  };

  const getRoleIcon = () => {
    if (user?.role === 'masterAdmin') {
      return <Shield size={16} className="role-icon master-admin" />;
    } else if (user?.role === 'admin') {
      return <UserCheck size={16} className="role-icon admin" />;
    } else if (user?.role === 'user') {
      return <User size={16} className="role-icon user" />;
    }
    return <User size={16} className="role-icon" />;
  };

  const getRoleColor = () => {
    if (user?.role === 'masterAdmin') return 'master-admin';
    if (user?.role === 'admin') return 'admin';
    if (user?.role === 'user') return 'user';
    return 'default';
  };

  const getRoleDisplayName = () => {
    if (user?.role === 'masterAdmin') return 'Master Admin';
    if (user?.role === 'admin') return 'Administrator';
    if (user?.role === 'user') return 'User';
    return user?.role || 'Unknown';
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.read).length;
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1>Reem Resort Invoice System</h1>
          <div className="system-status">
            <div className="status-indicator online"></div>
            <span>System Online</span>
          </div>
        </div>
        
        <div className="header-right">
          {/* Notifications */}
          <div className="notifications" onClick={() => setShowDropdown(!showDropdown)}>
            <Bell size={20} />
            {getUnreadCount() > 0 && (
              <span className="notification-badge">{getUnreadCount()}</span>
            )}
            
            {showDropdown && (
              <div className="notification-dropdown">
                <div className="dropdown-header">
                  <h3>Notifications</h3>
                  <span className="notification-count">{getUnreadCount()} unread</span>
                </div>
                
                <div className="notification-list">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 5).map(notification => (
                      <div 
                        key={notification.id} 
                        className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                      >
                        <div className={`notification-type ${notification.type}`}></div>
                        <div className="notification-content">
                          <p>{notification.message}</p>
                          <span className="notification-time">{notification.timestamp}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-notifications">
                      <p>No notifications</p>
                    </div>
                  )}
                </div>
                
                {notifications.length > 5 && (
                  <div className="dropdown-footer">
                    <button className="view-all-btn">View All Notifications</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="user-menu">
            <div className="user-info">
              <div className="user-avatar">
                {getRoleIcon()}
              </div>
              <div className="user-details">
                <span className="user-name">
                  {user?.name || user?.email?.split('@')[0] || 'User'}
                </span>
                <span className={`user-role ${getRoleColor()}`}>
                  {getRoleDisplayName()}
                </span>
                {user?.department && (
                  <span className="user-department">{user.department}</span>
                )}
              </div>
            </div>
            
            <button 
              className="logout-btn"
              onClick={handleLogout}
              title="Secure Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Security Banner for Demo/Dev Environment */}
      {process.env.NODE_ENV === 'development' && (
        <div className="dev-banner">
          <span>🔧 Development Mode - Enhanced Security Active</span>
        </div>
      )}
    </header>
  );
};

export default Header;