const mysql = require('mysql2/promise');

let pool;

async function initDb() {
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

  pool = mysql.createPool(config);
  // Simple test
  const conn = await pool.getConnection();
  await conn.query('SELECT 1');
  conn.release();
  console.log('MySQL pool created');
  return pool;
}

module.exports = {
  initDb,
  getPool: () => pool
};
