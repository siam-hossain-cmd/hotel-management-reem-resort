import express from 'express';
import { initDb, getPool } from '../db.js';

const router = express.Router();

// Get available rooms for specific date range - MUST be before /:id route
router.get('/available', async (req, res) => {
  try {
    const pool = getPool();
    const { checkin_date, checkout_date } = req.query;
    
    if (!checkin_date || !checkout_date) {
      return res.status(400).json({ success: false, error: 'Check-in and check-out dates are required' });
    }
    
    // Get all rooms that are not in maintenance
    const [allRooms] = await pool.query(
      'SELECT * FROM rooms WHERE status != ? ORDER BY room_number',
      ['maintenance']
    );
    
    // Get rooms that have conflicting bookings
    const [conflictedRooms] = await pool.query(`
      SELECT DISTINCT r.id as room_id
      FROM rooms r
      INNER JOIN bookings b ON r.id = b.room_id
      WHERE b.status IN ('confirmed', 'checked_in', 'paid')
      AND NOT (b.checkout_date <= ? OR b.checkin_date >= ?)
    `, [checkin_date, checkout_date]);
    
    // Filter out conflicted rooms
    const conflictedRoomIds = new Set(conflictedRooms.map(r => r.room_id));
    const availableRooms = allRooms.filter(room => !conflictedRoomIds.has(room.id));
    
    // Parse meta field and flatten it into room objects
    const roomsWithMeta = availableRooms.map(room => {
      let parsedMeta = {};
      if (room.meta) {
        try {
          parsedMeta = typeof room.meta === 'string' ? JSON.parse(room.meta) : room.meta;
        } catch (e) {
          console.error('Error parsing meta for room:', room.id, e);
        }
      }
      
      return {
        ...room,
        floor: parsedMeta.floor || room.floor,
        description: parsedMeta.description || room.description,
        meta: parsedMeta
      };
    });
    
    res.json({ success: true, rooms: roomsWithMeta });
  } catch (err) {
    console.error('Failed to fetch available rooms:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Public read-only endpoints for rooms
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM rooms ORDER BY room_number');
    
    // Parse meta field and flatten it into room object
    const roomsWithMeta = rows.map(room => {
      let parsedMeta = {};
      if (room.meta) {
        try {
          parsedMeta = typeof room.meta === 'string' ? JSON.parse(room.meta) : room.meta;
        } catch (e) {
          console.error('Error parsing meta for room:', room.id, e);
        }
      }
      
      return {
        ...room,
        floor: parsedMeta.floor || room.floor,
        description: parsedMeta.description || room.description,
        meta: parsedMeta
      };
    });
    
    res.json({ success: true, rooms: roomsWithMeta });
  } catch (err) {
    console.error('Failed to fetch rooms:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Room not found' });
    
    // Parse meta field and flatten it into room object
    const room = rows[0];
    let parsedMeta = {};
    if (room.meta) {
      try {
        parsedMeta = typeof room.meta === 'string' ? JSON.parse(room.meta) : room.meta;
      } catch (e) {
        console.error('Error parsing meta for room:', room.id, e);
      }
    }
    
    const roomWithMeta = {
      ...room,
      floor: parsedMeta.floor || room.floor,
      description: parsedMeta.description || room.description,
      meta: parsedMeta
    };
    
    res.json({ success: true, room: roomWithMeta });
  } catch (err) {
    console.error('Failed to fetch room:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add room endpoint (for now public, but could be protected later)
router.post('/', async (req, res) => {
  try {
    const pool = getPool();
    const { room_number, room_type, capacity, rate, status, meta } = req.body;
    
    if (!room_number || !room_type) {
      return res.status(400).json({ success: false, error: 'Room number and type are required' });
    }
    
    const [result] = await pool.query(
      `INSERT INTO rooms (room_number, room_type, capacity, rate, status, meta, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [room_number, room_type, capacity || 1, rate || 0, status || 'available', JSON.stringify(meta || {})]
    );
    
    res.status(201).json({ success: true, room_id: result.insertId });
  } catch (err) {
    console.error('Failed to create room:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ success: false, error: 'Room number already exists' });
    } else {
      res.status(500).json({ success: false, error: err.message });
    }
  }
});

// Update room endpoint
router.put('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { room_type, rate, capacity, status, meta, floor, description } = req.body;
    const roomId = req.params.id;
    
    console.log('📝 Update room request:', { roomId, floor, description, meta });
    
    if (!room_type || !rate || !capacity) {
      return res.status(400).json({ success: false, error: 'Room type, rate, and capacity are required' });
    }
    
    // First, get the current room data to preserve existing meta
    const [currentRoom] = await pool.query('SELECT meta FROM rooms WHERE id = ?', [roomId]);
    
    if (!currentRoom.length) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    
    // Build meta object with floor and description
    let metaObject = {};
    
    // Parse existing meta
    if (currentRoom[0].meta) {
      try {
        metaObject = typeof currentRoom[0].meta === 'string' ? JSON.parse(currentRoom[0].meta) : currentRoom[0].meta;
      } catch (e) {
        console.log('⚠️ Error parsing existing meta:', e);
      }
    }
    
    // Merge with new meta if provided
    if (meta) {
      const newMeta = typeof meta === 'string' ? JSON.parse(meta) : meta;
      metaObject = { ...metaObject, ...newMeta };
    }
    
    // Add floor and description to meta if provided
    if (floor !== undefined && floor !== null && floor !== '') {
      metaObject.floor = floor;
    }
    if (description !== undefined && description !== null && description !== '') {
      metaObject.description = description;
    }
    
    const metaJson = JSON.stringify(metaObject);
    console.log('💾 Saving meta:', metaJson);
    
    const [result] = await pool.query(
      'UPDATE rooms SET room_type = ?, rate = ?, capacity = ?, status = ?, meta = ? WHERE id = ?',
      [room_type, rate, capacity, status || 'available', metaJson, roomId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    
    console.log('✅ Room updated successfully, affectedRows:', result.affectedRows);
    res.json({ success: true, message: 'Room updated successfully' });
  } catch (err) {
    console.error('Failed to update room:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update room status endpoint
router.put('/:id/status', async (req, res) => {
  try {
    const pool = getPool();
    const { status } = req.body;
    const roomId = req.params.id;
    
    if (!status || !['available', 'occupied', 'maintenance'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Valid status is required (available, occupied, maintenance)' });
    }
    
    const [result] = await pool.query(
      'UPDATE rooms SET status = ? WHERE id = ?',
      [status, roomId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    
    res.json({ success: true, message: 'Room status updated successfully' });
  } catch (err) {
    console.error('Failed to update room status:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete room endpoint - permanently removes room from database
router.delete('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const roomId = req.params.id;
    
    // Check if room has any bookings
    const [bookings] = await pool.query(
      'SELECT COUNT(*) as count FROM bookings WHERE room_id = ?',
      [roomId]
    );
    
    if (bookings[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete room with existing bookings. Please cancel or complete all bookings first.' 
      });
    }
    
    // Delete the room
    const [result] = await pool.query(
      'DELETE FROM rooms WHERE id = ?',
      [roomId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    
    res.json({ success: true, message: 'Room deleted successfully' });
  } catch (err) {
    console.error('Failed to delete room:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
