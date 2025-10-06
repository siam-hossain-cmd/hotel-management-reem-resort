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
import { roomService } from '../firebase/roomService';
import { bookingService } from '../firebase/bookingService';
import { invoiceService } from '../firebase/invoiceService';

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
      // Get all rooms
      const roomsResult = await roomService.getAllRooms();
      const rooms = roomsResult.success ? roomsResult.rooms : [];
      
      // Get current bookings to determine room availability
      const today = new Date().toISOString().split('T')[0];
      const bookingsResult = await bookingService.getBookingsByDate(today, today);
      const todayBookings = bookingsResult.success ? bookingsResult.bookings : [];
      
      const totalRooms = rooms.length;
      const bookedRoomNumbers = todayBookings
        .filter(booking => booking.status === 'confirmed' || booking.status === 'checked-in')
        .map(booking => booking.roomNumber);
      
      const bookedRooms = bookedRoomNumbers.length;
      const availableRooms = totalRooms - bookedRooms;
      const occupancyPercentage = totalRooms > 0 ? Math.round((bookedRooms / totalRooms) * 100) : 0;
      const maintenanceRooms = rooms.filter(room => room.status === 'maintenance').length;

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
      // Get all rooms
      const roomsResult = await roomService.getAllRooms();
      const allRooms = roomsResult.success ? roomsResult.rooms : [];
      
      // Get current bookings to determine room availability
      const today = new Date().toISOString().split('T')[0];
      const bookingsResult = await bookingService.getBookingsByDate(today, today);
      const todayBookings = bookingsResult.success ? bookingsResult.bookings : [];
      
      // Create a map of booked rooms with booking details
      const bookedRoomsMap = new Map();
      todayBookings
        .filter(booking => booking.status === 'confirmed' || booking.status === 'checked-in')
        .forEach(booking => {
          bookedRoomsMap.set(booking.roomNumber, {
            ...booking,
            roomInfo: allRooms.find(room => room.roomNumber === booking.roomNumber)
          });
        });
      
      // Categorize rooms
      const bookedRooms = Array.from(bookedRoomsMap.values());
      const availableRooms = allRooms.filter(room => 
        !bookedRoomsMap.has(room.roomNumber) && room.status !== 'maintenance'
      );
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
    try {
      // Get all bookings
      const bookingsResult = await bookingService.getAllBookings();
      const allBookings = bookingsResult.success ? bookingsResult.bookings : [];
      
      // Get current month's date range
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      // Create calendar data
      const calendarData = [];
      const daysInMonth = lastDay.getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(now.getFullYear(), now.getMonth(), day);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayBookings = allBookings.filter(booking => {
          const checkIn = new Date(booking.checkInDate);
          const checkOut = new Date(booking.checkOutDate);
          const currentDate = new Date(dateStr);
          
          return currentDate >= checkIn && currentDate < checkOut;
        });
        
        calendarData.push({
          date: dateStr,
          day: day,
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
          bookings: dayBookings,
          occupancy: dayBookings.length,
          isToday: dateStr === new Date().toISOString().split('T')[0]
        });
      }
      
      return calendarData;
    } catch (error) {
      console.error('Error loading monthly bookings:', error);
      return [];
    }
  };

  const loadNext30DaysData = async () => {
    try {
      // Get all bookings and rooms
      const [bookingsResult, roomsResult] = await Promise.all([
        bookingService.getAllBookings(),
        roomService.getAllRooms()
      ]);
      
      const allBookings = bookingsResult.success ? bookingsResult.bookings : [];
      const allRooms = roomsResult.success ? roomsResult.rooms : [];
      
      // Create next 30 days data
      const next30Days = [];
      const today = new Date();
      
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Get bookings for this date
        const dayBookings = allBookings.filter(booking => {
          const checkIn = new Date(booking.checkInDate);
          const checkOut = new Date(booking.checkOutDate);
          const currentDate = new Date(dateStr);
          
          return currentDate >= checkIn && currentDate < checkOut && 
                 (booking.status === 'confirmed' || booking.status === 'checked-in');
        });
        
        // Calculate room type availability
        const roomTypeAvailability = {};
        const roomTypes = [...new Set(allRooms.map(room => room.roomType))];
        
        roomTypes.forEach(roomType => {
          const totalRoomsOfType = allRooms.filter(room => 
            room.roomType === roomType && room.status !== 'maintenance'
          ).length;
          
          const bookedRoomsOfType = dayBookings.filter(booking => {
            const room = allRooms.find(r => r.roomNumber === booking.roomNumber);
            return room && room.roomType === roomType;
          }).length;
          
          roomTypeAvailability[roomType] = {
            total: totalRoomsOfType,
            booked: bookedRoomsOfType,
            available: totalRoomsOfType - bookedRoomsOfType
          };
        });
        
        const totalRooms = allRooms.filter(room => room.status !== 'maintenance').length;
        const bookedRooms = dayBookings.length;
        const availableRooms = totalRooms - bookedRooms;
        const occupancyPercentage = totalRooms > 0 ? Math.round((bookedRooms / totalRooms) * 100) : 0;
        
        next30Days.push({
          date: dateStr,
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
          dayNumber: date.getDate(),
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          totalRooms,
          bookedRooms,
          availableRooms,
          occupancyPercentage,
          roomTypeAvailability,
          isToday: i === 0
        });
      }
      
      return next30Days;
    } catch (error) {
      console.error('Error loading next 30 days data:', error);
      return [];
    }
  };







  const loadRecentBookings = async () => {
    try {
      const result = await bookingService.getRecentBookings(5);
      return result.success ? result.bookings : [];
    } catch (error) {
      console.error('Error loading recent bookings:', error);
      return [];
    }
  };

  const loadRecentInvoices = async () => {
    try {
      const result = await invoiceService.getRecentInvoices(5);
      return result.success ? result.invoices : [];
    } catch (error) {
      console.error('Error loading recent invoices:', error);
      return [];
    }
  };

  const loadRoomTypeOccupancy = async () => {
    try {
      const roomsResult = await roomService.getAllRooms();
      const rooms = roomsResult.success ? roomsResult.rooms : [];
      
      const today = new Date().toISOString().split('T')[0];
      const bookingsResult = await bookingService.getBookingsByDate(today, today);
      const todayBookings = bookingsResult.success ? bookingsResult.bookings : [];
      
      // Group rooms by type
      const roomsByType = rooms.reduce((acc, room) => {
        acc[room.roomType] = (acc[room.roomType] || 0) + 1;
        return acc;
      }, {});
      
      // Count booked rooms by type
      const bookedByType = todayBookings
        .filter(booking => booking.status === 'confirmed' || booking.status === 'checked-in')
        .reduce((acc, booking) => {
          const room = rooms.find(r => r.roomNumber === booking.roomNumber);
          if (room) {
            acc[room.roomType] = (acc[room.roomType] || 0) + 1;
          }
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

      {/* Smart Room Display */}
      <div className="dashboard-section">
        <h2 className="section-title">
          <Bed size={20} />
          Room Status Overview
        </h2>
        
        {/* Available Rooms */}
        <div className="room-status-section">
          <h3 className="room-status-title">
            <CheckCircle size={18} />
            Available Rooms ({dashboardData.roomDetails.availableRooms.length})
          </h3>
          <div className="room-numbers-grid">
            {dashboardData.roomDetails.availableRooms.map((room, index) => (
              <div key={index} className="room-number-card available">
                <div className="room-number">{room.roomNumber}</div>
                <div className="room-type">{room.roomType}</div>
                <div className="room-status-indicator available">Available</div>
              </div>
            ))}
            {dashboardData.roomDetails.availableRooms.length === 0 && (
              <div className="no-rooms-message">No available rooms</div>
            )}
          </div>
        </div>

        {/* Booked Rooms */}
        <div className="room-status-section">
          <h3 className="room-status-title">
            <XCircle size={18} />
            Booked Rooms ({dashboardData.roomDetails.bookedRooms.length})
          </h3>
          <div className="room-numbers-grid">
            {dashboardData.roomDetails.bookedRooms.map((booking, index) => (
              <div key={index} className="room-number-card booked">
                <div className="room-number">{booking.roomNumber}</div>
                <div className="room-type">{booking.roomInfo?.roomType || 'Standard'}</div>
                <div className="guest-name">{booking.guestName}</div>
                <div className="booking-dates">
                  {new Date(booking.checkInDate).toLocaleDateString()} - {new Date(booking.checkOutDate).toLocaleDateString()}
                </div>
                <div className={`room-status-indicator ${booking.status}`}>
                  {booking.status === 'confirmed' ? 'Confirmed' : 'Checked In'}
                </div>
              </div>
            ))}
            {dashboardData.roomDetails.bookedRooms.length === 0 && (
              <div className="no-rooms-message">No booked rooms</div>
            )}
          </div>
        </div>

        {/* Maintenance Rooms */}
        {dashboardData.roomDetails.maintenanceRooms.length > 0 && (
          <div className="room-status-section">
            <h3 className="room-status-title">
              <AlertCircle size={18} />
              Maintenance Rooms ({dashboardData.roomDetails.maintenanceRooms.length})
            </h3>
            <div className="room-numbers-grid">
              {dashboardData.roomDetails.maintenanceRooms.map((room, index) => (
                <div key={index} className="room-number-card maintenance">
                  <div className="room-number">{room.roomNumber}</div>
                  <div className="room-type">{room.roomType}</div>
                  <div className="room-status-indicator maintenance">Under Maintenance</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Next 30 Days Booking Overview Table */}
      <div className="dashboard-section">
        <h2 className="section-title">
          <Calendar size={20} />
          Next 30 Days Booking Overview
        </h2>
        <div className="booking-overview-table-container">
          <table className="booking-overview-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Day</th>
                <th>Occupancy %</th>
                <th>Available Rooms</th>
                <th>Room Type Availability</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.next30DaysData.map((dayData, index) => (
                <tr key={index} className={dayData.isToday ? 'today-row' : ''}>
                  <td className="date-cell">
                    <div className="date-display">
                      <span className="day-number">{dayData.dayNumber}</span>
                      <span className="month-name">{dayData.month}</span>
                    </div>
                  </td>
                  <td className="day-cell">{dayData.dayName}</td>
                  <td className="occupancy-cell">
                    <div className="occupancy-display">
                      <span className={`occupancy-percentage ${dayData.occupancyPercentage >= 80 ? 'high' : dayData.occupancyPercentage >= 50 ? 'medium' : 'low'}`}>
                        {dayData.occupancyPercentage}%
                      </span>
                      <div className="occupancy-bar-mini">
                        <div 
                          className="occupancy-fill-mini" 
                          style={{ width: `${dayData.occupancyPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="available-rooms-cell">
                    <span className="available-count">{dayData.availableRooms}</span>
                    <span className="total-count">/ {dayData.totalRooms}</span>
                  </td>
                  <td className="room-types-cell">
                    <div className="room-types-grid">
                      {Object.entries(dayData.roomTypeAvailability).map(([roomType, data]) => (
                        <div key={roomType} className="room-type-item">
                          <span className="room-type-name">{roomType}</span>
                          <span className={`room-type-count ${data.available === 0 ? 'fully-booked' : data.available <= 2 ? 'low-availability' : 'good-availability'}`}>
                            {data.available}/{data.total}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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