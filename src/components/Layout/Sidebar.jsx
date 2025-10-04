import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  Users, 
  PlusCircle, 
  Settings,
  BarChart3,
  UserCog,
  Shield,
  Bed
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { canPerformAction, isMasterAdmin, user, ROLES } = useAuth();
  
  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard', show: true },
    { path: '/invoices', icon: FileText, label: 'Invoices', show: canPerformAction('view_invoices') || isMasterAdmin() },
    { path: '/customers', icon: Users, label: 'Customers', show: canPerformAction('view_customers') || isMasterAdmin() },
    { path: '/rooms', icon: Bed, label: 'Rooms', show: canPerformAction('view_rooms') || isMasterAdmin() },
    { 
      path: '/create-invoice', 
      icon: PlusCircle, 
      label: 'Create Invoice', 
      show: canPerformAction('create_invoice') 
    },
    { 
      path: '/admin', 
      icon: UserCog, 
      label: 'Admin Management', 
      show: isMasterAdmin(),
      badge: <Shield size={14} className="admin-badge" />
    },
    { 
      path: '/users', 
      icon: UserCog, 
      label: 'User Management', 
      show: isMasterAdmin() || canPerformAction('manage_users'),
      badge: <Shield size={14} className="admin-badge" />
    },
    { path: '/reports', icon: BarChart3, label: 'Reports', show: canPerformAction('view_reports') || isMasterAdmin() },
    { path: '/settings', icon: Settings, label: 'Settings', show: true },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Invoice Generator</h2>
      </div>
      <nav className="sidebar-nav">
        {menuItems.filter(item => item.show).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
              {item.badge && item.badge}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;