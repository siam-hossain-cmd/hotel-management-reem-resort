import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function run() {
  const config = {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'reem_resort',
    multipleStatements: true
  };

  const conn = await mysql.createConnection(config);
  try {
    const initSql = fs.readFileSync(path.join(__dirname, '..', 'migrations', 'init.sql'), 'utf8');
    const seedSql = fs.readFileSync(path.join(__dirname, '..', 'migrations', 'seed.sql'), 'utf8');

    console.log('Running init.sql...');
    await conn.query(initSql);
    console.log('init.sql executed');

    console.log('Running seed.sql...');
    await conn.query(seedSql);
    console.log('seed.sql executed');

    console.log('Migrations completed successfully');
  } catch (err) {
    console.error('Migration error:', err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

run();
