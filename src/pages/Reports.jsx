import React, { useState } from 'react';
import { BarChart3, Users, FileText, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Reports = () => {
  const { isAnyAdmin } = useAuth();
  const [activeReport, setActiveReport] = useState('overview');

  if (!isAnyAdmin()) {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You don't have permission to view reports.</p>
      </div>
    );
  }

  const reportTabs = [
    { id: 'overview', name: 'System Overview', icon: BarChart3 },
    { id: 'users', name: 'User Activity', icon: Users },
    { id: 'invoices', name: 'Invoice Reports', icon: FileText },
    { id: 'analytics', name: 'Analytics', icon: TrendingUp }
  ];

  const renderContent = () => {
    switch (activeReport) {
      case 'overview':
        return (
          <div className="reports-overview">
            <div className="empty-state">
              <FileText size={64} />
              <h3>No Data Available</h3>
              <p>Reports will show real data once invoices and activities are created.</p>
            </div>
          </div>
        );
      case 'users':
        return (
          <div className="user-reports">
            <div className="empty-state">
              <Users size={64} />
              <h3>No User Data</h3>
              <p>User activity will appear here once users start using the system.</p>
            </div>
          </div>
        );
      case 'invoices':
        return (
          <div className="invoice-reports">
            <div className="empty-state">
              <FileText size={64} />
              <h3>No Invoice Data</h3>
              <p>Invoice analytics will appear here once invoices are created.</p>
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="analytics-reports">
            <div className="empty-state">
              <TrendingUp size={64} />
              <h3>Analytics Coming Soon</h3>
              <p>Advanced analytics and insights will be available once data is collected.</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="empty-state">
            <BarChart3 size={64} />
            <h3>Select a Report</h3>
            <p>Choose a report type from the tabs above.</p>
          </div>
        );
    }
  };

  return (
    <div className="reports">
      <div className="page-header">
        <h1>Reports & Analytics</h1>
        <p>View system reports and analytics data</p>
      </div>

      <div className="reports-container">
        <div className="reports-sidebar">
          <div className="report-tabs">
            {reportTabs.map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={'report-tab' + (activeReport === tab.id ? ' active' : '')}
                  onClick={() => setActiveReport(tab.id)}
                >
                  <IconComponent size={20} />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="reports-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Reports;
