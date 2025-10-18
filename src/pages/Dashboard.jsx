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
  X,
  User,
  CreditCard,
  Eye,
  Plus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { categorizeRoomsByDate, isDateInBookingRange, isValidBookingStatus } from '../utils/roomAvailability';
import { previewInvoice } from '../utils/pdfGenerator';
import '../booking.css';

const Dashboard = () => {
  const { user, hasPermission, isAdmin } = useAuth();
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
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedRoomBooking, setSelectedRoomBooking] = useState(null);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [chargeData, setChargeData] = useState({
    type: '',
    customDescription: '',
    amount: ''
  });
  const [paymentData, setPaymentData] = useState({
    amount: '',
    method: 'cash',
    notes: ''
  });
  
  const handleOccupiedRoomClick = async (room) => {
    try {
      console.log('🏠 Clicked on room:', room);
      console.log('📅 Selected date:', selectedDate);
      
      // Fetch all bookings
      const bookingsResult = await api.getBookings();
      if (!bookingsResult.success) {
        console.error('❌ Failed to load bookings:', bookingsResult);
        alert('Failed to load booking details');
        return;
      }

      const bookings = bookingsResult.bookings;
      console.log('📋 Total bookings fetched:', bookings.length);

      // Find the booking for this room on the selected date
      const roomBooking = bookings.find(booking => {
        // Match by room_number
        const isRoomMatch = booking.room_number === room.room_number;
        
        // Check if the selected date falls within the booking range
        const isDateInRange = isDateInBookingRange(
          selectedDate,
          booking.checkin_date,
          booking.checkout_date
        );
        
        // Check if booking status is valid (confirmed or checked-in)
        const isActive = isValidBookingStatus(booking.status);
        
        console.log(`🔍 Checking booking ${booking.booking_reference}:`, {
          roomMatch: isRoomMatch,
          bookingRoom: booking.room_number,
          clickedRoom: room.room_number,
          dateInRange: isDateInRange,
          checkinDate: booking.checkin_date,
          checkoutDate: booking.checkout_date,
          selectedDate: selectedDate.toISOString().split('T')[0],
          isActive,
          status: booking.status,
          allMatch: isRoomMatch && isDateInRange && isActive
        });
        
        return isRoomMatch && isDateInRange && isActive;
      });

      console.log('🎯 Found booking:', roomBooking);

      if (roomBooking) {
        console.log('✅ Loading booking summary for ID:', roomBooking.id);
        // Fetch detailed booking information including charges and payments
        const bookingSummary = await api.getBookingSummary(roomBooking.id);
        
        console.log('📊 Booking summary:', bookingSummary);
        console.log('📊 Booking summary:', bookingSummary);
        
        if (bookingSummary.success) {
          const detailedBooking = {
            id: roomBooking.id,
            bookingRef: roomBooking.booking_reference,
            guestName: `${roomBooking.first_name || ''} ${roomBooking.last_name || ''}`.trim(),
            guestEmail: roomBooking.email || '',
            guestPhone: roomBooking.phone || '',
            roomNumber: room.room_number,
            roomType: room.room_type,
            checkInDate: roomBooking.checkin_date,
            checkOutDate: roomBooking.checkout_date,
            totalNights: Math.ceil((new Date(roomBooking.checkout_date) - new Date(roomBooking.checkin_date)) / (1000 * 60 * 60 * 24)),
            guestCount: roomBooking.capacity || 1,
            status: (roomBooking.status || 'confirmed').toLowerCase().replace(/_/g, '-'),
            paymentStatus: bookingSummary.summary.paymentStatus,
            createdAt: roomBooking.created_at,
            createdBy: roomBooking.created_by || 'System',
            charges: bookingSummary.summary.charges || [],
            payments: bookingSummary.summary.payments || [],
            totals: bookingSummary.summary.totals
          };
          
          console.log('✨ Detailed booking:', detailedBooking);
          
          setSelectedRoomBooking(detailedBooking);
          setShowBookingModal(true);
        } else {
          console.error('❌ Failed to load booking summary:', bookingSummary);
          alert('Failed to load booking summary');
        }
      } else {
        console.warn('⚠️ No active booking found');
        alert('No active booking found for this room on the selected date');
      }
    } catch (error) {
      console.error('💥 Error fetching booking details:', error);
      alert('Error loading booking details');
    }
  };

  const handleCloseBookingModal = () => {
    setShowBookingModal(false);
    setSelectedRoomBooking(null);
    setShowChargeModal(false);
    setShowPaymentModal(false);
  };

  const handleAddChargeClick = () => {
    setShowChargeModal(true);
  };

  const handleCloseChargeModal = () => {
    setShowChargeModal(false);
    setChargeData({
      type: '',
      customDescription: '',
      amount: ''
    });
  };

  const handleChargeSubmit = async () => {
    try {
      if (!chargeData.type || !chargeData.amount) {
        alert('Please fill in all required fields');
        return;
      }

      const description = chargeData.type === 'Others' ? chargeData.customDescription : chargeData.type;
      
      if (chargeData.type === 'Others' && !chargeData.customDescription) {
        alert('Please provide a description for the charge');
        return;
      }

      const result = await api.addBookingCharge(selectedRoomBooking.id, {
        description,
        amount: parseFloat(chargeData.amount)
      });

      if (result.success) {
        alert('Charge added successfully');
        handleCloseChargeModal();
        
        // Refresh the booking details
        const bookingSummary = await api.getBookingSummary(selectedRoomBooking.id);
        if (bookingSummary.success) {
          setSelectedRoomBooking({
            ...selectedRoomBooking,
            charges: bookingSummary.summary.charges || [],
            payments: bookingSummary.summary.payments || [],
            totals: bookingSummary.summary.totals
          });
        }
        
        // Refresh dashboard data
        loadDashboardData();
      } else {
        alert('Failed to add charge: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error adding charge:', error);
      alert('Error adding charge');
    }
  };

  const handleAddPaymentClick = () => {
    setShowPaymentModal(true);
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentData({
      amount: '',
      method: 'cash',
      notes: ''
    });
  };

  const handlePaymentSubmit = async () => {
    try {
      if (!paymentData.amount) {
        alert('Please enter payment amount');
        return;
      }

      const result = await api.addPayment({
        booking_id: selectedRoomBooking.id,
        amount: parseFloat(paymentData.amount),
        gateway: paymentData.method,
        notes: paymentData.notes
      });

      if (result.success) {
        alert('Payment added successfully');
        handleClosePaymentModal();
        
        // Refresh the booking details
        const bookingSummary = await api.getBookingSummary(selectedRoomBooking.id);
        if (bookingSummary.success) {
          setSelectedRoomBooking({
            ...selectedRoomBooking,
            charges: bookingSummary.summary.charges || [],
            payments: bookingSummary.summary.payments || [],
            totals: bookingSummary.summary.totals,
            paymentStatus: bookingSummary.summary.paymentStatus
          });
        }
        
        // Refresh dashboard data
        loadDashboardData();
      } else {
        alert('Failed to add payment: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Error adding payment');
    }
  };

  const handleViewInvoice = async () => {
    if (!selectedRoomBooking) return;
    
    try {
      const invoiceResult = await api.getInvoiceByBookingId(selectedRoomBooking.id);
      
      if (invoiceResult.success && invoiceResult.invoice) {
        const invoice = invoiceResult.invoice;
        
        // Calculate dates and amounts
        const checkIn = new Date(invoice.checkin_date);
        const checkOut = new Date(invoice.checkout_date);
        const totalNights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        
        const baseAmount = parseFloat(invoice.base_amount || invoice.booking_total || 0);
        const discountPercentage = parseFloat(invoice.discount_percentage || 0);
        const discountAmount = parseFloat(invoice.discount_amount || 0);
        const roomTotal = baseAmount - discountAmount;
        const perNightCost = totalNights > 0 ? baseAmount / totalNights : 0;
        
        // Calculate additional charges total - Backend returns totalAmount (camelCase)
        const additionalChargesTotal = (invoice.charges || []).reduce((sum, c) => 
          sum + parseFloat(c.totalAmount || c.amount || 0), 0
        );
        
        // Calculate tax/VAT
        const taxRate = parseFloat(invoice.tax_rate || 0);
        const subtotalBeforeTax = roomTotal + additionalChargesTotal;
        const taxAmount = parseFloat(invoice.tax_amount || 0) || (subtotalBeforeTax * taxRate / 100);
        const finalTotal = subtotalBeforeTax + taxAmount;
        
        // Transform invoice data for PDF - Match Bookings.jsx format
        const transformedInvoice = {
          id: invoice.invoice_number || `INV-${invoice.id}`,
          invoice_number: invoice.invoice_number || `INV-${invoice.id}`, // Add explicit invoice_number field
          booking_id: invoice.booking_id, // Add explicit booking_id field
          booking_reference: invoice.booking_reference, // Add booking reference (e.g., BK773337T28)
          invoiceDate: invoice.issued_at || invoice.created_at,
          dueDate: invoice.due_at,
          customerInfo: {
            name: `${invoice.first_name || ''} ${invoice.last_name || ''}`.trim() || 'Guest',
            email: invoice.email || '',
            phone: invoice.phone || '',
            nid: invoice.nid || '',
            address: invoice.address || ''
          },
          items: invoice.items && invoice.items.length > 0 ? 
            invoice.items.map(item => ({
              roomNumber: item.room_number || invoice.room_number || 'N/A',
              checkInDate: item.check_in_date || invoice.checkin_date,
              checkOutDate: item.check_out_date || invoice.checkout_date,
              totalNights: item.total_nights || totalNights,
              guestCount: item.guest_count || invoice.capacity || 1,
              perNightCost: parseFloat(item.price_per_night || perNightCost || 0),
              amount: parseFloat(item.amount || roomTotal || 0)
            })) : 
            [{
              roomNumber: invoice.room_number || 'N/A',
              checkInDate: invoice.checkin_date,
              checkOutDate: invoice.checkout_date,
              totalNights: totalNights,
              guestCount: invoice.capacity || 1,
              perNightCost: perNightCost,
              amount: roomTotal
            }],
          additionalCharges: (invoice.charges || []).map(charge => ({
            description: charge.description,
            amount: parseFloat(charge.totalAmount || charge.amount || 0)
          })),
          originalSubtotal: baseAmount,
          discountPercentage: discountPercentage,
          totalDiscount: discountAmount,
          subtotal: roomTotal,
          additionalTotal: additionalChargesTotal,
          additionalChargesTotal: additionalChargesTotal,
          taxRate: taxRate,
          tax: taxAmount,
          total: parseFloat(invoice.total || finalTotal),
          paid: parseFloat(invoice.paid || 0),
          due: parseFloat(invoice.due || 0),
          paidAmount: parseFloat(invoice.paid || 0),
          dueAmount: parseFloat(invoice.due || 0),
          totalPaid: parseFloat(invoice.paid || 0),
          balanceDue: parseFloat(invoice.due || 0),
          payments: invoice.payments || []
        };
        
        previewInvoice(transformedInvoice);
      } else {
        alert('No invoice found for this booking');
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      alert('Error loading invoice');
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      confirmed: { class: 'status-confirmed', label: 'Confirmed' },
      checked_in: { class: 'status-checked-in', label: 'Checked In' },
      checked_out: { class: 'status-checked-out', label: 'Checked Out' },
      cancelled: { class: 'status-cancelled', label: 'Cancelled' }
    };
    const config = statusConfig[status?.toLowerCase()] || statusConfig.confirmed;
    return <span className={`status-badge-modern ${config.class}`}>{config.label}</span>;
  };

  const getPaymentBadge = (status) => {
    const paymentConfig = {
      paid: { class: 'payment-paid', label: 'Paid' },
      partial: { class: 'payment-partial', label: 'Partially Paid' },
      unpaid: { class: 'payment-unpaid', label: 'Unpaid' }
    };
    const config = paymentConfig[status?.toLowerCase()] || paymentConfig.unpaid;
    return <span className={`payment-badge-modern ${config.class}`}>{config.label}</span>;
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
                <div className="room-number-badge">
                  <div className="room-number-text">{room.room_number}</div>
                  <div className="status-pill available">
                    <CheckCircle size={12} />
                    <span>AVAILABLE</span>
                  </div>
                </div>
                <div className="room-details-section">
                  <div className="room-type-name">{room.room_type}</div>
                  <div className="room-status-text">
                    <Users size={12} />
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
              <div 
                key={index} 
                className="professional-room-card occupied clickable"
                onClick={() => handleOccupiedRoomClick(room)}
                style={{ cursor: 'pointer' }}
                title="Click to view booking details"
              >
                <div className="room-number-badge">
                  <div className="room-number-text">{room.room_number}</div>
                  <div className="status-pill occupied">
                    <XCircle size={12} />
                    <span>OCCUPIED</span>
                  </div>
                </div>
                <div className="room-details-section">
                  <div className="room-type-name">{room.room_type}</div>
                  <div className="room-status-text">
                    <Users size={12} />
                    <span>Click to view booking</span>
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
                  <div className="room-number-badge">
                    <div className="room-number-text">{room.room_number}</div>
                    <div className="status-pill maintenance">
                      <AlertCircle size={12} />
                      <span>MAINTENANCE</span>
                    </div>
                  </div>
                  <div className="room-details-section">
                    <div className="room-type-name">{room.room_type}</div>
                    <div className="room-status-text">
                      <Clock size={12} />
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

      {/* Booking Details Modal */}
      {showBookingModal && selectedRoomBooking && (
        <div className="modal-overlay" onClick={handleCloseBookingModal}>
          <div className="view-modal modern-booking-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header gradient-header">
              <div className="header-content">
                <div className="header-icon">
                  <Calendar size={28} />
                </div>
                <div>
                  <h3>Booking Details</h3>
                  <p className="booking-ref-badge">{selectedRoomBooking.bookingRef}</p>
                </div>
              </div>
              <button className="close-btn" onClick={handleCloseBookingModal}>
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body scrollable-content">
              {/* Guest Information Card */}
              <div className="info-card guest-card">
                <div className="card-header">
                  <User size={20} />
                  <h4>Guest Information</h4>
                </div>
                <div className="card-content">
                  <div className="guest-info-grid">
                    <div className="guest-info-item">
                      <div className="guest-info-icon name">👤</div>
                      <div className="guest-info-content">
                        <span className="guest-info-label">Guest Name</span>
                        <span className="guest-info-value">{selectedRoomBooking.guestName}</span>
                      </div>
                    </div>
                    <div className="guest-info-item">
                      <div className="guest-info-icon email">📧</div>
                      <div className="guest-info-content">
                        <span className="guest-info-label">Email</span>
                        <span className="guest-info-value">{selectedRoomBooking.guestEmail}</span>
                      </div>
                    </div>
                    <div className="guest-info-item">
                      <div className="guest-info-icon phone">📱</div>
                      <div className="guest-info-content">
                        <span className="guest-info-label">Phone</span>
                        <span className="guest-info-value">{selectedRoomBooking.guestPhone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Information Card */}
              <div className="info-card booking-card">
                <div className="card-header">
                  <Calendar size={20} />
                  <h4>Booking Information</h4>
                </div>
                <div className="card-content">
                  <div className="dates-grid">
                    <div className="date-box checkin">
                      <div className="date-box-icon">📅</div>
                      <div className="date-box-content">
                        <span className="date-box-label">Check-in</span>
                        <span className="date-box-date">{formatDate(selectedRoomBooking.checkInDate)}</span>
                        <span className="date-box-year">{new Date(selectedRoomBooking.checkInDate).getFullYear()}</span>
                      </div>
                    </div>
                    
                    <div className="date-separator">
                      <div className="separator-line"></div>
                      <div className="nights-badge">{selectedRoomBooking.totalNights} {selectedRoomBooking.totalNights === 1 ? 'Night' : 'Nights'}</div>
                    </div>
                    
                    <div className="date-box checkout">
                      <div className="date-box-icon">📆</div>
                      <div className="date-box-content">
                        <span className="date-box-label">Check-out</span>
                        <span className="date-box-date">{formatDate(selectedRoomBooking.checkOutDate)}</span>
                        <span className="date-box-year">{new Date(selectedRoomBooking.checkOutDate).getFullYear()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="room-guests-grid">
                    <div className="room-guest-box room">
                      <div className="rgb-icon">🏠</div>
                      <div className="rgb-content">
                        <span className="rgb-label">Room</span>
                        <span className="rgb-value">Room {selectedRoomBooking.roomNumber}</span>
                        <span className="rgb-subtitle">{selectedRoomBooking.roomType}</span>
                      </div>
                    </div>
                    <div className="room-guest-box guests">
                      <div className="rgb-icon">👥</div>
                      <div className="rgb-content">
                        <span className="rgb-label">Guests</span>
                        <span className="rgb-value">{selectedRoomBooking.guestCount} {selectedRoomBooking.guestCount === 1 ? 'Guest' : 'Guests'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="status-grid">
                    <div className="status-box-item">
                      <span className="status-box-label">Booking Status</span>
                      {getStatusBadge(selectedRoomBooking.status)}
                    </div>
                    <div className="status-box-item">
                      <span className="status-box-label">Payment Status</span>
                      {getPaymentBadge(selectedRoomBooking.paymentStatus)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Charges */}
              {selectedRoomBooking.charges && selectedRoomBooking.charges.length > 0 && (
                <div className="info-card charges-card">
                  <div className="card-header">
                    <span className="header-icon">➕</span>
                    <h4>Additional Charges</h4>
                  </div>
                  <div className="card-content">
                    <div className="charges-list">
                      {selectedRoomBooking.charges.map((charge, index) => {
                        const chargeAmount = parseFloat(charge.totalAmount || charge.amount || 0);
                        const chargeDate = charge.createdAt || charge.created_at;
                        return (
                          <div key={index} className="charge-item modern">
                            <div className="charge-info">
                              <span className="charge-name">{charge.description}</span>
                              <span className="charge-date">
                                <Clock size={12} />
                                {chargeDate && formatDate(chargeDate)}
                              </span>
                            </div>
                            <div className="charge-amount">
                              ৳{isNaN(chargeAmount) ? '0.00' : chargeAmount.toFixed(2)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Payment History */}
              {selectedRoomBooking.payments && selectedRoomBooking.payments.length > 0 && (
                <div className="info-card payments-card">
                  <div className="card-header">
                    <CreditCard size={20} />
                    <h4>Payment History</h4>
                  </div>
                  <div className="card-content">
                    <div className="payments-list modern">
                      {selectedRoomBooking.payments.map((payment, index) => (
                        <div key={index} className="payment-item modern">
                          <div className="payment-icon-wrapper">
                            <CreditCard size={20} />
                          </div>
                          <div className="payment-info">
                            <div className="payment-method-badge">{(payment.method || 'CASH').toUpperCase()}</div>
                            <div className="payment-meta">
                              <Clock size={12} />
                              <span>{formatDate(payment.processedAt || payment.createdAt)} at {new Date(payment.processedAt || payment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            {payment.reference && (
                              <div className="payment-reference">
                                <span>Ref: {payment.reference}</span>
                              </div>
                            )}
                            {payment.receivedBy && (
                              <div className="payment-received">
                                <User size={12} />
                                <span>{payment.receivedBy}</span>
                              </div>
                            )}
                          </div>
                          <div className="payment-amount-badge">৳{parseFloat(payment.amount).toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Room Charges Breakdown */}
              {selectedRoomBooking.totals && (
                <div className="info-card charges-breakdown-card">
                  <div className="card-header">
                    <span className="header-icon">📋</span>
                    <h4>Room Charges Breakdown</h4>
                  </div>
                  <div className="card-content">
                    <div className="charge-breakdown-list">
                      <div className="charge-line-item">
                        <div className="charge-line-info">
                          <span className="charge-line-label">Room {selectedRoomBooking.roomNumber}</span>
                          <span className="charge-line-detail">
                            {selectedRoomBooking.totalNights} {selectedRoomBooking.totalNights === 1 ? 'night' : 'nights'} × ৳{(selectedRoomBooking.totals.baseAmount / selectedRoomBooking.totalNights).toFixed(2)}
                          </span>
                        </div>
                        <span className="charge-line-value">৳{selectedRoomBooking.totals.baseAmount?.toFixed(2)}</span>
                      </div>

                      {selectedRoomBooking.totals.discountAmount > 0 && (
                        <div className="charge-line-item discount-line">
                          <div className="charge-line-info">
                            <span className="charge-line-label">Discount Applied</span>
                            <span className="charge-line-detail">{selectedRoomBooking.totals.discountPercentage}% off</span>
                          </div>
                          <span className="charge-line-value discount-value">-৳{selectedRoomBooking.totals.discountAmount?.toFixed(2)}</span>
                        </div>
                      )}

                      {selectedRoomBooking.totals.additionalCharges > 0 && (
                        <div className="charge-line-item">
                          <div className="charge-line-info">
                            <span className="charge-line-label">Additional Charges</span>
                            <span className="charge-line-detail">
                              {selectedRoomBooking.charges?.length || 0} {selectedRoomBooking.charges?.length === 1 ? 'charge' : 'charges'}
                            </span>
                          </div>
                          <span className="charge-line-value">৳{selectedRoomBooking.totals.additionalCharges?.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Financial Summary */}
              {selectedRoomBooking.totals && (
                <div className="info-card financial-card">
                  <div className="card-header financial-header">
                    <span className="header-icon">💰</span>
                    <h4>Financial Summary</h4>
                    <div className="header-badge">
                      {selectedRoomBooking.totals.balance > 0 ? (
                        <span className="badge-due">Payment Pending</span>
                      ) : (
                        <span className="badge-paid">Fully Paid</span>
                      )}
                    </div>
                  </div>
                  <div className="card-content financial-content">
                    {/* Compact Charges List */}
                    <div className="financial-charges-list">
                      <div className="charge-line-item">
                        <span className="charge-line-label">
                          <span className="charge-line-icon">🛏️</span>
                          Room Charges
                        </span>
                        <span className="charge-line-value">৳{selectedRoomBooking.totals.roomTotal?.toFixed(2)}</span>
                      </div>
                      
                      {selectedRoomBooking.totals.additionalCharges > 0 && (
                        <div className="charge-line-item">
                          <span className="charge-line-label">
                            <span className="charge-line-icon">➕</span>
                            Extra Charges
                          </span>
                          <span className="charge-line-value">৳{selectedRoomBooking.totals.additionalCharges?.toFixed(2)}</span>
                        </div>
                      )}
                      
                      {selectedRoomBooking.totals.vat > 0 && (
                        <div className="charge-line-item">
                          <span className="charge-line-label">
                            <span className="charge-line-icon">📊</span>
                            VAT
                          </span>
                          <span className="charge-line-value">৳{selectedRoomBooking.totals.vat?.toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    {/* Financial Summary Row */}
                    <div className="financial-summary-row">
                      {/* Grand Total */}
                      <div className="financial-box total-box">
                        <div className="fb-icon total-icon">💵</div>
                        <div className="fb-content">
                          <span className="fb-label">Grand Total</span>
                          <span className="fb-amount total-amount">৳{selectedRoomBooking.totals.grandTotal?.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      {/* Total Paid */}
                      <div className="financial-box paid-box">
                        <div className="fb-icon paid-icon">✓</div>
                        <div className="fb-content">
                          <span className="fb-label">Total Paid</span>
                          <span className="fb-amount paid-amount">৳{selectedRoomBooking.totals.totalPaid?.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      {/* Balance Due */}
                      <div className={`financial-box ${selectedRoomBooking.totals.balance > 0 ? 'due-box' : 'clear-box'}`}>
                        <div className={`fb-icon ${selectedRoomBooking.totals.balance > 0 ? 'due-icon' : 'clear-icon'}`}>
                          {selectedRoomBooking.totals.balance > 0 ? '⚠' : '✓'}
                        </div>
                        <div className="fb-content">
                          <span className="fb-label">Balance Due</span>
                          <span className={`fb-amount ${selectedRoomBooking.totals.balance > 0 ? 'due-amount' : 'clear-amount'}`}>
                            ৳{selectedRoomBooking.totals.balance?.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-actions modern-actions">
              <button className="btn btn-secondary modern-btn" onClick={handleCloseBookingModal}>
                <X size={18} />
                Close
              </button>
              <button className="btn btn-warning modern-btn" onClick={handleAddChargeClick}>
                <Plus size={18} />
                Add Charge
              </button>
              <button className="btn btn-primary modern-btn" onClick={handleAddPaymentClick}>
                <Plus size={18} />
                Add Payment
              </button>
              <button className="btn btn-success modern-btn" onClick={handleViewInvoice}>
                <Eye size={18} />
                View Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Charge Modal */}
      {showChargeModal && selectedRoomBooking && (
        <div className="modal-overlay" onClick={handleCloseChargeModal}>
          <div className="charge-modal modern-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header gradient-header">
              <div className="header-content">
                <div className="header-icon">
                  <Plus size={24} />
                </div>
                <div>
                  <h3>Add Additional Charge</h3>
                  <p className="modal-subtitle">Booking: {selectedRoomBooking.bookingRef}</p>
                </div>
              </div>
              <button className="close-btn" onClick={handleCloseChargeModal}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Charge Type *</label>
                <select
                  value={chargeData.type}
                  onChange={(e) => setChargeData({...chargeData, type: e.target.value})}
                  className="form-control"
                >
                  <option value="">Select charge type</option>
                  <option value="Late Check-out">Late Check-out</option>
                  <option value="Early Check-in">Early Check-in</option>
                  <option value="Smoking Fine">Smoking Fine</option>
                  <option value="Room Damage">Room Damage</option>
                  <option value="Lost Keycard">Lost Keycard</option>
                  <option value="Excessive Cleaning">Excessive Cleaning</option>
                  <option value="Unauthorized Guest">Unauthorized Guest</option>
                  <option value="Linen/Towel Damage">Linen/Towel Damage</option>
                  <option value="Lost Item Damage">Lost Item Damage</option>
                  <option value="Mini-bar">Mini-bar</option>
                  <option value="Room Service">Room Service</option>
                  <option value="Laundry">Laundry</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              {chargeData.type === 'Others' && (
                <div className="form-group">
                  <label>Custom Description *</label>
                  <input
                    type="text"
                    value={chargeData.customDescription}
                    onChange={(e) => setChargeData({...chargeData, customDescription: e.target.value})}
                    className="form-control"
                    placeholder="Enter charge description"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Amount (৳) *</label>
                <input
                  type="number"
                  value={chargeData.amount}
                  onChange={(e) => setChargeData({...chargeData, amount: e.target.value})}
                  className="form-control"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="modal-actions modern-actions">
              <button className="btn btn-secondary modern-btn" onClick={handleCloseChargeModal}>
                <X size={18} />
                Cancel
              </button>
              <button className="btn btn-warning modern-btn" onClick={handleChargeSubmit}>
                <Plus size={18} />
                Add Charge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showPaymentModal && selectedRoomBooking && (
        <div className="modal-overlay" onClick={handleClosePaymentModal}>
          <div className="payment-modal modern-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header gradient-header">
              <div className="header-content">
                <div className="header-icon">
                  <CreditCard size={24} />
                </div>
                <div>
                  <h3>Add Payment</h3>
                  <p className="modal-subtitle">Booking: {selectedRoomBooking.bookingRef}</p>
                </div>
              </div>
              <button className="close-btn" onClick={handleClosePaymentModal}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Payment Amount (৳) *</label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                  className="form-control"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Payment Method *</label>
                <select
                  value={paymentData.method}
                  onChange={(e) => setPaymentData({...paymentData, method: e.target.value})}
                  className="form-control"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_banking">Mobile Banking</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                  className="form-control"
                  placeholder="Add any notes about this payment"
                  rows="3"
                />
              </div>
            </div>

            <div className="modal-actions modern-actions">
              <button className="btn btn-secondary modern-btn" onClick={handleClosePaymentModal}>
                <X size={18} />
                Cancel
              </button>
              <button className="btn btn-primary modern-btn" onClick={handlePaymentSubmit}>
                <CreditCard size={18} />
                Add Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;