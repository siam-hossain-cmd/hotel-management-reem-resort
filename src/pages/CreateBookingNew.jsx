import React, { useState, useEffect } from 'react';
import { Calendar, Users, Bed, Check, Search, ArrowLeft, ArrowRight, Eye, Download } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './CreateBooking.css';
import { previewInvoice, generateInvoicePDF } from '../utils/pdfGenerator';


const CreateBooking = () => {
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1); // 1: Date Selection, 2: Room Selection, 3: Guest Details, 4: Invoice, 5: Payment & Confirmation
  const [loading, setLoading] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  
  // Guest information (moved to step 3)
  const [guestInfo, setGuestInfo] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    nid: ''
  });
  
  // Booking details
  const [bookingDetails, setBookingDetails] = useState({
    checkin_date: '',
    checkout_date: '',
    room_id: null,
    selectedRoom: null,
    total_amount: 0,
    discount_percentage: 0,
    discount_amount: 0,
    final_amount: 0,
    auto_checkin: false
  });
  
  // Invoice and payment
  const [invoiceData, setInvoiceData] = useState(null);
  const [paymentData, setPaymentData] = useState({
    payment_method: 'cash',
    payment_status: 'pending',
    paid_amount: 0
  });
  const [vatRate, setVatRate] = useState(10); // Add VAT rate state
  const [payments, setPayments] = useState([]); // Multiple payments array
  const [newPayment, setNewPayment] = useState({
    method: 'cash',
    amount: 0,
    notes: ''
  });
  
  const [errors, setErrors] = useState({});
  const [bookingResult, setBookingResult] = useState(null);

  // Recalculate totals whenever relevant details change
  useEffect(() => {
    if (bookingDetails.selectedRoom) {
      const { total, discount, final } = calculateTotal(bookingDetails.selectedRoom, bookingDetails.discount_percentage);
      const subtotal = final;
      const tax = subtotal * (vatRate / 100);
      const finalAmountWithVAT = subtotal + tax;

      setBookingDetails(prev => ({
        ...prev,
        total_amount: total,
        discount_amount: discount,
        final_amount: finalAmountWithVAT, // This is now the grand total
        subtotal_before_vat: subtotal, // Store for display
        vat_amount: tax // Store for display
      }));
    }
  }, [bookingDetails.selectedRoom, bookingDetails.discount_percentage, vatRate, bookingDetails.checkin_date, bookingDetails.checkout_date]);


  useEffect(() => {
    // Only search for available rooms when we have both dates and we're on step 2
    if (currentStep === 2 && bookingDetails.checkin_date && bookingDetails.checkout_date) {
      loadAvailableRooms();
    }
  }, [currentStep, bookingDetails.checkin_date, bookingDetails.checkout_date]);

  const loadAvailableRooms = async () => {
    setLoading(true);
    try {
      setDateRange({
        checkin: bookingDetails.checkin_date,
        checkout: bookingDetails.checkout_date
      });
      
      // Use the new availability endpoint that checks booking conflicts
      const response = await api.getAvailableRooms(
        bookingDetails.checkin_date, 
        bookingDetails.checkout_date
      );
      
      console.log('Available rooms response:', response);
      
      if (response.success) {
        setAvailableRooms(response.rooms);
      } else {
        console.error('Failed to load available rooms:', response.error);
        setAvailableRooms([]);
      }
    } catch (error) {
      console.error('Error loading available rooms:', error);
      setAvailableRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      // Step 1: Date Selection
      if (!bookingDetails.checkin_date) newErrors.checkin_date = 'Check-in date is required';
      if (!bookingDetails.checkout_date) newErrors.checkout_date = 'Check-out date is required';
      
      if (bookingDetails.checkin_date && bookingDetails.checkout_date) {
        if (new Date(bookingDetails.checkout_date) <= new Date(bookingDetails.checkin_date)) {
          newErrors.checkout_date = 'Check-out date must be after check-in date';
        }
      }
    } else if (step === 2) {
      // Step 2: Room Selection
      if (!bookingDetails.room_id) newErrors.room_id = 'Please select a room';
    } else if (step === 3) {
      // Step 3: Guest Information
      if (!guestInfo.first_name.trim()) newErrors.first_name = 'First name is required';
      if (!guestInfo.last_name.trim()) newErrors.last_name = 'Last name is required';
      if (!guestInfo.phone.trim()) newErrors.phone = 'Phone number is required';
      if (!guestInfo.email.trim()) newErrors.email = 'Email is required';
      if (!guestInfo.address.trim()) newErrors.address = 'Address is required';
      if (!guestInfo.nid.trim()) newErrors.nid = 'NID number is required';
    } else if (step === 4) {
      // Invoice step - no validation needed as it's auto-generated
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotal = (room, discountPercentage = 0) => {
    if (!room || !bookingDetails.checkin_date || !bookingDetails.checkout_date) return { total: 0, discount: 0, final: 0 };
    
    const checkin = new Date(bookingDetails.checkin_date);
    const checkout = new Date(bookingDetails.checkout_date);
    const nights = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));
    
    const total = nights * parseFloat(room.rate);
    const discount = (total * discountPercentage) / 100;
    const final = total - discount;
    
    return { total, discount, final, nights };
  };

  const handleDiscountChange = (percentage) => {
    const discount = Math.min(Math.max(parseFloat(percentage) || 0, 0), 100);
    if (bookingDetails.selectedRoom) {
      const { total, discount: discountAmount, final } = calculateTotal(bookingDetails.selectedRoom, discount);
      setBookingDetails(prev => ({
        ...prev,
        discount_percentage: discount,
        total_amount: total,
        discount_amount: discountAmount,
        final_amount: final
      }));
    }
  };

  const handleNext = () => {
    const isStepValid = validateStep(currentStep);

    // Allow moving to the invoice review step (4) even if guest info (step 3) is not fully valid,
    // but still show the validation errors. The final confirmation will be blocked.
    if (isStepValid || currentStep === 3) {
      if (currentStep === 1) {
        // Clear previous room selection when dates change
        setBookingDetails(prev => ({
          ...prev,
          room_id: null,
          selectedRoom: null,
          total_amount: 0
        }));
      }
      
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleRoomSelect = (room) => {
    const { total, discount, final } = calculateTotal(room, bookingDetails.discount_percentage);
    
    setBookingDetails(prev => ({
      ...prev,
      room_id: room.id,
      selectedRoom: room,
      total_amount: total,
      discount_amount: discount,
      final_amount: final
    }));
  };

  const setDateRange = (range) => {
    // This function exists for compatibility but the logic is handled in useEffect
  };

  const handleCreateBooking = async () => {
    setLoading(true);
    try {
      const finalAmount = bookingDetails.final_amount > 0 ? bookingDetails.final_amount : bookingDetails.total_amount;
      const totalPaid = getTotalPaid();
      
      // Determine payment status based on payments
      let paymentStatus = 'pending';
      if (totalPaid >= finalAmount) {
        paymentStatus = 'paid';
      } else if (totalPaid > 0) {
        paymentStatus = 'partial';
      }
      
      // Validate required fields before sending
      if (!guestInfo.first_name || !guestInfo.last_name || !guestInfo.email || !guestInfo.phone) {
        alert('Please fill in all required guest information fields.');
        return;
      }
      
      if (!bookingDetails.room_id || !bookingDetails.checkin_date || !bookingDetails.checkout_date) {
        alert('Please ensure room and date information is complete.');
        return;
      }
      
      // Use the correct structure that matches backend expectations
      const bookingData = {
        first_name: guestInfo.first_name,
        last_name: guestInfo.last_name,
        email: guestInfo.email,
        phone: guestInfo.phone,
        address: guestInfo.address,
        id_number: guestInfo.nid,
        room_number: bookingDetails.selectedRoom?.room_number,
        checkin_date: bookingDetails.checkin_date,
        checkout_date: bookingDetails.checkout_date,
        total_amount: finalAmount,
        status: 'confirmed',
        payment_status: paymentStatus,
        paid_amount: totalPaid,
        payments: payments
      };
      
      console.log('Creating booking with data:', bookingData);
      
      const response = await api.createBooking(bookingData);

      if (response.success) {
        setBookingResult(response);
        // Also fetch the full invoice data for the confirmation page
        if (response.invoice_id) {
          try {
            const invoiceRes = await api.getInvoiceById(response.invoice_id);
            if (invoiceRes.success) {
              setInvoiceData(invoiceRes.invoice);
            }
          } catch (invoiceError) {
            console.warn('Failed to fetch invoice data:', invoiceError);
          }
        }
        setCurrentStep(5);
      } else {
        console.error('Booking creation failed:', response.error);
        alert(`Failed to create booking: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = async () => {
    // Use real invoice data if available from API
    if (bookingResult?.booking_id) {
      try {
        // Fetch the latest invoice data with payments
        const invoiceRes = await api.getInvoiceByBookingId(bookingResult.booking_id);
        if (invoiceRes.success && invoiceRes.invoice) {
          const transformedInvoice = transformInvoiceData(invoiceRes.invoice);
          console.log('📄 REAL INVOICE DATA FOR PREVIEW:', transformedInvoice);
          previewInvoice(transformedInvoice);
          return;
        }
      } catch (error) {
        console.error('Failed to fetch invoice:', error);
      }
    }
    
    // Fallback to mock data if API fails
    const mockInvoiceData = createMockInvoiceData();
    if (mockInvoiceData) {
      previewInvoice(mockInvoiceData);
    } else {
      alert("Invoice data is not available for preview.");
    }
  };

  const handleDownloadInvoice = async () => {
    // Use real invoice data if available from API
    if (bookingResult?.booking_id) {
      try {
        // Fetch the latest invoice data with payments
        const invoiceRes = await api.getInvoiceByBookingId(bookingResult.booking_id);
        if (invoiceRes.success && invoiceRes.invoice) {
          const transformedInvoice = transformInvoiceData(invoiceRes.invoice);
          console.log('📄 REAL INVOICE DATA FOR DOWNLOAD:', transformedInvoice);
          generateInvoicePDF(transformedInvoice);
          return;
        }
      } catch (error) {
        console.error('Failed to fetch invoice:', error);
      }
    }
    
    // Fallback to mock data if API fails
    const mockInvoiceData = createMockInvoiceData();
    if (mockInvoiceData) {
      generateInvoicePDF(mockInvoiceData);
    } else {
      alert("Invoice data is not available for download.");
    }
  };

  // Transform invoice data from API to match PDF generator format
  const transformInvoiceData = (invoice) => {
    console.log('🔍 TRANSFORMING INVOICE:', invoice);
    
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
      // Calculate total paid from payments array if not provided
      paidAmount: parseFloat(invoice.paid_amount || invoice.paid || 0),
      balanceDue: parseFloat(invoice.due_amount || invoice.due || 0),
      // Add aliases for PDF template compatibility
      totalPaid: parseFloat(invoice.paid || invoice.paid_amount || 0),
      dueAmount: parseFloat(invoice.due || invoice.due_amount || 0),
      notes: invoice.notes || '',
      terms: invoice.terms || 'Payment due upon receipt.',
      payments: (invoice.payments || []).map(payment => {
        console.log('🔍 RAW PAYMENT DATA:', payment);
        return {
          amount: parseFloat(payment.amount || 0),
          method: payment.method || payment.gateway || 'CASH',
          description: payment.reference || payment.gateway_payment_id || payment.notes || 'Payment',
          date: payment.payment_date || payment.processed_at || payment.created_at
        };
      })
    };
  };

  const createMockInvoiceData = () => {
    if (!bookingDetails.selectedRoom || !guestInfo.first_name) {
      return null;
    }

    const totalPaid = getTotalPaid();
    const finalTotal = bookingDetails.final_amount || bookingDetails.total_amount;
    const dueAmount = Math.max(0, finalTotal - totalPaid);

    return {
      id: 'PREVIEW-' + Date.now(),
      invoiceDate: new Date().toISOString(),
      dueDate: bookingDetails.checkout_date,
      customerInfo: {
        name: `${guestInfo.first_name} ${guestInfo.last_name}`.trim(),
        email: guestInfo.email || '',
        phone: guestInfo.phone || '',
        address: guestInfo.address || '',
        nid: guestInfo.nid || ''
      },
      items: [
        {
          roomNumber: `Room ${bookingDetails.selectedRoom.room_number}`,
          checkInDate: bookingDetails.checkin_date,
          checkOutDate: bookingDetails.checkout_date,
          totalNights: getNights(),
          guestCount: bookingDetails.selectedRoom.capacity || 1,
          perNightCost: parseFloat(bookingDetails.selectedRoom.rate),
          amount: bookingDetails.total_amount - (bookingDetails.discount_amount || 0),
          description: `Room ${bookingDetails.selectedRoom.room_number} - ${bookingDetails.selectedRoom.room_type}`,
          quantity: getNights(),
          unitPrice: parseFloat(bookingDetails.selectedRoom.rate)
        }
      ],
      originalSubtotal: bookingDetails.total_amount || 0,
      totalDiscount: bookingDetails.discount_amount || 0,
      subtotal: (bookingDetails.total_amount || 0) - (bookingDetails.discount_amount || 0),
      taxRate: vatRate,
      taxAmount: bookingDetails.vat_amount || 0,
      total: finalTotal,
      // Add payment information
      totalPaid: totalPaid,
      paidAmount: totalPaid,
      dueAmount: dueAmount,
      balanceDue: dueAmount,
      payments: payments.map(payment => ({
        amount: parseFloat(payment.amount || 0),
        method: payment.method || 'cash',
        description: payment.notes || 'Payment',
        date: new Date().toISOString()
      })),
      paymentStatus: totalPaid >= finalTotal ? 'paid' : (totalPaid > 0 ? 'partial' : 'pending'),
      notes: `Check-in: ${bookingDetails.checkin_date}, Check-out: ${bookingDetails.checkout_date}`,
      additionalCharges: [],
      additionalTotal: 0
    };
  };

  const addPayment = () => {
    if (newPayment.amount > 0) {
      setPayments(prev => [...prev, {
        ...newPayment,
        id: Date.now() // Simple ID for key
      }]);
      setNewPayment({
        method: 'cash',
        amount: 0,
        notes: ''
      });
    }
  };

  const removePayment = (paymentId) => {
    setPayments(prev => prev.filter(p => p.id !== paymentId));
  };

  const getTotalPaid = () => {
    return payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
  };

  const getDueAmount = () => {
    const finalAmount = bookingDetails.final_amount || 0;
    const totalPaid = getTotalPaid();
    return Math.max(0, finalAmount - totalPaid);
  };


  const getNights = () => {
    if (!bookingDetails.checkin_date || !bookingDetails.checkout_date) return 0;
    const checkin = new Date(bookingDetails.checkin_date);
    const checkout = new Date(bookingDetails.checkout_date);
    return Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="create-booking-page">
      <div className="booking-header">
        <h1>Create New Booking</h1>
        <div className="step-indicator">
          <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
            <span>1</span>
            <label>Select Dates</label>
          </div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
            <span>2</span>
            <label>Choose Room</label>
          </div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
            <span>3</span>
            <label>Guest Info</label>
          </div>
          <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>
            <span>4</span>
            <label>Review & Confirm</label>
          </div>
          <div className={`step ${currentStep >= 5 ? 'active' : ''}`}>
            <span>5</span>
            <label>Confirmation</label>
          </div>
        </div>
      </div>

      <div className="booking-content">
        {/* Step 1: Date Selection */}
        {currentStep === 1 && (
          <div className="booking-step">
            <h2>Select Your Dates</h2>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="checkin_date">Check-in Date *</label>
                <input
                  type="date"
                  id="checkin_date"
                  value={bookingDetails.checkin_date}
                  onChange={(e) => setBookingDetails(prev => ({ ...prev, checkin_date: e.target.value }))}
                  className={errors.checkin_date ? 'error' : ''}
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.checkin_date && <span className="error-text">{errors.checkin_date}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="checkout_date">Check-out Date *</label>
                <input
                  type="date"
                  id="checkout_date"
                  value={bookingDetails.checkout_date}
                  onChange={(e) => setBookingDetails(prev => ({ ...prev, checkout_date: e.target.value }))}
                  className={errors.checkout_date ? 'error' : ''}
                  min={bookingDetails.checkin_date || new Date().toISOString().split('T')[0]}
                />
                {errors.checkout_date && <span className="error-text">{errors.checkout_date}</span>}
              </div>
            </div>

            {bookingDetails.checkin_date && bookingDetails.checkout_date && (
              <div className="stay-summary">
                <p>You'll be staying for {getNights()} night{getNights() !== 1 ? 's' : ''}</p>
              </div>
            )}

            <div className="step-actions">
              <button 
                className="btn btn-primary"
                onClick={handleNext}
                disabled={loading}
              >
                Next: Choose Room
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Room Selection */}
        {currentStep === 2 && (
          <div className="booking-step">
            <h2>Choose Your Room & Apply Discount</h2>
            
            <div className="booking-summary-mini">
              <div className="summary-item">
                <Calendar size={16} />
                <span>{bookingDetails.checkin_date} to {bookingDetails.checkout_date}</span>
              </div>
              <div className="summary-item">
                <Bed size={16} />
                <span>{getNights()} nights</span>
              </div>
            </div>

            {loading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p>Searching for available rooms...</p>
                <p className="loading-details">
                  Checking availability from {bookingDetails.checkin_date} to {bookingDetails.checkout_date}
                </p>
              </div>
            ) : (
              <>
                {availableRooms.length > 0 && (
                  <div className="search-results-summary">
                    <p>Found {availableRooms.length} available room{availableRooms.length !== 1 ? 's' : ''} for your dates</p>
                  </div>
                )}
                
                {availableRooms.length > 0 && (
                  <div className="discount-control">
                    <label htmlFor="discount">Apply Discount (%):</label>
                    <input
                      type="number"
                      id="discount"
                      min="0"
                      max="100"
                      step="0.1"
                      value={bookingDetails.discount_percentage}
                      onChange={(e) => handleDiscountChange(e.target.value)}
                      placeholder="0"
                    />
                    <span className="discount-help">Enter percentage (0-100%)</span>
                  </div>
                )}
                
                <div className="rooms-grid">
                  {availableRooms.map(room => {
                    const { total, discount, final } = calculateTotal(room, bookingDetails.discount_percentage);
                    const isSelected = bookingDetails.room_id === room.id;
                  
                    return (
                      <div 
                        key={room.id} 
                        className={`room-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleRoomSelect(room)}
                      >
                        <div className="room-header">
                          <h3>Room {room.room_number}</h3>
                          <span className="room-type">{room.room_type}</span>
                        </div>
                        
                        <div className="room-details">
                          <div className="room-info">
                            <div className="info-item">
                              <Users size={16} />
                              <span>{room.capacity} guests</span>
                            </div>
                            <div className="info-item">
                              <span>Floor {JSON.parse(room.meta || '{}').floor || 'N/A'}</span>
                            </div>
                            <div className="info-item">
                              <span>{JSON.parse(room.meta || '{}').has_ac ? 'AC' : 'Non-AC'}</span>
                            </div>
                          </div>
                          
                          {JSON.parse(room.meta || '{}').description && (
                            <p className="room-description">
                              {JSON.parse(room.meta || '{}').description}
                            </p>
                          )}
                          
                          <div className="room-pricing">
                            <div className="price-breakdown">
                              <span>৳{room.rate}/night × {getNights()} nights = ৳{total.toFixed(2)}</span>
                              {bookingDetails.discount_percentage > 0 && (
                                <>
                                  <span className="discount-line">Discount ({bookingDetails.discount_percentage}%): -৳{discount.toFixed(2)}</span>
                                  <span className="discounted-rate">Per night after discount: ৳{((parseFloat(room.rate) * (100 - bookingDetails.discount_percentage)) / 100).toFixed(2)}</span>
                                </>
                              )}
                            </div>
                            <div className="total-price">
                              {bookingDetails.discount_percentage > 0 ? (
                                <>
                                  <span className="original-price">Original: ৳{total.toFixed(2)}</span>
                                  <span className="final-price">Final: ৳{final.toFixed(2)}</span>
                                </>
                              ) : (
                                <span>Total: ৳{total.toFixed(2)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {isSelected && (
                          <div className="selected-indicator">
                            <Check size={20} />
                            Selected
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {availableRooms.length === 0 && !loading && (
              <div className="no-rooms">
                <Bed size={48} />
                <h3>No Available Rooms</h3>
                <p>No rooms are available for {bookingDetails.checkin_date} to {bookingDetails.checkout_date}</p>
                <p className="suggestion">Try different dates or contact us for assistance</p>
                <button 
                  className="btn btn-secondary"
                  onClick={handleBack}
                >
                  Change Dates
                </button>
              </div>
            )}

            {errors.room_id && <div className="error-text center">{errors.room_id}</div>}
            
            <div className="step-actions">
              <button 
                className="btn btn-secondary"
                onClick={handleBack}
              >
                <ArrowLeft size={20} />
                Back
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleNext}
                disabled={loading || !bookingDetails.room_id}
              >
                Next: Guest Details
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Guest Information */}
        {currentStep === 3 && (
          <div className="booking-step">
            <h2>Guest Information</h2>
            
            <div className="booking-summary-mini">
              <div className="summary-item">
                <Calendar size={16} />
                <span>{bookingDetails.checkin_date} to {bookingDetails.checkout_date}</span>
              </div>
              <div className="summary-item">
                <Bed size={16} />
                <span>Room {bookingDetails.selectedRoom?.room_number} - {bookingDetails.selectedRoom?.room_type}</span>
              </div>
              <div className="summary-item">
                <span>৳{bookingDetails.final_amount > 0 ? bookingDetails.final_amount.toFixed(2) : bookingDetails.total_amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="first_name">First Name *</label>
                <input
                  type="text"
                  id="first_name"
                  value={guestInfo.first_name}
                  onChange={(e) => setGuestInfo(prev => ({ ...prev, first_name: e.target.value }))}
                  className={errors.first_name ? 'error' : ''}
                />
                {errors.first_name && <span className="error-text">{errors.first_name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="last_name">Last Name *</label>
                <input
                  type="text"
                  id="last_name"
                  value={guestInfo.last_name}
                  onChange={(e) => setGuestInfo(prev => ({ ...prev, last_name: e.target.value }))}
                  className={errors.last_name ? 'error' : ''}
                />
                {errors.last_name && <span className="error-text">{errors.last_name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  value={guestInfo.email}
                  onChange={(e) => setGuestInfo(prev => ({ ...prev, email: e.target.value }))}
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  value={guestInfo.phone}
                  onChange={(e) => setGuestInfo(prev => ({ ...prev, phone: e.target.value }))}
                  className={errors.phone ? 'error' : ''}
                />
                {errors.phone && <span className="error-text">{errors.phone}</span>}
              </div>

              <div className="form-group full-width">
                <label htmlFor="address">Address *</label>
                <textarea
                  id="address"
                  value={guestInfo.address}
                  onChange={(e) => setGuestInfo(prev => ({ ...prev, address: e.target.value }))}
                  className={errors.address ? 'error' : ''}
                  rows="3"
                />
                {errors.address && <span className="error-text">{errors.address}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="nid">NID Number *</label>
                <input
                  type="text"
                  id="nid"
                  value={guestInfo.nid}
                  onChange={(e) => setGuestInfo(prev => ({ ...prev, nid: e.target.value }))}
                  className={errors.nid ? 'error' : ''}
                />
                {errors.nid && <span className="error-text">{errors.nid}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={bookingDetails.auto_checkin}
                  onChange={(e) => setBookingDetails(prev => ({ ...prev, auto_checkin: e.target.checked }))}
                />
                Check-in guest immediately (mark room as occupied)
              </label>
            </div>

            <div className="step-actions">
              <button 
                className="btn btn-secondary"
                onClick={handleBack}
              >
                <ArrowLeft size={20} />
                Back
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleNext}
                disabled={loading}
              >
                Next: Review & Invoice
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Invoice */}
        {currentStep === 4 && (
          <div className="booking-step invoice-step">
            <h2>Create New Invoice</h2>
            
            {/* Only render invoice if we have the required data */}
            {bookingDetails.selectedRoom ? (
              <div className="invoice-form-container">
                
                {/* Invoice Details */}
                <div className="form-section">
                  <h3>Invoice Details</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Invoice ID</label>
                      <input type="text" value="AUTO-GENERATED" disabled className="form-control" />
                    </div>
                    <div className="form-group">
                      <label>Invoice Date</label>
                      <input type="date" value={new Date().toISOString().split('T')[0]} disabled className="form-control" />
                    </div>
                    <div className="form-group">
                      <label>Due Date</label>
                      <input type="date" value={bookingDetails.checkout_date} disabled className="form-control" />
                    </div>
                    <div className="form-group">
                      <label>Created By (Admin) - Auto Assigned</label>
                      <input type="text" value={user?.email || 'System Admin'} disabled className="form-control" />
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="form-section">
                  <h3>Customer Information</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Customer Name</label>
                      <input 
                        type="text" 
                        value={`${guestInfo.first_name || ''} ${guestInfo.last_name || ''}`.trim() || '[Customer Name]'} 
                        disabled 
                        className="form-control" 
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input type="email" value={guestInfo.email || '[Email]'} disabled className="form-control" />
                    </div>
                    <div className="form-group">
                      <label>NID Number</label>
                      <input type="text" value={guestInfo.nid || '[NID]'} disabled className="form-control" />
                    </div>
                    <div className="form-group">
                      <label>Phone</label>
                      <input type="tel" value={guestInfo.phone || '[Phone]'} disabled className="form-control" />
                    </div>
                    <div className="form-group full-width">
                      <label>Address</label>
                      <textarea value={guestInfo.address || '[Address]'} disabled className="form-control" rows="2" />
                    </div>
                  </div>
                </div>

                {/* Room Booking Details */}
                <div className="form-section">
                  <h3>Room Booking Details</h3>
                  <div className="room-booking-item">
                    <h4>Room Booking #1</h4>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Select Room</label>
                        <input 
                          type="text" 
                          value={`Room ${bookingDetails.selectedRoom?.room_number || '[Room]'}`} 
                          disabled 
                          className="form-control" 
                        />
                      </div>
                      <div className="form-group">
                        <label>Room Type</label>
                        <input 
                          type="text" 
                          value={bookingDetails.selectedRoom?.room_type || '[Room Type]'} 
                          disabled 
                          className="form-control" 
                        />
                      </div>
                      <div className="form-group">
                        <label>Number of Guests</label>
                        <input 
                          type="number" 
                          value={bookingDetails.selectedRoom?.capacity || 1} 
                          disabled 
                          className="form-control" 
                        />
                      </div>
                      <div className="form-group">
                        <label>Check-in Date</label>
                        <input 
                          type="date" 
                          value={bookingDetails.checkin_date || ''} 
                          disabled 
                          className="form-control" 
                        />
                      </div>
                      <div className="form-group">
                        <label>Check-out Date</label>
                        <input 
                          type="date" 
                          value={bookingDetails.checkout_date || ''} 
                          disabled 
                          className="form-control" 
                        />
                      </div>
                      <div className="form-group">
                        <label>Total Nights</label>
                        <input 
                          type="number" 
                          value={getNights()} 
                          disabled 
                          className="form-control" 
                        />
                      </div>
                      <div className="form-group">
                        <label>Original Price Per Night</label>
                        <input 
                          type="text" 
                          value={`৳${bookingDetails.selectedRoom?.rate ? parseFloat(bookingDetails.selectedRoom.rate).toFixed(2) : '0.00'}`} 
                          disabled 
                          className="form-control" 
                        />
                      </div>
                      <div className="form-group">
                        <label>Discount Percentage</label>
                        <input 
                          type="number" 
                          value={bookingDetails.discount_percentage} 
                          onChange={(e) => handleDiscountChange(e.target.value)}
                          className="form-control" 
                          min="0" 
                          max="100" 
                          step="0.1"
                        />
                      </div>
                      <div className="form-group">
                        <label>Price After Discount Per Night</label>
                        <input 
                          type="text" 
                          value={`৳${bookingDetails.selectedRoom?.rate ? ((parseFloat(bookingDetails.selectedRoom.rate) * (100 - bookingDetails.discount_percentage)) / 100).toFixed(2) : '0.00'}`} 
                          disabled 
                          className="form-control" 
                        />
                      </div>
                    </div>
                    
                    <div className="booking-totals">
                      <div className="total-item">
                        <span>Original Total:</span>
                        <span>৳{bookingDetails.total_amount?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="total-item">
                        <span>Final Total:</span>
                        <span>৳{(bookingDetails.total_amount - bookingDetails.discount_amount)?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Tracking */}
                <div className="form-section">
                  <h3>Payment Tracking</h3>
                  
                  <div className="add-payment-form">
                    <div className="form-grid payment-grid">
                      <div className="form-group">
                        <label>Payment Method</label>
                        <select 
                          value={newPayment.method} 
                          onChange={(e) => setNewPayment(prev => ({...prev, method: e.target.value}))}
                          className="form-control"
                        >
                          <option value="cash">Cash</option>
                          <option value="card">Credit/Debit Card</option>
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="mobile_banking">Mobile Banking</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Amount</label>
                        <input 
                          type="number" 
                          value={newPayment.amount} 
                          onChange={(e) => setNewPayment(prev => ({...prev, amount: parseFloat(e.target.value) || 0}))}
                          className="form-control" 
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="form-group">
                        <label>Notes (Optional)</label>
                        <input 
                          type="text" 
                          value={newPayment.notes} 
                          onChange={(e) => setNewPayment(prev => ({...prev, notes: e.target.value}))}
                          className="form-control" 
                          placeholder="Payment reference, notes..."
                        />
                      </div>
                      <div className="form-group">
                        <label>&nbsp;</label>
                        <button type="button" onClick={addPayment} className="btn btn-secondary">
                          Add Payment
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Payment List */}
                  {payments.length > 0 && (
                    <div className="payment-list">
                      <h4>Payments Added</h4>
                      {payments.map((payment) => (
                        <div key={payment.id} className="payment-item">
                          <div className="payment-details">
                            <div className="payment-method">{payment.method}</div>
                            <div className="payment-amount">৳{payment.amount.toFixed(2)}</div>
                            {payment.notes && <div className="payment-notes">{payment.notes}</div>}
                          </div>
                          <button 
                            type="button" 
                            onClick={() => removePayment(payment.id)}
                            className="btn-remove"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Final Totals */}
                <div className="form-section final-totals">
                  <div className="totals-grid">
                    <div className="total-row">
                      <span>Original Room Charges:</span>
                      <span>৳{bookingDetails.total_amount?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="total-row">
                      <span>Room Charges After Discount:</span>
                      <span>৳{(bookingDetails.total_amount - bookingDetails.discount_amount)?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="total-row">
                      <span>Subtotal (Before VAT):</span>
                      <span>৳{(bookingDetails.total_amount - bookingDetails.discount_amount)?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="total-row">
                      <span>VAT ({vatRate}%):</span>
                      <span>
                        <input 
                          type="number"
                          value={vatRate}
                          onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                          className="vat-input"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                        ৳{bookingDetails.vat_amount?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <div className="total-row grand-total">
                      <span>Final Total Amount:</span>
                      <span>৳{bookingDetails.final_amount?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="total-row">
                      <span>Total Paid:</span>
                      <span>৳{getTotalPaid().toFixed(2)}</span>
                    </div>
                    <div className="total-row due-amount">
                      <span>Due Amount:</span>
                      <span>৳{getDueAmount().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div style={{padding: '2rem', textAlign: 'center', background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '0.5rem'}}>
                <h3>Missing Booking Information</h3>
                <p>Please go back and complete the previous steps.</p>
                <button className="btn btn-secondary" onClick={handleBack}>
                  <ArrowLeft size={20} />
                  Go Back
                </button>
              </div>
            )}

            <div className="step-actions">
              <button 
                className="btn btn-secondary"
                onClick={handleBack}
              >
                <ArrowLeft size={20} />
                Back
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleCreateBooking}
                disabled={loading || !bookingDetails.selectedRoom}
              >
                {loading ? 'Processing...' : 'Create Invoice & Confirm Booking'}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Confirmation */}
        {currentStep === 5 && bookingResult && (
          <div className="booking-step confirmation">
            <div className="success-header">
              <Check size={48} />
              <h2>Booking Created Successfully!</h2>
            </div>

            <div className="booking-confirmation">
              <div className="confirmation-card">
                <h3>Booking Details</h3>
                
                <div className="confirmation-grid">
                  <div className="confirmation-item">
                    <label>Booking Reference</label>
                    <span className="booking-ref">{bookingResult.booking_reference}</span>
                  </div>
                  
                  <div className="confirmation-item">
                    <label>Guest Name</label>
                    <span>{guestInfo.first_name} {guestInfo.last_name}</span>
                  </div>
                  
                  <div className="confirmation-item">
                    <label>Email</label>
                    <span>{guestInfo.email}</span>
                  </div>
                  
                  <div className="confirmation-item">
                    <label>Phone</label>
                    <span>{guestInfo.phone}</span>
                  </div>
                  
                  <div className="confirmation-item">
                    <label>Address</label>
                    <span>{guestInfo.address}</span>
                  </div>
                  
                  <div className="confirmation-item">
                    <label>NID</label>
                    <span>{guestInfo.nid}</span>
                  </div>
                  
                  <div className="confirmation-item">
                    <label>Room</label>
                    <span>Room {bookingDetails.selectedRoom?.room_number} - {bookingDetails.selectedRoom?.room_type}</span>
                  </div>
                  
                  <div className="confirmation-item">
                    <label>Dates</label>
                    <span>{bookingDetails.checkin_date} to {bookingDetails.checkout_date}</span>
                  </div>
                  
                  <div className="confirmation-item">
                    <label>Total Amount</label>
                    <span>৳{(bookingDetails.final_amount > 0 ? bookingDetails.final_amount : bookingDetails.total_amount).toFixed(2)}</span>
                  </div>
                  
                  <div className="confirmation-item">
                    <label>Payment Method</label>
                    <span>{paymentData.payment_method}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="step-actions">
              <button 
                className="btn btn-secondary"
                onClick={handleViewInvoice}
              >
                <Eye size={20} />
                View/Print Invoice
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleDownloadInvoice}
              >
                <Download size={20} />
                Download Invoice
              </button>
            </div>

            <div className="step-actions" style={{ marginTop: '1rem' }}>
              <button 
                className="btn btn-secondary"
                onClick={() => window.location.href = '/bookings'}
              >
                View All Bookings
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => window.location.href = '/dashboard'}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateBooking;