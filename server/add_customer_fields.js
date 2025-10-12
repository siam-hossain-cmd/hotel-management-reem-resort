const { initDb, getPool } = require('./db');

async function addCustomerFields() {
  await initDb(); // Initialize the database connection
  const pool = getPool();
  
  try {
    // Add address column
    await pool.query(`
      ALTER TABLE customers 
      ADD COLUMN address TEXT NULL AFTER phone
    `);
    console.log('Added address column');
    
    // Add nid column  
    await pool.query(`
      ALTER TABLE customers 
      ADD COLUMN nid VARCHAR(50) NULL AFTER address
    `);
    console.log('Added nid column');
    
    console.log('Successfully added customer fields');
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Columns already exist');
      process.exit(0);
    }
    console.error('Error adding customer fields:', error);
    process.exit(1);
  }
}

addCustomerFields();