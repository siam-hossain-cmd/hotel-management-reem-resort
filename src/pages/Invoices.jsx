import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Trash2, Download, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { generateInvoicePDF, previewInvoice } from '../utils/pdfGenerator';
import { api } from '../services/api';

const Invoices = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);
  const [accessDeniedAction, setAccessDeniedAction] = useState('');
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const { canPerformAction, user, hasPermission } = useAuth();

  // Initialize invoices with state management - load from database
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load invoices when component mounts
  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const result = await api.getInvoices();
      console.log('🔍 Frontend - API Result:', result);
      console.log('🔍 Frontend - First invoice data:', result.invoices?.[0]);
      
      if (result.success) {
        // Transform database data to match component expectations
        const transformedInvoices = result.invoices.map(invoice => {
          console.log('📝 Transforming invoice:', {
            id: invoice.id,
            invoice_number: invoice.invoice_number,
            first_name: invoice.first_name,
            last_name: invoice.last_name
          });
          
          return {
            id: invoice.id,
            invoiceRef: invoice.invoice_number || invoice.booking_reference || `INV-${invoice.id}`,
            guestName: `${invoice.first_name || ''} ${invoice.last_name || ''}`.trim() || 'Unknown Guest',
            amount: parseFloat(invoice.total || 0),
            dueAmount: parseFloat(invoice.due || 0),
            status: invoice.status || 'issued',
            issueDate: invoice.issued_at ? new Date(invoice.issued_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            booking_id: invoice.booking_id,
            customer_id: invoice.customer_id,
            fullData: invoice // Keep full invoice data for operations
          };
        });
        console.log('✅ Transformed invoices:', transformedInvoices);
        setInvoices(transformedInvoices);
      } else {
        console.error('Failed to load invoices:', result.error);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoiceRef.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || invoice.status.toLowerCase() === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleDeleteClick = (invoice) => {
    // Check if user has permission to delete invoices
    if (!hasPermission('delete_invoice')) {
      setAccessDeniedAction('delete');
      setShowAccessDeniedModal(true);
      return;
    }
    
    setInvoiceToDelete(invoice);
    setShowDeleteModal(true);
  };

  const handleCreateInvoiceClick = () => {
    // Check if user has permission to create invoices
    if (!hasPermission('create_invoice')) {
      setAccessDeniedAction('create');
      setShowAccessDeniedModal(true);
      return;
    }
    
    // Navigate to create invoice page
    window.location.href = '/create-invoice';
  };

  const handleCloseAccessDenied = () => {
    setShowAccessDeniedModal(false);
    setAccessDeniedAction('');
  };

  const handleConfirmDelete = async () => {
    if (invoiceToDelete) {
      try {
        // Call backend API to delete invoice
        const result = await api.deleteInvoice(invoiceToDelete.id);
        
        if (result.success) {
          // Remove from local state after successful deletion
          setInvoices(prevInvoices => 
            prevInvoices.filter(invoice => invoice.id !== invoiceToDelete.id)
          );
          console.log('✅ Invoice deleted successfully:', invoiceToDelete.id);
        } else {
          alert('Error deleting invoice: ' + (result.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Error deleting invoice: ' + (error.message || 'Unknown error'));
      } finally {
        setShowDeleteModal(false);
        setInvoiceToDelete(null);
      }
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setInvoiceToDelete(null);
  };

  const canDeleteInvoice = (invoice) => {
    // Only MasterAdmin can delete invoices, or if user created the invoice
    return canPerformAction('delete_invoice') || 
           (invoice.adminName === user?.name && canPerformAction('edit_invoice'));
  };

  const handleView = async (invoice) => {
    try {
      // Fetch full invoice data from backend
      const result = await api.getInvoiceById(invoice.id);
      if (result.success && result.invoice) {
        // Transform the invoice data to match PDF generator format
        const transformedInvoice = transformInvoiceData(result.invoice);
        console.log('✅ TRANSFORMED INVOICE FOR PDF:', transformedInvoice);
        previewInvoice(transformedInvoice);
      } else {
        alert('Failed to load invoice details: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
      alert('Failed to load invoice details. Please try again.');
    }
  };

  const handleDownload = async (invoice) => {
    try {
      // Fetch full invoice data from backend
      const result = await api.getInvoiceById(invoice.id);
      if (result.success && result.invoice) {
        // Transform the invoice data to match PDF generator format
        const transformedInvoice = transformInvoiceData(result.invoice);
        const success = await generateInvoicePDF(transformedInvoice);
        if (!success) {
          alert('Failed to generate PDF. Please try again.');
        }
      } else {
        alert('Failed to load invoice details: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Transform invoice data from API to match PDF generator format
  const transformInvoiceData = (invoice) => {
    console.log('🔍 RAW INVOICE DATA:', invoice);
    
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
    
    const finalTotal = parseFloat(invoice.total || invoice.booking_total || 0);

    return {
      id: invoice.invoice_number || `INV-${invoice.id}`,
      invoice_number: invoice.invoice_number || `INV-${invoice.id}`,
      booking_id: invoice.booking_id,
      booking_reference: invoice.booking_reference,
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
      total: parseFloat(invoice.total || finalTotal),
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

  const handleEdit = (invoice) => {
    const realInvoice = invoice.fullData;
    if (realInvoice) {
      // Store invoice data in localStorage for editing
      localStorage.setItem('invoiceToEdit', JSON.stringify({
        id: invoice.id,
        ...realInvoice
      }));
      
      // Navigate to CreateInvoice page
      window.location.href = '/create-invoice?mode=edit&id=' + invoice.id;
      console.log('Navigating to edit invoice:', invoice.id);
    } else {
      alert('Invoice data not available for editing.');
      console.error('No fullData available for invoice:', invoice);
    }
  };

  return (
    <div className="invoices-page">
      <div className="page-header">
        <h1>Invoices</h1>
        <button onClick={handleCreateInvoiceClick} className="btn btn-primary">
          <Plus size={20} />
          Create Invoice
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading invoices...</p>
        </div>
      ) : (
        <>
          <div className="filters">
            <div className="search-box">
              <Search size={20} />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-dropdown">
          <Filter size={20} />
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      <div className="invoices-table">
        <div className="table-header">
          <div>Invoice Ref No</div>
          <div>Guest Name</div>
          <div>Amount</div>
          <div>Due Amount</div>
          <div>Status</div>
          <div>Issue Date</div>
          <div>Actions</div>
        </div>
        
        {filteredInvoices.map((invoice) => (
          <div key={invoice.id} className="table-row">
            <div className="invoice-id">{invoice.invoiceRef}</div>
            <div className="customer-name">{invoice.guestName}</div>
            <div className="amount">৳{invoice.amount.toFixed(2)}</div>
            <div className="amount" style={{ color: invoice.dueAmount > 0 ? '#ef4444' : '#10b981' }}>
              ৳{invoice.dueAmount.toFixed(2)}
            </div>
            <div>
              <span className={`status-badge ${invoice.status.toLowerCase()}`}>
                {invoice.status.toUpperCase()}
              </span>
            </div>
            <div className="date-cell">{invoice.issueDate}</div>
            <div className="actions">
              <button className="action-btn view" title="View Invoice" onClick={() => handleView(invoice)}>
                <Eye size={16} />
              </button>
              <button 
                className="action-btn download" 
                title="Download PDF"
                onClick={() => handleDownload(invoice)}
              >
                <Download size={16} />
              </button>
              <button 
                className="action-btn delete" 
                title="Delete Invoice"
                onClick={() => handleDeleteClick(invoice)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredInvoices.length === 0 && (
        <div className="empty-state">
          <p>No invoices found matching your criteria.</p>
        </div>
      )}
      </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <AlertTriangle size={24} className="warning-icon" />
              <h3>Confirm Delete</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this invoice?</p>
              <div className="invoice-details">
                <strong>Invoice Ref:</strong> {invoiceToDelete?.invoiceRef}<br />
                <strong>Guest:</strong> {invoiceToDelete?.guestName}<br />
                <strong>Amount:</strong> ৳{invoiceToDelete?.amount?.toFixed(2) || '0.00'}<br />
                <strong>Due:</strong> ৳{invoiceToDelete?.dueAmount?.toFixed(2) || '0.00'}
              </div>
              <p className="warning-text">
                <strong>Warning:</strong> This action cannot be undone.
              </p>
            </div>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary" 
                onClick={handleCancelDelete}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleConfirmDelete}
              >
                <Trash2 size={16} />
                Delete Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Access Denied Modal */}
      {showAccessDeniedModal && (
        <div className="modal-overlay">
          <div className="access-denied-modal">
            <div className="access-denied-header">
              <AlertTriangle size={48} className="access-denied-icon" />
              <h2>Access Denied</h2>
            </div>
            <div className="access-denied-body">
              <p className="access-denied-message">
                You do not have permission to {accessDeniedAction} invoices.
              </p>
              <div className="access-denied-info">
                <p><strong>Your Role:</strong> {user?.role || 'Unknown'}</p>
                <p><strong>Required Permission:</strong> MasterAdmin or FullAdmin</p>
              </div>
              <p className="access-denied-contact">
                Please contact your Manager or Administrator if you need access to this feature.
              </p>
            </div>
            <div className="access-denied-actions">
              <button 
                className="btn btn-primary" 
                onClick={handleCloseAccessDenied}
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;