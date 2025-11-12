import React, { useState, useEffect } from 'react';
import { X, ArrowRight, DollarSign, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import './RoomChangeModal.css';

const RoomChangeModal = ({ booking, onClose, onSuccess, userName }) => {
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [vatPercentage, setVatPercentage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAvailableRooms();
  }, [booking]);

  const loadAvailableRooms = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Validate booking data
      if (!booking || !booking.checkOutDate) {
        setError('Invalid booking data');
        setLoading(false);
        return;
      }
      
      // Get today's date and checkout date
      const today = new Date().toISOString().split('T')[0];
      const checkoutDate = new Date(booking.checkOutDate).toISOString().split('T')[0];
      
      const result = await api.getAvailableRooms(today, checkoutDate);
      
      if (result.success && Array.isArray(result.rooms)) {
        // Filter out the current room
        const filtered = result.rooms.filter(room => room.id !== booking.roomId);
        setAvailableRooms(filtered || []);
      } else {
        setError('Failed to load available rooms');
        setAvailableRooms([]);
      }
    } catch (err) {
      console.error('Error loading available rooms:', err);
      setError('Error loading available rooms: ' + err.message);
      setAvailableRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateRemainingNights = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkout = new Date(booking.checkOutDate);
    checkout.setHours(0, 0, 0, 0);
    return Math.ceil((checkout - today) / (1000 * 60 * 60 * 24));
  };

  const calculatePriceAdjustment = (newRoom) => {
    const remainingNights = calculateRemainingNights();
    const currentRate = booking.roomRate || 0;
    const newRate = parseFloat(newRoom.rate) || 0;
    
    // Apply discount to the NEW room rate FIRST
    const discountAmount = (newRate * discountPercentage) / 100;
    const newRateAfterDiscount = newRate - discountAmount;
    
    // Then calculate the difference from original room (this is the extra charge per night)
    const difference = newRateAfterDiscount - currentRate;
    const subtotal = difference * remainingNights; // Total extra charge before VAT
    
    // Apply VAT to the extra charge (subtotal)
    const vatAmount = (subtotal * vatPercentage) / 100;
    const totalWithVat = subtotal + vatAmount;
    
    return {
      originalNewRate: newRate,
      discountPerNight: discountAmount,
      newRateAfterDiscount: newRateAfterDiscount,
      differencePerNight: difference,
      subtotal: subtotal,
      vatAmount: vatAmount,
      totalAdjustment: totalWithVat,
      remainingNights
    };
  };

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedRoom) {
      setError('Please select a room');
      return;
    }

    if (!reason) {
      setError('Please select a reason for room change');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Calculate final values to send to backend
      const calculation = calculatePriceAdjustment(selectedRoom);
      
      const result = await api.changeRoom(booking.id, {
        new_room_id: selectedRoom.id,
        reason: reason,
        notes: notes,
        discount_percentage: discountPercentage,
        vat_percentage: vatPercentage,
        calculated_charge: calculation.totalAdjustment, // Send final calculated amount
        nights_affected: calculation.remainingNights, // Send nights from frontend
        changed_by: userName || 'Unknown'
      });

      if (result.success) {
        alert(
          `✅ Room changed successfully!\n\n` +
          `From: ${result.changeDetails.fromRoom}\n` +
          `To: ${result.changeDetails.toRoom}\n` +
          `Nights Affected: ${result.changeDetails.nightsAffected}\n` +
          `Price Adjustment: ৳${result.changeDetails.priceAdjustment.toFixed(2)}\n` +
          `Type: ${result.changeDetails.adjustmentType}`
        );
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Failed to change room');
      }
    } catch (err) {
      setError('Error changing room: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const remainingNights = calculateRemainingNights();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="room-change-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Change Room</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {/* Current Booking Info */}
          <div className="current-booking-info">
            <h3>Current Booking Details</h3>
            <div className="info-grid">
              <div className="info-item">
                <strong>Guest:</strong> {booking.guestName}
              </div>
              <div className="info-item">
                <strong>Current Room:</strong> {booking.roomNumber} - {booking.roomType}
              </div>
              <div className="info-item">
                <strong>Rate:</strong> ৳{booking.roomRate || 0}/night
              </div>
              <div className="info-item">
                <strong>Check-out:</strong> {new Date(booking.checkOutDate).toLocaleDateString()}
              </div>
              <div className="info-item">
                <strong>Remaining Nights:</strong> {remainingNights}
              </div>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Select New Room */}
            <div className="form-section">
              <h3>Select New Room</h3>
              {loading ? (
                <div className="loading">Loading available rooms...</div>
              ) : availableRooms.length === 0 ? (
                <div className="no-rooms">No available rooms for the remaining dates</div>
              ) : (
                <div className="rooms-grid">
                  {availableRooms.map(room => {
                    const adjustment = calculatePriceAdjustment(room);
                    const isSelected = selectedRoom?.id === room.id;

                    return (
                      <div
                        key={room.id}
                        className={`room-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleRoomSelect(room)}
                      >
                        <div className="room-header">
                          <strong>Room {room.room_number}</strong>
                          {isSelected && <CheckCircle size={20} className="check-icon" />}
                        </div>
                        <div className="room-type">{room.room_type}</div>
                        <div className="room-rate">৳{room.rate}/night</div>
                        <div className="room-capacity">{room.capacity} guests</div>
                        
                        {adjustment.totalAdjustment !== 0 && (
                          <div className={`price-adjustment ${adjustment.totalAdjustment > 0 ? 'upgrade' : 'downgrade'}`}>
                            {adjustment.totalAdjustment > 0 ? '+' : ''}৳{adjustment.totalAdjustment.toFixed(2)} total
                          </div>
                        )}
                        {adjustment.totalAdjustment === 0 && (
                          <div className="price-adjustment same">Same Price</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reason for Change */}
            <div className="form-group">
              <label>Reason for Room Change *</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              >
                <option value="">Select a reason</option>
                <option value="Maintenance Issue">Maintenance Issue</option>
                <option value="Guest Request - Upgrade">Guest Request - Upgrade</option>
                <option value="Guest Request - Downgrade">Guest Request - Downgrade</option>
                <option value="Room Availability">Room Availability</option>
                <option value="Guest Preference">Guest Preference</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label>Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes..."
                rows="3"
              />
            </div>

            {/* Discount */}
            <div className="form-group">
              <label>Discount Percentage (Optional)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(parseFloat(e.target.value) || 0)}
                placeholder="Enter discount % (0-100)"
              />
              <small className="field-hint">Apply discount to the new room rate</small>
            </div>

            {/* VAT */}
            <div className="form-group">
              <label>VAT/Tax Percentage (Optional)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={vatPercentage}
                onChange={(e) => setVatPercentage(parseFloat(e.target.value) || 0)}
                placeholder="Enter VAT % (0-100)"
              />
              <small className="field-hint">VAT will be applied to the extra charge amount</small>
            </div>

            {/* Summary */}
            {selectedRoom && (
              <div className="change-summary">
                <h3>Change Summary</h3>
                <div className="summary-row">
                  <span>From:</span>
                  <strong>Room {booking.roomNumber}</strong>
                </div>
                <div className="summary-row">
                  <ArrowRight size={20} className="arrow-icon" />
                </div>
                <div className="summary-row">
                  <span>To:</span>
                  <strong>Room {selectedRoom.room_number}</strong>
                </div>
                <div className="summary-row">
                  <span>Remaining Nights:</span>
                  <strong>{calculatePriceAdjustment(selectedRoom).remainingNights} nights</strong>
                </div>
                
                <div className="summary-divider"></div>
                
                {/* Per Night Breakdown */}
                <div className="summary-row">
                  <span>Extra Per Night:</span>
                  <strong>
                    {calculatePriceAdjustment(selectedRoom).differencePerNight >= 0 ? '+' : ''}
                    ৳{calculatePriceAdjustment(selectedRoom).differencePerNight.toFixed(2)}
                  </strong>
                </div>
                
                {vatPercentage > 0 && (
                  <div className="summary-row">
                    <span>VAT Per Night ({vatPercentage}%):</span>
                    <strong>
                      +৳{(calculatePriceAdjustment(selectedRoom).differencePerNight * vatPercentage / 100).toFixed(2)}
                    </strong>
                  </div>
                )}
                
                <div className="summary-row highlight">
                  <span>Total Per Night:</span>
                  <strong>
                    {calculatePriceAdjustment(selectedRoom).totalAdjustment >= 0 ? '+' : ''}
                    ৳{(calculatePriceAdjustment(selectedRoom).totalAdjustment / calculatePriceAdjustment(selectedRoom).remainingNights).toFixed(2)}
                  </strong>
                </div>
                
                <div className="summary-divider"></div>
                
                <div className="summary-row total">
                  <span>Total Additional Charge:</span>
                  <strong>
                    {calculatePriceAdjustment(selectedRoom).totalAdjustment >= 0 ? '+' : ''}
                    ৳{calculatePriceAdjustment(selectedRoom).totalAdjustment.toFixed(2)}
                  </strong>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={!selectedRoom || submitting}
              >
                {submitting ? 'Changing Room...' : 'Confirm Room Change'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RoomChangeModal;
