-- Seed data for REEM Resort

-- Sample customers
INSERT INTO customers (external_id, first_name, last_name, email, phone) VALUES
('cust-001', 'John', 'Doe', 'john.doe@example.com', '+1234567890'),
('cust-002', 'Jane', 'Smith', 'jane.smith@example.com', '+1987654321');

-- Sample rooms
INSERT INTO rooms (room_number, room_type, capacity, rate, status, meta) VALUES
('101', 'Standard', 2, 100.00, 'available', JSON_OBJECT('floor', 1)),
('102', 'Deluxe', 2, 150.00, 'available', JSON_OBJECT('floor', 1)),
('201', 'Suite', 4, 300.00, 'available', JSON_OBJECT('floor', 2));

-- Sample booking (for room 101)
INSERT INTO bookings (booking_reference, customer_id, room_id, status, checkin_date, checkout_date, total_amount, currency, created_at, updated_at)
VALUES ('BR-0001', 1, 1, 'confirmed', '2025-10-10', '2025-10-12', 200.00, 'USD', NOW(), NOW());

-- Sample invoice for booking
INSERT INTO invoices (invoice_number, booking_id, customer_id, issued_at, due_at, total, currency, status, created_at)
VALUES ('INV-0001', 1, 1, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 200.00, 'USD', 'issued', NOW());

-- Invoice items
INSERT INTO invoice_items (invoice_id, description, unit_price, quantity, line_total)
VALUES (1, 'Room 101 x2 nights', 100.00, 2, 200.00);

-- Sample payment (pending)
INSERT INTO payments (invoice_id, booking_id, amount, currency, gateway, gateway_payment_id, status, processed_at)
VALUES (1, 1, 0.00, 'USD', NULL, NULL, 'pending', NULL);
