import React from 'react';
import { X, User, Calendar, CheckCircle, Clock, CreditCard, RefreshCw, ArrowRight } from 'lucide-react';

// Safe wrapper component that prevents iteration errors
const SafeBookingView = ({ 
  booking, 
  onClose, 
  onAddPayment, 
  onAddCharge, 
  onViewInvoice,
  formatDate,
  getStatusBadge,
  getPaymentBadge
}) => {
  // Early return if no booking
  if (!booking) {
    console.log('❌ SafeBookingView: No booking provided');
    return null;
  }

  console.log('🔍 SafeBookingView received booking:', booking);
  console.log('🔍 booking.charges type:', typeof booking.charges, Array.isArray(booking.charges));
  console.log('🔍 booking.payments type:', typeof booking.payments, Array.isArray(booking.payments));
  console.log('🔍 booking.room_change_history type:', typeof booking.room_change_history, Array.isArray(booking.room_change_history));
  console.log('🔍 booking.totals type:', typeof booking.totals);

  // Safely get arrays with defaults
  const charges = Array.isArray(booking.charges) ? booking.charges : [];
  const payments = Array.isArray(booking.payments) ? booking.payments : [];
  const roomChangeHistory = Array.isArray(booking.room_change_history) ? booking.room_change_history : [];
  const totals = booking.totals || {};

  console.log('✅ Validated arrays - charges:', charges.length, 'payments:', payments.length, 'roomChangeHistory:', roomChangeHistory.length);

  try {
    return (
    <div className="modal-overlay">
      <div className="view-modal modern-booking-modal">
        <div className="modal-header gradient-header">
          <div className="header-content">
            <div>
              <h3>Booking Details</h3>
              <p className="booking-ref-badge">{booking.bookingRef || 'N/A'}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="modal-body scrollable-content">
          {/* Guest Information Card */}
          <div className="info-card guest-card">
            <div className="card-header">
              <User size={20} />
              <h4>Guest Information</h4>
            </div>
            <div className="card-content">
              <div className="guest-info-grid">
                <div className="guest-info-item">
                  <div className="guest-info-icon name">👤</div>
                  <div className="guest-info-content">
                    <span className="guest-info-label">Guest Name</span>
                    <span className="guest-info-value">{booking.guestName || 'N/A'}</span>
                  </div>
                </div>
                <div className="guest-info-item">
                  <div className="guest-info-icon email">📧</div>
                  <div className="guest-info-content">
                    <span className="guest-info-label">Email</span>
                    <span className="guest-info-value">{booking.guestEmail || 'N/A'}</span>
                  </div>
                </div>
                <div className="guest-info-item">
                  <div className="guest-info-icon phone">📱</div>
                  <div className="guest-info-content">
                    <span className="guest-info-label">Phone</span>
                    <span className="guest-info-value">{booking.guestPhone || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Information Card */}
          <div className="info-card booking-card">
            <div className="card-header">
              <Calendar size={20} />
              <h4>Booking Information</h4>
            </div>
            <div className="card-content">
              <div className="dates-grid">
                <div className="date-box checkin">
                  <div className="date-box-icon">📅</div>
                  <div className="date-box-content">
                    <span className="date-box-label">Check-in</span>
                    <span className="date-box-date">{formatDate(booking.checkInDate)}</span>
                    <span className="date-box-year">{booking.checkInDate ? new Date(booking.checkInDate).getFullYear() : ''}</span>
                  </div>
                </div>
                
                <div className="date-separator">
                  <div className="separator-line"></div>
                  <div className="nights-badge">{booking.totalNights || 0} {booking.totalNights === 1 ? 'Night' : 'Nights'}</div>
                </div>
                
                <div className="date-box checkout">
                  <div className="date-box-icon">📆</div>
                  <div className="date-box-content">
                    <span className="date-box-label">Check-out</span>
                    <span className="date-box-date">{formatDate(booking.checkOutDate)}</span>
                    <span className="date-box-year">{booking.checkOutDate ? new Date(booking.checkOutDate).getFullYear() : ''}</span>
                  </div>
                </div>
              </div>
              
              <div className="room-guests-grid">
                <div className="room-guest-box room">
                  <div className="rgb-icon">🏠</div>
                  <div className="rgb-content">
                    <span className="rgb-label">Room</span>
                    <span className="rgb-value">Room {booking.roomNumber || 'N/A'}</span>
                    <span className="rgb-subtitle">{booking.roomType || 'N/A'}</span>
                  </div>
                </div>
                <div className="room-guest-box guests">
                  <div className="rgb-icon">👥</div>
                  <div className="rgb-content">
                    <span className="rgb-label">Guests</span>
                    <span className="rgb-value">{booking.guestCount || 1} {booking.guestCount === 1 ? 'Guest' : 'Guests'}</span>
                  </div>
                </div>
              </div>
              
              <div className="status-grid">
                <div className="status-box-item">
                  <span className="status-box-label">Booking Status</span>
                  {getStatusBadge(booking.status)}
                </div>
                <div className="status-box-item">
                  <span className="status-box-label">Payment Status</span>
                  {getPaymentBadge(booking.paymentStatus)}
                </div>
              </div>
              
              <div className="booking-footer-meta">
                <div className="footer-meta-item">
                  <Clock size={14} />
                  <span>Booked on {formatDate(booking.createdAt)}</span>
                </div>
                <div className="footer-meta-item">
                  <User size={14} />
                  <span>By {booking.createdBy || 'Unknown'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Room Change History Section */}
          {roomChangeHistory.length > 0 && (
            <div className="info-card room-history-card">
              <div className="card-header">
                <RefreshCw size={20} />
                <h4>Room Change History</h4>
                <span className="history-badge">{roomChangeHistory.length} {roomChangeHistory.length === 1 ? 'Change' : 'Changes'}</span>
              </div>
              <div className="card-content">
                <div className="room-history-timeline">
                  {/* Original Room */}
                  <div className="timeline-item original-room">
                    <div className="timeline-marker start">
                      <CheckCircle size={16} />
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className="timeline-title">Original Room Assignment</span>
                        <span className="timeline-date">{formatDate(booking.checkInDate)}</span>
                      </div>
                      <div className="timeline-details">
                        <div className="room-info-box original">
                          <span className="room-number">Room {roomChangeHistory[0]?.from_room_number || booking.roomNumber}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Each Room Change */}
                  {roomChangeHistory.map((change, index) => {
                    if (!change) return null;
                    
                    return (
                      <div key={index} className="timeline-item room-change">
                        <div className="timeline-marker change">
                          <RefreshCw size={16} />
                        </div>
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <span className="timeline-title">Room Changed</span>
                            <span className="timeline-date">{change.date ? new Date(change.date).toLocaleDateString() : 'N/A'}</span>
                          </div>
                          <div className="timeline-details">
                            <div className="change-flow">
                              <div className="room-info-box from">
                                <span className="flow-label">FROM</span>
                                <span className="room-number">Room {change.from_room_number || 'N/A'}</span>
                              </div>
                              <div className="flow-arrow">
                                <ArrowRight size={20} />
                              </div>
                              <div className="room-info-box to">
                                <span className="flow-label">TO</span>
                                <span className="room-number">Room {change.to_room_number || 'N/A'}</span>
                              </div>
                            </div>
                            <div className="change-meta">
                              <div className="change-reason">
                                <strong>Reason:</strong> {change.reason || 'N/A'}
                              </div>
                              {change.notes && (
                                <div className="change-notes">
                                  <strong>Notes:</strong> {change.notes}
                                </div>
                              )}
                              <div className="change-impact">
                                <span className="nights-affected">
                                  <Calendar size={14} />
                                  {change.nights_affected || 0} {change.nights_affected === 1 ? 'night' : 'nights'} affected
                                </span>
                                <span className={`price-adjustment ${(change.price_adjustment || 0) > 0 ? 'upgrade' : (change.price_adjustment || 0) < 0 ? 'downgrade' : 'same'}`}>
                                  {(change.price_adjustment || 0) > 0 && '+'}
                                  ৳{Math.abs(change.price_adjustment || 0).toFixed(2)}
                                  {(change.price_adjustment || 0) === 0 ? ' (No charge)' : ''}
                                </span>
                              </div>
                              <div className="change-by">
                                Changed by <strong>{change.changed_by || 'Unknown'}</strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Current Room */}
                  {roomChangeHistory.length > 0 && (
                    <div className="timeline-item current-room">
                      <div className="timeline-marker current">
                        <CheckCircle size={16} />
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <span className="timeline-title">Current Room</span>
                          <span className="timeline-badge current">Active</span>
                        </div>
                        <div className="timeline-details">
                          <div className="room-info-box current-active">
                            <span className="room-number">Room {booking.roomNumber || 'N/A'}</span>
                            <span className="room-type">{booking.roomType || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Additional Charges Section */}
          {charges.length > 0 && (
            <div className="info-card charges-card">
              <div className="card-header">
                <span className="header-icon">➕</span>
                <h4>Additional Charges</h4>
              </div>
              <div className="card-content">
                <div className="charges-list">
                  {charges.map((charge, index) => (
                    <div key={charge.id || index} className="charge-item">
                      <div className="charge-info">
                        <span className="charge-description">{charge.description || 'N/A'}</span>
                        <span className="charge-meta">
                          {charge.createdAt ? new Date(charge.createdAt).toLocaleDateString() : 'N/A'}
                          {charge.createdBy && ` • ${charge.createdBy}`}
                        </span>
                      </div>
                      <div className="charge-amount">৳{(charge.totalAmount || charge.amount || 0).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Payments Section */}
          {payments.length > 0 && (
            <div className="info-card payments-card">
              <div className="card-header">
                <CreditCard size={20} />
                <h4>Payment History</h4>
              </div>
              <div className="card-content">
                <div className="payments-list">
                  {payments.map((payment, index) => (
                    <div key={payment.id || index} className="payment-item">
                      <div className="payment-info">
                        <span className="payment-method">{payment.method || 'CASH'}</span>
                        <span className="payment-meta">
                          {payment.processedAt ? new Date(payment.processedAt).toLocaleDateString() : 'N/A'}
                          {payment.receivedBy && ` • ${payment.receivedBy}`}
                        </span>
                        {payment.notes && <span className="payment-notes">{payment.notes}</span>}
                      </div>
                      <div className="payment-amount">৳{(payment.amount || 0).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Financial Summary */}
          {Object.keys(totals).length > 0 && (
            <div className="info-card totals-card">
              <div className="card-header">
                <span className="header-icon">💰</span>
                <h4>Financial Summary</h4>
              </div>
              <div className="card-content">
                <div className="totals-grid">
                  {totals.baseAmount > 0 && (
                    <div className="total-row">
                      <span>Base Amount:</span>
                      <span>৳{(totals.baseAmount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {totals.discountAmount > 0 && (
                    <div className="total-row discount">
                      <span>Discount ({totals.discountPercentage || 0}%):</span>
                      <span>-৳{(totals.discountAmount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {totals.additionalCharges > 0 && (
                    <div className="total-row">
                      <span>Additional Charges:</span>
                      <span>৳{(totals.additionalCharges || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {totals.vat > 0 && (
                    <div className="total-row">
                      <span>VAT ({totals.taxRate || 0}%):</span>
                      <span>৳{(totals.vat || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="total-row grand">
                    <span>Grand Total:</span>
                    <span>৳{(totals.grandTotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="total-row paid">
                    <span>Total Paid:</span>
                    <span>৳{(totals.totalPaid || 0).toFixed(2)}</span>
                  </div>
                  <div className="total-row balance">
                    <span>Balance Due:</span>
                    <span>৳{(totals.balance || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          {onAddCharge && (
            <button className="btn btn-primary" onClick={onAddCharge}>
              Add Charge
            </button>
          )}
          {onAddPayment && (
            <button className="btn btn-success" onClick={onAddPayment}>
              Add Payment
            </button>
          )}
          {onViewInvoice && (
            <button className="btn btn-info" onClick={onViewInvoice}>
              View Invoice
            </button>
          )}
        </div>
      </div>
    </div>
    );
  } catch (error) {
    console.error('💥 ERROR IN SafeBookingView RENDER:', error);
    console.error('💥 Error stack:', error.stack);
    console.error('💥 Booking data when error occurred:', booking);
    
    return (
      <div className="modal-overlay">
        <div className="view-modal">
          <div className="modal-header">
            <h3>Error Loading Booking</h3>
            <button className="close-btn" onClick={onClose}>
              <X size={24} />
            </button>
          </div>
          <div className="modal-body">
            <p>An error occurred while loading the booking details.</p>
            <p style={{color: 'red'}}>{error.message}</p>
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }
};

export default SafeBookingView;
