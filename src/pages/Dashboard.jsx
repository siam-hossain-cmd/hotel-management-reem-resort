import React, { useState, useEffect } from 'react';
import { 
  Bed, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Home,
  UserCheck,
  FileText,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Bell,
  LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { categorizeRoomsByDate } from '../utils/roomAvailability';

const Dashboard = () => {
  const { user, hasPermission, isAdmin, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    roomStats: {
      totalRooms: 0,
      bookedRooms: 0,
      availableRooms: 0,
      occupancyPercentage: 0,
      maintenanceRooms: 0
    },
    roomDetails: {
      allRooms: [],
      bookedRooms: [],
      availableRooms: [],
      maintenanceRooms: []
    },
    monthlyBookings: [],
    next30DaysData: [],
    recentBookings: [],
    recentInvoices: [],
    roomTypeOccupancy: []
  });
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateRangeRooms, setDateRangeRooms] = useState({
    availableRooms: [],
    bookedRooms: [],
    maintenanceRooms: []
  });
  
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
  
  const getUnreadCount = () => {
    return notifications.filter(n => !n.read).length;
  };
  
  const getUserName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  useEffect(() => {
    if (dashboardData.roomDetails.allRooms.length > 0) {
      loadRoomsByDate(selectedDate);
    }
  }, [selectedDate, dashboardData.roomDetails.allRooms]);

  const loadRoomsByDate = async (date) => {
    try {
      // Get all rooms
      const allRooms = dashboardData.roomDetails.allRooms;
      
      // Get bookings for the selected date
      const bookingsResult = await api.getBookings();
      const bookings = bookingsResult.success ? bookingsResult.bookings : [];
      
      console.log('📅 Selected date:', date.toISOString().split('T')[0]);
      console.log('📋 Total bookings:', bookings.length);
      
      // Use the helper function to categorize rooms
      const { availableRooms, bookedRooms, maintenanceRooms, occupiedRoomNumbers } = 
        categorizeRoomsByDate(allRooms, bookings, date);
      
      console.log('🔒 Occupied room numbers:', occupiedRoomNumbers);
      console.log('✅ Available rooms:', availableRooms.length, availableRooms.map(r => r.room_number));
      console.log('🔒 Booked rooms:', bookedRooms.length, bookedRooms.map(r => r.room_number));
      console.log('🔧 Maintenance rooms:', maintenanceRooms.length);
      
      setDateRangeRooms({
        availableRooms,
        bookedRooms,
        maintenanceRooms
      });
    } catch (error) {
      console.error('Error loading rooms by date:', error);
      // Fallback to current room status if date-based lookup fails
      setDateRangeRooms({
        availableRooms: dashboardData.roomDetails.availableRooms,
        bookedRooms: dashboardData.roomDetails.bookedRooms,
        maintenanceRooms: dashboardData.roomDetails.maintenanceRooms
      });
    }
  };

  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    
    // Generate 30 days from today
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  const formatDateForDisplay = (date) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameDay = (date1, date2) => {
    return date1.toDateString() === date2.toDateString();
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all dashboard data in parallel
      const [
        roomStats,
        roomDetails,
        monthlyBookings,
        next30DaysData,
        recentBookings,
        recentInvoices,
        roomTypeOccupancy
      ] = await Promise.all([
        loadRoomStatistics(),
        loadRoomDetails(),
        loadMonthlyBookings(),
        loadNext30DaysData(),
        loadRecentBookings(),
        hasPermission('view_invoices') ? loadRecentInvoices() : [],
        loadRoomTypeOccupancy()
      ]);
      
      setDashboardData({
        roomStats,
        roomDetails,
        monthlyBookings,
        next30DaysData,
        recentBookings,
        recentInvoices,
        roomTypeOccupancy
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoomStatistics = async () => {
    try {
      // Get all rooms from MySQL
      const roomsResult = await api.getRooms();
      const rooms = roomsResult.success ? roomsResult.rooms : [];
      
      // Get current bookings to determine room availability
      // For now, we'll use room status from the database
      const totalRooms = rooms.length;
      const bookedRooms = rooms.filter(room => room.status === 'occupied').length;
      const availableRooms = rooms.filter(room => room.status === 'available').length;
      const maintenanceRooms = rooms.filter(room => room.status === 'maintenance').length;
      const occupancyPercentage = totalRooms > 0 ? Math.round((bookedRooms / totalRooms) * 100) : 0;

      return {
        totalRooms,
        bookedRooms,
        availableRooms,
        occupancyPercentage,
        maintenanceRooms
      };
    } catch (error) {
      console.error('Error loading room statistics:', error);
      return {
        totalRooms: 0,
        bookedRooms: 0,
        availableRooms: 0,
        occupancyPercentage: 0,
        maintenanceRooms: 0
      };
    }
  };

  const loadRoomDetails = async () => {
    try {
      // Get all rooms from MySQL
      const roomsResult = await api.getRooms();
      const allRooms = roomsResult.success ? roomsResult.rooms : [];
      
      // Categorize rooms based on their status
      const bookedRooms = allRooms.filter(room => room.status === 'occupied');
      const availableRooms = allRooms.filter(room => room.status === 'available');
      const maintenanceRooms = allRooms.filter(room => room.status === 'maintenance');

      return {
        allRooms,
        bookedRooms,
        availableRooms,
        maintenanceRooms
      };
    } catch (error) {
      console.error('Error loading room details:', error);
      return {
        allRooms: [],
        bookedRooms: [],
        availableRooms: [],
        maintenanceRooms: []
      };
    }
  };

  const loadMonthlyBookings = async () => {
    // Simplified for now - will be enhanced when booking system is integrated
    return [];
  };

  const loadNext30DaysData = async () => {
    // Simplified for now - will be enhanced when booking system is integrated
    return [];
  };

  const loadRecentBookings = async () => {
    // Simplified for now - will be enhanced when booking system is integrated
    return [];
  };

  const loadRecentInvoices = async () => {
    // Simplified for now - will be enhanced when booking system is integrated
    return [];
  };

  const loadRoomTypeOccupancy = async () => {
    try {
      const roomsResult = await api.getRooms();
      const rooms = roomsResult.success ? roomsResult.rooms : [];
      
      // Group rooms by type
      const roomsByType = rooms.reduce((acc, room) => {
        const roomType = room.room_type || room.roomType;
        acc[roomType] = (acc[roomType] || 0) + 1;
        return acc;
      }, {});
      
      // Count booked rooms by type
      const bookedByType = rooms
        .filter(room => room.status === 'occupied')
        .reduce((acc, room) => {
          const roomType = room.room_type || room.roomType;
          acc[roomType] = (acc[roomType] || 0) + 1;
          return acc;
        }, {});
      
      // Calculate occupancy percentage by room type
      return Object.keys(roomsByType).map(roomType => ({
        roomType,
        total: roomsByType[roomType],
        booked: bookedByType[roomType] || 0,
        available: roomsByType[roomType] - (bookedByType[roomType] || 0),
        occupancy: Math.round(((bookedByType[roomType] || 0) / roomsByType[roomType]) * 100)
      }));
    } catch (error) {
      console.error('Error loading room type occupancy:', error);
      return [];
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading hotel dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard hotel-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="system-branding">
            <div className="brand-icon">
              <Home size={32} />
            </div>
            <div className="brand-info">
              <h1>Reem Resort Management System</h1>
              <div className="system-status">
                <div className="status-indicator online">
                  <div className="status-dot"></div>
                  <span>System Online</span>
                </div>
                <div className="last-updated">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
          
          <div className="user-info-section">
            <div className="welcome-message">
              <h2>Welcome back, {getUserName()}!</h2>
              <p>Here's your hotel overview for today</p>
            </div>
            
            {user?.role && (
              <div className="user-role-container">
                <div className="user-role-badge enhanced">
                  <div className="role-icon">
                    <UserCheck size={20} />
                  </div>
                  <div className="role-info">
                    <span className="role-title">{user.role}</span>
                    <span className="role-department">Administration</span>
                  </div>
                </div>
                <div className="admin-privileges">
                  <div className="privilege-item">
                    <CheckCircle size={14} />
                    <span>Full Access</span>
                  </div>
                  <div className="privilege-item">
                    <CheckCircle size={14} />
                    <span>All Permissions</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="header-actions">
            {/* Action Buttons */}
            <div className="action-buttons">
              {/* Notifications */}
              <button 
                className="action-btn notification-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications"
              >
                <Bell size={18} />
                {getUnreadCount() > 0 && (
                  <span className="notification-badge">{getUnreadCount()}</span>
                )}
              </button>

              {/* Logout Button */}
              <button 
                className="action-btn logout-btn"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>

            {/* Notification Dropdown */}
            {showNotifications && (
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
              </div>
            )}
          </div>
        </div>
        
        <div className="dashboard-stats-mini">
          <div className="mini-stat">
            <Calendar size={18} />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Room Statistics Cards */}
      <div className="stats-section">
        <h2 className="section-title">
          <Bed size={20} />
          Room Overview
        </h2>
        <div className="stats-grid rooms-grid">
          <div className="stat-card primary">
            <div className="stat-icon">
              <Home size={24} />
            </div>
            <div className="stat-content">
              <h3>Total Rooms</h3>
              <div className="stat-value">{dashboardData.roomStats.totalRooms}</div>
              <div className="stat-change">Available property rooms</div>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">
              <CheckCircle size={24} />
            </div>
            <div className="stat-content">
              <h3>Booked Rooms</h3>
              <div className="stat-value">{dashboardData.roomStats.bookedRooms}</div>
              <div className="stat-change">Currently occupied</div>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">
              <Bed size={24} />
            </div>
            <div className="stat-content">
              <h3>Available Rooms</h3>
              <div className="stat-value">{dashboardData.roomStats.availableRooms}</div>
              <div className="stat-change">Ready for booking</div>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">
              <BarChart3 size={24} />
            </div>
            <div className="stat-content">
              <h3>Occupancy Rate</h3>
              <div className="stat-value">{dashboardData.roomStats.occupancyPercentage}%</div>
              <div className="stat-change">Current occupancy</div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Room Status Display */}
      <div className="dashboard-section room-status-overview">
        <h2 className="section-title">
          <Bed size={20} />
          Room Status Overview
        </h2>
        
        {/* Date Selection Row */}
        <div className="date-selection-container">
          <div className="date-selector-header">
            <Calendar size={18} />
            <h3>Select Date to View Room Availability</h3>
          </div>
          <div className="date-scroll-container">
            <div className="date-options-row">
              {generateDateOptions().map((date, index) => (
                <button
                  key={index}
                  className={`date-option-card ${isSameDay(date, selectedDate) ? 'selected' : ''} ${isToday(date) ? 'today' : ''}`}
                  onClick={() => setSelectedDate(date)}
                >
                  <div className="date-day">{date.getDate()}</div>
                  <div className="date-month">{date.toLocaleDateString('en-US', { month: 'short' })}</div>
                  <div className="date-weekday">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  {isToday(date) && <div className="today-badge">Today</div>}
                </button>
              ))}
            </div>
          </div>
          <div className="selected-date-info">
            <Clock size={16} />
            <span>Showing availability for: <strong>{formatDateForDisplay(selectedDate)}</strong></span>
          </div>
        </div>
        
        {/* Available Rooms */}
        <div className="room-category-section">
          <div className="category-header available-header">
            <div className="header-left">
              <CheckCircle size={20} />
              <h3>Available Rooms</h3>
            </div>
            <span className="room-count">{dateRangeRooms.availableRooms.length}</span>
          </div>
          <div className="professional-room-grid">
            {dateRangeRooms.availableRooms.map((room, index) => (
              <div key={index} className="professional-room-card available">
                <div className="room-card-header">
                  <div className="room-number-large">{room.room_number}</div>
                  <div className="status-badge available">
                    <CheckCircle size={14} />
                    <span>Available</span>
                  </div>
                </div>
                <div className="room-card-body">
                  <div className="room-type-label">{room.room_type}</div>
                  <div className="room-capacity">
                    <Users size={14} />
                    <span>Ready for booking</span>
                  </div>
                </div>
              </div>
            ))}
            {dateRangeRooms.availableRooms.length === 0 && (
              <div className="no-rooms-message">
                <Bed size={24} />
                <p>No available rooms for this date</p>
              </div>
            )}
          </div>
        </div>

        {/* Booked Rooms */}
        <div className="room-category-section">
          <div className="category-header occupied-header">
            <div className="header-left">
              <XCircle size={20} />
              <h3>Occupied Rooms</h3>
            </div>
            <span className="room-count">{dateRangeRooms.bookedRooms.length}</span>
          </div>
          <div className="professional-room-grid">
            {dateRangeRooms.bookedRooms.map((room, index) => (
              <div key={index} className="professional-room-card occupied">
                <div className="room-card-header">
                  <div className="room-number-large">{room.room_number}</div>
                  <div className="status-badge occupied">
                    <XCircle size={14} />
                    <span>Occupied</span>
                  </div>
                </div>
                <div className="room-card-body">
                  <div className="room-type-label">{room.room_type}</div>
                  <div className="room-capacity">
                    <Users size={14} />
                    <span>Currently occupied</span>
                  </div>
                </div>
              </div>
            ))}
            {dateRangeRooms.bookedRooms.length === 0 && (
              <div className="no-rooms-message">
                <CheckCircle size={24} />
                <p>No occupied rooms for this date</p>
              </div>
            )}
          </div>
        </div>

        {/* Maintenance Rooms */}
        {dateRangeRooms.maintenanceRooms.length > 0 && (
          <div className="room-category-section">
            <div className="category-header maintenance-header">
              <div className="header-left">
                <AlertCircle size={20} />
                <h3>Maintenance Rooms</h3>
              </div>
              <span className="room-count">{dateRangeRooms.maintenanceRooms.length}</span>
            </div>
            <div className="professional-room-grid">
              {dateRangeRooms.maintenanceRooms.map((room, index) => (
                <div key={index} className="professional-room-card maintenance">
                  <div className="room-card-header">
                    <div className="room-number-large">{room.room_number}</div>
                    <div className="status-badge maintenance">
                      <AlertCircle size={14} />
                      <span>Maintenance</span>
                    </div>
                  </div>
                  <div className="room-card-body">
                    <div className="room-type-label">{room.room_type}</div>
                    <div className="room-capacity">
                      <Clock size={14} />
                      <span>Under maintenance</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Next 30 Days Booking Overview - Coming Soon */}
      <div className="dashboard-section">
        <h2 className="section-title">
          <Calendar size={20} />
          Booking Overview (Coming Soon)
        </h2>
        <div className="coming-soon-card">
          <Calendar size={48} />
          <h3>Booking Integration in Progress</h3>
          <p>Full booking calendar and occupancy forecasting will be available once the booking system is integrated.</p>
        </div>
      </div>

      {/* Room Type Occupancy */}
      {dashboardData.roomTypeOccupancy.length > 0 && (
        <div className="dashboard-section">
          <h2 className="section-title">
            <PieChart size={20} />
            Room Type Occupancy
          </h2>
          <div className="room-type-grid">
            {dashboardData.roomTypeOccupancy.map((roomType, index) => (
              <div key={index} className="room-type-card">
                <div className="room-type-header">
                  <h3>{roomType.roomType}</h3>
                  <span className="occupancy-badge">{roomType.occupancy}%</span>
                </div>
                <div className="room-type-stats">
                  <div className="room-stat">
                    <span className="stat-label">Total</span>
                    <span className="stat-value">{roomType.total}</span>
                  </div>
                  <div className="room-stat">
                    <span className="stat-label">Booked</span>
                    <span className="stat-value occupied">{roomType.booked}</span>
                  </div>
                  <div className="room-stat">
                    <span className="stat-label">Available</span>
                    <span className="stat-value available">{roomType.available}</span>
                  </div>
                </div>
                <div className="occupancy-bar">
                  <div 
                    className="occupancy-fill" 
                    style={{ width: `${roomType.occupancy}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-content">
        {/* Recent Bookings */}
        {dashboardData.recentBookings.length > 0 && (
          <div className="dashboard-section recent-bookings">
            <div className="section-header">
              <h2>
                <Calendar size={20} />
                Recent Bookings
              </h2>
              {hasPermission('create_booking') && (
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => window.location.href = '/create-booking'}
                >
                  New Booking
                </button>
              )}
            </div>
            <div className="booking-list">
              {dashboardData.recentBookings.map((booking) => (
                <div key={booking.id} className="booking-item">
                  <div className="booking-info">
                    <div className="booking-guest">
                      <strong>{booking.guestInfo?.firstName} {booking.guestInfo?.lastName}</strong>
                      <span className="booking-id">#{booking.id?.substring(0, 8)}</span>
                    </div>
                    <div className="booking-details">
                      <span>Room {booking.roomNumber} • {booking.roomType}</span>
                      <span>{booking.checkInDate} to {booking.checkOutDate}</span>
                    </div>
                  </div>
                  <div className="booking-meta">
                    <span className={`booking-status ${booking.status}`}>
                      {booking.status}
                    </span>
                    <span className="booking-amount">${booking.total?.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Invoices - Show only if user has permission */}
        {hasPermission('view_invoices') && dashboardData.recentInvoices.length > 0 && (
          <div className="dashboard-section recent-invoices">
            <div className="section-header">
              <h2>
                <FileText size={20} />
                Recent Invoices
              </h2>
              {hasPermission('create_invoice') && (
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => window.location.href = '/create-invoice'}
                >
                  Create Invoice
                </button>
              )}
            </div>
            <div className="invoice-list">
              {dashboardData.recentInvoices.map((invoice) => (
                <div key={invoice.id} className="invoice-item">
                  <div className="invoice-info">
                    <div className="invoice-customer">
                      <strong>{invoice.customerInfo?.name}</strong>
                      <span className="invoice-id">{invoice.id}</span>
                    </div>
                    <div className="invoice-details">
                      <span>{invoice.invoiceDate}</span>
                    </div>
                  </div>
                  <div className="invoice-meta">
                    <span className="invoice-amount">${invoice.total?.toFixed(2)}</span>
                    <span className={`invoice-status ${invoice.dueAmount > 0 ? 'pending' : 'paid'}`}>
                      {invoice.dueAmount > 0 ? 'Pending' : 'Paid'}
                    </span>
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
            {hasPermission('create_booking') && (
              <button 
                className="action-card"
                onClick={() => window.location.href = '/create-booking'}
              >
                <Calendar size={24} />
                <span>New Booking</span>
              </button>
            )}
            {hasPermission('create_invoice') && (
              <button 
                className="action-card"
                onClick={() => window.location.href = '/create-invoice'}
              >
                <FileText size={24} />
                <span>Create Invoice</span>
              </button>
            )}
            {hasPermission('view_rooms') && (
              <button 
                className="action-card"
                onClick={() => window.location.href = '/rooms'}
              >
                <Bed size={24} />
                <span>Manage Rooms</span>
              </button>
            )}
            {hasPermission('view_customers') && (
              <button 
                className="action-card"
                onClick={() => window.location.href = '/customers'}
              >
                <Users size={24} />
                <span>Customers</span>
              </button>
            )}
            {hasPermission('view_reports') && (
              <button 
                className="action-card"
                onClick={() => window.location.href = '/reports'}
              >
                <BarChart3 size={24} />
                <span>Reports</span>
              </button>
            )}
            {isAdmin() && (
              <button 
                className="action-card"
                onClick={() => window.location.href = '/admin-management'}
              >
                <UserCheck size={24} />
                <span>Admin Panel</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;