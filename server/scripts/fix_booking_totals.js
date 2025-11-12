import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function fixBookingTotals() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE
    });
    
    console.log('✅ Connected to database');
    
    // Get all bookings with charges
    console.log('📝 Finding bookings with additional charges...');
    const [bookings] = await connection.query(`
      SELECT 
        b.id,
        b.booking_reference,
        b.base_amount,
        b.discount_amount,
        b.subtotal_amount,
        b.tax_amount,
        b.total_amount as current_total,
        COALESCE(SUM(bc.amount), 0) as additional_charges
      FROM bookings b
      LEFT JOIN booking_charges bc ON b.id = bc.booking_id
      GROUP BY b.id
      HAVING additional_charges > 0
    `);
    
    console.log(`📊 Found ${bookings.length} bookings with additional charges`);
    
    let updatedCount = 0;
    
    for (const booking of bookings) {
      // Calculate correct total
      // Total = Subtotal (after discount) + Tax + Additional Charges
      const correctTotal = parseFloat(booking.subtotal_amount || 0) + 
                          parseFloat(booking.tax_amount || 0) + 
                          parseFloat(booking.additional_charges || 0);
      
      const currentTotal = parseFloat(booking.current_total || 0);
      
      // Only update if different
      if (Math.abs(correctTotal - currentTotal) > 0.01) {
        console.log(`\n🔧 Fixing booking ${booking.booking_reference}:`);
        console.log(`   Current total: ৳${currentTotal.toFixed(2)}`);
        console.log(`   Correct total: ৳${correctTotal.toFixed(2)}`);
        console.log(`   Breakdown:`);
        console.log(`     - Subtotal: ৳${parseFloat(booking.subtotal_amount || 0).toFixed(2)}`);
        console.log(`     - Tax: ৳${parseFloat(booking.tax_amount || 0).toFixed(2)}`);
        console.log(`     - Additional charges: ৳${parseFloat(booking.additional_charges || 0).toFixed(2)}`);
        
        await connection.query(`
          UPDATE bookings 
          SET total_amount = ?, updated_at = NOW() 
          WHERE id = ?
        `, [correctTotal, booking.id]);
        
        updatedCount++;
        console.log(`   ✅ Updated!`);
      }
    }
    
    console.log(`\n🎉 Migration completed!`);
    console.log(`📊 Updated ${updatedCount} bookings`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

fixBookingTotals();
