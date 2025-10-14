import { initDb, getPool } from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function updateInvoicesTable() {
  try {
    console.log('Initializing database connection...');
    await initDb();
    
    console.log('Getting database pool...');
    const pool = getPool();
    
    console.log('Reading migration file...');
    const migrationPath = path.join(__dirname, '../migrations/update_invoices_add_paid_due.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Running migration...');
    const connection = await pool.getConnection();
    
    try {
      // Split SQL file by semicolons and execute each statement
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (const statement of statements) {
        if (statement) {
          console.log('Executing:', statement.substring(0, 100) + '...');
          await connection.query(statement);
        }
      }
      
      console.log('✅ Migration completed successfully!');
      
      // Show table structure
      const [columns] = await connection.query('SHOW COLUMNS FROM invoices');
      console.log('Invoices table columns:', columns);
      
    } finally {
      connection.release();
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

updateInvoicesTable();
