const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const fs = require('fs');
const path = require('path');

let db;

async function initDb() {
  if (db) return db;
  
  // Create SQLite database
  db = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });
  
  console.log('SQLite database created/opened');
  return db;
}

async function runMigrations() {
  const db = await initDb();
  
  const initSql = fs.readFileSync(path.join(__dirname, 'migrations', 'init-sqlite.sql'), 'utf8');
  const seedSql = fs.readFileSync(path.join(__dirname, 'migrations', 'seed-sqlite.sql'), 'utf8');
  
  // Split and execute SQL statements
  const initStatements = initSql.split(';').filter(stmt => stmt.trim());
  const seedStatements = seedSql.split(';').filter(stmt => stmt.trim());
  
  for (const statement of initStatements) {
    if (statement.trim()) {
      await db.exec(statement);
    }
  }
  
  for (const statement of seedStatements) {
    if (statement.trim()) {
      await db.exec(statement);
    }
  }
  
  console.log('SQLite migrations completed');
}

module.exports = {
  initDb,
  runMigrations,
  getDb: () => db
};