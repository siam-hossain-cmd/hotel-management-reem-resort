import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function addCreatedByColumn() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE
    });
    
    console.log('✅ Connected to database');
    
    // Add created_by column
    console.log('📝 Adding created_by column to bookings table...');
    await connection.query(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS created_by VARCHAR(100) NULL AFTER tax_amount
    `);
    
    console.log('✅ created_by column added successfully');
    
    // Add index
    console.log('📝 Adding index on created_by column...');
    try {
      await connection.query(`
        CREATE INDEX idx_bookings_created_by ON bookings(created_by)
      `);
      console.log('✅ Index added successfully');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️ Index already exists, skipping...');
      } else {
        throw err;
      }
    }
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

addCreatedByColumn();
