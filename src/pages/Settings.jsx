import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import authService from '../firebase/authService';
import { Settings as SettingsIcon, Lock, User, Mail, Shield, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import './Settings.css';

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ 
        type: 'error', 
        text: 'New password and confirm password do not match' 
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ 
        type: 'error', 
        text: 'Password must be at least 6 characters long' 
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      const result = await authService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );

      if (result.success) {
        setPasswordMessage({ 
          type: 'success', 
          text: 'Password changed successfully!' 
        });
        // Clear form
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setPasswordMessage({ 
          type: 'error', 
          text: result.error || 'Failed to change password' 
        });
      }
    } catch (error) {
      setPasswordMessage({ 
        type: 'error', 
        text: 'An error occurred while changing password' 
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'MasterAdmin':
        return 'role-badge-master';
      case 'FullAdmin':
        return 'role-badge-full';
      case 'Admin':
        return 'role-badge-admin';
      case 'FrontDesk':
        return 'role-badge-front';
      default:
        return 'role-badge-default';
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div className="header-left">
          <SettingsIcon size={32} />
          <div>
            <h1>Settings</h1>
            <p>Manage your account settings and preferences</p>
          </div>
        </div>
      </div>

      <div className="settings-container">
        <div className="settings-tabs">
          <button
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} />
            Profile
          </button>
          <button
            className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Lock size={18} />
            Security
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'profile' && (
            <div className="settings-section">
              <h2>Profile Information</h2>
              <div className="profile-card">
                <div className="profile-avatar">
                  <User size={48} />
                </div>
                <div className="profile-details">
                  <div className="detail-row">
                    <div className="detail-label">
                      <User size={16} />
                      Full Name
                    </div>
                    <div className="detail-value">{user?.name || 'N/A'}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">
                      <Mail size={16} />
                      Email Address
                    </div>
                    <div className="detail-value">{user?.email || 'N/A'}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">
                      <Shield size={16} />
                      Role
                    </div>
                    <div className="detail-value">
                      <span className={`role-badge ${getRoleBadgeClass(user?.role)}`}>
                        {user?.role || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-section">
              <h2>Change Password</h2>
              <div className="security-card">
                <p className="section-description">
                  Update your password to keep your account secure. Your password must be at least 6 characters long.
                </p>

                {passwordMessage.text && (
                  <div className={`message-box ${passwordMessage.type}`}>
                    {passwordMessage.type === 'success' ? (
                      <CheckCircle size={20} />
                    ) : (
                      <XCircle size={20} />
                    )}
                    <span>{passwordMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handlePasswordChange} className="password-form">
                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <div className="password-input-wrapper">
                      <Lock size={18} className="input-icon" />
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        id="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value
                        })}
                        placeholder="Enter your current password"
                        required
                        disabled={isChangingPassword}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        disabled={isChangingPassword}
                      >
                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <div className="password-input-wrapper">
                      <Lock size={18} className="input-icon" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        id="newPassword"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value
                        })}
                        placeholder="Enter your new password"
                        required
                        minLength="6"
                        disabled={isChangingPassword}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        disabled={isChangingPassword}
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <div className="password-input-wrapper">
                      <Lock size={18} className="input-icon" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value
                        })}
                        placeholder="Confirm your new password"
                        required
                        minLength="6"
                        disabled={isChangingPassword}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isChangingPassword}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={isChangingPassword}
                    >
                      {isChangingPassword ? (
                        <>
                          <span className="spinner"></span>
                          Changing Password...
                        </>
                      ) : (
                        <>
                          <Lock size={18} />
                          Change Password
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <div className="security-tips">
                  <h3>Password Security Tips</h3>
                  <ul>
                    <li>Use a strong password with at least 6 characters</li>
                    <li>Include a mix of letters, numbers, and symbols</li>
                    <li>Don't use common words or personal information</li>
                    <li>Change your password regularly</li>
                    <li>Never share your password with anyone</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
