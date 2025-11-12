import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function updateSchema() {
  let connection;
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      multipleStatements: true
    });
    
    console.log('✅ Connected!');
    console.log('📖 Reading migration file...');
    
    const migrationPath = join(__dirname, '../migrations/update_schema.sql');
    const sql = await fs.readFile(migrationPath, 'utf-8');
    
    console.log('⚙️  Running schema updates...');
    await connection.query(sql);
    
    console.log('✅ Schema updated successfully!');
    
    // Verify the changes
    console.log('\n📊 Verifying schema...');
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'customers'
      ORDER BY ORDINAL_POSITION
    `, [process.env.MYSQL_DATABASE]);
    
    console.log('Customers table columns:');
    columns.forEach(col => console.log(`  - ${col.COLUMN_NAME}`));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

updateSchema();
