import React, { useState } from 'react';
import './AddRoomForm.css';

const AddRoomForm = ({ onRoomAdded, onCancel }) => {
  const [formData, setFormData] = useState({
    room_number: '',
    room_type: 'Premium Quadruple (Connecting)',
    floor: 1,
    has_ac: true,
    rate: '',
    description: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const roomTypes = [
    'Premium Quadruple (Connecting)',
    'Deluxe Quadruple (Connecting)',
    'Deluxe Triple',
    'Deluxe Double',
    'Premium Deluxe Double',
    'Deluxe Double Queen',
    'Premium Quadruple',
    'Deluxe Twin',
    'Family Suits (3Bed)',
    'Family Suits (4Bed)',
    'Hall Room',
    'Rooftop Couple'
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.room_number.trim()) {
      newErrors.room_number = 'Room number is required';
    }
    
    if (!formData.rate || formData.rate <= 0) {
      newErrors.rate = 'Valid price is required';
    }
    
    if (formData.floor < 1 || formData.floor > 50) {
      newErrors.floor = 'Floor must be between 1 and 50';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
      const response = await fetch(`${API_BASE}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_number: formData.room_number.trim(),
          room_type: formData.room_type,
          capacity: getRoomCapacity(formData.room_type),
          rate: parseFloat(formData.rate),
          status: 'available',
          meta: {
            floor: parseInt(formData.floor),
            has_ac: formData.has_ac,
            description: formData.description.trim()
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Reset form
        setFormData({
          room_number: '',
          room_type: 'Premium Quadruple (Connecting)',
          floor: 1,
          has_ac: true,
          rate: '',
          description: ''
        });
        setErrors({});
        
        // Notify parent component
        if (onRoomAdded) {
          onRoomAdded();
        }
        
        alert('Room added successfully!');
      } else {
        if (response.status === 409) {
          setErrors({ room_number: 'Room number already exists' });
        } else {
          alert('Error: ' + result.error);
        }
      }
    } catch (error) {
      console.error('Error adding room:', error);
      alert('Failed to add room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRoomCapacity = (roomType) => {
    const capacityMap = {
      'Premium Quadruple (Connecting)': 4,
      'Deluxe Quadruple (Connecting)': 4,
      'Deluxe Triple': 3,
      'Deluxe Double': 2,
      'Premium Deluxe Double': 2,
      'Deluxe Double Queen': 2,
      'Premium Quadruple': 4,
      'Deluxe Twin': 2,
      'Family Suits (3Bed)': 6,
      'Family Suits (4Bed)': 8,
      'Hall Room': 10,
      'Rooftop Couple': 2
    };
    return capacityMap[roomType] || 2;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="add-room-modal">
      <div className="add-room-form-container">
        <div className="form-header">
          <h2>Add New Room</h2>
          <button 
            type="button" 
            className="close-btn"
            onClick={onCancel}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-room-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="room_number">Room Number *</label>
              <input
                type="text"
                id="room_number"
                value={formData.room_number}
                onChange={(e) => handleInputChange('room_number', e.target.value)}
                placeholder="e.g. 101, A-205"
                className={errors.room_number ? 'error' : ''}
                disabled={loading}
              />
              {errors.room_number && <span className="error-text">{errors.room_number}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="room_type">Room Type *</label>
              <select
                id="room_type"
                value={formData.room_type}
                onChange={(e) => handleInputChange('room_type', e.target.value)}
                disabled={loading}
              >
                {roomTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="floor">Floor *</label>
              <input
                type="number"
                id="floor"
                min="1"
                max="50"
                value={formData.floor}
                onChange={(e) => handleInputChange('floor', e.target.value)}
                className={errors.floor ? 'error' : ''}
                disabled={loading}
              />
              {errors.floor && <span className="error-text">{errors.floor}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="rate">Price per Night (৳ BDT) *</label>
              <input
                type="number"
                id="rate"
                min="0"
                step="0.01"
                value={formData.rate}
                onChange={(e) => handleInputChange('rate', e.target.value)}
                placeholder="5000.00"
                className={errors.rate ? 'error' : ''}
                disabled={loading}
              />
              {errors.rate && <span className="error-text">{errors.rate}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Air Conditioning</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="has_ac"
                    checked={formData.has_ac === true}
                    onChange={() => handleInputChange('has_ac', true)}
                    disabled={loading}
                  />
                  AC
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="has_ac"
                    checked={formData.has_ac === false}
                    onChange={() => handleInputChange('has_ac', false)}
                    disabled={loading}
                  />
                  Non-AC
                </label>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Additional Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Optional: Sea view, balcony, near elevator, corner room, garden view, etc."
              rows="3"
              disabled={loading}
            />
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-btn"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Adding Room...' : 'Add Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRoomForm;