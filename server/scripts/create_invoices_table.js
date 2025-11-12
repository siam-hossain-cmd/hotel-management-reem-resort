import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
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
