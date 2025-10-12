const mysql = require('mysql2/promise');
require('dotenv').config();

async function clearData() {
  const config = {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'reem_resort',
    multipleStatements: true
  };

  const conn = await mysql.createConnection(config);
  try {
    console.log('Clearing all existing data...');
    
    // Delete all data in correct order (respecting foreign key constraints)
    await conn.query('DELETE FROM payments');
    await conn.query('DELETE FROM invoice_items');  
    await conn.query('DELETE FROM invoices');
    await conn.query('DELETE FROM bookings');
    await conn.query('DELETE FROM rooms');
    await conn.query('DELETE FROM customers');
    
    // Reset auto-increment counters
    await conn.query('ALTER TABLE customers AUTO_INCREMENT = 1');
    await conn.query('ALTER TABLE rooms AUTO_INCREMENT = 1');
    await conn.query('ALTER TABLE bookings AUTO_INCREMENT = 1');
    await conn.query('ALTER TABLE invoices AUTO_INCREMENT = 1');
    await conn.query('ALTER TABLE invoice_items AUTO_INCREMENT = 1');
    await conn.query('ALTER TABLE payments AUTO_INCREMENT = 1');
    
    console.log('✅ Database cleared successfully!');
    console.log('📝 Tables are now empty and ready for admin to add:');
    console.log('   - Rooms with custom types and prices');
    console.log('   - Customers/guests');
    console.log('   - Bookings and invoices');
    
  } catch (err) {
    console.error('❌ Error clearing database:', err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

clearData();