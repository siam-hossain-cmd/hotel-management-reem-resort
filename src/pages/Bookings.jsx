import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2, Calendar, Users, User, CheckCircle, XCircle, Clock, CreditCard, AlertTriangle, X, LogIn, LogOut, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import bookingService from '../firebase/bookingService';
import invoiceService from '../firebase/invoiceService';
import { previewInvoice } from '../utils/pdfGenerator';
import RoomChangeModal from '../components/RoomChangeModal';
import SafeBookingView from '../components/SafeBookingView';
import '../booking.css';

const Bookings = () => {
  const { canPerformAction, hasPermission, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [bookingToView, setBookingToView] = useState(null);
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    method: 'CASH',
    reference: '',
    notes: ''
  });
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [chargeData, setChargeData] = useState({
    chargeType: '',
    customDescription: '',
    amount: '',
    notes: ''
  });
  const [sortConfig, setSortConfig] = useState({ key: 'checkInDate', direction: 'descending' });
  const [showCheckInOutModal, setShowCheckInOutModal] = useState(false);
  const [checkInOutData, setCheckInOutData] = useState({
    booking: null,
    action: '', // 'check-in' or 'check-out'
    expectedDate: null,
    currentDate: null,
    hasWarning: false
  });
  const [showRoomChangeModal, setShowRoomChangeModal] = useState(false);
  const [bookingToChangeRoom, setBookingToChangeRoom] = useState(null);

  // Format date to dd/mm/yyyy
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Load bookings on component mount
  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const bookingResult = await api.getBookings();
      if (bookingResult.success && Array.isArray(bookingResult.bookings)) {
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
            status: (booking.status || 'confirmed').toLowerCase().replace(/_/g, '-'),
            createdAt: booking.created_at,
            createdBy: booking.created_by || 'System',
            currency: booking.currency || 'BDT',
            bookingDate: booking.created_at ? new Date(booking.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
            fullData: booking // Store full booking data for actions
          };
        });
        
        setBookings(transformedBookings);
      } else {
        console.error('Failed to load bookings:', bookingResult.error || 'Bookings is not an array');
        setBookings([]);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      setBookings([]);
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
    
    // Check if user has permission to delete bookings
    if (!hasPermission('delete_booking')) {
      setShowAccessDeniedModal(true);
      return;
    }
    
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
      // Get current date (today) in YYYY-MM-DD format
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      
      // Handle check-in with date validation
      if (newStatus === 'checked-in') {
        const checkInDate = new Date(bookingData.checkInDate);
        checkInDate.setHours(0, 0, 0, 0);
        const checkInStr = checkInDate.toISOString().split('T')[0];
        
        // Check if check-in date matches today's date
        if (checkInStr !== todayStr) {
          // Show warning modal
          setCheckInOutData({
            booking: bookingData,
            action: 'check-in',
            expectedDate: checkInDate,
            currentDate: today,
            hasWarning: true
          });
          setShowCheckInOutModal(true);
          return;
        }
      } 
      // Handle check-out with date validation
      else if (newStatus === 'checked-out') {
        const checkOutDate = new Date(bookingData.checkOutDate);
        checkOutDate.setHours(0, 0, 0, 0);
        const checkOutStr = checkOutDate.toISOString().split('T')[0];
        
        // Check if check-out date matches today's date
        if (checkOutStr !== todayStr) {
          // Show warning modal
          setCheckInOutData({
            booking: bookingData,
            action: 'check-out',
            expectedDate: checkOutDate,
            currentDate: today,
            hasWarning: true
          });
          setShowCheckInOutModal(true);
          return;
        }
      }
      
      console.log(`Attempting to change status to: ${newStatus} for booking: ${bookingId}`);
      
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
    // Ensure filteredBookings is an array before spreading
    if (!Array.isArray(filteredBookings)) {
      console.error('❌ filteredBookings is not an array:', filteredBookings);
      return [];
    }
    
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
    
    // Create initial booking object without spreading
    const initialBooking = {
      id: booking?.id || null,
      bookingRef: booking?.bookingRef || '',
      guestName: booking?.guestName || '',
      guestEmail: booking?.guestEmail || '',
      guestPhone: booking?.guestPhone || '',
      roomNumber: booking?.roomNumber || '',
      roomType: booking?.roomType || '',
      checkInDate: booking?.checkInDate || '',
      checkOutDate: booking?.checkOutDate || '',
      totalNights: booking?.totalNights || 0,
      guestCount: booking?.guestCount || 1,
      status: booking?.status || '',
      createdAt: booking?.createdAt || '',
      createdBy: booking?.createdBy || '',
      total: booking?.total || 0,
      paymentStatus: booking?.paymentStatus || 'unpaid',
      paidAmount: booking?.paidAmount || 0,
      dueBalance: booking?.dueBalance || 0,
      room_change_history: [],
      charges: [],
      payments: [],
      totals: {},
      invoice: null
    };
    
    setBookingToView(initialBooking);
    setShowViewModal(true);
    
    try {
      // Fetch comprehensive booking summary with charges, payments, and totals
      const result = await api.getBookingSummary(booking.id);
      
      console.log('📊 BOOKING SUMMARY RESULT:', result);
      
      if (result.success && result.summary) {
        const { summary } = result;
        
        console.log('💰 PAYMENTS IN SUMMARY:', summary.payments);
        console.log('📋 CHARGES IN SUMMARY:', summary.charges);
        console.log('🏨 ROOM CHANGE HISTORY RAW:', summary?.booking?.room_change_history);
        
        // Safely extract booking data
        const bookingData = summary.booking || {};
        
        // Parse room_change_history if it's a string
        let roomChangeHistory = bookingData.room_change_history;
        if (typeof roomChangeHistory === 'string' && roomChangeHistory) {
          try {
            roomChangeHistory = JSON.parse(roomChangeHistory);
          } catch (e) {
            console.error('Error parsing room_change_history:', e);
            roomChangeHistory = [];
          }
        }
        
        // Build updated booking object explicitly without spreading
        const updatedBooking = {
          id: bookingData?.id || booking?.id || null,
          bookingRef: bookingData?.bookingRef || booking?.bookingRef || '',
          guestName: bookingData?.guestName || booking?.guestName || '',
          guestEmail: bookingData?.guestEmail || booking?.guestEmail || '',
          guestPhone: bookingData?.guestPhone || booking?.guestPhone || '',
          guestAddress: bookingData?.guestAddress || '',
          roomNumber: bookingData?.roomNumber || booking?.roomNumber || '',
          roomType: bookingData?.roomType || booking?.roomType || '',
          checkInDate: bookingData?.checkInDate || booking?.checkInDate || '',
          checkOutDate: bookingData?.checkOutDate || booking?.checkOutDate || '',
          totalNights: booking?.totalNights || 0,
          guestCount: booking?.guestCount || 1,
          status: bookingData?.status || booking?.status || '',
          createdAt: bookingData?.createdAt || booking?.createdAt || '',
          createdBy: booking?.createdBy || '',
          paymentStatus: booking?.paymentStatus || 'unpaid',
          room_id: bookingData?.room_id || null,
          room_rate: bookingData?.room_rate || 0,
          original_room_id: bookingData?.original_room_id || null,
          room_change_history: Array.isArray(roomChangeHistory) ? roomChangeHistory : [],
          charges: Array.isArray(summary.charges) ? summary.charges : [],
          payments: Array.isArray(summary.payments) ? summary.payments : [],
          totals: summary.totals || {},
          invoice: summary.invoice || null
        };
        
        console.log('✅ FINAL BOOKING TO VIEW:', updatedBooking);
        setBookingToView(updatedBooking);
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

  const handleAddChargeClick = () => {
    if (bookingToView) {
      setSelectedBooking(bookingToView);
      setShowChargeModal(true);
      setChargeData({
        chargeType: '',
        customDescription: '',
        amount: '',
        notes: ''
      });
    }
  };

  const handleRoomChangeClick = async (booking) => {
    try {
      // Get the full booking details including room rate
      const result = await api.getBookingSummary(booking.id);
      if (result.success && result.summary) {
        const fullBooking = {
          ...booking,
          roomId: result.summary.booking.room_id,
          roomRate: result.summary.booking.room_rate || 0,
          // Keep the existing properties
          checkOutDate: booking.checkOutDate,
          guestName: booking.guestName
        };
        setBookingToChangeRoom(fullBooking);
        setShowRoomChangeModal(true);
      } else {
        alert('Failed to load booking details');
      }
    } catch (error) {
      console.error('Error loading booking details:', error);
      alert('Error loading booking details');
    }
  };

  const handleRoomChangeSuccess = () => {
    setShowRoomChangeModal(false);
    setBookingToChangeRoom(null);
    loadBookings(); // Reload bookings to reflect the change
  };

  const handleCloseChargeModal = () => {
    setShowChargeModal(false);
    setChargeData({
      chargeType: '',
      customDescription: '',
      amount: '',
      notes: ''
    });
  };

  const handleChargeSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedBooking) {
      alert('No booking selected');
      return;
    }

    try {
      const description = chargeData.chargeType === 'Others' 
        ? chargeData.customDescription 
        : chargeData.chargeType;

      if (!description || !chargeData.amount) {
        alert('Please fill in all required fields');
        return;
      }

      const chargePayload = {
        description: description,
        amount: parseFloat(chargeData.amount),
        notes: chargeData.notes || ''
      };

      const result = await api.addBookingCharge(selectedBooking.id, chargePayload);
      
      if (result.success) {
        alert('Charge added successfully!');
        handleCloseChargeModal();
        // Reload bookings to show updated charge
        await loadBookings();
        // Reload view modal if it was open
        if (bookingToView) {
          await handleViewBooking(selectedBooking);
        }
      } else {
        alert('Failed to add charge: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error adding charge:', error);
      alert('Error adding charge: ' + error.message);
    }
  };

  const getChargeDescription = () => {
    if (chargeData.chargeType === 'Others') {
      return chargeData.customDescription;
    }
    return chargeData.chargeType;
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
        // Otherwise, try to fetch invoice by booking ID (auto-creates if missing)
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
        // No invoice found - offer to create one
        const shouldCreate = confirm(
          'No invoice found for this booking.\n\n' +
          'Would you like to create an invoice now?\n\n' +
          'Click OK to auto-generate invoice, or Cancel to go back.'
        );
        
        if (shouldCreate) {
          console.log('🆕 Creating invoice for booking:', bookingToView.id);
          
          // The backend auto-creates when fetching by booking_id
          // So we just need to try again, and it should work
          const retryResult = await api.getInvoiceByBookingId(bookingToView.id);
          
          if (retryResult.success && retryResult.invoice) {
            const transformedInvoice = transformInvoiceData(retryResult.invoice);
            previewInvoice(transformedInvoice);
            
            // Reload bookings to show the new invoice
            await loadBookings();
          } else {
            alert('Failed to create invoice. Please check the console for errors.');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      alert('Error: ' + (error.message || 'Failed to fetch invoice. Please try again.'));
    }
  };

  // Transform invoice data from API to match PDF generator format
  const transformInvoiceData = (invoice) => {
    console.log('🔍 RAW INVOICE DATA:', invoice); // Enhanced debug log
    console.log('📋 Invoice Number:', invoice.invoice_number);
    console.log('🔖 Booking ID:', invoice.booking_id);
    console.log('🎫 Booking Reference:', invoice.booking_reference);
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
    console.log('💰 Financial Info:', {
      total: invoice.total,
      paid: invoice.paid,
      paid_amount: invoice.paid_amount,
      due: invoice.due,
      due_amount: invoice.due_amount
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
    const discountPercentage = parseFloat(invoice.discount_percentage || 0);
    const discountAmount = parseFloat(invoice.discount_amount || 0);
    const roomTotal = baseAmount - discountAmount;
    const perNightCost = totalNights > 0 ? baseAmount / totalNights : 0;

    // Calculate additional charges total
    const additionalChargesTotal = (invoice.charges || []).reduce((sum, c) => 
      sum + parseFloat(c.amount || 0), 0
    );
    
    // Get tax data
    const storedTaxRate = parseFloat(invoice.booking_tax_rate || invoice.tax_rate || 0);
    const storedTaxAmount = parseFloat(invoice.booking_tax_amount || invoice.tax_amount || 0);
    const subtotalBeforeTax = parseFloat(invoice.subtotal_amount || roomTotal);
    
    let taxRate = storedTaxRate;
    let taxAmount = storedTaxAmount;
    
    // If tax_amount exists but not tax_rate, calculate rate
    if (taxAmount > 0 && taxRate === 0 && subtotalBeforeTax > 0) {
      taxRate = (taxAmount / subtotalBeforeTax) * 100;
    }
    
    // Use booking_total (from bookings table) which includes all charges
    // invoice.total is from invoices table and is static/outdated
    const finalTotal = parseFloat(invoice.booking_total || invoice.total || 0);
    
    console.log('💰 INVOICE CHARGES DEBUG:', {
      charges: invoice.charges,
      additionalChargesTotal,
      subtotalBeforeTax,
      storedTaxRate,
      storedTaxAmount,
      taxRate,
      taxAmount,
      finalTotal,
      booking_tax_rate: invoice.booking_tax_rate,
      booking_tax_amount: invoice.booking_tax_amount,
      invoice_tax_rate: invoice.tax_rate,
      invoice_tax_amount: invoice.tax_amount
    });

    return {
      id: invoice.invoice_number || `INV-${invoice.id}`,
      invoice_number: invoice.invoice_number || `INV-${invoice.id}`, // Add explicit invoice_number field
      booking_id: invoice.booking_id, // Add explicit booking_id field
      booking_reference: invoice.booking_reference, // Add booking reference (e.g., BK773337T28)
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
      discountPercentage: discountPercentage,
      totalDiscount: discountAmount,
      subtotal: roomTotal,
      additionalChargesTotal: additionalChargesTotal,
      additionalTotal: additionalChargesTotal,
      taxRate: taxRate,
      tax: taxAmount,
      total: finalTotal, // Use calculated finalTotal (from booking_total)
      paidAmount: parseFloat(invoice.paid_amount || invoice.paid || 0),
      balanceDue: parseFloat(invoice.due_amount || invoice.due || 0),
      totalPaid: parseFloat(invoice.paid || invoice.paid_amount || 0),
      dueAmount: parseFloat(invoice.due || invoice.due_amount || 0),
      paid: parseFloat(invoice.paid || invoice.paid_amount || 0),
      due: parseFloat(invoice.due || invoice.due_amount || 0),
      notes: invoice.notes || '',
      terms: invoice.terms || 'Payment due upon receipt.',
      payments: (invoice.payments || []).map(payment => ({
        amount: parseFloat(payment.amount || 0),
        method: payment.method || payment.gateway || 'CASH',
        description: payment.notes || payment.gateway_payment_id || 'Payment',
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

  // Get today's checkouts with useMemo for efficiency
  const todaysCheckouts = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return sortedAndFilteredBookings.filter(booking => {
      const checkoutDate = new Date(booking.checkOutDate).toISOString().split('T')[0];
      return checkoutDate === today && (booking.status === 'checked-in' || booking.status === 'confirmed');
    });
  }, [sortedAndFilteredBookings]);

  // Handle quick checkout from priority section
  const handleCheckOut = async (booking) => {
    if (window.confirm(`Check out ${booking.guestName} from Room ${booking.roomNumber}?`)) {
      await handleQuickStatusChange(booking.id, 'checked-out', booking);
    }
  };

  // Handle check-in/check-out confirmation from modal
  const handleConfirmCheckInOut = async () => {
    const { booking, action } = checkInOutData;
    
    if (!booking) return;
    
    try {
      let result;
      
      if (action === 'check-in') {
        result = await bookingService.checkIn(booking.id);
      } else if (action === 'check-out') {
        result = await bookingService.checkOut(booking.id);
      }

      if (result && result.success) {
        await loadBookings();
        alert(`Successfully ${action === 'check-in' ? 'checked in' : 'checked out'} guest for Room ${booking.roomNumber}`);
        setShowCheckInOutModal(false);
        setCheckInOutData({
          booking: null,
          action: '',
          expectedDate: null,
          currentDate: null,
          hasWarning: false
        });
      } else {
        let errorMsg = `Failed to ${action}`;
        if (result && result.error) {
          if (typeof result.error === 'string') {
            errorMsg = result.error;
          } else if (result.error.message) {
            errorMsg = result.error.message;
          }
        }
        alert(errorMsg);
      }
    } catch (error) {
      console.error(`Error during ${action}:`, error);
      alert(`Error: ${error.message || 'Unknown error occurred'}`);
    }
  };

  // Handle cancel check-in/check-out
  const handleCancelCheckInOut = () => {
    setShowCheckInOutModal(false);
    setCheckInOutData({
      booking: null,
      action: '',
      expectedDate: null,
      currentDate: null,
      hasWarning: false
    });
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
    <div className="bookings-page modern-bookings">
      {/* Header */}
      <div className="page-header-modern">
        <h1>Bookings & Reservations</h1>
        {canPerformAction('create_booking') && (
          <Link to="/create-booking" className="btn btn-primary-modern">
            <Plus size={20} />
            New Booking
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="booking-stats-grid">
        <div className="stat-card-modern total">
          <div className="stat-label">Total Bookings</div>
          <div className="stat-value">{bookings.length}</div>
        </div>
        
        <div className="stat-card-modern confirmed">
          <div className="stat-label">Confirmed (Awaiting CI)</div>
          <div className="stat-value">{bookings.filter(b => b.status === 'confirmed').length}</div>
        </div>
        
        <div className="stat-card-modern checked-in">
          <div className="stat-label">Currently Checked In</div>
          <div className="stat-value">{bookings.filter(b => b.status === 'checked-in').length}</div>
        </div>
        
        <div className="stat-card-modern checked-out">
          <div className="stat-label">Today's Check-Outs</div>
          <div className="stat-value">{todaysCheckouts.length}</div>
        </div>
      </div>

      {/* Priority Departures - Today's Checkouts */}
      <div className="priority-section">
        <div className="priority-header">
          <div className="priority-title">
            <AlertTriangle size={24} />
            <h2>Priority Departures Today ({todaysCheckouts.length} Guests)</h2>
          </div>
          <button className="view-all-link">View All Departures</button>
        </div>
        
        {todaysCheckouts.length > 0 ? (
          <div className="priority-cards-grid">
            {todaysCheckouts.slice(0, 3).map(booking => (
              <div key={booking.id} className="priority-card">
                <div className="priority-card-header">
                  <div className="room-label">Room {booking.roomNumber}</div>
                  <div className="guest-name-priority">{booking.guestName}, {booking.totalNights} nights</div>
                </div>
                <button className="checkout-btn-small" onClick={() => handleCheckOut(booking)}>
                  Check Out
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-checkouts-message">
            <p>No departures scheduled for today</p>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="search-filter-bar">
        <div className="search-bar-modern">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by guest, room, or ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-group-modern">
          <Filter size={18} />
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

      {/* Bookings Table */}
      <div className="modern-table-container">
        <table className="modern-bookings-table">
          <thead>
            <tr>
              <th>REF</th>
              <th onClick={() => requestSort('guestName')} className="sortable">
                GUEST{getSortIndicator('guestName')}
              </th>
              <th>ROOM</th>
              <th onClick={() => requestSort('checkInDate')} className="sortable">
                CHECK-IN{getSortIndicator('checkInDate')}
              </th>
              <th>CHECK-OUT</th>
              <th>NIGHTS</th>
              <th>GUESTS</th>
              <th onClick={() => requestSort('total')} className="sortable">
                TOTAL AMOUNT{getSortIndicator('total')}
              </th>
              <th>STATUS</th>
              <th>PAID / DUE (BDT)</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFilteredBookings.map((booking) => (
              <tr key={booking.id} className="booking-row-modern">
                <td className="ref-cell">{booking.bookingRef}</td>
                <td className="guest-cell">{booking.guestName}</td>
                <td className="room-cell">{booking.roomNumber}</td>
                <td className="date-cell">{formatDate(booking.checkInDate)}</td>
                <td className="date-cell checkout-highlight">
                  {formatDate(booking.checkOutDate)}
                  {new Date(booking.checkOutDate).toISOString().split('T')[0] === new Date().toISOString().split('T')[0] && (
                    <span className="today-badge-inline">(Today)</span>
                  )}
                </td>
                <td className="text-center nights-cell">{booking.totalNights}</td>
                <td className="text-center">{booking.guestCount}</td>
                <td className="amount-cell">৳{booking.total?.toFixed(0)}</td>
                <td className="status-cell">
                  {getStatusBadge(booking.status)}
                </td>
                <td className="payment-cell">
                  <div className="payment-summary-compact">
                    <div className="payment-row-compact paid">
                      Paid: <strong className="paid-color">৳{booking.paidAmount?.toFixed(0)}</strong>
                    </div>
                    <div className="payment-row-compact due">
                      Due: <strong className="due-color">৳{booking.dueBalance?.toFixed(0)}</strong>
                    </div>
                  </div>
                </td>
                <td className="actions-cell">
                  <div className="action-buttons-modern">
                    <button className="action-btn-modern view" title="View" onClick={() => handleViewBooking(booking)}>
                      View
                    </button>
                    
                    {booking.status === 'confirmed' && (
                      <button 
                        className="action-btn-modern checkin" 
                        title="Check In"
                        onClick={() => handleQuickStatusChange(booking.id, 'checked-in', booking)}
                      >
                        <LogIn size={14} /> Check In
                      </button>
                    )}
                    
                    {booking.status === 'checked-in' && (
                      <button 
                        className="action-btn-modern checkout" 
                        title="Check Out"
                        onClick={() => handleQuickStatusChange(booking.id, 'checked-out', booking)}
                      >
                        <LogOut size={14} /> Check Out
                      </button>
                    )}
                    
                    {booking.status === 'checked-in' && hasPermission('update_booking') && (
                      <button 
                        className="action-btn-modern change-room" 
                        title="Change Room"
                        onClick={() => handleRoomChangeClick(booking)}
                      >
                        <RefreshCw size={14} /> Change Room
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
                      className={`action-btn delete ${!hasPermission('delete_booking') ? 'disabled' : ''}`}
                      title={hasPermission('delete_booking') ? "Delete" : "Access Denied - Admin Only"}
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

      {/* Access Denied Modal */}
      {showAccessDeniedModal && (
        <div className="modal-overlay">
          <div className="access-denied-modal">
            <div className="modal-header access-denied-header">
              <div className="header-icon-wrapper">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h3>Access Denied</h3>
                <p className="modal-subtitle">Insufficient Permissions</p>
              </div>
              <button className="close-btn" onClick={() => setShowAccessDeniedModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <div className="access-denied-content">
                <div className="access-denied-icon">
                  <XCircle size={64} />
                </div>
                <h4>You do not have permission to delete bookings</h4>
                <p className="access-denied-message">
                  Only administrators can delete bookings from the system.
                </p>
                <div className="access-denied-info">
                  <p><strong>Your Role:</strong> Front Desk</p>
                  <p><strong>Required Permission:</strong> Delete Bookings (Admin Only)</p>
                </div>
                <div className="access-denied-help">
                  <p>If you need to delete this booking, please contact:</p>
                  <ul>
                    <li>System Administrator</li>
                    <li>Hotel Manager</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => setShowAccessDeniedModal(false)}>
                <CheckCircle size={20} />
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

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
        <SafeBookingView
          booking={bookingToView}
          onClose={handleCloseViewModal}
          onAddPayment={handleAddPaymentClick}
          onAddCharge={handleAddChargeClick}
          onViewInvoice={handleViewInvoice}
          formatDate={formatDate}
          getStatusBadge={getStatusBadge}
          getPaymentBadge={getPaymentBadge}
        />
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

      {/* Add Charge Modal */}
      {showChargeModal && selectedBooking && (
        <div className="modal-overlay" onClick={handleCloseChargeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Additional Charge</h2>
              <button className="close-btn" onClick={handleCloseChargeModal}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="booking-summary">
                <h4>Booking Details</h4>
                <p><strong>Guest:</strong> {selectedBooking.guestName}</p>
                <p><strong>Room:</strong> {selectedBooking.roomNumber} - {selectedBooking.roomType}</p>
                <p><strong>Booking Ref:</strong> {selectedBooking.bookingRef}</p>
              </div>
              
              <form onSubmit={handleChargeSubmit} className="payment-form">
                <div className="form-group">
                  <label htmlFor="chargeType">Charge Type *</label>
                  <select
                    id="chargeType"
                    value={chargeData.chargeType}
                    onChange={(e) => setChargeData({ ...chargeData, chargeType: e.target.value })}
                    required
                  >
                    <option value="">Select charge type...</option>
                    <option value="Late Check-out Fee">Late Check-out Fee</option>
                    <option value="Early Check-in Fee">Early Check-in Fee</option>
                    <option value="Smoking Fine">Smoking Fine</option>
                    <option value="Room Damage Fee">Room Damage Fee</option>
                    <option value="Lost Keycard Fee">Lost Keycard Fee</option>
                    <option value="Excessive Cleaning Fee">Excessive Cleaning Fee</option>
                    <option value="Unauthorized Guest Fee">Unauthorized Guest Fee</option>
                    <option value="Linen/Towel Damage Fee">Linen/Towel Damage Fee</option>
                    <option value="Lost Item or Appliance Damage Fee">Lost Item or Appliance Damage Fee</option>
                    <option value="Mini-bar Charges">Mini-bar Charges</option>
                    <option value="Room Service">Room Service</option>
                    <option value="Laundry Service">Laundry Service</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                {chargeData.chargeType === 'Others' && (
                  <div className="form-group">
                    <label htmlFor="customDescription">Custom Description *</label>
                    <input
                      type="text"
                      id="customDescription"
                      value={chargeData.customDescription}
                      onChange={(e) => setChargeData({ ...chargeData, customDescription: e.target.value })}
                      required
                      placeholder="Enter custom charge description"
                    />
                  </div>
                )}
                
                <div className="form-group">
                  <label htmlFor="chargeAmount">Amount *</label>
                  <input
                    type="number"
                    id="chargeAmount"
                    step="0.01"
                    min="0.01"
                    value={chargeData.amount}
                    onChange={(e) => setChargeData({ ...chargeData, amount: e.target.value })}
                    required
                    placeholder="Enter charge amount"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="chargeNotes">Notes</label>
                  <textarea
                    id="chargeNotes"
                    rows="3"
                    value={chargeData.notes}
                    onChange={(e) => setChargeData({ ...chargeData, notes: e.target.value })}
                    placeholder="Additional notes about this charge..."
                  />
                </div>
                
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseChargeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <Plus size={20} />
                    Add Charge
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Check-In/Check-Out Confirmation Modal */}
      {showCheckInOutModal && checkInOutData.booking && (
        <div className="modal-overlay">
          <div className="delete-modal checkin-checkout-modal">
            <div className="modal-header">
              <h3>{checkInOutData.action === 'check-in' ? 'Check In Confirmation' : 'Check Out Confirmation'}</h3>
              <button className="close-btn" onClick={handleCancelCheckInOut}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <div className="warning-icon" style={{ color: checkInOutData.hasWarning ? '#f59e0b' : '#10b981' }}>
                {checkInOutData.hasWarning ? <AlertTriangle size={48} /> : <CheckCircle size={48} />}
              </div>
              
              {checkInOutData.hasWarning && (
                <div className="warning-message">
                  <h4>⚠️ Date Mismatch Warning</h4>
                  <p>The {checkInOutData.action === 'check-in' ? 'check-in' : 'check-out'} date does not match today's date.</p>
                </div>
              )}
              
              <div className="booking-details">
                <p><strong>Guest:</strong> {checkInOutData.booking.guestName}</p>
                <p><strong>Room:</strong> {checkInOutData.booking.roomNumber}</p>
                <p><strong>Expected {checkInOutData.action === 'check-in' ? 'Check-In' : 'Check-Out'} Date:</strong> {formatDate(checkInOutData.expectedDate)}</p>
                <p><strong>Today's Date:</strong> {formatDate(checkInOutData.currentDate)}</p>
              </div>
              
              {checkInOutData.hasWarning && (
                <>
                  {checkInOutData.action === 'check-in' && checkInOutData.expectedDate > checkInOutData.currentDate && (
                    <div className="info-box early-checkin">
                      <p><strong>Early Check-In:</strong> This is an early check-in. The guest is checking in before the scheduled date.</p>
                    </div>
                  )}
                  {checkInOutData.action === 'check-in' && checkInOutData.expectedDate < checkInOutData.currentDate && (
                    <div className="info-box late-checkin">
                      <p><strong>Late Check-In:</strong> This is a late check-in. The guest is checking in after the scheduled date.</p>
                    </div>
                  )}
                  {checkInOutData.action === 'check-out' && checkInOutData.expectedDate > checkInOutData.currentDate && (
                    <div className="info-box early-checkout">
                      <p><strong>Early Check-Out:</strong> The guest is checking out before the scheduled date.</p>
                    </div>
                  )}
                  {checkInOutData.action === 'check-out' && checkInOutData.expectedDate < checkInOutData.currentDate && (
                    <div className="info-box late-checkout">
                      <p><strong>Late Check-Out:</strong> The guest is checking out after the scheduled date.</p>
                    </div>
                  )}
                  <p className="warning-text">Are you sure you want to proceed with this {checkInOutData.action}?</p>
                </>
              )}
              
              {!checkInOutData.hasWarning && (
                <p className="success-text">Dates match! Proceed with {checkInOutData.action}?</p>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={handleCancelCheckInOut}>
                Cancel
              </button>
              <button 
                className={`btn ${checkInOutData.action === 'check-in' ? 'btn-primary' : 'btn-success'}`} 
                onClick={handleConfirmCheckInOut}
              >
                {checkInOutData.action === 'check-in' ? <LogIn size={20} /> : <LogOut size={20} />}
                Confirm {checkInOutData.action === 'check-in' ? 'Check In' : 'Check Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Room Change Modal */}
      {showRoomChangeModal && bookingToChangeRoom && (
        <div className="modal-overlay">
          <RoomChangeModal
            booking={bookingToChangeRoom}
            onClose={() => {
              setShowRoomChangeModal(false);
              setBookingToChangeRoom(null);
            }}
            onSuccess={handleRoomChangeSuccess}
            userName={user?.name || user?.email || 'Unknown'}
          />
        </div>
      )}
    </div>
  );
};

export default Bookings;