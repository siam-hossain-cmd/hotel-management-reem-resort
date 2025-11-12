import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

async function testConnection() {
  console.log('🔍 Testing Database Connection...\n');
  
  const config = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  };

  console.log('📋 Configuration:');
  console.log(`   Host: ${config.host}:${config.port}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Database: ${config.database}`);
  console.log(`   Password: ${config.password ? '✓ Set' : '✗ Not Set'}\n`);

  let connection;
  try {
    console.log('⏳ Attempting to connect...');
    connection = await mysql.createConnection(config);
    console.log('✅ Connection successful!\n');

    // Test query
    console.log('⏳ Running test query...');
    const [result] = await connection.query('SELECT 1 as test');
    console.log('✅ Query successful!\n');

    // Check tables
    console.log('📊 Checking database tables...');
    const [tables] = await connection.query('SHOW TABLES');
    
    if (tables.length === 0) {
      console.log('⚠️  No tables found. You need to run migrations.\n');
      console.log('💡 Run: node scripts/run_migrations.js\n');
    } else {
      console.log(`✅ Found ${tables.length} tables:`);
      tables.forEach(table => {
        const tableName = Object.values(table)[0];
        console.log(`   - ${tableName}`);
      });
      console.log('');
    }

    // Database info
    const [dbInfo] = await connection.query(`
      SELECT 
        table_name,
        table_rows,
        ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
      FROM information_schema.TABLES
      WHERE table_schema = ?
      ORDER BY table_name
    `, [config.database]);

    if (dbInfo.length > 0) {
      console.log('📈 Table Statistics:');
      dbInfo.forEach(info => {
        console.log(`   ${info.table_name}: ${info.table_rows} rows, ${info.size_mb || 0} MB`);
      });
      console.log('');
    }

    console.log('🎉 Database is ready to use!');
    
  } catch (error) {
    console.error('❌ Connection failed!\n');
    console.error(`Error: ${error.message}`);
    console.error(`Code: ${error.code || 'N/A'}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 MySQL server is not accessible. Check if MySQL is running.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Access denied. Check username and password in .env file.');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\n💡 Database does not exist. Create it first:');
      console.error('   mysql -u root -p');
      console.error(`   CREATE DATABASE ${config.database};`);
    } else if (error.code === 'ENOTFOUND') {
      console.error('\n💡 Host not found. Check MYSQL_HOST in .env file.');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testConnection();
