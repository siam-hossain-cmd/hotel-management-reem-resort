import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Mail, Phone, MapPin, CreditCard, Calendar, Users, MoreVertical, Eye, X } from 'lucide-react';
import { api } from '../services/api';

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [customersWithBookings, setCustomersWithBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomerBookings, setSelectedCustomerBookings] = useState(null);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    nid: ''
  });

  // Load customers and their bookings on component mount
  useEffect(() => {
    loadCustomersWithBookings();
  }, []);

  const loadCustomersWithBookings = async () => {
    setLoading(true);
    try {
      // Load customers and bookings in parallel
      const [customersResult, bookingsResult] = await Promise.all([
        api.getCustomers(),
        api.getBookings()
      ]);

      if (customersResult.success && bookingsResult.success) {
        const customers = customersResult.customers;
        const bookings = bookingsResult.bookings;

        // Count active bookings for each customer
        const customersWithBookingCount = customers.map(customer => {
          const customerBookings = bookings.filter(
            booking => booking.customer_id === customer.id && 
            (booking.status === 'confirmed' || booking.status === 'checked_in')
          );
          
          return {
            ...customer,
            activeBookings: customerBookings.length,
            bookingDetails: customerBookings
          };
        });

        setCustomers(customers);
        setCustomersWithBookings(customersWithBookingCount);
      } else {
        console.error('Failed to load data');
        setCustomers([]);
        setCustomersWithBookings([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setCustomers([]);
      setCustomersWithBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customersWithBookings.filter(customer =>
    `${customer.first_name} ${customer.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (customer.phone && customer.phone.includes(searchTerm)) ||
    (customer.nid && customer.nid.includes(searchTerm))
  );

  const handleViewBookings = (customer) => {
    setSelectedCustomerBookings({
      customer: customer,
      bookings: customer.bookingDetails || []
    });
    setShowBookingsModal(true);
  };

  const getInitials = (firstName, lastName) => {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return firstInitial + lastInitial;
  };

  const getAvatarColor = (name) => {
    const colors = [
      '#86efac', // green
      '#93c5fd', // blue
      '#fde68a', // yellow
      '#fca5a5', // red
      '#c4b5fd', // purple
      '#fdba74', // orange
    ];
    const index = (name.charCodeAt(0) + name.charCodeAt(name.length - 1)) % colors.length;
    return colors[index];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

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
    <div className="customers-page-modern">
      <div className="page-header-modern">
        <div className="header-content">
          <h1>Customers</h1>
          <p className="subtitle">Manage your customer profiles and view their booking history.</p>
        </div>
        <div className="header-actions">
          <div className="search-box-modern">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowForm(true)}
          >
            <Plus size={20} />
            Add Customer
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading customers...</div>
      ) : (
        <div className="customers-grid-modern">
          {filteredCustomers.length === 0 ? (
            <div className="no-data">
              <p>No customers found</p>
            </div>
          ) : (
            filteredCustomers.map((customer) => {
              const initials = getInitials(customer.first_name, customer.last_name);
              const avatarColor = getAvatarColor(customer.first_name || 'A');
              const fullName = `${customer.first_name} ${customer.last_name}`;
              const joinedDate = formatDate(customer.created_at);
              
              return (
                <div key={customer.id} className="customer-card-modern">
                  <div className="card-header-modern">
                    <div className="customer-avatar" style={{ backgroundColor: avatarColor }}>
                      {initials}
                    </div>
                    <div className="customer-info-header">
                      <h3>{fullName}</h3>
                      <p className="joined-date">Joined: {joinedDate}</p>
                    </div>
                    <button className="menu-btn" title="More options">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                  
                  <div className="card-body-modern">
                    {customer.email && (
                      <div className="info-row">
                        <Mail size={16} className="info-icon" />
                        <span>{customer.email}</span>
                      </div>
                    )}
                    
                    {customer.phone && (
                      <div className="info-row">
                        <Phone size={16} className="info-icon" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                    
                    {customer.address && (
                      <div className="info-row">
                        <MapPin size={16} className="info-icon" />
                        <span>{customer.address}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="card-footer-modern">
                    {customer.activeBookings > 0 ? (
                      <button 
                        className="booking-status active"
                        onClick={() => handleViewBookings(customer)}
                      >
                        <Calendar size={16} />
                        <span>{customer.activeBookings} Active Booking{customer.activeBookings > 1 ? 's' : ''}</span>
                      </button>
                    ) : (
                      <div className="booking-status inactive">
                        <Calendar size={16} />
                        <span>No Active Bookings</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Bookings Modal */}
      {showBookingsModal && selectedCustomerBookings && (
        <div className="modal-overlay" onClick={() => setShowBookingsModal(false)}>
          <div className="modal-content-bookings" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{selectedCustomerBookings.customer.first_name} {selectedCustomerBookings.customer.last_name}'s Bookings</h2>
                <p className="modal-subtitle">{selectedCustomerBookings.bookings.length} Active Booking{selectedCustomerBookings.bookings.length > 1 ? 's' : ''}</p>
              </div>
              <button className="modal-close" onClick={() => setShowBookingsModal(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="bookings-list">
              {selectedCustomerBookings.bookings.length === 0 ? (
                <div className="no-bookings">
                  <Calendar size={48} />
                  <p>No active bookings found</p>
                </div>
              ) : (
                selectedCustomerBookings.bookings.map((booking) => (
                  <div key={booking.id} className="booking-card">
                    <div className="booking-header">
                      <div>
                        <h4>Booking #{booking.id}</h4>
                        <span className={`booking-status-badge ${booking.status}`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="booking-amount">
                        ৳{booking.total_amount || 0}
                      </div>
                    </div>
                    
                    <div className="booking-details">
                      <div className="booking-info-row">
                        <div className="info-item">
                          <strong>Room:</strong>
                          <span>Room {booking.room_number || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                          <strong>Type:</strong>
                          <span>{booking.room_type || 'Standard'}</span>
                        </div>
                      </div>
                      
                      <div className="booking-info-row">
                        <div className="info-item">
                          <strong>Check-in:</strong>
                          <span>{formatDate(booking.checkin_date)}</span>
                        </div>
                        <div className="info-item">
                          <strong>Check-out:</strong>
                          <span>{formatDate(booking.checkout_date)}</span>
                        </div>
                      </div>
                      
                      {booking.num_guests && (
                        <div className="booking-info-row">
                          <div className="info-item">
                            <strong>Guests:</strong>
                            <span>{booking.num_guests} guest{booking.num_guests > 1 ? 's' : ''}</span>
                          </div>
                          <div className="info-item">
                            <strong>Nights:</strong>
                            <span>{booking.num_nights || 0} night{booking.num_nights > 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
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
        .customers-page-modern {
          padding: 32px;
          max-width: 1400px;
          margin: 0 auto;
          background: #f8f9fa;
          min-height: 100vh;
        }
        
        .page-header-modern {
          margin-bottom: 32px;
        }
        
        .header-content h1 {
          margin: 0 0 8px 0;
          color: #1a1a1a;
          font-size: 32px;
          font-weight: 700;
        }
        
        .subtitle {
          margin: 0;
          color: #64748b;
          font-size: 16px;
        }
        
        .header-actions {
          display: flex;
          gap: 16px;
          margin-top: 24px;
          align-items: center;
        }
        
        .search-box-modern {
          position: relative;
          flex: 1;
          max-width: 500px;
        }
        
        .search-box-modern svg {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }
        
        .search-box-modern input {
          width: 100%;
          padding: 14px 16px 14px 48px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          font-size: 15px;
          background: white;
          transition: all 0.2s;
        }
        
        .search-box-modern input:focus {
          outline: none;
          border-color: #0ea5e9;
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
        }
        
        .customers-grid-modern {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 20px;
        }
        
        .customer-card-modern {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
          transition: all 0.3s ease;
          overflow: hidden;
          min-height: 220px;
        }
        
        .customer-card-modern:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
          border-color: #cbd5e1;
        }
        
        .card-header-modern {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 20px 20px 16px;
        }
        
        .customer-avatar {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 18px;
          color: #1a1a1a;
          flex-shrink: 0;
          border: 2px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .customer-info-header {
          flex: 1;
        }
        
        .customer-info-header h3 {
          margin: 0 0 4px 0;
          color: #1a1a1a;
          font-size: 17px;
          font-weight: 600;
        }
        
        .joined-date {
          margin: 0;
          color: #64748b;
          font-size: 12px;
        }
        
        .menu-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          padding: 6px;
          border-radius: 6px;
          transition: all 0.2s;
        }
        
        .menu-btn:hover {
          background: #f1f5f9;
          color: #64748b;
        }
        
        .card-body-modern {
          padding: 0 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .info-row {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #475569;
          font-size: 14px;
        }
        
        .info-icon {
          color: #94a3b8;
          flex-shrink: 0;
        }
        
        .card-footer-modern {
          padding: 14px 20px;
          border-top: 1px solid #f1f5f9;
          background: #fafbfc;
        }
        
        .booking-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          border: none;
          width: 100%;
          justify-content: center;
          transition: all 0.2s;
        }
        
        .booking-status.active {
          background: #dcfce7;
          color: #15803d;
          cursor: pointer;
        }
        
        .booking-status.active:hover {
          background: #bbf7d0;
          transform: scale(1.02);
        }
        
        .booking-status.inactive {
          background: #f1f5f9;
          color: #64748b;
        }
        
        .loading, .no-data {
          text-align: center;
          padding: 60px 20px;
          color: #64748b;
          font-size: 16px;
        }
        
        .btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 24px;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-primary {
          background: #0ea5e9;
          color: white;
        }
        
        .btn-primary:hover {
          background: #0284c7;
          transform: scale(1.02);
        }
        
        .btn-secondary {
          background: #f1f5f9;
          color: #475569;
        }
        
        .btn-secondary:hover {
          background: #e2e8f0;
        }
        
        /* Bookings Modal Styles */
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
          padding: 20px;
        }
        
        .modal-content-bookings {
          background: white;
          border-radius: 20px;
          width: 100%;
          max-width: 800px;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 32px 32px 24px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .modal-header h2 {
          margin: 0 0 6px 0;
          color: #1a1a1a;
          font-size: 24px;
          font-weight: 700;
        }
        
        .modal-subtitle {
          margin: 0;
          color: #64748b;
          font-size: 14px;
        }
        
        .modal-close {
          background: #f1f5f9;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #64748b;
          transition: all 0.2s;
        }
        
        .modal-close:hover {
          background: #e2e8f0;
          color: #475569;
        }
        
        .bookings-list {
          padding: 24px 32px 32px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .booking-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
        }
        
        .booking-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .booking-header h4 {
          margin: 0 0 8px 0;
          color: #1a1a1a;
          font-size: 16px;
          font-weight: 600;
        }
        
        .booking-status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }
        
        .booking-status-badge.confirmed {
          background: #dbeafe;
          color: #1e40af;
        }
        
        .booking-status-badge.checked_in {
          background: #dcfce7;
          color: #15803d;
        }
        
        .booking-amount {
          font-size: 24px;
          font-weight: 700;
          color: #0ea5e9;
        }
        
        .booking-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .booking-info-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .info-item strong {
          color: #64748b;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .info-item span {
          color: #1a1a1a;
          font-size: 14px;
          font-weight: 500;
        }
        
        .no-bookings {
          text-align: center;
          padding: 60px 20px;
          color: #94a3b8;
        }
        
        .no-bookings svg {
          margin-bottom: 16px;
          opacity: 0.5;
        }
        
        /* Original Modal Styles for Add/Edit Form */
        .modal-content {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
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
          border-color: #0ea5e9;
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        
        @media (max-width: 768px) {
          .customers-page-modern {
            padding: 16px;
          }
          
          .customers-grid-modern {
            grid-template-columns: 1fr;
          }
          
          .header-actions {
            flex-direction: column;
            align-items: stretch;
          }
          
          .search-box-modern {
            max-width: 100%;
          }
          
          .form-grid {
            grid-template-columns: 1fr;
          }
          
          .booking-info-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Customers;