import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '.env') });

let pool;

export async function initDb() {
  if (pool) return pool;
  
  const config = {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'reem_resort',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };

  console.log('Connecting to MySQL database...');
  console.log(`Host: ${config.host}:${config.port}`);
  console.log(`Database: ${config.database}`);
  console.log(`User: ${config.user}`);

  try {
    pool = mysql.createPool(config);
    
    // Test the connection
    const conn = await pool.getConnection();
    await conn.query('SELECT 1 as test');
    conn.release();
    
    console.log('✅ MySQL pool created and tested successfully');
    return pool;
  } catch (error) {
    console.error('❌ Failed to create MySQL pool:', error.message);
    throw error;
  }
}

export function getPool() {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initDb() first.');
  }
  return pool;
}
