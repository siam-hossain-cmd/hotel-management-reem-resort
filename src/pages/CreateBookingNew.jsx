import React, { useState, useEffect } from 'react';
import { Calendar, Users, Bed, Check, Search, ArrowLeft, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './CreateBooking.css';

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
  
  const [errors, setErrors] = useState({});
  const [bookingResult, setBookingResult] = useState(null);

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
    if (validateStep(currentStep)) {
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
      
      const response = await api.createBooking({
        ...guestInfo,
        ...bookingDetails,
        user_id: user?.uid || null,
        total_amount: finalAmount,
        payment_method: paymentData.payment_method,
        payment_status: paymentData.payment_status,
        paid_amount: paymentData.paid_amount
      });

      if (response.success) {
        setBookingResult(response);
        setCurrentStep(5);
      } else {
        console.error('Booking creation failed:', response.error);
        alert(`Failed to create booking: ${response.error}`);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
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
            <label>Invoice</label>
          </div>
          <div className={`step ${currentStep >= 5 ? 'active' : ''}`}>
            <span>5</span>
            <label>Payment</label>
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
          <div className="booking-step">
            <h2>Invoice Preview</h2>
            
            <div className="invoice-preview">
              <div className="invoice-header">
                <h3>REEM RESORT</h3>
                <p>Invoice for Booking</p>
              </div>
              
              <div className="invoice-details">
                <div className="invoice-section">
                  <h4>Guest Information</h4>
                  <p><strong>Name:</strong> {guestInfo.first_name} {guestInfo.last_name}</p>
                  <p><strong>Email:</strong> {guestInfo.email}</p>
                  <p><strong>Phone:</strong> {guestInfo.phone}</p>
                  <p><strong>Address:</strong> {guestInfo.address}</p>
                  <p><strong>NID:</strong> {guestInfo.nid}</p>
                </div>
                
                <div className="invoice-section">
                  <h4>Booking Details</h4>
                  <p><strong>Room:</strong> {bookingDetails.selectedRoom?.room_number} - {bookingDetails.selectedRoom?.room_type}</p>
                  <p><strong>Check-in:</strong> {new Date(bookingDetails.checkin_date).toLocaleDateString()}</p>
                  <p><strong>Check-out:</strong> {new Date(bookingDetails.checkout_date).toLocaleDateString()}</p>
                  <p><strong>Nights:</strong> {getNights()}</p>
                </div>
                
                <div className="invoice-section">
                  <h4>Payment Details</h4>
                  <div className="invoice-amounts">
                    <div className="amount-row">
                      <span>Room Rate × {getNights()} nights:</span>
                      <span>৳{bookingDetails.total_amount.toFixed(2)}</span>
                    </div>
                    {bookingDetails.discount_percentage > 0 && (
                      <div className="amount-row discount">
                        <span>Discount ({bookingDetails.discount_percentage}%):</span>
                        <span>-৳{bookingDetails.discount_amount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="amount-row total">
                      <span><strong>Total Amount:</strong></span>
                      <span><strong>৳{(bookingDetails.final_amount > 0 ? bookingDetails.final_amount : bookingDetails.total_amount).toFixed(2)}</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="payment-section">
              <h3>Payment Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="payment_method">Payment Method</label>
                  <select
                    id="payment_method"
                    value={paymentData.payment_method}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, payment_method: e.target.value }))}
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Credit/Debit Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mobile_banking">Mobile Banking</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="paid_amount">Amount Received</label>
                  <input
                    type="number"
                    id="paid_amount"
                    value={paymentData.paid_amount}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, paid_amount: parseFloat(e.target.value) || 0 }))}
                    placeholder={`৳${(bookingDetails.final_amount > 0 ? bookingDetails.final_amount : bookingDetails.total_amount).toFixed(2)}`}
                  />
                </div>
              </div>
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
                onClick={handleCreateBooking}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Confirm Booking & Payment'}
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