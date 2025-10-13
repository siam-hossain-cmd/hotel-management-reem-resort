import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2, Calendar, Users, CheckCircle, XCircle, Clock, CreditCard, AlertTriangle, X, LogIn, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import bookingService from '../firebase/bookingService';
import invoiceService from '../firebase/invoiceService'; // Import invoice service
import '../booking.css';

const Bookings = () => {
  const { canPerformAction } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [bookingToView, setBookingToView] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'checkInDate', direction: 'descending' });

  // Load bookings on component mount
  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const bookingResult = await api.getBookings();
      if (bookingResult.success) {
        const invoiceResult = await invoiceService.getAllInvoices();
        const invoices = invoiceResult.success ? invoiceResult.invoices : [];
        
        const transformedBookings = bookingResult.bookings.map(booking => {
          const relatedInvoice = invoices.find(inv => inv.bookingId === booking.id);
          let paymentStatus = 'unpaid'; // Default to unpaid
          let paidAmount = 0;
          const totalAmount = parseFloat(booking.total_amount) || 0;

          if (relatedInvoice) {
            paidAmount = relatedInvoice.totalPaid || 0;
            if (paidAmount >= totalAmount) {
              paymentStatus = 'paid';
            } else if (paidAmount > 0) {
              paymentStatus = 'partial';
            }
          }
          
          const dueBalance = totalAmount - paidAmount;

          return {
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
            total: totalAmount,
            paymentStatus: paymentStatus,
            paidAmount: paidAmount,
            dueBalance: dueBalance,
            status: (booking.status || 'confirmed').toLowerCase(),
            createdAt: booking.created_at,
            createdBy: booking.created_by || 'System',
            currency: booking.currency || 'BDT',
            bookingDate: booking.created_at ? new Date(booking.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
            fullData: booking // Store full booking data for actions
          };
        });
        
        setBookings(transformedBookings);
      } else {
        console.error('Failed to load bookings:', bookingResult.error);
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
    console.log('Delete booking clicked:', booking);
    setBookingToDelete(booking);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (bookingToDelete) {
      try {
        console.log('Attempting to delete booking:', bookingToDelete.id);
        const result = await bookingService.deleteBooking(bookingToDelete.id);
        console.log('Delete result:', result);
        
        if (result && result.success) {
          // Remove from local state
          setBookings(prevBookings => 
            prevBookings.filter(booking => booking.id !== bookingToDelete.id)
          );
          // Reload bookings to ensure data consistency
          await loadBookings();
          alert(`Booking deleted successfully! Room ${bookingToDelete.roomNumber} is now available.`);
        } else {
          // Handle different types of error responses
          let errorMsg = 'Failed to delete booking';
          if (result && result.error) {
            if (typeof result.error === 'string') {
              errorMsg = result.error;
            } else if (result.error.message) {
              errorMsg = result.error.message;
            }
          }
          console.error('Delete failed with error:', result);
          alert('Failed to delete booking: ' + errorMsg);
        }
      } catch (error) {
        console.error('Exception during delete:', error);
        // Handle different error types more safely
        let errorMsg = 'Unknown error occurred';
        try {
          if (error && typeof error === 'object') {
            if (error.message && typeof error.message === 'string') {
              errorMsg = error.message;
            } else if (error.toString && typeof error.toString === 'function') {
              errorMsg = error.toString();
            }
          } else if (typeof error === 'string') {
            errorMsg = error;
          }
        } catch (e) {
          console.error('Error processing error message:', e);
        }
        alert('Error deleting booking: ' + errorMsg);
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

  const handleQuickStatusChange = async (bookingId, newStatus, bookingData) => {
    try {
      let result;
      
      // Show confirmation for critical actions
      if (newStatus === 'checked-in') {
        if (!confirm(`Check in guest for Room ${bookingData.roomNumber}?`)) return;
      } else if (newStatus === 'checked-out') {
        if (!confirm(`Check out guest from Room ${bookingData.roomNumber}?`)) return;
      }
      
      console.log(`Attempting to change status to: ${newStatus} for booking: ${bookingId}`);
      
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
        default:
          result = await bookingService.updateBooking(bookingId, { status: newStatus });
      }

      console.log('Status change result:', result);

      if (result && result.success) {
        await loadBookings(); // Reload bookings to reflect changes
        alert(`Booking status updated to ${newStatus.replace('-', ' ')}`);
      } else {
        let errorMsg = 'Failed to update booking status';
        if (result && result.error) {
          if (typeof result.error === 'string') {
            errorMsg = result.error;
          } else if (result.error.message) {
            errorMsg = result.error.message;
          }
        }
        console.error('Status change failed:', result);
        alert('Failed to update booking status: ' + errorMsg);
      }
    } catch (error) {
      console.error('Exception during status change:', error);
      let errorMsg = 'Unknown error occurred';
      try {
        if (error && typeof error === 'object') {
          if (error.message && typeof error.message === 'string') {
            errorMsg = error.message;
          } else if (error.toString && typeof error.toString === 'function') {
            errorMsg = error.toString();
          }
        } else if (typeof error === 'string') {
          errorMsg = error;
        }
      } catch (e) {
        console.error('Error processing error message:', e);
      }
      alert('Error updating booking status: ' + errorMsg);
    }
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
        const errorMsg = typeof result.error === 'string' ? result.error : 'Failed to update payment status';
        alert('Failed to update payment status: ' + errorMsg);
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      const errorMsg = error && error.message ? error.message : 'Unknown error occurred';
      alert('Error updating payment status: ' + errorMsg);
    }
  };

  const sortedAndFilteredBookings = React.useMemo(() => {
    let sortableItems = [...filteredBookings];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredBookings, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    }
    return '';
  };

  const handleViewBooking = (booking) => {
    console.log('View booking clicked:', booking);
    setBookingToView(booking);
    setShowViewModal(true);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setBookingToView(null);
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
    
    const config = paymentConfig[paymentStatus] || paymentConfig.unpaid;
    
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
        <div className="summary-card confirmed">
          <h3>Confirmed</h3>
          <p className="summary-number">{bookings.filter(b => b.status === 'confirmed').length}</p>
        </div>
        <div className="summary-card checked-in">
          <h3>Checked In</h3>
          <p className="summary-number">{bookings.filter(b => b.status === 'checked-in').length}</p>
        </div>
        <div className="summary-card checked-out">
          <h3>Checked Out</h3>
          <p className="summary-number">{bookings.filter(b => b.status === 'checked-out').length}</p>
        </div>
      </div>

      <div className="bookings-table-container">
        <table className="bookings-table">
          <thead>
            <tr>
              <th>Booking Ref</th>
              <th onClick={() => requestSort('guestName')} className="sortable">
                Guest{getSortIndicator('guestName')}
              </th>
              <th>Room</th>
              <th onClick={() => requestSort('bookingDate')} className="sortable">
                Booking Date{getSortIndicator('bookingDate')}
              </th>
              <th onClick={() => requestSort('checkInDate')} className="sortable">
                Check-in{getSortIndicator('checkInDate')}
              </th>
              <th>Check-out</th>
              <th>Nights</th>
              <th>Guests</th>
              <th onClick={() => requestSort('total')} className="sortable">
                Total{getSortIndicator('total')}
              </th>
              <th>Status</th>
              <th>Payment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFilteredBookings.map((booking) => (
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
                <td>
                  <div className="booking-date">
                    <span>{booking.bookingDate}</span>
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
                  </div>
                </td>
                <td>
                  <div className="payment-details-col">
                    <div className="payment-line">
                      <span className="payment-label paid">Paid:</span>
                      <span className="payment-amount paid">৳{booking.paidAmount?.toFixed(2)}</span>
                    </div>
                    <div className="payment-line">
                      <span className="payment-label due">Due:</span>
                      <span className="payment-amount due">৳{booking.dueBalance?.toFixed(2)}</span>
                    </div>
                    {getPaymentBadge(booking.paymentStatus)}
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="action-btn view" title="View" onClick={() => handleViewBooking(booking)}>
                      <Eye size={16} /> View
                    </button>
                    
                    {/* Quick Action Buttons based on status - temporarily removing permission checks */}
                    {booking.status === 'confirmed' && (
                      <button 
                        className="action-btn checkin" 
                        title="Check In"
                        onClick={() => handleQuickStatusChange(booking.id, 'checked-in', booking)}
                      >
                        <LogIn size={16} /> Check In
                      </button>
                    )}
                    
                    {booking.status === 'checked-in' && (
                      <button 
                        className="action-btn checkout" 
                        title="Check Out"
                        onClick={() => handleQuickStatusChange(booking.id, 'checked-out', booking)}
                      >
                        <LogOut size={16} /> Check Out
                      </button>
                    )}
                    
                    {booking.paymentStatus === 'paid' && (
                      <button 
                        className="action-btn invoice" 
                        title="Generate Invoice"
                        onClick={() => handleGenerateInvoice(booking)}
                      >
                        <Calendar size={16} /> Invoice
                      </button>
                    )}
                    
                    <button 
                      className="action-btn delete" 
                      title="Delete"
                      onClick={() => handleDeleteClick(booking)}
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sortedAndFilteredBookings.length === 0 && (
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

      {/* View Booking Modal */}
      {showViewModal && bookingToView && (
        <div className="modal-overlay">
          <div className="view-modal">
            <div className="modal-header">
              <h3>Booking Details</h3>
              <button className="close-btn" onClick={handleCloseViewModal}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <div className="booking-details-grid">
                <div className="detail-item"><span>Booking Ref:</span> <strong>{bookingToView.bookingRef}</strong></div>
                <div className="detail-item"><span>Guest Name:</span> {bookingToView.guestName}</div>
                <div className="detail-item"><span>Email:</span> {bookingToView.guestEmail}</div>
                <div className="detail-item"><span>Phone:</span> {bookingToView.guestPhone}</div>
                <div className="detail-item"><span>Room:</span> Room {bookingToView.roomNumber} ({bookingToView.roomType})</div>
                <div className="detail-item"><span>Check-in:</span> {new Date(bookingToView.checkInDate).toLocaleDateString()}</div>
                <div className="detail-item"><span>Check-out:</span> {new Date(bookingToView.checkOutDate).toLocaleDateString()}</div>
                <div className="detail-item"><span>Nights:</span> {bookingToView.totalNights}</div>
                <div className="detail-item"><span>Guests:</span> {bookingToView.guestCount}</div>
                <div className="detail-item"><span>Total Amount:</span> ৳{bookingToView.total?.toFixed(2)}</div>
                <div className="detail-item"><span>Booking Status:</span> {getStatusBadge(bookingToView.status)}</div>
                <div className="detail-item"><span>Payment Status:</span> {getPaymentBadge(bookingToView.paymentStatus)}</div>
                <div className="detail-item"><span>Booked On:</span> {new Date(bookingToView.createdAt).toLocaleString()}</div>
                <div className="detail-item"><span>Booked By:</span> {bookingToView.createdBy}</div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={handleCloseViewModal}>
                Close
              </button>
              {canPerformAction('generate_invoice') && bookingToView.paymentStatus === 'paid' && (
                <button 
                  className="btn btn-primary" 
                  onClick={() => handleGenerateInvoice(bookingToView)}
                >
                  <Calendar size={20} />
                  Generate Invoice
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;