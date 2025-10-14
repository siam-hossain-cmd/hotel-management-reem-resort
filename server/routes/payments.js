import express from 'express';
import { getPool } from '../db.js';

const router = express.Router();

// Add payment to a booking
router.post('/', async (req, res) => {
  const pool = getPool();
  const conn = await pool.getConnection();
  
  try {
    const { booking_id, amount, method, reference, notes } = req.body;

    // Validate required fields
    if (!booking_id || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: booking_id and amount are required'
      });
    }

    await conn.beginTransaction();

    // Verify booking exists
    const [bookings] = await conn.query(
      'SELECT id, total_amount FROM bookings WHERE id = ?',
      [booking_id]
    );

    if (bookings.length === 0) {
      await conn.rollback();
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    const booking = bookings[0];

    // Insert payment
    const [paymentResult] = await conn.query(
      `INSERT INTO payments (booking_id, amount, gateway, gateway_payment_id, status, processed_at, currency, created_at)
       VALUES (?, ?, ?, ?, ?, NOW(), ?, NOW())`,
      [
        booking_id,
        amount,
        method || 'cash',
        notes || reference || '',
        'completed',
        'BDT'
      ]
    );

    // Get total paid amount for this booking
    const [payments] = await conn.query(
      'SELECT SUM(amount) as total_paid FROM payments WHERE booking_id = ? AND status = "completed"',
      [booking_id]
    );

    const totalPaid = parseFloat(payments[0].total_paid) || 0;
    const totalAmount = parseFloat(booking.total_amount) || 0;
    const dueAmount = totalAmount - totalPaid;

    // Update booking payment status based on amount paid
    let paymentStatus = 'unpaid';
    if (totalPaid >= totalAmount) {
      paymentStatus = 'paid';
    } else if (totalPaid > 0) {
      paymentStatus = 'partial';
    }

    await conn.query(
      'UPDATE bookings SET updated_at = NOW() WHERE id = ?',
      [booking_id]
    );

    // 🧾 AUTO-UPDATE INVOICE
    // Find the invoice for this booking
    const [invoices] = await conn.query(
      'SELECT id FROM invoices WHERE booking_id = ?',
      [booking_id]
    );

    if (invoices.length > 0) {
      const invoiceId = invoices[0].id;
      
      // Update invoice with new paid amount, due amount, and status
      let invoiceStatus = 'issued';
      if (dueAmount <= 0) {
        invoiceStatus = 'paid';
      } else if (totalPaid > 0) {
        invoiceStatus = 'partial';
      }

      await conn.query(
        'UPDATE invoices SET paid = ?, due = ?, status = ?, updated_at = NOW() WHERE id = ?',
        [totalPaid, dueAmount, invoiceStatus, invoiceId]
      );
      
      console.log(`✅ Invoice #${invoiceId} auto-updated: paid=${totalPaid}, due=${dueAmount}, status=${invoiceStatus}`);
    } else {
      // 🆕 AUTO-CREATE INVOICE if it doesn't exist
      console.log('⚠️ No invoice found for booking', booking_id, '- Creating one now...');
      
      const invoiceNumber = `INV${Date.now().toString().slice(-6)}${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
      
      // Get customer_id from booking
      const [bookingDetails] = await conn.query(
        'SELECT customer_id FROM bookings WHERE id = ?',
        [booking_id]
      );
      
      if (bookingDetails.length > 0) {
        const customerId = bookingDetails[0].customer_id;
        
        let invoiceStatus = 'issued';
        if (dueAmount <= 0) {
          invoiceStatus = 'paid';
        } else if (totalPaid > 0) {
          invoiceStatus = 'partial';
        }
        
        await conn.query(
          `INSERT INTO invoices (invoice_number, booking_id, customer_id, issued_at, total, paid, due, currency, status, created_at, updated_at)
           VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, NOW(), NOW())`,
          [invoiceNumber, booking_id, customerId, totalAmount, totalPaid, dueAmount, 'BDT', invoiceStatus]
        );
        
        console.log(`✅ Invoice auto-created for booking #${booking_id}: ${invoiceNumber}`);
      }
    }

    await conn.commit();

    res.json({
      success: true,
      payment: {
        id: paymentResult.insertId,
        booking_id,
        amount,
        method,
        status: 'completed',
        total_paid: totalPaid,
        payment_status: paymentStatus
      }
    });

  } catch (err) {
    await conn.rollback();
    console.error('Failed to add payment:', err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

// Get payments for a booking
router.get('/booking/:bookingId', async (req, res) => {
  try {
    const pool = getPool();
    const bookingId = req.params.bookingId;

    const [payments] = await pool.query(
      'SELECT * FROM payments WHERE booking_id = ? ORDER BY processed_at DESC',
      [bookingId]
    );

    res.json({ success: true, payments });
  } catch (err) {
    console.error('Failed to fetch payments:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
