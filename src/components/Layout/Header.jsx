import React from 'react';
import { Bell, User, LogOut } from 'lucide-react';

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <h1>Reem Resort Invoice System</h1>
        
        <div className="header-actions">
          <button className="notification-btn">
            <Bell size={20} />
          </button>
          
          <div className="user-menu">
            <button className="user-btn">
              <User size={20} />
              <span>Admin</span>
            </button>
            
            <button className="logout-btn">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;