import React, { useState, useEffect } from 'react';
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
  Bed,
  Calendar,
  CalendarPlus,
  ChevronDown,
  ChevronRight,
  Eye,
  Plus
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { canPerformAction, isMasterAdmin, user, ROLES } = useAuth();
  
  // State for managing open/closed submenus
  const [openMenus, setOpenMenus] = useState({
    bookings: false,
    invoices: false
  });

  // Auto-expand submenu if user is on a submenu page
  useEffect(() => {
    const bookingPaths = ['/bookings', '/create-booking'];
    const invoicePaths = ['/invoices', '/create-invoice'];
    
    if (bookingPaths.includes(location.pathname)) {
      setOpenMenus(prev => ({ ...prev, bookings: true }));
    }
    if (invoicePaths.includes(location.pathname)) {
      setOpenMenus(prev => ({ ...prev, invoices: true }));
    }
  }, [location.pathname]);

  // Toggle submenu open/closed
  const toggleMenu = (menuKey) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };
  
  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard', show: true },
    
    // Bookings Menu with Submenu
    {
      key: 'bookings',
      icon: Calendar, 
      label: 'Bookings', 
      show: canPerformAction('view_bookings') || canPerformAction('manage_bookings') || isMasterAdmin(),
      isSubmenu: true,
      submenuItems: [
        { 
          path: '/bookings', 
          icon: Eye, 
          label: 'View Bookings', 
          show: canPerformAction('view_bookings') || canPerformAction('manage_bookings') || isMasterAdmin() 
        },
        { 
          path: '/create-booking', 
          icon: Plus, 
          label: 'New Booking', 
          show: canPerformAction('create_booking') || canPerformAction('manage_bookings') || isMasterAdmin() 
        }
      ]
    },
    
    // Invoices Menu with Submenu
    {
      key: 'invoices',
      icon: FileText, 
      label: 'Invoices', 
      show: canPerformAction('view_invoices') || canPerformAction('create_invoice') || isMasterAdmin(),
      isSubmenu: true,
      submenuItems: [
        { 
          path: '/invoices', 
          icon: Eye, 
          label: 'View Invoices', 
          show: canPerformAction('view_invoices') || isMasterAdmin() 
        }
      ]
    },
    
    // Regular menu items
    { path: '/customers', icon: Users, label: 'Customers', show: canPerformAction('view_customers') || isMasterAdmin() },
    { path: '/rooms', icon: Bed, label: 'Rooms', show: canPerformAction('view_rooms') || isMasterAdmin() },
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

  // Check if current path belongs to a submenu
  const isSubmenuActive = (submenuItems) => {
    return submenuItems.some(item => location.pathname === item.path);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Reem Resort System</h2>
      </div>
      <nav className="sidebar-nav">
        {menuItems.filter(item => item.show).map((item) => {
          if (item.isSubmenu) {
            const isOpen = openMenus[item.key];
            const isActive = isSubmenuActive(item.submenuItems);
            const Icon = item.icon;
            const ChevronIcon = isOpen ? ChevronDown : ChevronRight;
            
            return (
              <div key={item.key} className="menu-group">
                <div 
                  className={`nav-item submenu-header ${isActive ? 'active' : ''}`}
                  onClick={() => toggleMenu(item.key)}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                  <ChevronIcon size={16} className="chevron-icon" />
                </div>
                
                {isOpen && (
                  <div className="submenu">
                    {item.submenuItems.filter(subItem => subItem.show).map((subItem) => {
                      const SubIcon = subItem.icon;
                      const isSubActive = location.pathname === subItem.path;
                      
                      return (
                        <Link 
                          key={subItem.path} 
                          to={subItem.path} 
                          className={`nav-item submenu-item ${isSubActive ? 'active' : ''}`}
                        >
                          <SubIcon size={18} />
                          <span>{subItem.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          } else {
            // Regular menu item
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
          }
        })}
      </nav>
    </div>
  );
};

export default Sidebar;