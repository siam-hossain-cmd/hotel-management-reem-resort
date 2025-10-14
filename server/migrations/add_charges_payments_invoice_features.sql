-- Add invoice_id to bookings table if not exists
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS invoice_id INT NULL AFTER total_amount,
ADD COLUMN IF NOT EXISTS invoice_snapshot JSON NULL AFTER invoice_id;

-- Update invoices table structure - add missing columns
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS snapshot_json JSON NULL AFTER meta,
ADD COLUMN IF NOT EXISTS file_url VARCHAR(255) NULL AFTER snapshot_json,
ADD COLUMN IF NOT EXISTS preview_url VARCHAR(255) NULL AFTER file_url;

-- Charges table - add quantity and unit_amount if missing
ALTER TABLE booking_charges
ADD COLUMN IF NOT EXISTS quantity INT DEFAULT 1 AFTER description,
ADD COLUMN IF NOT EXISTS unit_amount DECIMAL(10,2) NULL AFTER quantity,
ADD COLUMN IF NOT EXISTS created_by VARCHAR(100) NULL AFTER unit_amount;

-- Update existing charges to populate unit_amount from amount if null
UPDATE booking_charges 
SET unit_amount = amount, quantity = 1 
WHERE unit_amount IS NULL;

-- Payments table - add received_by and notes if missing
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS received_by VARCHAR(100) NULL AFTER processed_at,
ADD COLUMN IF NOT EXISTS notes TEXT NULL AFTER received_by,
ADD COLUMN IF NOT EXISTS method VARCHAR(50) NULL AFTER gateway;

-- Add indices for performance
CREATE INDEX IF NOT EXISTS idx_booking_charges_booking_id ON booking_charges(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_invoice_id ON bookings(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_number ON invoices(invoice_number);
