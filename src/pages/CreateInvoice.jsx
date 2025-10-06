import React, { useState, useEffect } from 'react';
import { Save, Send, Plus, Trash2, Eye, Download, Printer } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { generateInvoicePDF, previewInvoice, printInvoicePDF } from '../utils/pdfGenerator';
import { roomService } from '../firebase/roomService';
import { invoiceService } from '../firebase/invoiceService';
import { useAuth } from '../contexts/AuthContext';

const CreateInvoice = () => {
  const { user, isMasterAdmin } = useAuth();
  
  // Add loading state
  if (!user) {
    return (
      <div className="create-invoice">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading invoice form...</p>
        </div>
      </div>
    );
  }
  
  // Generate automatic admin name based on user role and info
  const getAdminName = () => {
    if (isMasterAdmin()) {
      return 'master_admin';
    } else {
      // For admin users, use admin_[name] format
      const userName = user?.name || user?.email?.split('@')[0] || 'admin';
      return `admin_${userName.toLowerCase().replace(/\s+/g, '_')}`;
    }
  };
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
    adminName: '', // Will be set automatically based on logged-in user
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
  
  // Set admin name automatically when component mounts or user changes
  useEffect(() => {
    if (user) {
      setInvoice(prev => ({
        ...prev,
        adminName: getAdminName()
      }));
    }
  }, [user]);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'cash',
    description: ''
  });

  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load rooms from Firebase on component mount
  useEffect(() => {
    const loadRooms = async () => {
      try {
        setLoading(true);
        const rooms = await roomService.getAllRooms();
        setAvailableRooms(rooms);
      } catch (error) {
        console.error('Error loading rooms:', error);
        alert('Failed to load room data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, []);

  const addItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, { 
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
      }]
    }));
  };

  const removeItem = (itemId) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
    calculateTotals();
  };

  const updateItem = (itemId, field, value) => {
    setInvoice(prev => {
      const updatedItems = prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          
          // Handle room selection
          if (field === 'roomNumber') {
            const selectedRoom = availableRooms.find(room => room.roomNumber === value);
            if (selectedRoom) {
              updatedItem.roomType = selectedRoom.roomType;
              updatedItem.perNightCost = selectedRoom.pricePerNight;
            } else {
              updatedItem.roomType = '';
              updatedItem.perNightCost = 0;
            }
          }
          
          // Calculate total nights if check-in or check-out date changes
          if (field === 'checkInDate' || field === 'checkOutDate') {
            if (updatedItem.checkInDate && updatedItem.checkOutDate) {
              const checkIn = new Date(updatedItem.checkInDate);
              const checkOut = new Date(updatedItem.checkOutDate);
              const diffTime = Math.abs(checkOut - checkIn);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              updatedItem.totalNights = diffDays > 0 ? diffDays : 1;
            }
          }
          
          // Calculate base amount
          const baseAmount = updatedItem.totalNights * updatedItem.perNightCost;
          
          // Calculate discount amount
          if (field === 'discountPercentage' || field === 'totalNights' || field === 'perNightCost' || 
              field === 'checkInDate' || field === 'checkOutDate' || field === 'roomNumber') {
            updatedItem.discountAmount = (baseAmount * updatedItem.discountPercentage) / 100;
          }
          
          // Calculate final amount after discount
          updatedItem.amount = baseAmount - updatedItem.discountAmount;
          
          return updatedItem;
        }
        return item;
      });
      
      return { ...prev, items: updatedItems };
    });
  };

  const calculateTotals = () => {
    // Calculate original amounts (before discount)
    const originalSubtotal = invoice.items.reduce((sum, item) => {
      return sum + (item.totalNights * item.perNightCost);
    }, 0);
    
    // Calculate total discount amount
    const totalDiscount = invoice.items.reduce((sum, item) => sum + item.discountAmount, 0);
    
    // Calculate subtotal after discount
    const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
    
    // Additional charges
    const additionalTotal = invoice.additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
    
    // Calculate VAT on discounted amount + additional charges
    const tax = ((subtotal + additionalTotal) * invoice.taxRate) / 100;
    
    // Final total
    const total = subtotal + additionalTotal + tax;
    
    // Payment calculations
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

  // Additional charges functions
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

  // Payment functions
  const addPayment = () => {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }
    
    const amount = parseFloat(paymentForm.amount);
    
    if (invoice.total <= 0) {
      alert('Please add room charges first to create an invoice before adding payments.');
      return;
    }
    
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

  React.useEffect(() => {
    calculateTotals();
  }, [invoice.items, invoice.additionalCharges, invoice.payments, invoice.taxRate]);

  const handleSave = async () => {
    try {
      console.log('Saving invoice to database:', invoice);
      
      // Clean the invoice data to remove undefined values and null values
      const cleanInvoiceData = (data) => {
        if (data === null || data === undefined) return null;
        if (typeof data !== 'object') return data;
        if (Array.isArray(data)) {
          return data.map(item => cleanInvoiceData(item)).filter(item => item !== null);
        }
        
        const cleaned = {};
        for (const [key, value] of Object.entries(data)) {
          if (value !== undefined && value !== null) {
            if (typeof value === 'object') {
              const cleanedValue = cleanInvoiceData(value);
              if (cleanedValue !== null && Object.keys(cleanedValue).length > 0) {
                cleaned[key] = cleanedValue;
              }
            } else {
              cleaned[key] = value;
            }
          }
        }
        return Object.keys(cleaned).length > 0 ? cleaned : null;
      };
      
      const cleanedInvoice = cleanInvoiceData(invoice);
      
      // Ensure required fields are present
      const invoiceToSave = {
        ...cleanedInvoice,
        id: invoice.id || `INV-${Date.now()}`,
        adminName: invoice.adminName || getAdminName(),
        customerInfo: {
          name: invoice.customerInfo?.name || '',
          email: invoice.customerInfo?.email || '',
          address: invoice.customerInfo?.address || '',
          phone: invoice.customerInfo?.phone || '',
          nid: invoice.customerInfo?.nid || ''
        },
        items: invoice.items?.map(item => ({
          id: item.id || uuidv4(),
          roomNumber: item.roomNumber || '',
          roomType: item.roomType || '',
          checkInDate: item.checkInDate || '',
          checkOutDate: item.checkOutDate || '',
          totalNights: item.totalNights || 0,
          perNightCost: item.perNightCost || 0,
          discountPercentage: item.discountPercentage || 0,
          discountAmount: item.discountAmount || 0,
          guestCount: item.guestCount || 1,
          amount: item.amount || 0
        })) || [],
        additionalCharges: invoice.additionalCharges || [],
        payments: invoice.payments || [],
        notes: invoice.notes || '',
        terms: invoice.terms || 'Payment is due within 30 days',
        originalSubtotal: invoice.originalSubtotal || 0,
        totalDiscount: invoice.totalDiscount || 0,
        subtotal: invoice.subtotal || 0,
        additionalTotal: invoice.additionalTotal || 0,
        tax: invoice.tax || 0,
        taxRate: invoice.taxRate || 10,
        total: invoice.total || 0,
        totalPaid: invoice.totalPaid || 0,
        dueAmount: invoice.dueAmount || 0,
        invoiceDate: invoice.invoiceDate || new Date().toISOString().split('T')[0],
        dueDate: invoice.dueDate || ''
      };
      
      console.log('Cleaned invoice data:', invoiceToSave);
      
      const result = await invoiceService.createInvoice(invoiceToSave);
      
      if (result.success) {
        alert('Invoice saved successfully!');
        console.log('Invoice saved with ID:', result.id);
        // Update the invoice ID with the database ID
        setInvoice(prev => ({ ...prev, dbId: result.id }));
        return true;
      } else {
        alert('Failed to save invoice: ' + result.error);
        console.error('Save failed:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Error occurred while saving invoice.');
      return false;
    }
  };

  const handleSend = () => {
    console.log('Sending invoice:', invoice);
    // Handle send logic here
  };

  const handlePreview = () => {
    previewInvoice(invoice);
  };

  const handleDownloadPDF = async () => {
    const success = await generateInvoicePDF(invoice);
    if (success) {
      console.log('PDF generated successfully');
    } else {
      console.error('Failed to generate PDF');
    }
  };

  const handleSaveAndPrint = async () => {
    try {
      // First save the invoice to database
      console.log('Saving invoice to database...');
      const saveSuccess = await handleSave();
      
      if (saveSuccess) {
        // Then print the PDF (not download)
        console.log('Printing invoice PDF...');
        const printSuccess = await printInvoicePDF(invoice);
        
        if (printSuccess) {
          console.log('Invoice saved and print dialog opened successfully');
        } else {
          alert('Invoice saved but failed to open print dialog. You can print from the invoice history.');
        }
      }
    } catch (error) {
      console.error('Error saving and printing:', error);
      alert('Error occurred while saving and printing. Please try again.');
    }
  };

  return (
    <div className="create-invoice">
      <div className="page-header">
        <h1>Create New Invoice</h1>
      </div>

      <div className="invoice-form">
        <div className="form-section">
          <h2>Invoice Details</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Invoice ID</label>
              <input type="text" value={invoice.id} readOnly />
            </div>
            <div className="form-group">
              <label>Invoice Date</label>
              <input 
                type="date" 
                value={invoice.invoiceDate}
                onChange={(e) => setInvoice(prev => ({ ...prev, invoiceDate: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input 
                type="date" 
                value={invoice.dueDate}
                onChange={(e) => setInvoice(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Created By (Admin) - Auto Assigned</label>
              <input 
                type="text" 
                placeholder="Auto-assigned based on logged-in user"
                value={invoice.adminName}
                readOnly
                className="readonly-field"
                title="This field is automatically set based on your login credentials"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Customer Information</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Customer Name</label>
              <input 
                type="text" 
                placeholder="Enter customer name"
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
                placeholder="customer@example.com"
                value={invoice.customerInfo.email}
                onChange={(e) => setInvoice(prev => ({
                  ...prev, 
                  customerInfo: { ...prev.customerInfo, email: e.target.value }
                }))}
              />
            </div>
            <div className="form-group">
              <label>NID Number</label>
              <input 
                type="text" 
                placeholder="National ID Number"
                value={invoice.customerInfo.nid}
                onChange={(e) => setInvoice(prev => ({
                  ...prev, 
                  customerInfo: { ...prev.customerInfo, nid: e.target.value }
                }))}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input 
                type="tel" 
                placeholder="Phone number"
                value={invoice.customerInfo.phone}
                onChange={(e) => setInvoice(prev => ({
                  ...prev, 
                  customerInfo: { ...prev.customerInfo, phone: e.target.value }
                }))}
              />
            </div>
            <div className="form-group full-width">
              <label>Address</label>
              <textarea 
                placeholder="Customer address"
                value={invoice.customerInfo.address}
                onChange={(e) => setInvoice(prev => ({
                  ...prev, 
                  customerInfo: { ...prev.customerInfo, address: e.target.value }
                }))}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <h2>Room Booking Details</h2>
            <button className="btn btn-secondary" onClick={addItem}>
              <Plus size={20} />
              Add Room
            </button>
          </div>
          
          <div className="room-booking-cards">
            {invoice.items.map((item, index) => (
              <div key={item.id} className="room-booking-card">
                <div className="card-header">
                  <h3>Room Booking #{index + 1}</h3>
                  {invoice.items.length > 1 && (
                    <button 
                      className="action-btn delete" 
                      onClick={() => removeItem(item.id)}
                      title="Remove Room"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="card-content">
                  <div className="room-selection-row">
                    <div className="form-group">
                      <label>Select Room</label>
                      {loading ? (
                        <input type="text" disabled value="Loading rooms..." />
                      ) : (
                        <select 
                          value={item.roomNumber}
                          onChange={(e) => updateItem(item.id, 'roomNumber', e.target.value)}
                        >
                          <option value="">Choose a room</option>
                          {availableRooms.map((room) => (
                            <option key={room.id} value={room.roomNumber}>
                              {room.roomNumber} - {room.roomType}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label>Room Type</label>
                      <input 
                        type="text" 
                        value={item.roomType || 'Select room first'} 
                        readOnly 
                        className="readonly-field"
                      />
                    </div>

                    <div className="form-group">
                      <label>Number of Guests</label>
                      <input 
                        type="number" 
                        min="1"
                        max="10"
                        value={item.guestCount}
                        onChange={(e) => updateItem(item.id, 'guestCount', parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>

                  <div className="dates-row">
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
                    
                    <div className="form-group">
                      <label>Total Nights</label>
                      <input 
                        type="text" 
                        value={`${item.totalNights} ${item.totalNights === 1 ? 'night' : 'nights'}`}
                        readOnly 
                        className="readonly-field"
                      />
                    </div>
                  </div>

                  <div className="pricing-row">
                    <div className="form-group">
                      <label>Original Price Per Night</label>
                      <input 
                        type="text" 
                        value={`৳${item.perNightCost.toFixed(2)}`}
                        readOnly 
                        className="readonly-field"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Discount Percentage</label>
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="0"
                        value={item.discountPercentage}
                        onChange={(e) => updateItem(item.id, 'discountPercentage', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Price After Discount Per Night</label>
                      <input 
                        type="text" 
                        value={`৳${(item.perNightCost * (1 - item.discountPercentage / 100)).toFixed(2)}`}
                        readOnly 
                        className="readonly-field discounted-price"
                      />
                    </div>
                  </div>

                  <div className="totals-row">
                    <div className="total-breakdown">
                      <div className="total-item">
                        <span className="label">Original Total:</span>
                        <span className="value original-total">৳{(item.totalNights * item.perNightCost).toFixed(2)}</span>
                      </div>
                      {item.discountPercentage > 0 && (
                        <div className="total-item">
                          <span className="label">Discount Amount:</span>
                          <span className="value discount-amount">-৳{item.discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="total-item final-total">
                        <span className="label">Final Total:</span>
                        <span className="value">৳{item.amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <h2>Additional Charges</h2>
            <button className="btn btn-secondary" onClick={addAdditionalCharge}>
              <Plus size={20} />
              Add Charge
            </button>
          </div>
          
          <div className="additional-charges">
            {invoice.additionalCharges.map((charge) => (
              <div key={charge.id} className="charge-row">
                <div className="form-group">
                  <input 
                    type="text" 
                    placeholder="Service fee, Cleaning charge, etc."
                    value={charge.description}
                    onChange={(e) => updateAdditionalCharge(charge.id, 'description', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    value={charge.amount}
                    onChange={(e) => updateAdditionalCharge(charge.id, 'amount', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="actions">
                  {invoice.additionalCharges.length > 1 && (
                    <button 
                      className="action-btn delete" 
                      onClick={() => removeAdditionalCharge(charge.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="totals-section">
          <div className="payment-section">
            <div className="section-header">
              <h3>Payment Tracking</h3>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  if (invoice.total <= 0) {
                    alert('Please add room charges first to create an invoice amount before adding payments.');
                    return;
                  }
                  setShowPaymentForm(!showPaymentForm);
                }}
              >
                <Plus size={16} />
                Add Payment
              </button>
            </div>
            
            {showPaymentForm && (
              <div className="payment-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Amount (৳)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Payment Method</label>
                    <select 
                      value={paymentForm.method}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, method: e.target.value }))}
                    >
                      <option value="cash">Cash</option>
                      <option value="credit_card">Credit Card</option>
                      <option value="debit_card">Debit Card</option>
                      <option value="online_transfer">Online Transfer</option>
                      <option value="mobile_banking">Mobile Banking</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group full-width">
                    <label>Description (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="Payment description"
                      value={paymentForm.description}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button className="btn btn-secondary" onClick={() => setShowPaymentForm(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={addPayment}>
                    Add Payment
                  </button>
                </div>
              </div>
            )}

            {invoice.payments.length > 0 && (
              <div className="payments-list">
                <h4>Payments Received</h4>
                {invoice.payments.map((payment) => (
                  <div key={payment.id} className="payment-item">
                    <div className="payment-info">
                      <span className="payment-amount">৳{payment.amount.toFixed(2)}</span>
                      <span className="payment-method">{payment.method.replace('_', ' ').toUpperCase()}</span>
                      <span className="payment-date">{new Date(payment.date).toLocaleDateString()}</span>
                      {payment.description && <span className="payment-desc">{payment.description}</span>}
                    </div>
                    <button 
                      className="action-btn delete" 
                      onClick={() => removePayment(payment.id)}
                      title="Remove Payment"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="totals">
            <div className="total-row">
              <span>Original Room Charges:</span>
              <span>৳{(invoice.originalSubtotal || 0).toFixed(2)}</span>
            </div>
            {(invoice.totalDiscount || 0) > 0 && (
              <div className="total-row discount">
                <span>Total Discount Applied:</span>
                <span className="discount-value">-৳{(invoice.totalDiscount || 0).toFixed(2)}</span>
              </div>
            )}
            <div className="total-row">
              <span>Room Charges After Discount:</span>
              <span>৳{invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.additionalTotal > 0 && (
              <div className="total-row">
                <span>Additional Charges:</span>
                <span>৳{invoice.additionalTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="total-row subtotal-before-vat">
              <span>Subtotal (Before VAT):</span>
              <span>৳{(invoice.subtotal + invoice.additionalTotal).toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>VAT ({invoice.taxRate}%):</span>
              <span>৳{invoice.tax.toFixed(2)}</span>
            </div>
            <div className="total-row total">
              <span>Final Total Amount:</span>
              <span>৳{invoice.total.toFixed(2)}</span>
            </div>
            <div className="total-row paid">
              <span>Total Paid:</span>
              <span>৳{invoice.totalPaid.toFixed(2)}</span>
            </div>
            <div className={`total-row due ${invoice.dueAmount > 0 ? 'amount-due' : 'paid-full'}`}>
              <span>Due Amount:</span>
              <span>৳{invoice.dueAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        {/* Action Buttons - Moved to bottom */}
        <div className="invoice-actions-bottom">
          <div className="actions-grid">
            <button className="btn btn-secondary" onClick={handlePreview}>
              <Eye size={20} />
              Preview Invoice
            </button>
            <button className="btn btn-secondary" onClick={handleDownloadPDF}>
              <Download size={20} />
              Download PDF
            </button>
            <button className="btn btn-success" onClick={handleSaveAndPrint}>
              <Printer size={20} />
              Create Invoice & Print
            </button>
            <button className="btn btn-primary" onClick={handleSend}>
              <Send size={20} />
              Send Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoice;