import React, { useState } from 'react';
import { BarChart3, Users, FileText, TrendingUp, Calendar, Download, Filter, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Reports = () => {
  const { user, isMasterAdmin, isAnyAdmin } = useAuth();
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState('month');

  if (!isMasterAdmin()) {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You don't have permission to access reports.</p>
      </div>
    );
  }

  const reportTypes = [
    { id: 'overview', name: 'System Overview', icon: BarChart3 },
    { id: 'users', name: 'User Activity', icon: Users },
    { id: 'invoices', name: 'Invoice Reports', icon: FileText },
    { id: 'analytics', name: 'Analytics', icon: TrendingUp }
  ];

  const mockData = {
    overview: {
      totalUsers: 15,
      activeUsers: 12,
      totalInvoices: 247,
      monthlyRevenue: '$45,230'
    },
    users: [
      { name: 'John Doe', role: 'MasterAdmin', lastLogin: '2024-01-15 10:30', status: 'Active' },
      { name: 'Jane Smith', role: 'FullAdmin', lastLogin: '2024-01-15 09:15', status: 'Active' },
      { name: 'Bob Wilson', role: 'Admin', lastLogin: '2024-01-14 16:45', status: 'Active' }
    ],
    invoices: {
      total: 247,
      pending: 12,
      paid: 220,
      overdue: 15
    }
  };

  const renderOverview = () => (
    <div className="reports-overview">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon users">
            <Users size={32} />
          </div>
          <div className="stat-content">
            <h3>Total Users</h3>
            <div className="stat-number">{mockData.overview.totalUsers}</div>
            <div className="stat-change positive">+3 this month</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon active">
            <Users size={32} />
          </div>
          <div className="stat-content">
            <h3>Active Users</h3>
            <div className="stat-number">{mockData.overview.activeUsers}</div>
            <div className="stat-change positive">+2 this week</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon invoices">
            <FileText size={32} />
          </div>
          <div className="stat-content">
            <h3>Total Invoices</h3>
            <div className="stat-number">{mockData.overview.totalInvoices}</div>
            <div className="stat-change positive">+18 this month</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon revenue">
            <TrendingUp size={32} />
          </div>
          <div className="stat-content">
            <h3>Monthly Revenue</h3>
            <div className="stat-number">{mockData.overview.monthlyRevenue}</div>
            <div className="stat-change positive">+12% from last month</div>
          </div>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-placeholder">
          <BarChart3 size={48} />
          <h3>Revenue Trends</h3>
          <p>Interactive charts will be displayed here</p>
        </div>
      </div>
    </div>
  );

  const renderUserActivity = () => (
    <div className="user-activity-report">
      <div className="activity-table">
        <div className="table-header">
          <div>User</div>
          <div>Role</div>
          <div>Last Login</div>
          <div>Status</div>
          <div>Actions</div>
        </div>
        {mockData.users.map((user, index) => (
          <div key={index} className="table-row">
            <div className="user-info">
              <div className="user-avatar">{user.name.charAt(0)}</div>
              <span>{user.name}</span>
            </div>
            <div className={`role-badge ${user.role.toLowerCase()}`}>
              {user.role}
            </div>
            <div className="last-login">{user.lastLogin}</div>
            <div className={`status ${user.status.toLowerCase()}`}>
              {user.status}
            </div>
            <div className="actions">
              <button className="btn btn-sm btn-secondary">View Details</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderInvoiceReports = () => (
    <div className="invoice-reports">
      <div className="invoice-stats">
        <div className="invoice-stat">
          <div className="stat-label">Total Invoices</div>
          <div className="stat-value">{mockData.invoices.total}</div>
        </div>
        <div className="invoice-stat pending">
          <div className="stat-label">Pending</div>
          <div className="stat-value">{mockData.invoices.pending}</div>
        </div>
        <div className="invoice-stat paid">
          <div className="stat-label">Paid</div>
          <div className="stat-value">{mockData.invoices.paid}</div>
        </div>
        <div className="invoice-stat overdue">
          <div className="stat-label">Overdue</div>
          <div className="stat-value">{mockData.invoices.overdue}</div>
        </div>
      </div>

      <div className="chart-placeholder">
        <FileText size={48} />
        <h3>Invoice Status Distribution</h3>
        <p>Pie chart showing invoice status breakdown</p>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="analytics-report">
      <div className="chart-placeholder">
        <TrendingUp size={48} />
        <h3>Advanced Analytics</h3>
        <p>Detailed performance metrics and trends</p>
      </div>
    </div>
  );

  return (
    <div className="reports">
      <div className="page-header">
        <div>
          <h1><BarChart3 size={32} /> Reports & Analytics</h1>
          <p>Comprehensive system reports and data insights</p>
        </div>
        <div className="header-actions">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="date-range-select"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
          <button className="btn btn-primary">
            <Download size={20} />
            Export Report
          </button>
        </div>
      </div>

      <div className="reports-nav">
        {reportTypes.map((report) => {
          const IconComponent = report.icon;
          return (
            <button
              key={report.id}
              className={`report-nav-item ${selectedReport === report.id ? 'active' : ''}`}
              onClick={() => setSelectedReport(report.id)}
            >
              <IconComponent size={20} />
              {report.name}
            </button>
          );
        })}
      </div>

      <div className="reports-content">
        {selectedReport === 'overview' && renderOverview()}
        {selectedReport === 'users' && renderUserActivity()}
        {selectedReport === 'invoices' && renderInvoiceReports()}
        {selectedReport === 'analytics' && renderAnalytics()}
      </div>

      <div className="report-footer">
        <div className="report-info">
          <Calendar size={16} />
          <span>Last updated: {new Date().toLocaleString()}</span>
        </div>
        <div className="report-actions">
          <button className="btn btn-secondary">
            <Filter size={16} />
            Apply Filters
          </button>
          <button className="btn btn-secondary">
            <Search size={16} />
            Search Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;