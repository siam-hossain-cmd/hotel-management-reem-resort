import express from 'express';
import { getPool } from '../db.js';

const router = express.Router();

// Get all bookings
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT 
        b.*, 
        c.first_name, 
        c.last_name, 
        c.email, 
        c.phone, 
        r.room_number, 
        r.room_type,
        (SELECT SUM(p.amount) FROM payments p WHERE p.booking_id = b.id) as paid_amount
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

// Get a single booking by ID
router.get('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const bookingId = req.params.id;

    const [rows] = await pool.query(`
      SELECT 
        b.*, 
        c.first_name, 
        c.last_name, 
        c.email, 
        c.phone, 
        c.address,
        r.room_number, 
        r.room_type,
        (SELECT SUM(p.amount) FROM payments p WHERE p.booking_id = b.id) as paid_amount
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE b.id = ?
    `, [bookingId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // Also fetch payment history
    const [payments] = await pool.query('SELECT * FROM payments WHERE booking_id = ? ORDER BY processed_at DESC', [bookingId]);

    const booking = rows[0];
    booking.payments = payments;

    res.json({ success: true, booking });
  } catch (err) {
    console.error(`Failed to fetch booking ${req.params.id}:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create booking with auto customer creation and room status update
router.post('/', async (req, res) => {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    console.log('🔵 Booking creation request received');
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    
    const { 
      first_name,
      last_name,
      email,
      phone,
      address,
      id_type,
      id_number,
      special_requests,
      room_number,
      room_type,
      checkin_date, 
      checkout_date, 
      capacity,
      total_amount,
      paid_amount,
      payment_status,
      status,
      created_by,
      payments,
    } = req.body;
    
    const guestInfo = {
        first_name,
        last_name,
        email,
        phone,
        address,
        id_type,
        id_number,
        special_requests,
    };

    // Validate required fields
    if (!first_name || !last_name || !phone || !room_number || !checkin_date || !checkout_date) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: first_name, last_name, phone, room_number, checkin_date, checkout_date' 
      });
    }

    await conn.beginTransaction();

    // Check if room exists and is available
    const [roomCheck] = await conn.query(
      'SELECT id, room_number, room_type, status FROM rooms WHERE room_number = ? FOR UPDATE',
      [room_number]
    );
    
    if (roomCheck.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    const room = roomCheck[0];
    const room_id = room.id;

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
          [guestInfo.first_name, guestInfo.last_name, guestInfo.phone, guestInfo.address || null, guestInfo.id_number || null, customer_id]
        );
      } else {
        // Create new customer
        const [customerResult] = await conn.query(
          'INSERT INTO customers (first_name, last_name, email, phone, address, nid, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
          [guestInfo.first_name, guestInfo.last_name, guestInfo.email, guestInfo.phone, guestInfo.address || null, guestInfo.id_number || null]
        );
        customer_id = customerResult.insertId;
      }
    } else {
      // Create customer without email
      const [customerResult] = await conn.query(
        'INSERT INTO customers (first_name, last_name, phone, address, nid, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
        [guestInfo.first_name, guestInfo.last_name, guestInfo.phone, guestInfo.address || null, guestInfo.id_number || null]
      );
      customer_id = customerResult.insertId;
    }

    // Generate booking reference
    const bookingRef = `BK${Date.now().toString().slice(-6)}${Math.random().toString(36).substr(2, 3).toUpperCase()}`;

    // Insert booking WITHOUT paid_amount first (we'll calculate it from payments table)
    const [bookingResult] = await conn.query(
      `INSERT INTO bookings (booking_reference, customer_id, room_id, status, checkin_date, checkout_date, total_amount, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [bookingRef, customer_id, room_id, status, checkin_date, checkout_date, total_amount || 0]
    );

    const bookingId = bookingResult.insertId;

    // Calculate actual paid amount from payments array
    let calculatedPaidAmount = 0;
    
    // Insert payments if they exist in the payments array
    console.log('📊 Payment data received:', JSON.stringify(payments, null, 2));
    if (payments && payments.length > 0) {
        for (const payment of payments) {
            console.log('💳 Inserting payment:', {
                bookingId,
                amount: payment.amount,
                method: payment.method,
                notes: payment.notes || payment.description
            });
            
            await conn.query(
                'INSERT INTO payments (booking_id, amount, gateway, gateway_payment_id, status, processed_at, currency) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                    bookingId, 
                    payment.amount, 
                    payment.method || 'cash', // Store payment method in gateway field
                    payment.notes || payment.description || '', // Store notes/description in gateway_payment_id
                    'completed', // Mark as completed since it's a direct payment
                    new Date(), // Use current time as processed_at
                    'BDT'
                ]
            );
            calculatedPaidAmount += parseFloat(payment.amount) || 0;
        }
        console.log('✅ Total paid amount calculated:', calculatedPaidAmount);
    } else {
        console.log('⚠️ No payments array provided or empty array');
    }

    // Calculate payment status based on actual paid amount
    let calculatedPaymentStatus = 'unpaid';
    if (calculatedPaidAmount >= (total_amount || 0)) {
        calculatedPaymentStatus = 'paid';
    } else if (calculatedPaidAmount > 0) {
        calculatedPaymentStatus = 'partial';
    }

    // Note: paid_amount is calculated dynamically in GET queries from payments table
    // We don't store it in the bookings table to avoid data inconsistency

    // Update room status to occupied if booking is for today or in the past
    const today = new Date();
    today.setHours(0,0,0,0);
    if (new Date(checkin_date) <= today) {
        await conn.query(
            'UPDATE rooms SET status = ? WHERE id = ?',
            ['occupied', room_id]
        );
    }

    // Create invoice for the booking
    const invoiceNumber = `INV${Date.now().toString().slice(-6)}${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
    const [invoiceResult] = await conn.query(
      `INSERT INTO invoices (invoice_number, booking_id, customer_id, issued_at, total, currency, status, created_at)
       VALUES (?, ?, ?, NOW(), ?, ?, 'issued', NOW())`,
      [invoiceNumber, bookingId, customer_id, total_amount || 0, 'BDT']
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
        status: status,
        checkin_date,
        checkout_date,
        total_amount,
        paid_amount: calculatedPaidAmount,
        payment_status: calculatedPaymentStatus,
        currency: 'BDT'
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

// Delete a booking by ID
router.delete('/:id', async (req, res) => {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    const bookingId = req.params.id;
    await conn.beginTransaction();

    // Check if booking exists
    const [bookingRows] = await conn.query('SELECT id, room_id FROM bookings WHERE id = ? FOR UPDATE', [bookingId]);
    if (bookingRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    const roomId = bookingRows[0].room_id;

    // Delete related invoices
    await conn.query('DELETE FROM invoices WHERE booking_id = ?', [bookingId]);

    // Delete the booking
    await conn.query('DELETE FROM bookings WHERE id = ?', [bookingId]);

    // Optionally, set room status to available if no other active bookings for this room
    const [activeBookings] = await conn.query(
      "SELECT id FROM bookings WHERE room_id = ? AND status IN ('confirmed','checked_in')",
      [roomId]
    );
    if (activeBookings.length === 0) {
      await conn.query('UPDATE rooms SET status = ? WHERE id = ?', ['available', roomId]);
    }

    await conn.commit();
    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (err) {
    await conn.rollback();
    console.error('Failed to delete booking:', err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

export default router;
