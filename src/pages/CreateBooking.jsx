import React, { useState, useEffect } from 'react';
import { Calendar, Users, Bed, CreditCard, Check, X, Search, Filter, Save, Send, Plus, Trash2, Eye, Download, Printer } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { bookingService } from '../firebase/bookingService';
import { invoiceService } from '../firebase/invoiceService';
import { generateInvoicePDF, previewInvoice, printInvoicePDF } from '../utils/pdfGenerator';
import { useAuth } from '../contexts/AuthContext';
import '../booking.css';

const CreateBooking = () => {
  const { user, canPerformAction } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1); // 1: Room Selection, 2: Guest Info, 3: Invoice Creation, 4: Confirmation
  const [loading, setLoading] = useState(false);
  
  // Room search criteria
  const [searchCriteria, setSearchCriteria] = useState({
    checkInDate: '',
    checkOutDate: '',
    guestCount: 1,
    roomType: 'all'
  });
  
  // Available rooms
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  // Guest information
  const [guestInfo, setGuestInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    idType: 'nid',
    idNumber: '',
    specialRequests: ''
  });
  
  // Booking summary
  const [bookingSummary, setBookingSummary] = useState({
    totalNights: 0,
    pricePerNight: 0,
    subtotal: 0,
    taxes: 0,
    total: 0
  });
  
  // Payment info
  const [paymentInfo, setPaymentInfo] = useState({
    method: 'cash',
    amount: 0,
    reference: '',
    notes: ''
  });

  // Invoice state (for step 3)
  const [invoice, setInvoice] = useState({
    id: `INV-${Date.now()}`,
    customerInfo: {
      name: '',
      email: '',
      address: '',
      phone: '',
      nid: ''
    },
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    adminName: user?.name || user?.email?.split('@')[0] || 'admin',
    items: [
      { 
        id: uuidv4(), 
        roomNumber: '', 
        roomType: '',
        checkInDate: '', 
        checkOutDate: '', 
        totalNights: 0,
        perNightCost: 0, 
        discountPercentage: 0,
        discountAmount: 0,
        guestCount: 1,
        amount: 0 
      }
    ],
    additionalCharges: [],
    payments: [],
    notes: '',
    terms: 'Payment is due within 30 days',
    originalSubtotal: 0,
    totalDiscount: 0,
    subtotal: 0,
    additionalTotal: 0,
    tax: 0,
    taxRate: 10,
    total: 0,
    totalPaid: 0,
    dueAmount: 0
  });

  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Calculate booking summary when dates or room change
  useEffect(() => {
    if (searchCriteria.checkInDate && searchCriteria.checkOutDate && selectedRoom) {
      const checkIn = new Date(searchCriteria.checkInDate);
      const checkOut = new Date(searchCriteria.checkOutDate);
      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      const subtotal = nights * selectedRoom.pricePerNight;
      const taxes = subtotal * 0.1; // 10% tax
      const total = subtotal + taxes;
      
      setBookingSummary({
        totalNights: nights,
        pricePerNight: selectedRoom.pricePerNight,
        subtotal,
        taxes,
        total
      });
      
      setPaymentInfo(prev => ({ ...prev, amount: total }));
    }
  }, [searchCriteria.checkInDate, searchCriteria.checkOutDate, selectedRoom]);

  // Auto-populate invoice when moving to step 3
  useEffect(() => {
    if (currentStep === 3 && selectedRoom && guestInfo.firstName) {
      const invoiceFromBooking = {
        id: `INV-${Date.now()}`,
        customerInfo: {
          name: `${guestInfo.firstName} ${guestInfo.lastName}`.trim(),
          email: guestInfo.email,
          address: guestInfo.address,
          phone: guestInfo.phone,
          nid: guestInfo.idNumber
        },
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        adminName: user?.name || user?.email?.split('@')[0] || 'admin',
        items: [{
          id: uuidv4(),
          roomNumber: selectedRoom.roomNumber,
          roomType: selectedRoom.roomType,
          checkInDate: searchCriteria.checkInDate,
          checkOutDate: searchCriteria.checkOutDate,
          totalNights: bookingSummary.totalNights,
          perNightCost: selectedRoom.pricePerNight,
          discountPercentage: 0,
          discountAmount: 0,
          guestCount: searchCriteria.guestCount,
          amount: bookingSummary.subtotal
        }],
        additionalCharges: [],
        payments: [],
        notes: guestInfo.specialRequests || '',
        terms: 'Payment is due within 30 days',
        originalSubtotal: bookingSummary.subtotal,
        totalDiscount: 0,
        subtotal: bookingSummary.subtotal,
        additionalTotal: 0,
        tax: bookingSummary.taxes,
        taxRate: 10,
        total: bookingSummary.total,
        totalPaid: 0,
        dueAmount: bookingSummary.total,
        bookingRef: `BK-${Date.now().toString().substring(6)}`
      };
      
      setInvoice(invoiceFromBooking);
    }
  }, [currentStep, selectedRoom, guestInfo, searchCriteria, bookingSummary, user]);

  // Invoice helper functions
  const calculateTotals = () => {
    const originalSubtotal = invoice.items.reduce((sum, item) => {
      return sum + (item.totalNights * item.perNightCost);
    }, 0);
    
    const totalDiscount = invoice.items.reduce((sum, item) => sum + item.discountAmount, 0);
    const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
    const additionalTotal = invoice.additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
    const tax = ((subtotal + additionalTotal) * invoice.taxRate) / 100;
    const total = subtotal + additionalTotal + tax;
    const totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const dueAmount = total - totalPaid;
    
    setInvoice(prev => ({
      ...prev,
      originalSubtotal,
      totalDiscount,
      subtotal,
      additionalTotal,
      tax,
      total,
      totalPaid,
      dueAmount
    }));
  };

  const updateItem = (itemId, field, value) => {
    setInvoice(prev => {
      const updatedItems = prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          
          if (field === 'checkInDate' || field === 'checkOutDate') {
            if (updatedItem.checkInDate && updatedItem.checkOutDate) {
              const checkIn = new Date(updatedItem.checkInDate);
              const checkOut = new Date(updatedItem.checkOutDate);
              const diffTime = Math.abs(checkOut - checkIn);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              updatedItem.totalNights = diffDays > 0 ? diffDays : 1;
            }
          }
          
          const baseAmount = updatedItem.totalNights * updatedItem.perNightCost;
          
          if (field === 'discountPercentage' || field === 'totalNights' || field === 'perNightCost' || 
              field === 'checkInDate' || field === 'checkOutDate') {
            updatedItem.discountAmount = (baseAmount * updatedItem.discountPercentage) / 100;
          }
          
          updatedItem.amount = baseAmount - updatedItem.discountAmount;
          return updatedItem;
        }
        return item;
      });
      
      return { ...prev, items: updatedItems };
    });
  };

  const addAdditionalCharge = () => {
    setInvoice(prev => ({
      ...prev,
      additionalCharges: [
        ...prev.additionalCharges,
        { id: uuidv4(), description: '', amount: 0 }
      ]
    }));
  };

  const updateAdditionalCharge = (chargeId, field, value) => {
    setInvoice(prev => ({
      ...prev,
      additionalCharges: prev.additionalCharges.map(charge =>
        charge.id === chargeId 
          ? { ...charge, [field]: field === 'amount' ? parseFloat(value) || 0 : value }
          : charge
      )
    }));
  };

  const removeAdditionalCharge = (chargeId) => {
    setInvoice(prev => ({
      ...prev,
      additionalCharges: prev.additionalCharges.filter(charge => charge.id !== chargeId)
    }));
  };

  const addPayment = () => {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }
    
    const amount = parseFloat(paymentForm.amount);
    
    if (amount > invoice.dueAmount) {
      alert(`Payment amount (৳${amount.toFixed(2)}) cannot exceed due amount (৳${invoice.dueAmount.toFixed(2)})`);
      return;
    }

    const newPayment = {
      id: uuidv4(),
      amount: amount,
      method: paymentForm.method,
      description: paymentForm.description,
      date: new Date().toISOString()
    };

    setInvoice(prev => ({
      ...prev,
      payments: [...prev.payments, newPayment]
    }));

    setPaymentForm({ amount: '', method: 'cash', description: '' });
    setShowPaymentForm(false);
  };

  const removePayment = (paymentId) => {
    setInvoice(prev => ({
      ...prev,
      payments: prev.payments.filter(payment => payment.id !== paymentId)
    }));
  };

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'cash',
    description: ''
  });

  // Recalculate totals when invoice changes
  useEffect(() => {
    calculateTotals();
  }, [invoice.items, invoice.additionalCharges, invoice.payments, invoice.taxRate]);

  // Save invoice function
  const saveInvoice = async () => {
    try {
      setLoading(true);
      
      if (!invoice.customerInfo.name.trim()) {
        alert('Customer name is required');
        return;
      }
      
      if (invoice.items.length === 0 || invoice.items.every(item => item.amount === 0)) {
        alert('Please add at least one room item with amount');
        return;
      }

      const result = await invoiceService.saveInvoice(invoice);
      
      if (result.success) {
        alert('Invoice saved successfully!');
        setCurrentStep(4); // Move to confirmation step
      } else {
        alert('Failed to save invoice: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Error occurred while saving invoice');
    } finally {
      setLoading(false);
    }
  };

  // Search for available rooms
  const handleSearchRooms = async () => {
    if (!searchCriteria.checkInDate || !searchCriteria.checkOutDate) {
      alert('Please select check-in and check-out dates');
      return;
    }
    
    if (new Date(searchCriteria.checkInDate) >= new Date(searchCriteria.checkOutDate)) {
      alert('Check-out date must be after check-in date');
      return;
    }
    
    setLoading(true);
    try {
      const result = await bookingService.getAvailableRooms(
        searchCriteria.checkInDate,
        searchCriteria.checkOutDate,
        searchCriteria.roomType === 'all' ? null : searchCriteria.roomType
      );
      
      if (result.success) {
        setAvailableRooms(result.rooms);
        if (result.rooms.length === 0) {
          alert('No rooms available for the selected dates. Please try different dates.');
        }
      } else {
        console.error('Failed to search rooms:', result.error);
        alert('Failed to search rooms: ' + result.error);
      }
    } catch (error) {
      console.error('Error searching rooms:', error);
      alert('Error occurred while searching rooms');
    } finally {
      setLoading(false);
    }
  };

  // Select a room
  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    setCurrentStep(2);
  };

  // Proceed to payment
  const handleProceedToInvoice = () => {
    // Validate guest information
    if (!guestInfo.firstName || !guestInfo.lastName || !guestInfo.email || !guestInfo.phone) {
      alert('Please fill in all required guest information');
      return;
    }
    
    // Move to step 3 (invoice creation) instead of navigating to new page
    setCurrentStep(3);
  };

  // Complete booking
  const handleCompleteBooking = async () => {
    setLoading(true);
    try {
      // Create booking data
      const bookingData = {
        // Room details
        roomNumber: selectedRoom.roomNumber,
        roomType: selectedRoom.roomType,
        pricePerNight: selectedRoom.pricePerNight,
        
        // Dates
        checkInDate: searchCriteria.checkInDate,
        checkOutDate: searchCriteria.checkOutDate,
        totalNights: bookingSummary.totalNights,
        
        // Guest information
        guestInfo,
        guestCount: searchCriteria.guestCount,
        
        // Booking summary
        subtotal: bookingSummary.subtotal,
        taxes: bookingSummary.taxes,
        total: bookingSummary.total,
        
        // Payment information
        paymentInfo,
        
        // Admin info
        createdBy: user?.name || user?.email || 'Unknown',
        adminName: user?.name || user?.email?.split('@')[0] || 'admin'
      };
      
      // Create booking
      const result = await bookingService.createBooking(bookingData);
      
      if (result.success) {
        console.log('Booking created successfully:', result.id);
        
        // If payment is made, mark as paid
        if (paymentInfo.method !== 'pending') {
          await bookingService.markAsPaid(result.id, paymentInfo);
        }
        
        setCurrentStep(4);
        
        // Store booking ID for invoice generation
        localStorage.setItem('completedBookingId', result.id);
        
      } else {
        console.error('Failed to create booking:', result.error);
        alert('Failed to create booking: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Error occurred while creating booking');
    } finally {
      setLoading(false);
    }
  };

  // Generate invoice from booking
  const handleGenerateInvoice = () => {
    const bookingId = localStorage.getItem('completedBookingId');
    if (bookingId) {
      // Navigate to create invoice with booking data
      window.location.href = `/create-invoice?mode=booking&bookingId=${bookingId}`;
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="booking-step">
            <h2>Search Available Rooms</h2>
            
            <div className="search-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Check-in Date</label>
                  <input
                    type="date"
                    value={searchCriteria.checkInDate}
                    onChange={(e) => setSearchCriteria(prev => ({ ...prev, checkInDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="form-group">
                  <label>Check-out Date</label>
                  <input
                    type="date"
                    value={searchCriteria.checkOutDate}
                    onChange={(e) => setSearchCriteria(prev => ({ ...prev, checkOutDate: e.target.value }))}
                    min={searchCriteria.checkInDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="form-group">
                  <label>Guests</label>
                  <select
                    value={searchCriteria.guestCount}
                    onChange={(e) => setSearchCriteria(prev => ({ ...prev, guestCount: parseInt(e.target.value) }))}
                  >
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Room Type</label>
                  <select
                    value={searchCriteria.roomType}
                    onChange={(e) => setSearchCriteria(prev => ({ ...prev, roomType: e.target.value }))}
                  >
                    <option value="all">All Types</option>
                    <option value="Standard">Standard</option>
                    <option value="Deluxe">Deluxe</option>
                    <option value="Suite">Suite</option>
                    <option value="Family">Family</option>
                  </select>
                </div>
              </div>
              
              <button 
                className="btn btn-primary search-btn" 
                onClick={handleSearchRooms}
                disabled={loading}
              >
                <Search size={20} />
                {loading ? 'Searching...' : 'Search Rooms'}
              </button>
            </div>

            {availableRooms.length > 0 && (
              <div className="available-rooms">
                <h3>Available Rooms ({availableRooms.length})</h3>
                <div className="rooms-grid">
                  {availableRooms.map((room) => (
                    <div key={room.roomNumber} className="room-card">
                      <div className="room-header">
                        <h4>Room {room.roomNumber}</h4>
                        <span className="room-type">{room.roomType}</span>
                      </div>
                      <div className="room-details">
                        <p className="price">${room.pricePerNight}/night</p>
                        <div className="amenities">
                          {room.amenities.map((amenity, index) => (
                            <span key={index} className="amenity-tag">{amenity}</span>
                          ))}
                        </div>
                      </div>
                      <button 
                        className="btn btn-primary select-room-btn"
                        onClick={() => handleSelectRoom(room)}
                      >
                        Select Room
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="booking-step">
            <h2>Guest Information</h2>
            
            {selectedRoom && (
              <div className="selected-room-summary">
                <h3>Selected Room: {selectedRoom.roomNumber} ({selectedRoom.roomType})</h3>
                <p>{searchCriteria.checkInDate} to {searchCriteria.checkOutDate} ({bookingSummary.totalNights} nights)</p>
              </div>
            )}
            
            <div className="guest-form">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    value={guestInfo.firstName}
                    onChange={(e) => setGuestInfo(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    value={guestInfo.lastName}
                    onChange={(e) => setGuestInfo(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={guestInfo.email}
                    onChange={(e) => setGuestInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
                <div className="form-group">
                  <label>Phone *</label>
                  <input
                    type="tel"
                    value={guestInfo.phone}
                    onChange={(e) => setGuestInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Address</label>
                <textarea
                  value={guestInfo.address}
                  onChange={(e) => setGuestInfo(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter address"
                  rows="2"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>ID Type</label>
                  <select
                    value={guestInfo.idType}
                    onChange={(e) => setGuestInfo(prev => ({ ...prev, idType: e.target.value }))}
                  >
                    <option value="nid">National ID</option>
                    <option value="passport">Passport</option>
                    <option value="driving_license">Driving License</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>ID Number</label>
                  <input
                    type="text"
                    value={guestInfo.idNumber}
                    onChange={(e) => setGuestInfo(prev => ({ ...prev, idNumber: e.target.value }))}
                    placeholder="Enter ID number"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Special Requests</label>
                <textarea
                  value={guestInfo.specialRequests}
                  onChange={(e) => setGuestInfo(prev => ({ ...prev, specialRequests: e.target.value }))}
                  placeholder="Any special requests or notes"
                  rows="3"
                />
              </div>
            </div>
            
            <div className="step-actions">
              <button className="btn btn-secondary" onClick={() => setCurrentStep(1)}>
                Back to Room Selection
              </button>
              <button className="btn btn-primary" onClick={handleProceedToInvoice}>
                Create Invoice
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="booking-step">
            <h2>Create Invoice</h2>
            
            {/* Customer Information */}
            <div className="form-section">
              <h3>Customer Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Customer Name</label>
                  <input 
                    type="text" 
                    value={invoice.customerInfo.name}
                    onChange={(e) => setInvoice(prev => ({
                      ...prev, 
                      customerInfo: { ...prev.customerInfo, name: e.target.value }
                    }))}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input 
                    type="email" 
                    value={invoice.customerInfo.email}
                    onChange={(e) => setInvoice(prev => ({
                      ...prev, 
                      customerInfo: { ...prev.customerInfo, email: e.target.value }
                    }))}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input 
                    type="tel" 
                    value={invoice.customerInfo.phone}
                    onChange={(e) => setInvoice(prev => ({
                      ...prev, 
                      customerInfo: { ...prev.customerInfo, phone: e.target.value }
                    }))}
                  />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <textarea 
                    value={invoice.customerInfo.address}
                    onChange={(e) => setInvoice(prev => ({
                      ...prev, 
                      customerInfo: { ...prev.customerInfo, address: e.target.value }
                    }))}
                    rows="2"
                  />
                </div>
              </div>
            </div>

            {/* Room Booking Details */}
            <div className="form-section">
              <h3>Room Booking Details</h3>
              {invoice.items.map((item, index) => (
                <div key={item.id} className="room-booking-card">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Room</label>
                      <input 
                        type="text" 
                        value={`${item.roomNumber} - ${item.roomType}`}
                        readOnly 
                        className="readonly-field"
                      />
                    </div>
                    <div className="form-group">
                      <label>Guests</label>
                      <input 
                        type="number" 
                        min="1"
                        value={item.guestCount}
                        onChange={(e) => updateItem(item.id, 'guestCount', parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Check-in Date</label>
                      <input 
                        type="date" 
                        value={item.checkInDate}
                        onChange={(e) => updateItem(item.id, 'checkInDate', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Check-out Date</label>
                      <input 
                        type="date" 
                        value={item.checkOutDate}
                        onChange={(e) => updateItem(item.id, 'checkOutDate', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Nights</label>
                      <input 
                        type="text" 
                        value={`${item.totalNights} nights`}
                        readOnly 
                        className="readonly-field"
                      />
                    </div>
                    <div className="form-group">
                      <label>Price per Night</label>
                      <input 
                        type="text" 
                        value={`$${item.perNightCost.toFixed(2)}`}
                        readOnly 
                        className="readonly-field"
                      />
                    </div>
                    <div className="form-group">
                      <label>Discount %</label>
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        value={item.discountPercentage}
                        onChange={(e) => updateItem(item.id, 'discountPercentage', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Amount</label>
                      <input 
                        type="text" 
                        value={`$${item.amount.toFixed(2)}`}
                        readOnly 
                        className="readonly-field"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Charges */}
            <div className="form-section">
              <div className="section-header">
                <h3>Additional Charges</h3>
                <button type="button" className="btn btn-secondary" onClick={addAdditionalCharge}>
                  <Plus size={16} />
                  Add Charge
                </button>
              </div>
              
              {invoice.additionalCharges.map((charge) => (
                <div key={charge.id} className="form-row">
                  <div className="form-group">
                    <label>Description</label>
                    <input 
                      type="text" 
                      value={charge.description}
                      onChange={(e) => updateAdditionalCharge(charge.id, 'description', e.target.value)}
                      placeholder="Service description"
                    />
                  </div>
                  <div className="form-group">
                    <label>Amount</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={charge.amount}
                      onChange={(e) => updateAdditionalCharge(charge.id, 'amount', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <button 
                      type="button" 
                      className="btn btn-danger" 
                      onClick={() => removeAdditionalCharge(charge.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Section */}
            <div className="form-section">
              <div className="section-header">
                <h3>Payments</h3>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowPaymentForm(!showPaymentForm)}
                >
                  <Plus size={16} />
                  Add Payment
                </button>
              </div>

              {showPaymentForm && (
                <div className="payment-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Amount</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="form-group">
                      <label>Method</label>
                      <select 
                        value={paymentForm.method}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, method: e.target.value }))}
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="mobile_payment">Mobile Payment</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <input 
                        type="text" 
                        value={paymentForm.description}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Payment description"
                      />
                    </div>
                    <div className="form-group">
                      <button type="button" className="btn btn-primary" onClick={addPayment}>
                        Add Payment
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {invoice.payments.map((payment) => (
                <div key={payment.id} className="payment-item">
                  <span>{payment.method}</span>
                  <span>${payment.amount.toFixed(2)}</span>
                  <span>{payment.description}</span>
                  <button 
                    type="button" 
                    className="btn btn-danger" 
                    onClick={() => removePayment(payment.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Invoice Summary */}
            <div className="form-section">
              <h3>Invoice Summary</h3>
              <div className="invoice-summary">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>${invoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Additional Charges:</span>
                  <span>${invoice.additionalTotal.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Tax ({invoice.taxRate}%):</span>
                  <span>${invoice.tax.toFixed(2)}</span>
                </div>
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>${invoice.total.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Total Paid:</span>
                  <span>${invoice.totalPaid.toFixed(2)}</span>
                </div>
                <div className="summary-row due">
                  <span>Amount Due:</span>
                  <span>${invoice.dueAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="step-actions">
              <button className="btn btn-secondary" onClick={() => setCurrentStep(2)}>
                Back to Guest Info
              </button>
              <button 
                className="btn btn-success" 
                onClick={saveInvoice}
                disabled={loading}
              >
                <Save size={20} />
                {loading ? 'Saving...' : 'Save Invoice'}
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="booking-step success-step">
            <div className="success-icon">
              <Check size={60} />
            </div>
            <h2>Invoice Created Successfully!</h2>
            <p>Your booking invoice has been successfully created and saved.</p>
            
            <div className="booking-confirmation">
              <h3>Invoice Details</h3>
              <div className="confirmation-details">
                <p><strong>Invoice ID:</strong> {invoice.id}</p>
                <p><strong>Customer:</strong> {invoice.customerInfo.name}</p>
                <p><strong>Room:</strong> {selectedRoom?.roomNumber} ({selectedRoom?.roomType})</p>
                <p><strong>Check-in:</strong> {searchCriteria.checkInDate}</p>
                <p><strong>Check-out:</strong> {searchCriteria.checkOutDate}</p>
                <p><strong>Total Amount:</strong> ${invoice.total.toFixed(2)}</p>
                <p><strong>Amount Paid:</strong> ${invoice.totalPaid.toFixed(2)}</p>
                <p><strong>Amount Due:</strong> ${invoice.dueAmount.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="step-actions">
              <button className="btn btn-primary" onClick={() => {
                generateInvoicePDF(invoice);
              }}>
                <Download size={20} />
                Download Invoice PDF
              </button>
              <button className="btn btn-secondary" onClick={() => window.location.href = '/invoices'}>
                View All Invoices
              </button>
              <button className="btn btn-success" onClick={() => window.location.reload()}>
                Create New Booking
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Check if user can create bookings
  if (!canPerformAction('create_booking') && !canPerformAction('manage_bookings')) {
    return (
      <div className="create-booking">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You don't have permission to create bookings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="create-booking">
      <div className="page-header">
        <h1>Create New Booking</h1>
        
        {/* Progress Steps */}
        <div className="booking-steps">
          <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Room Selection</span>
          </div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Guest Information</span>
          </div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Invoice Creation</span>
          </div>
          <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>
            <span className="step-number">4</span>
            <span className="step-label">Confirmation</span>
          </div>
        </div>
      </div>

      <div className="booking-content">
        {renderStepContent()}
      </div>
    </div>
  );
};

export default CreateBooking;