-- Create invoices table in MySQL
CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    booking_id INT NOT NULL,
    customer_id INT,
    
    -- Invoice Details
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date DATE,
    
    -- Financial Summary
    total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    paid DECIMAL(10, 2) DEFAULT 0.00,
    due DECIMAL(10, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'BDT',
    
    -- Status (issued, partial, paid, cancelled)
    status VARCHAR(20) DEFAULT 'issued',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_booking_id (booking_id),
    INDEX idx_customer_id (customer_id),
    INDEX idx_invoice_number (invoice_number),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create invoice_items table (for room bookings with discounts)
CREATE TABLE IF NOT EXISTS invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    
    -- Room Details
    room_number VARCHAR(10),
    room_type VARCHAR(50),
    check_in_date DATE,
    check_out_date DATE,
    total_nights INT DEFAULT 1,
    guest_count INT DEFAULT 1,
    
    -- Pricing
    price_per_night DECIMAL(10, 2) DEFAULT 0.00,
    base_amount DECIMAL(10, 2) DEFAULT 0.00,
    discount_percentage DECIMAL(5, 2) DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    amount DECIMAL(10, 2) NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_invoice_id (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: booking_charges table already exists for additional charges
-- Note: payments table already exists for payment records
-- Both can be linked to invoices via booking_id
