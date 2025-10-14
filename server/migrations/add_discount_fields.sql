-- Add discount and base amount fields to bookings table

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS base_amount DECIMAL(12,2) DEFAULT 0 COMMENT 'Original room price before discount',
ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2) DEFAULT 0 COMMENT 'Discount percentage applied',
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12,2) DEFAULT 0 COMMENT 'Discount amount in currency';

-- Update existing bookings to set base_amount same as total_amount if not set
UPDATE bookings 
SET base_amount = total_amount 
WHERE base_amount = 0 OR base_amount IS NULL;
