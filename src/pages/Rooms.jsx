import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Eye,
  Bed,
  Users,
  DollarSign,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Grid,
  List,
  Trash2,
  Save,
  X as CloseIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import AddRoomForm from '../components/AddRoomForm';
import '../App.css';
import '../rooms.css';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showAddRoomForm, setShowAddRoomForm] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [editingRoom, setEditingRoom] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  
  const { canPerformAction, isMasterAdmin } = useAuth();

  const canEditRooms = () => canPerformAction('edit_rooms');

  useEffect(() => {
    loadRoomsData();
  }, []);

  const loadRoomsData = async () => {
    try {
      setLoading(true);
      const roomsResponse = await api.getRooms();
      if (roomsResponse.success) {
        setRooms(roomsResponse.rooms);
        
        const uniqueTypes = [...new Set(roomsResponse.rooms.map(room => room.room_type))];
        const roomTypesData = uniqueTypes.map((type, index) => ({
          id: index + 1,
          name: type
        }));
        setRoomTypes(roomTypesData);
      } else {
        setError('Failed to load rooms from database');
        setRooms([]);
        setRoomTypes([]);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
      setError('Failed to connect to database');
      setRooms([]);
      setRoomTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRoomAdded = async () => {
    await loadRoomsData();
    setShowAddRoomForm(false);
  };

  const handleEditRoom = (room) => {
    if (!isMasterAdmin()) {
      alert('Only Master Admin can edit rooms');
      return;
    }
    setEditingRoom(room);
    setEditFormData({
      room_type: room.room_type,
      capacity: room.capacity,
      rate: room.rate,
      status: room.status,
      description: room.description || '',
      floor: room.floor || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateRoom = async (e) => {
    e.preventDefault();
    if (!isMasterAdmin()) {
      alert('Only Master Admin can update rooms');
      return;
    }

    try {
      const result = await api.updateRoom(editingRoom.id, editFormData);
      if (result.success) {
        alert('Room updated successfully!');
        setShowEditModal(false);
        setEditingRoom(null);
        await loadRoomsData();
      } else {
        alert(`Failed to update room: ${result.error}`);
      }
    } catch (error) {
      alert(`Failed to update room: ${error.message}`);
    }
  };

  const handleDeleteRoom = async (room) => {
    if (!isMasterAdmin()) {
      alert('Only Master Admin can delete rooms');
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete Room ${room.room_number}?\n\n` +
      `Type: ${room.room_type}\n` +
      `Rate: ৳${room.rate}/night\n\n` +
      `This action cannot be undone!`
    );

    if (!confirmDelete) return;

    try {
      const result = await api.deleteRoom(room.id);
      if (result.success) {
        alert('Room deleted successfully!');
        await loadRoomsData();
      } else {
        alert(`Failed to delete room: ${result.error}`);
      }
    } catch (error) {
      alert(`Failed to delete room: ${error.message}`);
    }
  };

  const handleViewRoom = (room) => {
    // View room details
    alert(`Room ${room.room_number} Details:\n\nType: ${room.room_type}\nDescription: ${room.description || 'Hotel room'}\nCapacity: ${room.capacity} guests\nRate: ৳${room.rate}/night\nFloor: ${room.floor || 'N/A'}\nStatus: ${room.status}`);
  };

  const handleUpdateRoomStatus = async (roomId, newStatus) => {
    if (!canEditRooms()) {
      alert('You do not have permission to update room status');
      return;
    }

    try {
      const result = await api.updateRoomStatus(roomId, newStatus);
      if (result.success) {
        setRooms(rooms.map(room => 
          room.id === roomId ? { ...room, status: newStatus } : room
        ));
      }
    } catch (error) {
      alert(`Failed to update room status: ${error.message}`);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return <CheckCircle size={18} className="text-green-600" />;
      case 'occupied':
        return <XCircle size={18} className="text-red-600" />;
      case 'maintenance':
        return <AlertCircle size={18} className="text-yellow-600" />;
      default:
        return <AlertCircle size={18} className="text-gray-600" />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'available':
        return 'status-available';
      case 'occupied':
        return 'status-occupied';
      case 'maintenance':
        return 'status-maintenance';
      default:
        return 'status-unknown';
    }
  };

  const filteredRooms = rooms.filter(room => {
    const roomNumber = room.room_number || room.roomNumber;
    const roomType = room.room_type || room.type;
    
    const matchesSearch = roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         roomType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || room.status === filterStatus;
    const matchesType = filterType === 'all' || roomType === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Get room stats
  const roomStats = {
    total: rooms.length,
    available: rooms.filter(r => r.status === 'available').length,
    maintenance: rooms.filter(r => r.status === 'maintenance').length
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner-large">
          <div className="spinner"></div>
          <p>Loading rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rooms-page-modern">
      {/* Header */}
      <div className="page-header-modern">
        <h1>Room Management</h1>
        <div className="header-actions">
          {canPerformAction('edit_rooms') && (
            <button 
              className="btn btn-primary-modern"
              onClick={() => setShowAddRoomForm(true)}
            >
              <Plus size={20} />
              Add Room
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message-modern">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="room-stats-grid">
        <div className="stat-card-room total">
          <div className="stat-icon">
            <Bed size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Rooms</div>
            <div className="stat-value">{roomStats.total}</div>
          </div>
        </div>
        
        <div className="stat-card-room available">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Available</div>
            <div className="stat-value">{roomStats.available}</div>
          </div>
        </div>
        
        <div className="stat-card-room maintenance">
          <div className="stat-icon">
            <AlertCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Maintenance</div>
            <div className="stat-value">{roomStats.maintenance}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-modern">
        <div className="search-bar-modern">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search rooms by number or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-group-modern">
          <Filter size={18} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="maintenance">Maintenance</option>
          </select>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            {roomTypes.map(type => (
              <option key={type.id} value={type.name}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        <div className="view-toggle">
          <button 
            className={viewMode === 'grid' ? 'active' : ''}
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >
            <Grid size={20} />
          </button>
          <button 
            className={viewMode === 'list' ? 'active' : ''}
            onClick={() => setViewMode('list')}
            title="List View"
          >
            <List size={20} />
          </button>
        </div>
      </div>

      {/* Rooms Grid/List */}
      <div className={`rooms-container ${viewMode === 'list' ? 'list-view' : 'grid-view'}`}>
        {filteredRooms.map(room => (
          <div key={room.id} className={`room-card-modern ${getStatusClass(room.status)}`}>
            <div className="room-card-header">
              <div className="room-number-badge">
                <Bed size={20} />
                <span className="room-number">Room {room.room_number || room.roomNumber}</span>
              </div>
              <div className={`room-status-badge status-${room.status}`}>
                {getStatusIcon(room.status)}
                <span>{room.status}</span>
              </div>
            </div>
            
            <div className="room-card-body">
              <h3 className="room-type">{room.room_type || room.type}</h3>
              <p className="room-description">{room.description || 'Hotel room'}</p>
              
              <div className="room-info-grid">
                <div className="info-item">
                  <Users size={16} />
                  <span>{room.capacity} Guests</span>
                </div>
                <div className="info-item">
                  <DollarSign size={16} />
                  <span>৳{room.rate || room.pricePerNight}/night</span>
                </div>
                <div className="info-item">
                  <MapPin size={16} />
                  <span>Floor {room.floor || (typeof room.meta === 'object' ? room.meta?.floor : null) || 'N/A'}</span>
                </div>
              </div>
              
              {room.amenities && room.amenities.length > 0 && (
                <div className="room-amenities">
                  {room.amenities.slice(0, 3).map((amenity, index) => (
                    <span key={index} className="amenity-badge">
                      {amenity}
                    </span>
                  ))}
                  {room.amenities.length > 3 && (
                    <span className="amenity-badge more">+{room.amenities.length - 3}</span>
                  )}
                </div>
              )}
            </div>
            
            <div className="room-card-footer">
              <button 
                className="action-btn-modern view" 
                title="View Details"
                onClick={() => handleViewRoom(room)}
              >
                <Eye size={16} />
                <span>View</span>
              </button>
              {isMasterAdmin() && (
                <>
                  <button 
                    className="action-btn-modern edit" 
                    title="Edit Room"
                    onClick={() => handleEditRoom(room)}
                  >
                    <Edit size={16} />
                    <span>Edit</span>
                  </button>
                  <button 
                    className="action-btn-modern delete" 
                    title="Delete Room"
                    onClick={() => handleDeleteRoom(room)}
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                  <select
                    value={room.status}
                    onChange={(e) => handleUpdateRoomStatus(room.id, e.target.value)}
                    className="status-select-modern"
                    title="Update Status"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredRooms.length === 0 && (
        <div className="empty-state-modern">
          <Bed size={64} />
          <h3>No rooms found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      )}

      {/* Add Room Form Modal */}
      {showAddRoomForm && (
        <div className="modal-overlay">
          <div className="modal-large">
            <div className="modal-header">
              <h2>Add New Room</h2>
              <button 
                className="modal-close"
                onClick={() => setShowAddRoomForm(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <AddRoomForm onRoomAdded={handleRoomAdded} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Room Modal */}
      {showEditModal && editingRoom && (
        <div className="modal-overlay">
          <div className="modal-large">
            <div className="modal-header">
              <h2>Edit Room {editingRoom.room_number}</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingRoom(null);
                }}
              >
                <CloseIcon size={24} />
              </button>
            </div>
            <div className="modal-content">
              <form onSubmit={handleUpdateRoom} className="edit-room-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Room Type *</label>
                    <input
                      type="text"
                      value={editFormData.room_type}
                      onChange={(e) => setEditFormData({...editFormData, room_type: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Capacity (Guests) *</label>
                    <input
                      type="number"
                      min="1"
                      value={editFormData.capacity}
                      onChange={(e) => setEditFormData({...editFormData, capacity: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Rate (৳/night) *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editFormData.rate}
                      onChange={(e) => setEditFormData({...editFormData, rate: parseFloat(e.target.value)})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Status *</label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                      required
                    >
                      <option value="available">Available</option>
                      <option value="occupied">Occupied</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                      rows="3"
                      placeholder="Enter room description"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Floor</label>
                    <input
                      type="text"
                      value={editFormData.floor}
                      onChange={(e) => setEditFormData({...editFormData, floor: e.target.value})}
                      placeholder="e.g., 1st Floor, Ground Floor"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingRoom(null);
                    }}
                  >
                    <CloseIcon size={18} />
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <Save size={18} />
                    Update Room
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rooms;
