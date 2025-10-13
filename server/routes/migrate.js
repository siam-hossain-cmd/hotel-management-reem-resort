import express from 'express';
import { getPool } from '../db.js';

// Add a migration endpoint to the server
const router = express.Router();

router.post('/add-customer-fields', async (req, res) => {
  const pool = getPool();
  
  try {
    // Add address column
    await pool.query(`
      ALTER TABLE customers 
      ADD COLUMN address TEXT NULL AFTER phone
    `);
    console.log('Added address column');
    
    // Add nid column  
    await pool.query(`
      ALTER TABLE customers 
      ADD COLUMN nid VARCHAR(50) NULL AFTER address
    `);
    console.log('Added nid column');
    
    res.json({ success: true, message: 'Successfully added customer fields' });
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      res.json({ success: true, message: 'Columns already exist' });
    } else {
      console.error('Error adding customer fields:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
});

export default router;