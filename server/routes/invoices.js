import express from 'express';
import { getPool } from '../db.js';

const router = express.Router();

// Create a new invoice
router.post('/', async (req, res) => {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      booking_id,
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      customer_nid,
      invoice_date,
      due_date,
      items,
      notes,
      terms,
      created_by
    } = req.body;
    
    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;
    
    // Calculate totals from items
    const baseAmount = items.reduce((sum, item) => sum + parseFloat(item.base_amount || 0), 0);
    const discountAmount = items.reduce((sum, item) => sum + parseFloat(item.discount_amount || 0), 0);
    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    
    // Get additional charges for this booking
    const [charges] = await connection.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM booking_charges WHERE booking_id = ?',
      [booking_id]
    );
    const additionalChargesTotal = parseFloat(charges[0]?.total || 0);
    
    // Calculate tax (if any)
    const taxRate = 0; // You can change this
    const taxAmount = ((subtotal + additionalChargesTotal) * taxRate) / 100;
    
    // Calculate totals
    const totalAmount = subtotal + additionalChargesTotal + taxAmount;
    
    // Get total paid amount for this booking
    const [payments] = await connection.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE booking_id = ?',
      [booking_id]
    );
    const paidAmount = parseFloat(payments[0]?.total || 0);
    const dueAmount = totalAmount - paidAmount;
    
    // Determine status
    let status = 'unpaid';
    if (paidAmount >= totalAmount) {
      status = 'paid';
    } else if (paidAmount > 0) {
      status = 'partial';
    }
    
    // Insert invoice
    const [invoiceResult] = await connection.query(
      `INSERT INTO invoices (
        invoice_number, booking_id, customer_name, customer_email, customer_phone,
        customer_address, customer_nid, invoice_date, due_date,
        base_amount, discount_amount, subtotal, additional_charges_total,
        tax_rate, tax_amount, total_amount, paid_amount, due_amount,
        status, notes, terms, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceNumber, booking_id, customer_name, customer_email, customer_phone,
        customer_address, customer_nid, invoice_date, due_date,
        baseAmount, discountAmount, subtotal, additionalChargesTotal,
        taxRate, taxAmount, totalAmount, paidAmount, dueAmount,
        status, notes, terms, created_by
      ]
    );
    
    const invoiceId = invoiceResult.insertId;
    
    // Insert invoice items
    for (const item of items) {
      await connection.query(
        `INSERT INTO invoice_items (
          invoice_id, room_number, room_type, check_in_date, check_out_date,
          total_nights, guest_count, price_per_night, base_amount,
          discount_percentage, discount_amount, amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          invoiceId,
          item.room_number,
          item.room_type,
          item.check_in_date,
          item.check_out_date,
          item.total_nights,
          item.guest_count,
          item.price_per_night,
          item.base_amount,
          item.discount_percentage,
          item.discount_amount,
          item.amount
        ]
      );
    }
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Invoice created successfully',
      id: invoiceId,
      invoice_id: invoiceId,
      invoice_number: invoiceNumber
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error creating invoice:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    connection.release();
  }
});

// Get invoice by ID
router.get('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    
    // Get invoice with booking and customer details - Select all columns explicitly
    // 💰 RECALCULATE paid/due amounts based on actual payments
    const [invoices] = await pool.query(
      `SELECT 
              i.id, i.invoice_number, i.booking_id, i.customer_id, i.issued_at, i.due_at,
              i.total,
              COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.booking_id = i.booking_id AND p.status = 'completed'), 0) as paid,
              i.total - COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.booking_id = i.booking_id AND p.status = 'completed'), 0) as due,
              i.currency, i.status, i.paid_at, i.meta,
              i.snapshot_json, i.file_url, i.preview_url, i.created_at,
              i.tax_rate, i.tax_amount,
              b.booking_reference, b.checkin_date, b.checkout_date, b.base_amount, b.discount_percentage, 
              b.discount_amount, b.subtotal_amount, b.tax_rate as booking_tax_rate, b.tax_amount as booking_tax_amount, b.total_amount as booking_total,
              c.first_name, c.last_name, c.email, c.phone, c.address, c.nid,
              r.room_number, r.room_type, r.capacity
       FROM invoices i
       LEFT JOIN bookings b ON i.booking_id = b.id
       LEFT JOIN customers c ON b.customer_id = c.id
       LEFT JOIN rooms r ON b.room_id = r.id
       WHERE i.id = ?`,
      [id]
    );
    
    console.log('🔍 Raw SQL result for invoice', id, ':', {
      first_name: invoices[0]?.first_name,
      last_name: invoices[0]?.last_name,
      email: invoices[0]?.email,
      room_number: invoices[0]?.room_number,
      checkin_date: invoices[0]?.checkin_date,
      checkout_date: invoices[0]?.checkout_date
    });
    
    if (invoices.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }
    
    const invoice = invoices[0];
    
    // Parse meta JSON if it exists
    let metaData = {};
    if (invoice.meta) {
      try {
        metaData = typeof invoice.meta === 'string' ? JSON.parse(invoice.meta) : invoice.meta;
      } catch (e) {
        console.log('Failed to parse invoice meta:', e);
      }
    }
    
    // Get invoice items
    const [items] = await pool.query(
      'SELECT * FROM invoice_items WHERE invoice_id = ?',
      [id]
    );
    
    // Get additional charges
    const [charges] = await pool.query(
      'SELECT * FROM booking_charges WHERE booking_id = ? ORDER BY created_at DESC',
      [invoice.booking_id]
    );
    
    // Get payments with dates
    const [payments] = await pool.query(
      'SELECT id, booking_id, amount, method, gateway, gateway_payment_id, notes, processed_at, received_by, created_at as payment_date FROM payments WHERE booking_id = ? ORDER BY created_at DESC',
      [invoice.booking_id]
    );
    
    // Merge all data - IMPORTANT: Spread metaData first, then invoice to prioritize JOIN data
    console.log('📊 Invoice base data:', {
      first_name: invoice.first_name,
      last_name: invoice.last_name,
      email: invoice.email,
      room_number: invoice.room_number,
      checkin_date: invoice.checkin_date,
      checkout_date: invoice.checkout_date
    });
    console.log('📋 Meta data:', metaData);
    
    const responseData = {
      ...metaData, // Spread meta data first (fallback)
      ...invoice, // Then spread invoice to override with JOIN data (priority)
      items,
      charges,
      payments
    };
    
    console.log('✅ Final response data:', {
      invoice_number: responseData.invoice_number,
      booking_id: responseData.booking_id,
      first_name: responseData.first_name,
      last_name: responseData.last_name,
      email: responseData.email,
      room_number: responseData.room_number,
      checkin_date: responseData.checkin_date,
      checkout_date: responseData.checkout_date
    });
    
    res.json({
      success: true,
      invoice: responseData
    });
    
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get invoice by booking ID
router.get('/booking/:booking_id', async (req, res) => {
  const pool = getPool();
  const conn = await pool.getConnection();
  
  try {
    const { booking_id } = req.params;
    
    // Get latest invoice for this booking
    // Try to get existing invoice for this booking WITH FULL JOIN DATA
    // 💰 RECALCULATE paid/due amounts based on actual payments
    let [invoices] = await conn.query(
      `SELECT 
        i.id, i.invoice_number, i.booking_id, i.customer_id, i.issued_at, i.due_at,
        i.total, 
        COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.booking_id = i.booking_id AND p.status = 'completed'), 0) as paid,
        i.total - COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.booking_id = i.booking_id AND p.status = 'completed'), 0) as due,
        i.currency, i.status, i.paid_at, i.meta,
        i.snapshot_json, i.file_url, i.preview_url, i.created_at,
        i.tax_rate, i.tax_amount,
        b.booking_reference, b.checkin_date, b.checkout_date, b.base_amount, b.discount_percentage, 
        b.discount_amount, b.subtotal_amount, b.tax_rate as booking_tax_rate, b.tax_amount as booking_tax_amount, b.total_amount as booking_total,
        c.first_name, c.last_name, c.email, c.phone, c.address, c.nid,
        r.room_number, r.room_type, r.capacity, r.rate
       FROM invoices i
       LEFT JOIN bookings b ON i.booking_id = b.id
       LEFT JOIN customers c ON b.customer_id = c.id
       LEFT JOIN rooms r ON b.room_id = r.id
       WHERE i.booking_id = ? 
       ORDER BY i.created_at DESC 
       LIMIT 1`,
      [booking_id]
    );
    
    // 🆕 AUTO-CREATE INVOICE if not found
    if (invoices.length === 0) {
      console.log(`⚠️ No invoice found for booking ${booking_id} - Auto-creating...`);
      
      await conn.beginTransaction();
      
      try {
        // Get booking details
        const [bookings] = await conn.query(
          `SELECT b.*, c.first_name, c.last_name, c.email, c.phone, c.address, c.nid,
                  r.room_number, r.room_type, r.rate,
                  (SELECT SUM(p.amount) FROM payments p WHERE p.booking_id = b.id AND p.status = 'completed') as paid_amount
           FROM bookings b
           LEFT JOIN customers c ON b.customer_id = c.id
           LEFT JOIN rooms r ON b.room_id = r.id
           WHERE b.id = ?`,
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
        const totalPaid = parseFloat(booking.paid_amount) || 0;
        const totalAmount = parseFloat(booking.total_amount) || 0;
        const dueAmount = totalAmount - totalPaid;
        const taxRate = parseFloat(booking.tax_rate) || 0;
        const taxAmount = parseFloat(booking.tax_amount) || 0;
        
        // Determine invoice status
        let invoiceStatus = 'issued';
        if (dueAmount <= 0) {
          invoiceStatus = 'paid';
        } else if (totalPaid > 0) {
          invoiceStatus = 'partial';
        }
        
        // Generate invoice number with booking ID for easy reference
        // Format: INV-[BookingID]-[Timestamp]
        const invoiceNumber = `INV-${booking_id}-${Date.now().toString().slice(-6)}`;
        
        console.log(`🔢 Generated Invoice Number: ${invoiceNumber} for Booking ID: ${booking_id}`);
        
        // Create invoice
        const [invoiceResult] = await conn.query(
          `INSERT INTO invoices (invoice_number, booking_id, customer_id, issued_at, total, paid, due, tax_rate, tax_amount, currency, status, created_at, updated_at)
           VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [invoiceNumber, booking_id, booking.customer_id, totalAmount, totalPaid, dueAmount, taxRate, taxAmount, 'BDT', invoiceStatus]
        );
        
        const invoiceId = invoiceResult.insertId;
        console.log(`✅ Invoice auto-created: ${invoiceNumber} (ID: ${invoiceId})`);
        
        // Create invoice item for room booking
        const checkIn = new Date(booking.checkin_date);
        const checkOut = new Date(booking.checkout_date);
        const totalNights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        
        const baseAmount = parseFloat(booking.base_amount) || totalAmount;
        const discountAmount = parseFloat(booking.discount_amount) || 0;
        const discountPercentage = parseFloat(booking.discount_percentage) || 0;
        const pricePerNight = totalNights > 0 ? baseAmount / totalNights : baseAmount;
        
        await conn.query(
          `INSERT INTO invoice_items (invoice_id, room_number, room_type, check_in_date, check_out_date, total_nights, guest_count, price_per_night, base_amount, discount_percentage, discount_amount, amount, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [invoiceId, booking.room_number, booking.room_type, booking.checkin_date, booking.checkout_date, totalNights, 1, pricePerNight, baseAmount, discountPercentage, discountAmount, baseAmount]
        );
        
        await conn.commit();
        
        // Re-fetch the newly created invoice WITH FULL JOIN DATA
        [invoices] = await conn.query(
          `SELECT 
            i.id, i.invoice_number, i.booking_id, i.customer_id, i.issued_at, i.due_at,
            i.total, 
            COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.booking_id = i.booking_id AND p.status = 'completed'), 0) as paid,
            i.total - COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.booking_id = i.booking_id AND p.status = 'completed'), 0) as due,
            i.currency, i.status, i.paid_at, i.meta,
            i.snapshot_json, i.file_url, i.preview_url, i.created_at,
            b.booking_reference, b.checkin_date, b.checkout_date, b.base_amount, b.discount_percentage, 
            b.discount_amount, b.total_amount as booking_total,
            c.first_name, c.last_name, c.email, c.phone, c.address, c.nid,
            r.room_number, r.room_type, r.capacity, r.rate
           FROM invoices i
           LEFT JOIN bookings b ON i.booking_id = b.id
           LEFT JOIN customers c ON b.customer_id = c.id
           LEFT JOIN rooms r ON b.room_id = r.id
           WHERE i.id = ?`,
          [invoiceId]
        );
      } catch (error) {
        await conn.rollback();
        throw error;
      }
    }
    
    const invoice = invoices[0];
    
    // Get invoice items
    const [items] = await conn.query(
      'SELECT * FROM invoice_items WHERE invoice_id = ?',
      [invoice.id]
    );
    
    // Get additional charges with dates
    const [charges] = await conn.query(
      'SELECT id, description, amount, created_at FROM booking_charges WHERE booking_id = ? ORDER BY created_at DESC',
      [booking_id]
    );
    
    // Get payments with dates
    const [payments] = await conn.query(
      'SELECT id, booking_id, amount, gateway as method, gateway_payment_id as reference, gateway_payment_id as notes, status, processed_at as created_at FROM payments WHERE booking_id = ? ORDER BY processed_at DESC',
      [booking_id]
    );
    
    console.log('💰 PAYMENTS FETCHED FROM DB:', {
      booking_id,
      payment_count: payments.length,
      payments: payments
    });
    
    console.log('📋 INVOICE DATA BEING SENT:', {
      invoice_number: invoice.invoice_number,
      booking_id: invoice.booking_id,
      id: invoice.id
    });
    
    res.json({
      success: true,
      invoice: {
        ...invoice,
        items,
        charges,
        payments
      }
    });
    
  } catch (error) {
    console.error('Error fetching/creating invoice:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    conn.release();
  }
});

// Get all invoices
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const [invoices] = await pool.query(
      `SELECT 
        i.id,
        i.invoice_number,
        i.booking_id,
        i.customer_id,
        i.issued_at,
        i.total,
        COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.booking_id = i.booking_id AND p.status = 'completed'), 0) as paid,
        i.total - COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.booking_id = i.booking_id AND p.status = 'completed'), 0) as due,
        i.currency,
        i.status,
        i.created_at,
        i.tax_rate,
        i.tax_amount,
        b.booking_reference,
        b.checkin_date,
        b.checkout_date,
        b.customer_id as booking_customer_id,
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        r.room_number,
        r.room_type
      FROM invoices i
      LEFT JOIN bookings b ON i.booking_id = b.id
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN rooms r ON b.room_id = r.id
      ORDER BY i.created_at DESC`
    );
    
    console.log('📋 Invoices API - Sample data:', {
      count: invoices.length,
      sample: invoices[0] ? {
        id: invoices[0].id,
        invoice_number: invoices[0].invoice_number,
        booking_id: invoices[0].booking_id,
        customer_id: invoices[0].customer_id,
        booking_customer_id: invoices[0].booking_customer_id,
        first_name: invoices[0].first_name,
        last_name: invoices[0].last_name,
        email: invoices[0].email
      } : 'No invoices'
    });
    
    res.json({
      success: true,
      invoices
    });
    
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update invoice status
router.patch('/:id/status', async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { status } = req.body;
    
    await pool.query(
      'UPDATE invoices SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );
    
    res.json({
      success: true,
      message: 'Invoice status updated'
    });
    
  } catch (error) {
    console.error('Error updating invoice status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete invoice
router.delete('/:id', async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('DELETE FROM invoices WHERE id = ?', [req.params.id]);
    
    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
