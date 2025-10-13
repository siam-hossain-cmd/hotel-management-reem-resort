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
    
    res.json({ success: true, rooms: availableRooms });
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
    res.json({ success: true, rooms: rows });
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
    res.json({ success: true, room: rows[0] });
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
    const { room_type, rate, capacity, status, meta } = req.body;
    const roomId = req.params.id;
    
    if (!room_type || !rate || !capacity) {
      return res.status(400).json({ success: false, error: 'Room type, rate, and capacity are required' });
    }
    
    const metaJson = typeof meta === 'string' ? meta : JSON.stringify(meta || {});
    
    const [result] = await pool.query(
      'UPDATE rooms SET room_type = ?, rate = ?, capacity = ?, status = ?, meta = ? WHERE id = ?',
      [room_type, rate, capacity, status || 'available', metaJson, roomId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }
    
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

export default router;
