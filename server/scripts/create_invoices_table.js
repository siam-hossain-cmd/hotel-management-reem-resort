import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = mysql.createPool({
  host: '216.104.47.118',
  user: 'reemresort_admin',
  password: 'tyrfaz-Jojgij-mirge6',
  database: 'reemresort_hotel_db',
  waitForConnections: true,
  connectionLimit: 10
});

async function runMigration() {
  let connection;
  try {
    console.log('Connecting to database...');
    connection = await pool.getConnection();
    
    console.log('Reading migration file...');
    const migrationPath = join(__dirname, '../migrations/create_invoices_table.sql');
    const sql = await fs.readFile(migrationPath, 'utf-8');
    
    console.log('Running migration...');
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      await connection.query(statement);
    }
    
    console.log('✅ Migration completed successfully!');
    
    // Verify tables were created
    const [tables] = await connection.query("SHOW TABLES LIKE 'invoice%'");
    console.log('Created tables:', tables);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

runMigration();
