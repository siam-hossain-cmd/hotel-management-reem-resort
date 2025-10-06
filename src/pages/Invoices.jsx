import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2, Download, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { generateInvoicePDF, previewInvoice } from '../utils/pdfGenerator';
import { invoiceService } from '../firebase/invoiceService';

const Invoices = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const { canPerformAction, user } = useAuth();

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
      const result = await invoiceService.getAllInvoices();
      if (result.success) {
        // Transform database data to match component expectations
        const transformedInvoices = result.invoices.map(invoice => ({
          id: invoice.id,
          customer: invoice.customerInfo?.name || 'Unknown Customer',
          amount: `৳${invoice.total?.toFixed(2) || '0.00'}`,
          status: invoice.status || 'created',
          date: invoice.invoiceDate || new Date().toISOString().split('T')[0],
          dueDate: invoice.dueDate || '',
          adminName: invoice.adminName || 'Unknown Admin',
          fullData: invoice // Keep full invoice data for operations
        }));
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
    const matchesSearch = invoice.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || invoice.status.toLowerCase() === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleDeleteClick = (invoice) => {
    setInvoiceToDelete(invoice);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (invoiceToDelete) {
      try {
        // Delete from Firebase database
        const result = await invoiceService.deleteInvoice(invoiceToDelete.id);
        
        if (result.success) {
          // Update local state only if database deletion was successful
          setInvoices(prevInvoices => 
            prevInvoices.filter(invoice => invoice.id !== invoiceToDelete.id)
          );
          console.log('✅ Invoice deleted from database:', invoiceToDelete.id);
          alert('Invoice deleted successfully!');
        } else {
          console.error('Failed to delete invoice:', result.error);
          alert('Failed to delete invoice: ' + result.error);
        }
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Error deleting invoice: ' + error.message);
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

  const handleView = (invoice) => {
    // Use the real invoice data from database
    const realInvoice = invoice.fullData;
    if (realInvoice) {
      previewInvoice(realInvoice);
    } else {
      alert('Invoice data not available for preview.');
      console.error('No fullData available for invoice:', invoice);
    }
  };

  const handleDownload = async (invoice) => {
    try {
      // Use the real invoice data from database
      const realInvoice = invoice.fullData;
      if (realInvoice) {
        const success = await generateInvoicePDF(realInvoice);
        if (success) {
          console.log('PDF downloaded successfully');
        } else {
          alert('Failed to generate PDF. Please try again.');
        }
      } else {
        alert('Invoice data not available for download.');
        console.error('No fullData available for invoice:', invoice);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
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
        {canPerformAction('create_invoice') && (
          <Link to="/create-invoice" className="btn btn-primary">
            <Plus size={20} />
            Create Invoice
          </Link>
        )}
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
                <button 
                  className="action-btn" 
                  title="Edit"
                  onClick={() => handleEdit(invoice)}
                >
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