import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function addDiscountFields() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      port: process.env.MYSQL_PORT || 3306
    });

    console.log('✅ Connected successfully!');
    console.log('📝 Adding discount fields to bookings table...');

    // Add columns
    await connection.query(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS base_amount DECIMAL(12,2) DEFAULT 0 COMMENT 'Original room price before discount',
      ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2) DEFAULT 0 COMMENT 'Discount percentage applied',
      ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12,2) DEFAULT 0 COMMENT 'Discount amount in currency'
    `);

    console.log('✅ Discount fields added successfully!');

    // Update existing bookings
    console.log('🔄 Updating existing bookings...');
    const [result] = await connection.query(`
      UPDATE bookings 
      SET base_amount = total_amount 
      WHERE base_amount = 0 OR base_amount IS NULL
    `);

    console.log(`✅ Updated ${result.affectedRows} existing bookings!`);

    // Verify the structure
    console.log('\n📊 Verifying bookings table structure:');
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_COMMENT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'bookings' 
      AND COLUMN_NAME IN ('base_amount', 'discount_percentage', 'discount_amount', 'total_amount')
      ORDER BY ORDINAL_POSITION
    `, [process.env.MYSQL_DATABASE]);

    console.table(columns);

    console.log('\n✅ Migration completed successfully! ✅');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

addDiscountFields();
