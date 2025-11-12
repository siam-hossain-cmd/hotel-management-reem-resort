import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

async function syncSchema() {
  let connection;
  try {
    console.log('🔄 Syncing schema with old database structure...\n');
    
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      multipleStatements: true
    });
    
    console.log('✅ Connected to database\n');
    
    const migrationPath = join(__dirname, '../migrations/sync_with_old_schema.sql');
    const sql = await fs.readFile(migrationPath, 'utf-8');
    
    console.log('⚙️  Running schema sync...');
    await connection.query(sql);
    
    console.log('✅ Schema synced successfully!\n');
    
    // Verify changes
    console.log('📊 Verifying schema...\n');
    
    const tables = ['customers', 'bookings', 'invoices', 'payments', 'booking_charges'];
    
    for (const table of tables) {
      const [columns] = await connection.query(`DESCRIBE ${table}`);
      console.log(`🔹 ${table}:`);
      columns.forEach(col => {
        console.log(`   - ${col.Field} (${col.Type})`);
      });
      console.log('');
    }
    
    console.log('✅ All done!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

syncSchema();
