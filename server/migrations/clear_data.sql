-- Clear all existing data to start fresh
-- Run this to empty the database for admin setup

-- Delete all data (in correct order due to foreign key constraints)
DELETE FROM payments;
DELETE FROM invoice_items;
DELETE FROM invoices;
DELETE FROM bookings;
DELETE FROM rooms;
DELETE FROM customers;

-- Reset auto-increment counters to start from 1
ALTER TABLE customers AUTO_INCREMENT = 1;
ALTER TABLE rooms AUTO_INCREMENT = 1;
ALTER TABLE bookings AUTO_INCREMENT = 1;
ALTER TABLE invoices AUTO_INCREMENT = 1;
ALTER TABLE invoice_items AUTO_INCREMENT = 1;
ALTER TABLE payments AUTO_INCREMENT = 1;