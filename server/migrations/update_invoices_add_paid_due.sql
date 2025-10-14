-- Add paid and due columns to invoices table if they don't exist
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS paid DECIMAL(10, 2) DEFAULT 0.00 AFTER total,
ADD COLUMN IF NOT EXISTS due DECIMAL(10, 2) DEFAULT 0.00 AFTER paid;

-- Update existing records to calculate paid and due amounts
UPDATE invoices i
SET 
    paid = (
        SELECT COALESCE(SUM(p.amount), 0)
        FROM payments p
        WHERE p.booking_id = i.booking_id AND p.status = 'completed'
    ),
    due = i.total - (
        SELECT COALESCE(SUM(p.amount), 0)
        FROM payments p
        WHERE p.booking_id = i.booking_id AND p.status = 'completed'
    ),
    status = CASE
        WHEN i.total <= (
            SELECT COALESCE(SUM(p.amount), 0)
            FROM payments p
            WHERE p.booking_id = i.booking_id AND p.status = 'completed'
        ) THEN 'paid'
        WHEN (
            SELECT COALESCE(SUM(p.amount), 0)
            FROM payments p
            WHERE p.booking_id = i.booking_id AND p.status = 'completed'
        ) > 0 THEN 'partial'
        ELSE 'issued'
    END
WHERE i.id IS NOT NULL;

-- Show updated table structure
SHOW COLUMNS FROM invoices;
