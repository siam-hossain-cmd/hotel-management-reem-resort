import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Mail, Phone, MapPin, CreditCard, Calendar, Users } from 'lucide-react';
import { api } from '../services/api';

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    nid: ''
  });

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const result = await api.getCustomers();
      if (result.success) {
        setCustomers(result.customers);
      } else {
        console.error('Failed to load customers:', result.error);
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    `${customer.first_name} ${customer.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (customer.phone && customer.phone.includes(searchTerm)) ||
    (customer.nid && customer.nid.includes(searchTerm))
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingCustomer) {
        // Update functionality would go here
        console.log('Update customer:', formData);
        alert('Customer update functionality not yet implemented');
      } else {
        const result = await api.createCustomer(formData);
        if (result.success) {
          loadCustomers(); // Refresh the list
          setShowForm(false);
          setFormData({
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            address: '',
            nid: ''
          });
        } else {
          alert('Error creating customer: ' + result.error);
        }
      }
    } catch (error) {
      console.error('Error submitting customer:', error);
      alert('Failed to save customer');
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      first_name: customer.first_name || '',
      last_name: customer.last_name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      nid: customer.nid || ''
    });
    setShowForm(true);
  };

  const handleDelete = (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      console.log('Delete customer:', customerId);
      alert('Customer delete functionality not yet implemented');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
      nid: ''
    });
    setEditingCustomer(null);
    setShowForm(false);
  };

  return (
    <div className="customers-page">
      <div className="page-header">
        <h1>Customers</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowForm(true)}
        >
          <Plus size={20} />
          Add Customer
        </button>
      </div>

      <div className="filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search customers by name, email, phone, or NID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading customers...</div>
      ) : (
        <div className="customers-grid">
          {filteredCustomers.length === 0 ? (
            <div className="no-data">
              <p>No customers found</p>
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <div key={customer.id} className="customer-card">
                <div className="customer-header">
                  <h3>{customer.first_name} {customer.last_name}</h3>
                  <div className="customer-actions">
                    <button 
                      className="btn-icon" 
                      onClick={() => handleEdit(customer)}
                      title="Edit Customer"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className="btn-icon delete" 
                      onClick={() => handleDelete(customer.id)}
                      title="Delete Customer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="customer-details">
                  {customer.email && (
                    <div className="detail-item">
                      <Mail size={14} />
                      <span>{customer.email}</span>
                    </div>
                  )}
                  
                  {customer.phone && (
                    <div className="detail-item">
                      <Phone size={14} />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  
                  {customer.address && (
                    <div className="detail-item">
                      <MapPin size={14} />
                      <span>{customer.address}</span>
                    </div>
                  )}
                  
                  {customer.nid && (
                    <div className="detail-item">
                      <CreditCard size={14} />
                      <span>NID: {customer.nid}</span>
                    </div>
                  )}
                </div>
                
                <div className="customer-stats">
                  <div className="stat">
                    <Users size={14} />
                    <span>{customer.total_bookings || 0} Bookings</span>
                  </div>
                  
                  <div className="stat">
                    <Calendar size={14} />
                    <span>Joined: {formatDate(customer.created_at)}</span>
                  </div>
                  
                  {customer.last_visit && (
                    <div className="stat">
                      <Calendar size={14} />
                      <span>Last Visit: {formatDate(customer.last_visit)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add/Edit Customer Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
              <button className="modal-close" onClick={resetForm}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="customer-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="first_name">First Name *</label>
                  <input
                    type="text"
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="last_name">Last Name *</label>
                  <input
                    type="text"
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone">Phone *</label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="form-group full-width">
                  <label htmlFor="address">Address</label>
                  <textarea
                    id="address"
                    rows="3"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Complete address"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="nid">NID Number</label>
                  <input
                    type="text"
                    id="nid"
                    value={formData.nid}
                    onChange={(e) => setFormData(prev => ({ ...prev, nid: e.target.value }))}
                    placeholder="National ID Number"
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCustomer ? 'Update Customer' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .customers-page {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .page-header h1 {
          margin: 0;
          color: #1f2937;
          font-size: 2rem;
          font-weight: 600;
        }
        
        .filters {
          margin-bottom: 24px;
        }
        
        .search-box {
          position: relative;
          max-width: 400px;
        }
        
        .search-box svg {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #6b7280;
        }
        
        .search-box input {
          width: 100%;
          padding: 12px 12px 12px 40px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
        }
        
        .customers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }
        
        .customer-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .customer-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .customer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .customer-header h3 {
          margin: 0;
          color: #1f2937;
          font-size: 18px;
          font-weight: 600;
        }
        
        .customer-actions {
          display: flex;
          gap: 8px;
        }
        
        .btn-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          background: #f3f4f6;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .btn-icon:hover {
          background: #e5e7eb;
        }
        
        .btn-icon.delete:hover {
          background: #fee2e2;
          color: #dc2626;
        }
        
        .customer-details {
          margin-bottom: 16px;
        }
        
        .detail-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          color: #4b5563;
          font-size: 14px;
        }
        
        .customer-stats {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }
        
        .stat {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #6b7280;
        }
        
        .loading, .no-data {
          text-align: center;
          padding: 40px;
          color: #6b7280;
        }
        
        .btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-primary {
          background: #059669;
          color: white;
        }
        
        .btn-primary:hover {
          background: #047857;
        }
        
        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
        }
        
        .btn-secondary:hover {
          background: #e5e7eb;
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-content {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .modal-header h2 {
          margin: 0;
          color: #1f2937;
          font-size: 20px;
        }
        
        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6b7280;
        }
        
        .customer-form {
          padding: 20px;
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
        }
        
        .form-group.full-width {
          grid-column: 1 / -1;
        }
        
        .form-group label {
          margin-bottom: 6px;
          font-weight: 500;
          color: #374151;
        }
        
        .form-group input,
        .form-group textarea {
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }
        
        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #059669;
          box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        
        @media (max-width: 768px) {
          .customers-grid {
            grid-template-columns: 1fr;
          }
          
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Customers;