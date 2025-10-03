import React from 'react';
import { FileText, Users, DollarSign, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const stats = [
    {
      title: 'Total Invoices',
      value: '156',
      icon: FileText,
      color: 'blue',
      change: '+12%'
    },
    {
      title: 'Total Customers',
      value: '89',
      icon: Users,
      color: 'green',
      change: '+5%'
    },
    {
      title: 'Total Revenue',
      value: '$24,580',
      icon: DollarSign,
      color: 'purple',
      change: '+18%'
    },
    {
      title: 'Growth',
      value: '23%',
      icon: TrendingUp,
      color: 'orange',
      change: '+3%'
    }
  ];

  const recentInvoices = [
    { id: 'INV-001', customer: 'John Doe', amount: '$1,250', status: 'Paid', date: '2024-01-15' },
    { id: 'INV-002', customer: 'Jane Smith', amount: '$850', status: 'Pending', date: '2024-01-14' },
    { id: 'INV-003', customer: 'Bob Wilson', amount: '$2,100', status: 'Paid', date: '2024-01-13' },
    { id: 'INV-004', customer: 'Alice Brown', amount: '$750', status: 'Overdue', date: '2024-01-10' },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard Overview</h1>
        <p>Welcome back! Here's what's happening with your invoices today.</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => {
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
        <div className="recent-invoices">
          <h2>Recent Invoices</h2>
          <div className="invoice-list">
            {recentInvoices.map((invoice) => (
              <div key={invoice.id} className="invoice-item">
                <div className="invoice-id">{invoice.id}</div>
                <div className="invoice-customer">{invoice.customer}</div>
                <div className="invoice-amount">{invoice.amount}</div>
                <div className={`invoice-status ${invoice.status.toLowerCase()}`}>
                  {invoice.status}
                </div>
                <div className="invoice-date">{invoice.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;