ALTER TABLE bookings 
ADD COLUMN tax_rate DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN tax_amount DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN subtotal_amount DECIMAL(10,2) DEFAULT 0.00;

UPDATE bookings SET subtotal_amount = total_amount WHERE subtotal_amount = 0;

ALTER TABLE invoices
ADD COLUMN tax_rate DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN tax_amount DECIMAL(10,2) DEFAULT 0.00;
