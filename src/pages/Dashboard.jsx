import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Activity,
  AlertTriangle,
  Shield,
  Clock,
  Eye
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user, hasPermission, isAdmin } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    stats: [],
    recentInvoices: [],
    recentActivity: [],
    securityAlerts: []
  });
  const [loading, setLoading] = useState(true);
  
  const getUserName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load data based on user permissions
      const data = {
        stats: await loadStatsData(),
        recentInvoices: hasPermission('canViewInvoices') ? await loadRecentInvoices() : [],
        recentActivity: hasPermission('canViewHistory') ? await loadRecentActivity() : [],
        securityAlerts: isAdmin() ? await loadSecurityAlerts() : []
      };
      
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatsData = async () => {
    // Base stats that all users can see
    const baseStats = [
      {
        title: 'My Profile',
        value: user?.isActive ? 'Active' : 'Inactive',
        icon: Users,
        color: user?.isActive ? 'green' : 'red',
        change: `Role: ${user?.role || 'Unknown'}`,
        show: true
      }
    ];

    const adminStats = [
      {
        title: 'Total Invoices',
        value: '0', // Will be loaded from database
        icon: FileText,
        color: 'blue',
        change: 'No data yet',
        show: hasPermission('canViewInvoices')
      },
      {
        title: 'Total Customers',
        value: '0',
        icon: Users,
        color: 'green',
        change: 'No data yet',
        show: hasPermission('canViewCustomers')
      },
      {
        title: 'Total Revenue',
        value: '$0',
        icon: DollarSign,
        color: 'purple',
        change: 'No data yet',
        show: hasPermission('canViewReports')
      },
      {
        title: 'System Health',
        value: '100%',
        icon: TrendingUp,
        color: 'orange',
        change: 'System ready',
        show: isAdmin()
      }
    ];

    return [...baseStats, ...adminStats.filter(stat => stat.show)];
  };

  const loadRecentInvoices = async () => {
    // Load real invoice data from database
    // For now, return empty array until real data is implemented
    return [];
  };

  const loadRecentActivity = async () => {
    // Load real activity data from database
    // For now, return empty array until real activity tracking is implemented
    return [];
  };

  const loadSecurityAlerts = async () => {
    // Load real security alerts from database
    // For now, return empty array until real security monitoring is implemented
    return [];
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard Overview</h1>
        <p>Welcome back, {getUserName()}! Here's what's happening with your system today.</p>
        {user?.role && (
          <div className="user-role-badge">
            <Shield size={16} />
            <span>{user.role} Access</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {dashboardData.stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`stat-card ${stat.color}`}>
              <div className="stat-icon">
                <Icon size={24} />
              </div>
              <div className="stat-content">
                <h3>{stat.title}</h3>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-change">{stat.change}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-content">
        {/* Recent Invoices - Show only if user has permission */}
        {hasPermission('canViewInvoices') && dashboardData.recentInvoices.length > 0 && (
          <div className="dashboard-section recent-invoices">
            <div className="section-header">
              <h2>
                <FileText size={20} />
                Recent Invoices
              </h2>
              {hasPermission('canCreateInvoices') && (
                <button className="btn btn-primary btn-sm">
                  Create New
                </button>
              )}
            </div>
            <div className="invoice-list">
              {dashboardData.recentInvoices.map((invoice) => (
                <div key={invoice.id} className="invoice-item">
                  <div className="invoice-id">{invoice.id}</div>
                  <div className="invoice-customer">{invoice.customer}</div>
                  <div className="invoice-amount">{invoice.amount}</div>
                  <div className={`invoice-status ${invoice.status.toLowerCase()}`}>
                    {invoice.status}
                  </div>
                  <div className="invoice-date">{invoice.date}</div>
                  {hasPermission('canEditInvoices') && (
                    <div className="invoice-actions">
                      <button className="btn-icon" title="View">
                        <Eye size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity - Show only if user has permission */}
        {hasPermission('canViewHistory') && dashboardData.recentActivity.length > 0 && (
          <div className="dashboard-section recent-activity">
            <div className="section-header">
              <h2>
                <Activity size={20} />
                Recent Activity
              </h2>
            </div>
            <div className="activity-list">
              {dashboardData.recentActivity.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div className={`activity-indicator ${activity.riskLevel}`}></div>
                  <div className="activity-content">
                    <div className="activity-action">{activity.action}</div>
                    <div className="activity-description">{activity.description}</div>
                    <div className="activity-meta">
                      <span className="activity-user">{activity.user}</span>
                      <span className="activity-time">
                        <Clock size={14} />
                        {activity.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security Alerts - Admin only */}
        {isAdmin() && dashboardData.securityAlerts.length > 0 && (
          <div className="dashboard-section security-alerts">
            <div className="section-header">
              <h2>
                <AlertTriangle size={20} />
                Security Alerts
              </h2>
            </div>
            <div className="alert-list">
              {dashboardData.securityAlerts.map((alert) => (
                <div key={alert.id} className={`alert-item ${alert.severity}`}>
                  <AlertTriangle size={16} />
                  <div className="alert-content">
                    <div className="alert-message">{alert.message}</div>
                    <div className="alert-timestamp">{alert.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="dashboard-section quick-actions">
          <div className="section-header">
            <h2>Quick Actions</h2>
          </div>
          <div className="action-grid">
            {hasPermission('canCreateInvoices') && (
              <button className="action-card">
                <FileText size={24} />
                <span>Create Invoice</span>
              </button>
            )}
            {hasPermission('canViewCustomers') && (
              <button className="action-card">
                <Users size={24} />
                <span>Manage Customers</span>
              </button>
            )}
            {hasPermission('canViewReports') && (
              <button className="action-card">
                <TrendingUp size={24} />
                <span>View Reports</span>
              </button>
            )}
            {isAdmin() && (
              <button className="action-card">
                <Shield size={24} />
                <span>System Settings</span>
              </button>
            )}
          </div>
        </div>

        {/* Help Section for New Users */}
        {user?.role === 'user' && (
          <div className="dashboard-section help-section">
            <div className="section-header">
              <h2>Getting Started</h2>
            </div>
            <div className="help-content">
              <p>Welcome to the Reem Resort Invoice System! Here are some things you can do:</p>
              <ul>
                <li>Create and manage invoices for customers</li>
                <li>View customer information and history</li>
                <li>Track your invoice performance</li>
                {hasPermission('canViewReports') && <li>Generate detailed reports</li>}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;