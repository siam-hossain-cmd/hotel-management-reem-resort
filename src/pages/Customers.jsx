import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Mail, Phone } from 'lucide-react';

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  
  const [customers, setCustomers] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCustomer) {
      setCustomers(prev => prev.map(customer => 
        customer.id === editingCustomer.id 
          ? { ...customer, ...formData }
          : customer
      ));
    } else {
      const newCustomer = {
        id: Date.now(),
        ...formData,
        totalInvoices: 0,
        totalAmount: 0
      };
      setCustomers(prev => [...prev, newCustomer]);
    }
    setShowForm(false);
    setEditingCustomer(null);
    setFormData({ name: '', email: '', phone: '', address: '' });
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address
    });
    setShowForm(true);
  };

  const handleDelete = (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      setCustomers(prev => prev.filter(customer => customer.id !== customerId));
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingCustomer(null);
    setFormData({ name: '', email: '', phone: '', address: '' });
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
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              
              <div className="form-group">
                <label>Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCustomer ? 'Update' : 'Add'} Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="customers-grid">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="customer-card">
            <div className="customer-header">
              <h3>{customer.name}</h3>
              <div className="customer-actions">
                <button 
                  className="action-btn" 
                  onClick={() => handleEdit(customer)}
                  title="Edit"
                >
                  <Edit size={16} />
                </button>
                <button 
                  className="action-btn delete" 
                  onClick={() => handleDelete(customer.id)}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="customer-info">
              <div className="info-item">
                <Mail size={16} />
                <span>{customer.email}</span>
              </div>
              <div className="info-item">
                <Phone size={16} />
                <span>{customer.phone}</span>
              </div>
              <div className="info-item address">
                <span>{customer.address}</span>
              </div>
            </div>
            
            <div className="customer-stats">
              <div className="stat">
                <span className="label">Total Invoices:</span>
                <span className="value">{customer.totalInvoices}</span>
              </div>
              <div className="stat">
                <span className="label">Total Amount:</span>
                <span className="value">${customer.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="empty-state">
          <p>{searchTerm ? 'No customers found matching your criteria.' : 'No customers added yet. Click "Add Customer" to get started.'}</p>
        </div>
      )}
    </div>
  );
};

export default Customers;