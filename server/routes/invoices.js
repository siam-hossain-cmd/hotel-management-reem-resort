import express from 'express';
import { getPool } from '../db.js';

const router = express.Router();

// Get all invoices
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT i.*, 
             c.first_name, c.last_name, c.email, c.phone,
             b.checkin_date, b.checkout_date, b.room_id
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id  
      LEFT JOIN bookings b ON i.booking_id = b.id
      ORDER BY i.created_at DESC
    `);
    res.json({ success: true, invoices: rows });
  } catch (err) {
    console.error('Get invoices failed:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create invoice
router.post('/', async (req, res) => {
  try {
    const pool = getPool();
    const { booking_id, customer_id, issued_at, due_at, total, currency, status } = req.body;
    const [result] = await pool.query(
      `INSERT INTO invoices (booking_id, customer_id, issued_at, due_at, total, currency, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [booking_id, customer_id, issued_at || new Date(), due_at || null, total, currency || 'BDT', status || 'issued']
    );
    res.status(201).json({ success: true, invoice_id: result.insertId });
  } catch (err) {
    console.error('Create invoice failed:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get invoice
router.get('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, error: 'Invoice not found' });
    res.json({ success: true, invoice: rows[0] });
  } catch (err) {
    console.error('Get invoice failed:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
