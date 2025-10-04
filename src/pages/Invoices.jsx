import React, { useState } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2, Download, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { generateInvoicePDF, previewInvoice } from '../utils/pdfGenerator';

const Invoices = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const { canPerformAction, user } = useAuth();

  // Initialize invoices with state management
  const [invoices, setInvoices] = useState([
    { 
      id: 'INV-001', 
      customer: 'John Doe', 
      amount: 1250, 
      status: 'Paid', 
      date: '2024-01-15', 
      dueDate: '2024-01-30', 
      checkInDate: '2024-01-10', 
      checkOutDate: '2024-01-12', 
      adminName: 'Admin User',
      roomNumber: '101',
      roomType: 'Deluxe Room'
    },
    { 
      id: 'INV-002', 
      customer: 'Jane Smith', 
      amount: 850, 
      status: 'Pending', 
      date: '2024-01-14', 
      dueDate: '2024-01-29', 
      checkInDate: '2024-01-15', 
      checkOutDate: '2024-01-16', 
      adminName: 'Admin User',
      roomNumber: '205',
      roomType: 'Standard Room'
    },
    { 
      id: 'INV-003', 
      customer: 'Bob Wilson', 
      amount: 2100, 
      status: 'Paid', 
      date: '2024-01-13', 
      dueDate: '2024-01-28', 
      checkInDate: '2024-01-18', 
      checkOutDate: '2024-01-20', 
      adminName: 'Manager',
      roomNumber: '301',
      roomType: 'Suite'
    }
  ]);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || invoice.status.toLowerCase() === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleDeleteClick = (invoice) => {
    setInvoiceToDelete(invoice);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (invoiceToDelete) {
      setInvoices(prevInvoices => 
        prevInvoices.filter(invoice => invoice.id !== invoiceToDelete.id)
      );
      console.log('✅ Invoice deleted:', invoiceToDelete.id);
      setShowDeleteModal(false);
      setInvoiceToDelete(null);
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

  const handleView = (invoice) => {
    // Create a mock invoice object for preview
    const mockInvoice = {
      id: invoice.id,
      customerInfo: {
        name: invoice.customer,
        email: 'customer@example.com',
        phone: '+1-555-0123',
        address: '123 Main St, City, State 12345'
      },
      invoiceDate: invoice.date,
      dueDate: invoice.dueDate,
      items: [
        { id: 1, description: 'Service/Product', quantity: 1, rate: invoice.amount, amount: invoice.amount }
      ],
      notes: '',
      terms: 'Payment is due within 30 days',
      subtotal: invoice.amount,
      tax: invoice.amount * 0.1,
      taxRate: 10,
      total: invoice.amount * 1.1
    };
    previewInvoice(mockInvoice);
  };

  const handleDownload = async (invoice) => {
    // Create a mock invoice object for PDF generation
    const mockInvoice = {
      id: invoice.id,
      customerInfo: {
        name: invoice.customer,
        email: 'customer@example.com',
        phone: '+1-555-0123',
        address: '123 Main St, City, State 12345'
      },
      invoiceDate: invoice.date,
      dueDate: invoice.dueDate,
      items: [
        { id: 1, description: 'Service/Product', quantity: 1, rate: invoice.amount, amount: invoice.amount }
      ],
      notes: '',
      terms: 'Payment is due within 30 days',
      subtotal: invoice.amount,
      tax: invoice.amount * 0.1,
      taxRate: 10,
      total: invoice.amount * 1.1
    };
    
    const success = await generateInvoicePDF(mockInvoice);
    if (!success) {
      alert('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div className="invoices-page">
      <div className="page-header">
        <h1>Invoices</h1>
        {canPerformAction('create_invoice') && (
          <Link to="/create-invoice" className="btn btn-primary">
            <Plus size={20} />
            Create Invoice
          </Link>
        )}
      </div>

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
          <div>Invoice ID</div>
          <div>Customer</div>
          <div>Amount</div>
          <div>Status</div>
          <div>Check-in Date</div>
          <div>Check-out Date</div>
          <div>Issue Date</div>
          <div>Due Date</div>
          <div>Admin Name</div>
          <div>Actions</div>
        </div>
        
        {filteredInvoices.map((invoice) => (
          <div key={invoice.id} className="table-row">
            <div className="invoice-id">{invoice.id}</div>
            <div>{invoice.customer}</div>
            <div className="amount">৳{invoice.amount.toLocaleString()}</div>
            <div>
              <span className={`status-badge ${invoice.status.toLowerCase()}`}>
                {invoice.status}
              </span>
            </div>
            <div>{invoice.checkInDate}</div>
            <div>{invoice.checkOutDate}</div>
            <div>{invoice.date}</div>
            <div>{invoice.dueDate}</div>
            <div>{invoice.adminName}</div>
            <div className="actions">
              <button className="action-btn" title="View" onClick={() => handleView(invoice)}>
                <Eye size={16} />
              </button>
              {canPerformAction('edit_invoice') && (
                <button className="action-btn" title="Edit">
                  <Edit size={16} />
                </button>
              )}
              <button 
                className="action-btn" 
                title="Download"
                onClick={() => handleDownload(invoice)}
              >
                <Download size={16} />
              </button>
              {canDeleteInvoice(invoice) && (
                <button 
                  className="action-btn delete" 
                  title="Delete Invoice"
                  onClick={() => handleDeleteClick(invoice)}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredInvoices.length === 0 && (
        <div className="empty-state">
          <p>No invoices found matching your criteria.</p>
        </div>
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
                <strong>Invoice ID:</strong> {invoiceToDelete?.id}<br />
                <strong>Customer:</strong> {invoiceToDelete?.customer}<br />
                <strong>Amount:</strong> ৳{invoiceToDelete?.amount.toLocaleString()}
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
    </div>
  );
};

export default Invoices;