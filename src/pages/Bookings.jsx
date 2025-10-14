import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2, Calendar, Users, CheckCircle, XCircle, Clock, CreditCard, AlertTriangle, X, LogIn, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import bookingService from '../firebase/bookingService';
import invoiceService from '../firebase/invoiceService';
import { previewInvoice } from '../utils/pdfGenerator';
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    method: 'CASH',
    reference: '',
    notes: ''
  });
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
          const totalAmount = parseFloat(booking.total_amount) || 0;
          
          // Use paid_amount from booking data (calculated from payments table)
          let paidAmount = parseFloat(booking.paid_amount) || 0;
          
          // Calculate payment status based on paid amount
          let paymentStatus = 'unpaid';
          if (paidAmount >= totalAmount) {
            paymentStatus = 'paid';
          } else if (paidAmount > 0) {
            paymentStatus = 'partial';
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

  const handleViewBooking = async (booking) => {
    console.log('View booking clicked:', booking);
    
    // Show modal immediately with basic info
    setBookingToView(booking);
    setShowViewModal(true);
    
    try {
      // Fetch comprehensive booking summary with charges, payments, and totals
      const result = await api.getBookingSummary(booking.id);
      
      if (result.success) {
        const { summary } = result;
        
        // Update modal with full details including charges, payments, and invoice info
        setBookingToView({
          ...booking,
          ...summary.booking,
          charges: summary.charges || [],
          payments: summary.payments || [],
          totals: summary.totals || {},
          invoice: summary.invoice || null
        });
      }
    } catch (error) {
      console.error('Error fetching booking summary:', error);
    }
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setBookingToView(null);
  };

  const handleAddPaymentClick = () => {
    if (bookingToView) {
      setShowViewModal(false);
      setSelectedBooking(bookingToView);
      setShowPaymentModal(true);
    }
  };

  const handleViewInvoice = async () => {
    if (!bookingToView) return;
    
    try {
      let invoiceData = null;
      
      // Check if invoice info is already loaded in the summary
      if (bookingToView.invoice && bookingToView.invoice.invoiceId) {
        // Fetch the full invoice data by numeric ID
        console.log('🔍 Fetching invoice by ID:', bookingToView.invoice.invoiceId);
        const invoiceResult = await api.getInvoiceById(bookingToView.invoice.invoiceId);
        
        if (invoiceResult.success && invoiceResult.invoice) {
          invoiceData = invoiceResult.invoice;
        }
      } else {
        // Otherwise, try to fetch invoice by booking ID
        console.log('🔍 Fetching invoice by booking ID:', bookingToView.id);
        const invoiceResult = await api.getInvoiceByBookingId(bookingToView.id);
        
        if (invoiceResult.success && invoiceResult.invoice) {
          invoiceData = invoiceResult.invoice;
        }
      }
      
      if (invoiceData) {
        // Transform the invoice data to match the format expected by previewInvoice
        const transformedInvoice = transformInvoiceData(invoiceData);
        console.log('✅ TRANSFORMED INVOICE FOR PDF:', transformedInvoice);
        console.log('📋 Customer Info in transformed:', transformedInvoice.customerInfo);
        console.log('🛏️ Items in transformed:', transformedInvoice.items);
        // Open invoice in preview/print mode
        previewInvoice(transformedInvoice);
      } else {
        // No invoice found
        alert('No invoice found for this booking. Please create an invoice from the Create Invoice page.');
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      alert('Error fetching invoice. Please try again.');
    }
  };

  // Transform invoice data from API to match PDF generator format
  const transformInvoiceData = (invoice) => {
    console.log('🔍 RAW INVOICE DATA:', invoice); // Enhanced debug log
    console.log('📋 Customer Info:', {
      first_name: invoice.first_name,
      last_name: invoice.last_name,
      email: invoice.email,
      phone: invoice.phone,
      nid: invoice.nid,
      address: invoice.address
    });
    console.log('📅 Date Info:', {
      checkin_date: invoice.checkin_date,
      checkout_date: invoice.checkout_date
    });
    console.log('🏠 Room Info:', {
      room_number: invoice.room_number,
      room_type: invoice.room_type
    });
    
    // Calculate nights if we have check-in and check-out dates
    let totalNights = 1;
    if (invoice.checkin_date && invoice.checkout_date) {
      const checkIn = new Date(invoice.checkin_date);
      const checkOut = new Date(invoice.checkout_date);
      totalNights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    }

    // Calculate per night cost
    const baseAmount = parseFloat(invoice.base_amount || invoice.booking_total || invoice.total || 0);
    const discountAmount = parseFloat(invoice.discount_amount || 0);
    const roomTotal = baseAmount - discountAmount;
    const perNightCost = totalNights > 0 ? baseAmount / totalNights : 0;

    // Calculate additional charges total
    const additionalChargesTotal = (invoice.charges || []).reduce((sum, c) => 
      sum + parseFloat(c.amount || 0), 0
    );

    return {
      id: invoice.invoice_number || `INV-${invoice.id}`,
      invoiceDate: invoice.invoice_date || invoice.issued_at || invoice.created_at,
      dueDate: invoice.due_date || invoice.due_at,
      customerInfo: {
        name: invoice.customer_name || 
              `${invoice.first_name || ''} ${invoice.last_name || ''}`.trim() || 
              'Guest',
        email: invoice.customer_email || invoice.email || '',
        phone: invoice.customer_phone || invoice.phone || '',
        nid: invoice.customer_nid || invoice.nid || '',
        address: invoice.customer_address || invoice.address || ''
      },
      items: invoice.items && invoice.items.length > 0 ? 
        invoice.items.map(item => ({
          roomNumber: item.room_number || invoice.room_number || 'N/A',
          checkInDate: item.check_in_date || invoice.checkin_date,
          checkOutDate: item.check_out_date || invoice.checkout_date,
          totalNights: item.total_nights || totalNights,
          guestCount: item.guest_count || invoice.capacity || 1,
          perNightCost: parseFloat(item.price_per_night || item.unit_price || perNightCost || 0),
          amount: parseFloat(item.amount || item.line_total || roomTotal || 0)
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
        amount: parseFloat(charge.amount || 0)
      })),
      originalSubtotal: baseAmount,
      totalDiscount: discountAmount,
      subtotal: roomTotal,
      additionalChargesTotal: additionalChargesTotal,
      tax: parseFloat(invoice.tax_amount || 0),
      total: parseFloat(invoice.total || baseAmount + additionalChargesTotal),
      paidAmount: parseFloat(invoice.paid_amount || invoice.paid || 0),
      balanceDue: parseFloat(invoice.due_amount || invoice.due || 0),
      notes: invoice.notes || '',
      terms: invoice.terms || 'Payment due upon receipt.',
      payments: (invoice.payments || []).map(payment => ({
        amount: parseFloat(payment.amount || 0),
        method: payment.method || payment.gateway || 'CASH',
        reference: payment.gateway_payment_id || '',
        date: payment.payment_date || payment.processed_at || payment.created_at
      }))
    };
  };

  const createInvoiceForBooking = async (booking) => {
    try {
      // Fetch full booking details
      const result = await api.getBookingById(booking.id);
      
      if (!result.success) {
        alert('Error fetching booking details');
        return;
      }
      
      const fullBooking = result.booking;
      
      // Calculate nights
      const checkIn = new Date(fullBooking.checkin_date || fullBooking.checkInDate);
      const checkOut = new Date(fullBooking.checkout_date || fullBooking.checkOutDate);
      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      
      // Calculate amounts
      const baseAmount = parseFloat(fullBooking.base_amount || fullBooking.total_amount || 0);
      const discountPercent = parseFloat(fullBooking.discount_percentage || 0);
      const discountAmount = (baseAmount * discountPercent) / 100;
      const afterDiscount = baseAmount - discountAmount;
      
      // Get additional charges
      const charges = fullBooking.charges || [];
      const additionalTotal = charges.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
      
      const total = afterDiscount + additionalTotal;
      
      // Create invoice
      const invoiceData = {
        booking_id: booking.id,
        customer_name: `${fullBooking.first_name} ${fullBooking.last_name}`,
        customer_email: fullBooking.email,
        customer_phone: fullBooking.phone,
        customer_address: fullBooking.address || '',
        customer_nid: fullBooking.id_number || '',
        invoice_date: new Date().toISOString().split('T')[0],
        items: [{
          room_number: fullBooking.room_number,
          room_type: fullBooking.room_type,
          check_in_date: fullBooking.checkin_date,
          check_out_date: fullBooking.checkout_date,
          total_nights: nights,
          guest_count: fullBooking.capacity || 1,
          price_per_night: baseAmount / nights,
          base_amount: baseAmount,
          discount_percentage: discountPercent,
          discount_amount: discountAmount,
          amount: afterDiscount
        }],
        notes: fullBooking.notes || '',
        terms: 'Payment due upon receipt.',
        created_by: 'system'
      };
      
      const createResult = await api.createInvoice(invoiceData);
      
      if (createResult.success) {
        alert('Invoice created successfully!');
        window.location.href = `/invoices?id=${createResult.invoice.id}`;
      } else {
        alert('Error creating invoice: ' + (createResult.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Error creating invoice. Please try again.');
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedBooking) return;
    
    try {
      const paymentPayload = {
        booking_id: selectedBooking.id,
        amount: parseFloat(paymentData.amount),
        method: paymentData.method,
        gateway_payment_id: paymentData.reference || null,
        notes: paymentData.notes || null,
        processed_at: new Date().toISOString()
      };
      
      const result = await api.addPayment(paymentPayload);
      
      if (result.success) {
        alert('Payment added successfully!');
        setShowPaymentModal(false);
        setPaymentData({
          amount: '',
          method: 'CASH',
          reference: '',
          notes: ''
        });
        setSelectedBooking(null);
        loadBookings(); // Reload bookings to update payment status
      } else {
        alert('Error adding payment: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Error adding payment. Please try again.');
    }
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentData({
      amount: '',
      method: 'CASH',
      reference: '',
      notes: ''
    });
    setSelectedBooking(null);
  };

  const handleGenerateInvoice = (booking) => {
    // Store booking data for invoice generation
    localStorage.setItem('bookingForInvoice', JSON.stringify(booking.fullData));
    window.location.href = `/create-invoice?mode=booking&bookingId=${booking.id}`;
  };

  const getStatusBadge = (status) => {
    // Handle undefined or null status
    const safeStatus = (status || 'pending').toLowerCase();
    
    const statusConfig = {
      pending: { color: 'orange', icon: Clock },
      confirmed: { color: 'blue', icon: CheckCircle },
      paid: { color: 'green', icon: CreditCard },
      'checked-in': { color: 'purple', icon: Users },
      'checked-out': { color: 'gray', icon: CheckCircle },
      cancelled: { color: 'red', icon: XCircle }
    };
    
    const config = statusConfig[safeStatus] || { color: 'gray', icon: Clock };
    const Icon = config.icon;
    
    return (
      <span className={`status-badge status-${config.color}`}>
        <Icon size={14} />
        {safeStatus.replace('-', ' ').toUpperCase()}
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

              {/* Additional Charges Section */}
              {bookingToView.charges && bookingToView.charges.length > 0 && (
                <div className="charges-section">
                  <h4>Additional Charges:</h4>
                  <div className="charges-list">
                    {bookingToView.charges.map((charge, index) => (
                      <div key={index} className="charge-item">
                        <div className="charge-desc">
                          <span className="charge-name">{charge.description}</span>
                          <span className="charge-date">
                            {new Date(charge.created_at).toLocaleDateString()} at {new Date(charge.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="charge-amount">৳{parseFloat(charge.amount).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment History Section */}
              {bookingToView.payments && bookingToView.payments.length > 0 && (
                <div className="payments-section">
                  <h4 className="payments-list-header">Payment History:</h4>
                  <div className="payments-list">
                    {bookingToView.payments.map((payment, index) => (
                      <div key={index} className="payment-item">
                        <div className="payment-desc">
                          <span className="payment-method">{(payment.method || 'CASH').toUpperCase()}</span>
                          <span className="payment-date">
                            Paid: {new Date(payment.processedAt || payment.createdAt).toLocaleDateString()} at {new Date(payment.processedAt || payment.createdAt).toLocaleTimeString()}
                          </span>
                          {payment.reference && (
                            <span className="payment-reference">Ref: {payment.reference}</span>
                          )}
                          {payment.receivedBy && (
                            <span className="payment-received">By: {payment.receivedBy}</span>
                          )}
                        </div>
                        <div className="payment-amount">৳{parseFloat(payment.amount).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Financial Totals Summary */}
              {bookingToView.totals && (
                <div className="financial-summary-card">
                  <div className="financial-header">
                    <h4>💰 Financial Summary</h4>
                  </div>
                  <div className="financial-body">
                    {/* Breakdown Section */}
                    <div className="breakdown-section">
                      <div className="breakdown-item">
                        <div className="breakdown-label">
                          <span className="breakdown-icon">🛏️</span>
                          <span>Room Charges</span>
                        </div>
                        <div className="breakdown-value">৳{bookingToView.totals.roomTotal?.toFixed(2)}</div>
                      </div>
                      
                      {bookingToView.totals.additionalCharges > 0 && (
                        <div className="breakdown-item">
                          <div className="breakdown-label">
                            <span className="breakdown-icon">➕</span>
                            <span>Additional Charges</span>
                          </div>
                          <div className="breakdown-value additional">৳{bookingToView.totals.additionalCharges?.toFixed(2)}</div>
                        </div>
                      )}
                      
                      <div className="breakdown-divider"></div>
                      
                      <div className="breakdown-item subtotal-row">
                        <div className="breakdown-label">
                          <span>Subtotal</span>
                        </div>
                        <div className="breakdown-value">৳{bookingToView.totals.subtotal?.toFixed(2)}</div>
                      </div>
                      
                      {bookingToView.totals.vat > 0 && (
                        <div className="breakdown-item">
                          <div className="breakdown-label">
                            <span className="breakdown-icon">📊</span>
                            <span>VAT</span>
                          </div>
                          <div className="breakdown-value">৳{bookingToView.totals.vat?.toFixed(2)}</div>
                        </div>
                      )}
                    </div>

                    {/* Grand Total */}
                    <div className="grand-total-row">
                      <div className="grand-total-label">Grand Total</div>
                      <div className="grand-total-amount">৳{bookingToView.totals.grandTotal?.toFixed(2)}</div>
                    </div>

                    {/* Payment Status Section */}
                    <div className="payment-status-section">
                      <div className="payment-status-item paid">
                        <div className="status-icon">✓</div>
                        <div className="status-content">
                          <div className="status-label">Total Paid</div>
                          <div className="status-amount">৳{bookingToView.totals.totalPaid?.toFixed(2)}</div>
                        </div>
                      </div>
                      
                      <div className={`payment-status-item balance ${bookingToView.totals.balance > 0 ? 'due' : 'clear'}`}>
                        <div className="status-icon">{bookingToView.totals.balance > 0 ? '⚠' : '✓'}</div>
                        <div className="status-content">
                          <div className="status-label">Balance Due</div>
                          <div className="status-amount">৳{bookingToView.totals.balance?.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={handleCloseViewModal}>
                Close
              </button>
              <button className="btn btn-info" onClick={handleAddPaymentClick}>
                <CreditCard size={20} />
                Add Payment
              </button>
              <button className="btn btn-success" onClick={handleViewInvoice}>
                <Eye size={20} />
                View Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedBooking && (
        <div className="modal-overlay" onClick={handleClosePaymentModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Payment</h2>
              <button className="close-btn" onClick={handleClosePaymentModal}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="booking-summary">
                <h4>Booking Details</h4>
                <p><strong>Guest:</strong> {selectedBooking.guestName}</p>
                <p><strong>Room:</strong> {selectedBooking.roomNumber} - {selectedBooking.roomType}</p>
                <p><strong>Total Amount:</strong> ৳{selectedBooking.total?.toFixed(2)}</p>
                <p><strong>Paid:</strong> ৳{selectedBooking.paidAmount?.toFixed(2)}</p>
                <p><strong>Due:</strong> ৳{selectedBooking.dueBalance?.toFixed(2)}</p>
              </div>
              
              <form onSubmit={handlePaymentSubmit} className="payment-form">
                <div className="form-group">
                  <label htmlFor="amount">Amount *</label>
                  <input
                    type="number"
                    id="amount"
                    step="0.01"
                    min="0.01"
                    max={selectedBooking.dueBalance}
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                    required
                    placeholder="Enter payment amount"
                  />
                  <small>Maximum: ৳{selectedBooking.dueBalance?.toFixed(2)}</small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="method">Payment Method *</label>
                  <select
                    id="method"
                    value={paymentData.method}
                    onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                    required
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="BKASH">bKash</option>
                    <option value="NAGAD">Nagad</option>
                    <option value="ROCKET">Rocket</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="reference">Transaction Reference</label>
                  <input
                    type="text"
                    id="reference"
                    value={paymentData.reference}
                    onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                    placeholder="Transaction ID, Check number, etc."
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="notes">Notes</label>
                  <textarea
                    id="notes"
                    rows="3"
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                    placeholder="Additional notes..."
                  />
                </div>
                
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={handleClosePaymentModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <CreditCard size={20} />
                    Add Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;