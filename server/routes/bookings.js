const express = require('express');
const router = express.Router();
const { getPool } = require('../db');

// Get all bookings
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT b.*, c.first_name, c.last_name, c.email, c.phone, 
             r.room_number, r.room_type
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN rooms r ON b.room_id = r.id
      ORDER BY b.created_at DESC
    `);
    res.json({ success: true, bookings: rows });
  } catch (err) {
    console.error('Failed to fetch bookings:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create booking with auto customer creation and room status update
router.post('/', async (req, res) => {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    const { 
      guestInfo, 
      room_id, 
      checkin_date, 
      checkout_date, 
      total_amount,
      original_amount,
      discount_percentage = 0,
      discount_amount = 0,
      currency = 'BDT',
      auto_checkin = false,
      payment_method = 'cash',
      paid_amount = 0,
      payment_status = 'pending'
    } = req.body;
    
    if (!guestInfo || !room_id || !checkin_date || !checkout_date) {
      return res.status(400).json({ success: false, error: 'Missing required fields: guestInfo, room_id, checkin_date, checkout_date' });
    }

    await conn.beginTransaction();

    // Check if room exists and is available
    const [roomCheck] = await conn.query(
      'SELECT id, room_number, room_type, status FROM rooms WHERE id = ? FOR UPDATE',
      [room_id]
    );
    
    if (roomCheck.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    const room = roomCheck[0];

    // Check for overlapping confirmed bookings for the room
    const [conflicts] = await conn.query(
      `SELECT id FROM bookings WHERE room_id = ? AND status IN ('confirmed','paid','checked_in') 
       AND NOT (checkout_date <= ? OR checkin_date >= ?) FOR UPDATE`,
      [room_id, checkin_date, checkout_date]
    );

    if (conflicts.length > 0) {
      await conn.rollback();
      return res.status(409).json({ success: false, error: 'Room not available for selected dates', conflicts });
    }

    // Create or find customer
    let customer_id;
    if (guestInfo.email) {
      // Check if customer exists
      const [existingCustomer] = await conn.query(
        'SELECT id FROM customers WHERE email = ?',
        [guestInfo.email]
      );
      
      if (existingCustomer.length > 0) {
        customer_id = existingCustomer[0].id;
        // Update customer info
        await conn.query(
          'UPDATE customers SET first_name = ?, last_name = ?, phone = ?, address = ?, nid = ?, updated_at = NOW() WHERE id = ?',
          [guestInfo.first_name, guestInfo.last_name, guestInfo.phone, guestInfo.address || null, guestInfo.nid || null, customer_id]
        );
      } else {
        // Create new customer
        const [customerResult] = await conn.query(
          'INSERT INTO customers (first_name, last_name, email, phone, address, nid, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
          [guestInfo.first_name, guestInfo.last_name, guestInfo.email, guestInfo.phone, guestInfo.address || null, guestInfo.nid || null]
        );
        customer_id = customerResult.insertId;
      }
    } else {
      // Create customer without email
      const [customerResult] = await conn.query(
        'INSERT INTO customers (first_name, last_name, phone, address, nid, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
        [guestInfo.first_name, guestInfo.last_name, guestInfo.phone, guestInfo.address || null, guestInfo.nid || null]
      );
      customer_id = customerResult.insertId;
    }

    // Generate booking reference
    const bookingRef = `BK${Date.now().toString().slice(-6)}${Math.random().toString(36).substr(2, 3).toUpperCase()}`;

    // Insert booking
    const bookingStatus = auto_checkin ? 'checked_in' : 'confirmed';
    const [bookingResult] = await conn.query(
      `INSERT INTO bookings (booking_reference, customer_id, room_id, status, checkin_date, checkout_date, total_amount, currency, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [bookingRef, customer_id, room_id, bookingStatus, checkin_date, checkout_date, total_amount || 0, currency]
    );

    const bookingId = bookingResult.insertId;

    // Update room status to occupied if auto check-in or immediate booking
    const newRoomStatus = auto_checkin || new Date(checkin_date) <= new Date() ? 'occupied' : room.status;
    if (newRoomStatus !== room.status) {
      await conn.query(
        'UPDATE rooms SET status = ? WHERE id = ?',
        [newRoomStatus, room_id]
      );
    }

    // Create invoice for the booking
    const invoiceNumber = `INV${Date.now().toString().slice(-6)}${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
    const [invoiceResult] = await conn.query(
      `INSERT INTO invoices (invoice_number, booking_id, customer_id, issued_at, total, currency, status, created_at)
       VALUES (?, ?, ?, NOW(), ?, ?, 'issued', NOW())`,
      [invoiceNumber, bookingId, customer_id, total_amount || 0, currency]
    );

    await conn.commit();
    
    res.status(201).json({ 
      success: true, 
      booking: {
        id: bookingId,
        booking_reference: bookingRef,
        customer_id,
        room_id,
        room_number: room.room_number,
        room_type: room.room_type,
        status: bookingStatus,
        checkin_date,
        checkout_date,
        total_amount,
        currency
      },
      invoice_id: invoiceResult.insertId,
      invoice_number: invoiceNumber
    });
  } catch (err) {
    await conn.rollback();
    console.error('Booking creation failed:', err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

// Update booking status (and room status accordingly)
router.put('/:id/status', async (req, res) => {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    const { status } = req.body;
    const bookingId = req.params.id;
    
    if (!['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    await conn.beginTransaction();

    // Get booking details
    const [booking] = await conn.query(
      'SELECT id, room_id, status as current_status FROM bookings WHERE id = ? FOR UPDATE',
      [bookingId]
    );

    if (booking.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const currentBooking = booking[0];

    // Update booking status
    await conn.query(
      'UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, bookingId]
    );

    // Update room status based on booking status
    let newRoomStatus;
    switch (status) {
      case 'checked_in':
        newRoomStatus = 'occupied';
        break;
      case 'checked_out':
      case 'cancelled':
        newRoomStatus = 'available';
        break;
      default:
        newRoomStatus = null; // Don't change room status
    }

    if (newRoomStatus) {
      await conn.query(
        'UPDATE rooms SET status = ? WHERE id = ?',
        [newRoomStatus, currentBooking.room_id]
      );
    }

    await conn.commit();
    res.json({ success: true, message: 'Booking status updated successfully' });
  } catch (err) {
    await conn.rollback();
    console.error('Failed to update booking status:', err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
