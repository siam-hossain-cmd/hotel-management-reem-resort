import { initDb, getPool } from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log('🚀 Starting database migration for charges, payments, and invoice features...');
  
  try {
    await initDb();
    const pool = getPool();
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../migrations/add_charges_payments_invoice_features.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      try {
        console.log('Executing:', statement.substring(0, 60) + '...');
        await pool.query(statement);
        console.log('✓ Success');
      } catch (error) {
        // Skip errors for already existing indices or columns
        if (error.code === 'ER_DUP_KEYNAME' || error.code === 'ER_KEY_COLUMN_DOES_NOT_EXITS') {
          console.log('⊘ Skipped (already exists or column not ready)');
        } else {
          throw error;
        }
      }
    }
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the changes
    console.log('\n📊 Verifying table structures...');
    
    const [bookingsColumns] = await pool.query('DESCRIBE bookings');
    console.log('\n✓ Bookings columns:', bookingsColumns.map(c => c.Field).join(', '));
    
    const [invoicesColumns] = await pool.query('DESCRIBE invoices');
    console.log('✓ Invoices columns:', invoicesColumns.map(c => c.Field).join(', '));
    
    const [chargesColumns] = await pool.query('DESCRIBE booking_charges');
    console.log('✓ Booking_charges columns:', chargesColumns.map(c => c.Field).join(', '));
    
    const [paymentsColumns] = await pool.query('DESCRIBE payments');
    console.log('✓ Payments columns:', paymentsColumns.map(c => c.Field).join(', '));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
