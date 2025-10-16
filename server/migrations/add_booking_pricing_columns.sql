-- Add pricing breakdown columns to bookings table

ALTER TABLE bookings 
ADD COLUMN base_amount DECIMAL(12,2) DEFAULT 0 AFTER total_amount,
ADD COLUMN discount_percentage DECIMAL(5,2) DEFAULT 0 AFTER base_amount,
ADD COLUMN discount_amount DECIMAL(12,2) DEFAULT 0 AFTER discount_percentage;

-- Update existing bookings to have base_amount = total_amount
UPDATE bookings SET base_amount = total_amount WHERE base_amount IS NULL OR base_amount = 0;
