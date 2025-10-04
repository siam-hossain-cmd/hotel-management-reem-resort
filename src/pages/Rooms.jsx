import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Bed,
  Users,
  DollarSign,
  MapPin,
  Wifi,
  Tv,
  Car,
  Coffee,
  Upload,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { roomService } from '../firebase/roomService';
import roomsData from '../data/rooms.json';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  
  const { canPerformAction } = useAuth();

  // Define permission functions
  const canEditRooms = () => canPerformAction('edit_rooms');
  const canUploadRooms = () => canPerformAction('upload_rooms');
  const canDeleteRooms = () => canPerformAction('delete_rooms');

  useEffect(() => {
    loadRoomsData();
  }, []);

  const loadRoomsData = async () => {
    try {
      setLoading(true);
      const [roomsData, roomTypesData] = await Promise.all([
        roomService.getAllRooms(),
        roomService.getAllRoomTypes()
      ]);
      setRooms(roomsData);
      setRoomTypes(roomTypesData);
    } catch (error) {
      console.error('Error loading rooms:', error);
      setError('Failed to load rooms data');
      // Fallback to local data if Firebase fails
      setRooms(roomsData.rooms || []);
      setRoomTypes(roomsData.roomTypes || []);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadToFirebase = async () => {
    if (!canUploadRooms()) {
      alert('You do not have permission to upload room data');
      return;
    }

    try {
      setUploadStatus({ type: 'loading', message: 'Uploading rooms to Firebase...' });
      
      const result = await roomService.uploadRoomsFromJSON(roomsData);
      
      if (result.errors.length > 0) {
        setUploadStatus({ 
          type: 'warning', 
          message: `Upload completed with ${result.errors.length} errors`,
          details: result
        });
      } else {
        setUploadStatus({ 
          type: 'success', 
          message: `Successfully uploaded ${result.rooms.length} rooms and ${result.roomTypes.length} room types`,
          details: result
        });
      }
      
      // Reload data
      await loadRoomsData();
      
    } catch (error) {
      setUploadStatus({ 
        type: 'error', 
        message: `Upload failed: ${error.message}` 
      });
    }
  };

  const handleUpdateRoomStatus = async (roomId, newStatus) => {
    if (!canEditRooms()) {
      alert('You do not have permission to update room status');
      return;
    }

    try {
      await roomService.updateRoomStatus(roomId, newStatus);
      setRooms(rooms.map(room => 
        room.id === roomId ? { ...room, status: newStatus } : room
      ));
    } catch (error) {
      alert(`Failed to update room status: ${error.message}`);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'occupied':
        return <XCircle size={16} className="text-red-600" />;
      case 'maintenance':
        return <AlertCircle size={16} className="text-yellow-600" />;
      default:
        return <AlertCircle size={16} className="text-gray-600" />;
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
    const matchesSearch = room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || room.status === filterStatus;
    const matchesType = filterType === 'all' || room.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

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
    <div className="rooms-page">
      <div className="page-header">
        <h1>Room Management</h1>
        <div className="header-actions">
          {canUploadRooms() && (
            <button 
              className="btn btn-secondary"
              onClick={() => setShowUploadModal(true)}
            >
              <Upload size={20} />
              Upload to Firebase
            </button>
          )}
          {canPerformAction('edit_rooms') && (
            <button className="btn btn-primary">
              <Plus size={20} />
              Add Room
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span>{error}</span>
        </div>
      )}

      <div className="filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search rooms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
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
      </div>

      <div className="rooms-grid">
        {filteredRooms.map(room => (
          <div key={room.id} className={`room-card ${getStatusClass(room.status)}`}>
            <div className="room-header">
              <div className="room-number">
                <Bed size={20} />
                <span>Room {room.roomNumber}</span>
              </div>
              <div className="room-status">
                {getStatusIcon(room.status)}
                <span>{room.status}</span>
              </div>
            </div>
            
            <div className="room-details">
              <h3>{room.type}</h3>
              <p className="room-description">{room.description}</p>
              
              <div className="room-info">
                <div className="info-item">
                  <Users size={16} />
                  <span>{room.capacity} guests</span>
                </div>
                <div className="info-item">
                  <DollarSign size={16} />
                  <span>৳{room.pricePerNight}/night</span>
                </div>
                <div className="info-item">
                  <MapPin size={16} />
                  <span>Floor {room.floor}</span>
                </div>
              </div>
              
              <div className="room-amenities">
                {room.amenities?.slice(0, 4).map((amenity, index) => (
                  <span key={index} className="amenity-tag">
                    {amenity}
                  </span>
                ))}
                {room.amenities?.length > 4 && (
                  <span className="amenity-tag">+{room.amenities.length - 4} more</span>
                )}
              </div>
            </div>
            
            <div className="room-actions">
              <button className="action-btn" title="View Details">
                <Eye size={16} />
              </button>
              {canPerformAction('edit_rooms') && (
                <>
                  <button className="action-btn" title="Edit Room">
                    <Edit size={16} />
                  </button>
                  <select
                    value={room.status}
                    onChange={(e) => handleUpdateRoomStatus(room.id, e.target.value)}
                    className="status-select"
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
        <div className="empty-state">
          <Bed size={48} />
          <p>No rooms found matching your criteria</p>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Upload Rooms to Firebase</h2>
              <button 
                className="modal-close"
                onClick={() => setShowUploadModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <p>This will upload all room data from the local JSON file to Firebase Firestore.</p>
              
              {uploadStatus && (
                <div className={`status-message ${uploadStatus.type}`}>
                  <p>{uploadStatus.message}</p>
                  {uploadStatus.details && (
                    <div className="status-details">
                      <p>Rooms uploaded: {uploadStatus.details.rooms?.length || 0}</p>
                      <p>Room types uploaded: {uploadStatus.details.roomTypes?.length || 0}</p>
                      {uploadStatus.details.errors?.length > 0 && (
                        <div>
                          <p>Errors:</p>
                          <ul>
                            {uploadStatus.details.errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              <div className="modal-actions">
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleUploadToFirebase}
                  disabled={uploadStatus?.type === 'loading'}
                >
                  {uploadStatus?.type === 'loading' ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rooms;