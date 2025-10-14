import { initDb } from '../db.js';

async function createBookingChargesTable() {
  try {
    console.log('🔧 Creating booking_charges table...');
    
    const pool = await initDb();
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS booking_charges (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id INT NOT NULL,
        description VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_booking_id (booking_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await pool.query(createTableSQL);
    console.log('✅ booking_charges table created successfully!');
    
    // Verify table exists
    const [tables] = await pool.query("SHOW TABLES LIKE 'booking_charges'");
    if (tables.length > 0) {
      console.log('✅ Verified: booking_charges table exists');
      
      // Show table structure
      const [structure] = await pool.query('DESCRIBE booking_charges');
      console.log('\n📋 Table Structure:');
      console.table(structure);
    } else {
      console.log('❌ Table creation failed');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  }
}

createBookingChargesTable();
