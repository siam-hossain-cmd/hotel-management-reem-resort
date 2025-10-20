import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load .env file (for local development)
// In cPanel, environment variables are set through the Node.js interface
try {
  dotenv.config({ path: path.join(__dirname, '.env') });
} catch (err) {
  console.log('No .env file found, using environment variables from system');
}

let pool;

export async function initDb() {
  if (pool) return pool;
  
  const config = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'reem_resort',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000 // 10 seconds timeout
  };

  console.log('🔄 Attempting to connect to MySQL database...');
  console.log(`📍 Host: ${config.host}:${config.port}`);
  console.log(`📊 Database: ${config.database}`);
  console.log(`👤 User: ${config.user}`);
  console.log(`🔑 Password: ${config.password ? '***set***' : '***NOT SET***'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

  try {
    pool = mysql.createPool(config);
    
    // Test the connection
    console.log('⏳ Testing database connection...');
    const conn = await pool.getConnection();
    await conn.query('SELECT 1 as test');
    conn.release();
    
    console.log('✅ MySQL pool created and tested successfully!');
    return pool;
  } catch (error) {
    console.error('❌ Failed to create MySQL pool:');
    console.error(`   Error Code: ${error.code}`);
    console.error(`   Error Message: ${error.message}`);
    console.error(`   SQL State: ${error.sqlState || 'N/A'}`);
    
    // Provide helpful error messages
    if (error.code === 'ECONNREFUSED') {
      console.error('   💡 Hint: MySQL server is not accessible. Check if MySQL is running.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   💡 Hint: Access denied. Check username and password.');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('   💡 Hint: Database does not exist. Check database name.');
    } else if (error.code === 'ENOTFOUND') {
      console.error('   💡 Hint: Host not found. Check MYSQL_HOST setting.');
    }
    
    throw error;
  }
}

export function getPool() {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initDb() first.');
  }
  return pool;
}
