import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2, Calendar, Users, CheckCircle, XCircle, Clock, CreditCard, AlertTriangle, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import '../booking.css';

const Bookings = () => {
  const { canPerformAction } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);

  // Load bookings on component mount
  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const result = await api.getBookings();
      if (result.success) {
        const transformedBookings = result.bookings.map(booking => ({
          id: booking.id,
          bookingRef: booking.booking_reference,
          guestName: `${booking.first_name || ''} ${booking.last_name || ''}`.trim(),
          guestEmail: booking.email || '',
          guestPhone: booking.phone || '',
          roomNumber: booking.room_number,
          roomType: booking.room_type,
          checkInDate: booking.checkin_date,
          checkOutDate: booking.checkout_date,
          totalNights: Math.ceil((new Date(booking.checkout_date) - new Date(booking.checkin_date)) / (1000 * 60 * 60 * 24)),
          guestCount: booking.capacity || 1,
          total: parseFloat(booking.total_amount),
          paymentStatus: booking.payment_status || 'pending',
          status: booking.status || 'confirmed',
          createdAt: booking.created_at,
          createdBy: booking.created_by || 'System',
          currency: booking.currency || 'BDT',
          fullData: booking // Store full booking data for actions
        }));
        
        setBookings(transformedBookings);
      } else {
        console.error('Failed to load bookings:', result.error);
        setBookings([]);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.guestEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.bookingRef.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || booking.status.toLowerCase() === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleDeleteClick = (booking) => {
    setBookingToDelete(booking);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (bookingToDelete) {
      try {
        const result = await bookingService.deleteBooking(bookingToDelete.id);
        
        if (result.success) {
          setBookings(prevBookings => 
            prevBookings.filter(booking => booking.id !== bookingToDelete.id)
          );
          alert('Booking deleted successfully!');
        } else {
          alert('Failed to delete booking: ' + result.error);
        }
      } catch (error) {
        console.error('Error deleting booking:', error);
        alert('Error deleting booking: ' + error.message);
      } finally {
        setShowDeleteModal(false);
        setBookingToDelete(null);
      }
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setBookingToDelete(null);
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      let result;
      switch (newStatus) {
        case 'confirmed':
          result = await bookingService.confirmBooking(bookingId);
          break;
        case 'checked-in':
          result = await bookingService.checkIn(bookingId);
          break;
        case 'checked-out':
          result = await bookingService.checkOut(bookingId);
          break;
        case 'cancelled':
          const reason = prompt('Enter cancellation reason (optional):');
          result = await bookingService.cancelBooking(bookingId, reason || '');
          break;
        default:
          result = await bookingService.updateBooking(bookingId, { status: newStatus });
      }

      if (result.success) {
        await loadBookings(); // Reload bookings to reflect changes
        alert(`Booking status updated to ${newStatus}`);
      } else {
        alert('Failed to update booking status: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Error updating booking status');
    }
  };

  const handlePaymentStatusChange = async (bookingId, newPaymentStatus) => {
    try {
      let result;
      if (newPaymentStatus === 'paid') {
        const paymentDetails = {
          method: prompt('Payment method (cash/card/transfer):') || 'cash',
          reference: prompt('Payment reference (optional):') || '',
          notes: prompt('Payment notes (optional):') || ''
        };
        result = await bookingService.markAsPaid(bookingId, paymentDetails);
      } else {
        result = await bookingService.updateBooking(bookingId, { paymentStatus: newPaymentStatus });
      }

      if (result.success) {
        await loadBookings(); // Reload bookings to reflect changes
        alert(`Payment status updated to ${newPaymentStatus}`);
      } else {
        alert('Failed to update payment status: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Error updating payment status');
    }
  };

  const handleViewBooking = (booking) => {
    // Create a detailed view of the booking
    const bookingDetails = `
Booking Reference: ${booking.bookingRef}
Guest: ${booking.guestName}
Email: ${booking.guestEmail}
Phone: ${booking.guestPhone}
Room: ${booking.roomNumber} (${booking.roomType})
Check-in: ${booking.checkInDate}
Check-out: ${booking.checkOutDate}
Nights: ${booking.totalNights}
Guests: ${booking.guestCount}
Total: ৳${booking.total?.toFixed(2)}
Status: ${booking.status}
Payment Status: ${booking.paymentStatus}
Created by: ${booking.createdBy}
    `.trim();
    
    alert(bookingDetails);
  };

  const handleGenerateInvoice = (booking) => {
    // Store booking data for invoice generation
    localStorage.setItem('bookingForInvoice', JSON.stringify(booking.fullData));
    window.location.href = `/create-invoice?mode=booking&bookingId=${booking.id}`;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'orange', icon: Clock },
      confirmed: { color: 'blue', icon: CheckCircle },
      paid: { color: 'green', icon: CreditCard },
      'checked-in': { color: 'purple', icon: Users },
      'checked-out': { color: 'gray', icon: CheckCircle },
      cancelled: { color: 'red', icon: XCircle }
    };
    
    const config = statusConfig[status] || { color: 'gray', icon: Clock };
    const Icon = config.icon;
    
    return (
      <span className={`status-badge status-${config.color}`}>
        <Icon size={14} />
        {status.replace('-', ' ').toUpperCase()}
      </span>
    );
  };

  const getPaymentBadge = (paymentStatus) => {
    const paymentConfig = {
      unpaid: { color: 'red', text: 'UNPAID' },
      partial: { color: 'orange', text: 'PARTIAL' },
      paid: { color: 'green', text: 'PAID' },
      refunded: { color: 'purple', text: 'REFUNDED' }
    };
    
    const config = paymentConfig[paymentStatus] || { color: 'gray', text: 'UNKNOWN' };
    
    return (
      <span className={`payment-badge payment-${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bookings-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bookings-page">
      <div className="page-header">
        <h1>Bookings & Reservations</h1>
        {canPerformAction('create_booking') && (
          <Link to="/create-booking" className="btn btn-primary">
            <Plus size={20} />
            New Booking
          </Link>
        )}
      </div>

      <div className="page-filters">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by guest name, email, room number, or booking reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <Filter size={20} />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="paid">Paid</option>
            <option value="checked-in">Checked In</option>
            <option value="checked-out">Checked Out</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bookings-summary">
        <div className="summary-card">
          <h3>Total Bookings</h3>
          <p className="summary-number">{bookings.length}</p>
        </div>
        <div className="summary-card">
          <h3>Pending</h3>
          <p className="summary-number">{bookings.filter(b => b.status === 'pending').length}</p>
        </div>
        <div className="summary-card">
          <h3>Confirmed</h3>
          <p className="summary-number">{bookings.filter(b => b.status === 'confirmed').length}</p>
        </div>
        <div className="summary-card">
          <h3>Checked In</h3>
          <p className="summary-number">{bookings.filter(b => b.status === 'checked-in').length}</p>
        </div>
      </div>

      <div className="bookings-table-container">
        <table className="bookings-table">
          <thead>
            <tr>
              <th>Booking Ref</th>
              <th>Guest</th>
              <th>Room</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Nights</th>
              <th>Guests</th>
              <th>Total</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map((booking) => (
              <tr key={booking.id}>
                <td>
                  <span className="booking-ref">{booking.bookingRef}</span>
                </td>
                <td>
                  <div className="guest-info">
                    <strong>{booking.guestName}</strong>
                    <div className="guest-contact">
                      <small>{booking.guestEmail}</small>
                      <small>{booking.guestPhone}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="room-info">
                    <strong>Room {booking.roomNumber}</strong>
                    <small>{booking.roomType}</small>
                  </div>
                </td>
                <td>{booking.checkInDate}</td>
                <td>{booking.checkOutDate}</td>
                <td className="text-center">{booking.totalNights}</td>
                <td className="text-center">{booking.guestCount}</td>
                <td className="amount">৳{booking.total?.toFixed(2)}</td>
                <td>
                  <div className="status-controls">
                    {getStatusBadge(booking.status)}
                    {canPerformAction('manage_bookings') && (
                      <select 
                        className="status-select"
                        value={booking.status}
                        onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="checked-in">Checked In</option>
                        <option value="checked-out">Checked Out</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    )}
                  </div>
                </td>
                <td>
                  <div className="payment-controls">
                    {getPaymentBadge(booking.paymentStatus)}
                    {canPerformAction('manage_payments') && (
                      <select 
                        className="payment-select"
                        value={booking.paymentStatus}
                        onChange={(e) => handlePaymentStatusChange(booking.id, e.target.value)}
                      >
                        <option value="unpaid">Unpaid</option>
                        <option value="partial">Partial</option>
                        <option value="paid">Paid</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    )}
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="action-btn" title="View" onClick={() => handleViewBooking(booking)}>
                      <Eye size={16} />
                    </button>
                    
                    {canPerformAction('generate_invoice') && booking.paymentStatus === 'paid' && (
                      <button 
                        className="action-btn invoice-btn" 
                        title="Generate Invoice"
                        onClick={() => handleGenerateInvoice(booking)}
                      >
                        <Calendar size={16} />
                      </button>
                    )}
                    
                    {canPerformAction('delete_booking') && (
                      <button 
                        className="action-btn delete-btn" 
                        title="Delete"
                        onClick={() => handleDeleteClick(booking)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredBookings.length === 0 && (
          <div className="no-bookings">
            <Calendar size={48} />
            <h3>No bookings found</h3>
            <p>No bookings match your current search criteria.</p>
            {canPerformAction('create_booking') && (
              <Link to="/create-booking" className="btn btn-primary">
                <Plus size={20} />
                Create First Booking
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <div className="modal-header">
              <h3>Delete Booking</h3>
              <button className="close-btn" onClick={handleCancelDelete}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <div className="warning-icon">
                <AlertTriangle size={48} />
              </div>
              <p>Are you sure you want to delete this booking?</p>
              <div className="booking-details">
                <p><strong>Guest:</strong> {bookingToDelete?.guestName}</p>
                <p><strong>Room:</strong> {bookingToDelete?.roomNumber}</p>
                <p><strong>Dates:</strong> {bookingToDelete?.checkInDate} to {bookingToDelete?.checkOutDate}</p>
              </div>
              <p className="warning-text">This action cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={handleCancelDelete}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleConfirmDelete}>
                <Trash2 size={20} />
                Delete Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;