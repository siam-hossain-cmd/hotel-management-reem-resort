const express = require('express');
const router = express.Router();
const { getPool } = require('../db');

// Get all customers
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT c.*, 
             COUNT(b.id) as total_bookings,
             MAX(b.checkout_date) as last_visit
      FROM customers c
      LEFT JOIN bookings b ON c.id = b.customer_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
    res.json({ success: true, customers: rows });
  } catch (err) {
    console.error('Failed to fetch customers:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const [customer] = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (!customer.length) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    
    // Get customer's bookings
    const [bookings] = await pool.query(`
      SELECT b.*, r.room_number, r.room_type
      FROM bookings b
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE b.customer_id = ?
      ORDER BY b.created_at DESC
    `, [req.params.id]);
    
    res.json({ 
      success: true, 
      customer: { 
        ...customer[0], 
        bookings 
      } 
    });
  } catch (err) {
    console.error('Failed to fetch customer:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create customer
router.post('/', async (req, res) => {
  try {
    const pool = getPool();
    const { first_name, last_name, email, phone } = req.body;
    
    if (!first_name || !last_name) {
      return res.status(400).json({ success: false, error: 'First name and last name are required' });
    }
    
    // Check if customer with email already exists
    if (email) {
      const [existing] = await pool.query('SELECT id FROM customers WHERE email = ?', [email]);
      if (existing.length > 0) {
        return res.status(409).json({ success: false, error: 'Customer with this email already exists' });
      }
    }
    
    const [result] = await pool.query(
      'INSERT INTO customers (first_name, last_name, email, phone, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [first_name, last_name, email, phone]
    );
    
    res.status(201).json({ success: true, customer_id: result.insertId });
  } catch (err) {
    console.error('Failed to create customer:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { first_name, last_name, email, phone } = req.body;
    
    const [result] = await pool.query(
      'UPDATE customers SET first_name = ?, last_name = ?, email = ?, phone = ?, updated_at = NOW() WHERE id = ?',
      [first_name, last_name, email, phone, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    
    res.json({ success: true, message: 'Customer updated successfully' });
  } catch (err) {
    console.error('Failed to update customer:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;