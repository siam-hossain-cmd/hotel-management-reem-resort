import { initDb, getPool } from '../db.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('🔄 Initializing database connection...');
    await initDb();
    const pool = getPool();
    
    console.log('📖 Reading SQL migration file...');
    const sqlPath = path.join(__dirname, '../migrations/add_tax_fields.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');
    
    // Split by semicolon and filter empty statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n▶️  Executing statement ${i + 1}/${statements.length}...`);
      console.log(statement.substring(0, 100) + '...');
      
      try {
        await pool.query(statement);
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (error) {
        // Ignore "duplicate column" errors (1060)
        if (error.errno === 1060) {
          console.log(`⚠️  Column already exists, skipping...`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
    
    // Verify the columns were added
    console.log('\n🔍 Verifying bookings table structure...');
    const [bookingsColumns] = await pool.query('SHOW COLUMNS FROM bookings');
    const taxColumns = bookingsColumns.filter(col => 
      col.Field.includes('tax') || col.Field.includes('subtotal')
    );
    console.log('Tax-related columns in bookings:', taxColumns.map(c => c.Field));
    
    console.log('\n🔍 Verifying invoices table structure...');
    const [invoicesColumns] = await pool.query('SHOW COLUMNS FROM invoices');
    const invoiceTaxColumns = invoicesColumns.filter(col => col.Field.includes('tax'));
    console.log('Tax-related columns in invoices:', invoiceTaxColumns.map(c => c.Field));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
