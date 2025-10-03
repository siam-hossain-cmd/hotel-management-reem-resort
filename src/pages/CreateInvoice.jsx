import React, { useState } from 'react';
import { Save, Send, Plus, Trash2, Eye, Download } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { generateInvoicePDF, previewInvoice } from '../utils/pdfGenerator';

const CreateInvoice = () => {
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
    adminName: 'Admin User', // Default admin name - can be updated based on logged-in user
    items: [
      { 
        id: uuidv4(), 
        roomNumber: '', 
        checkInDate: '', 
        checkOutDate: '', 
        totalNights: 0,
        perNightCost: 0, 
        guestCount: 1,
        amount: 0 
      }
    ],
    additionalCharges: [],
    payments: [],
    notes: '',
    terms: 'Payment is due within 30 days',
    subtotal: 0,
    additionalTotal: 0,
    tax: 0,
    taxRate: 10,
    total: 0,
    totalPaid: 0,
    dueAmount: 0
  });

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'cash',
    description: ''
  });

  const addItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, { 
        id: uuidv4(), 
        roomNumber: '', 
        checkInDate: '', 
        checkOutDate: '', 
        totalNights: 0,
        perNightCost: 0, 
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
          
          // Calculate amount based on nights and per night cost
          if (field === 'totalNights' || field === 'perNightCost' || field === 'checkInDate' || field === 'checkOutDate') {
            updatedItem.amount = updatedItem.totalNights * updatedItem.perNightCost;
          }
          
          return updatedItem;
        }
        return item;
      });
      
      return { ...prev, items: updatedItems };
    });
  };

  const calculateTotals = () => {
    const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
    const additionalTotal = invoice.additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
    const tax = ((subtotal + additionalTotal) * invoice.taxRate) / 100;
    const total = subtotal + additionalTotal + tax;
    const totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const dueAmount = total - totalPaid;
    
    setInvoice(prev => ({
      ...prev,
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

  const handleSave = () => {
    console.log('Saving invoice:', invoice);
    // Handle save logic here
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

  return (
    <div className="create-invoice">
      <div className="page-header">
        <h1>Create New Invoice</h1>
        <div className="actions">
          <button className="btn btn-secondary" onClick={handlePreview}>
            <Eye size={20} />
            Preview
          </button>
          <button className="btn btn-secondary" onClick={handleDownloadPDF}>
            <Download size={20} />
            Download PDF
          </button>
          <button className="btn btn-secondary" onClick={handleSave}>
            <Save size={20} />
            Save Draft
          </button>
          <button className="btn btn-primary" onClick={handleSend}>
            <Send size={20} />
            Send Invoice
          </button>
        </div>
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
              <label>Created By (Admin)</label>
              <input 
                type="text" 
                placeholder="Admin name"
                value={invoice.adminName}
                onChange={(e) => setInvoice(prev => ({ ...prev, adminName: e.target.value }))}
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
          
          <div className="items-table">
            <div className="table-header hotel-header">
              <div>Room Number</div>
              <div>Check-in Date</div>
              <div>Check-out Date</div>
              <div>Total Nights</div>
              <div>Guests</div>
              <div>Per Night Cost</div>
              <div>Total Amount</div>
              <div>Actions</div>
            </div>
            
            {invoice.items.map((item) => (
              <div key={item.id} className="table-row hotel-row">
                <div className="form-group">
                  <input 
                    type="text" 
                    placeholder="Room 101"
                    value={item.roomNumber}
                    onChange={(e) => updateItem(item.id, 'roomNumber', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <input 
                    type="date" 
                    value={item.checkInDate}
                    onChange={(e) => updateItem(item.id, 'checkInDate', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <input 
                    type="date" 
                    value={item.checkOutDate}
                    onChange={(e) => updateItem(item.id, 'checkOutDate', e.target.value)}
                  />
                </div>
                <div className="nights-display">
                  {item.totalNights} {item.totalNights === 1 ? 'night' : 'nights'}
                </div>
                <div className="form-group">
                  <input 
                    type="number" 
                    min="1"
                    value={item.guestCount}
                    onChange={(e) => updateItem(item.id, 'guestCount', parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="form-group">
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    value={item.perNightCost}
                    onChange={(e) => updateItem(item.id, 'perNightCost', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="amount">
                  ৳{item.amount.toFixed(2)}
                </div>
                <div className="actions">
                  {invoice.items.length > 1 && (
                    <button 
                      className="action-btn delete" 
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
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
              <span>Room Charges:</span>
              <span>৳{invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.additionalTotal > 0 && (
              <div className="total-row">
                <span>Additional Charges:</span>
                <span>৳{invoice.additionalTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="total-row">
              <span>VAT ({invoice.taxRate}%):</span>
              <span>৳{invoice.tax.toFixed(2)}</span>
            </div>
            <div className="total-row total">
              <span>Total Amount:</span>
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
      </div>
    </div>
  );
};

export default CreateInvoice;