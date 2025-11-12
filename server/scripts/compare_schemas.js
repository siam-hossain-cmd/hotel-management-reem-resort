import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

async function compareSchemas() {
  let oldConn, newConn;
  
  try {
    console.log('🔍 Comparing database schemas...\n');
    
    // Connect to old database
    console.log('📊 Connecting to OLD database (216.104.47.118)...');
    oldConn = await mysql.createConnection({
      host: '216.104.47.118',
      user: 'reemresort_admin',
      password: 'tyrfaz-Jojgij-mirge6',
      database: 'reemresort_hotel_db'
    });
    console.log('✅ Connected to old database\n');
    
    // Connect to new database
    console.log('📊 Connecting to NEW database (CyberPanel)...');
    newConn = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE
    });
    console.log('✅ Connected to new database\n');
    
    // Get tables from old database
    const [oldTables] = await oldConn.query('SHOW TABLES');
    console.log('📋 OLD DATABASE TABLES:');
    console.log('=====================');
    
    for (const tableRow of oldTables) {
      const tableName = Object.values(tableRow)[0];
      console.log(`\n🔹 Table: ${tableName}`);
      
      const [columns] = await oldConn.query(`DESCRIBE ${tableName}`);
      columns.forEach(col => {
        console.log(`   - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `[${col.Key}]` : ''}`);
      });
    }
    
    console.log('\n\n');
    
    // Get tables from new database
    const [newTables] = await newConn.query('SHOW TABLES');
    console.log('📋 NEW DATABASE TABLES:');
    console.log('=====================');
    
    for (const tableRow of newTables) {
      const tableName = Object.values(tableRow)[0];
      console.log(`\n🔹 Table: ${tableName}`);
      
      const [columns] = await newConn.query(`DESCRIBE ${tableName}`);
      columns.forEach(col => {
        console.log(`   - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `[${col.Key}]` : ''}`);
      });
    }
    
    console.log('\n\n✅ Schema comparison complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (oldConn) await oldConn.end();
    if (newConn) await newConn.end();
  }
}

compareSchemas();
