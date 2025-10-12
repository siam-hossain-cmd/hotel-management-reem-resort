-- SQL migration for initial schema

CREATE TABLE IF NOT EXISTS customers (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  external_id VARCHAR(128),
  first_name VARCHAR(128),
  last_name VARCHAR(128),
  email VARCHAR(255),
  phone VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rooms (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  room_number VARCHAR(50) UNIQUE,
  room_type VARCHAR(100),
  capacity INT DEFAULT 1,
  rate DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'available',
  meta JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  booking_reference VARCHAR(64) UNIQUE,
  customer_id BIGINT NOT NULL,
  room_id BIGINT NOT NULL,
  status VARCHAR(32) DEFAULT 'pending',
  checkin_date DATE NOT NULL,
  checkout_date DATE NOT NULL,
  total_amount DECIMAL(12,2) DEFAULT 0,
  currency CHAR(3) DEFAULT 'USD',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_booking_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT fk_booking_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS invoices (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(64) UNIQUE,
  booking_id BIGINT NULL,
  customer_id BIGINT NOT NULL,
  issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  due_at DATETIME NULL,
  total DECIMAL(12,2) DEFAULT 0,
  currency CHAR(3) DEFAULT 'USD',
  status VARCHAR(32) DEFAULT 'issued',
  paid_at DATETIME NULL,
  meta JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_invoice_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
  CONSTRAINT fk_invoice_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  invoice_id BIGINT NOT NULL,
  description VARCHAR(255),
  unit_price DECIMAL(12,2) DEFAULT 0,
  quantity INT DEFAULT 1,
  line_total DECIMAL(12,2) DEFAULT 0,
  CONSTRAINT fk_item_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  invoice_id BIGINT NULL,
  booking_id BIGINT NULL,
  amount DECIMAL(12,2) DEFAULT 0,
  currency CHAR(3) DEFAULT 'USD',
  gateway VARCHAR(128),
  gateway_payment_id VARCHAR(255),
  status VARCHAR(32) DEFAULT 'pending',
  processed_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
  CONSTRAINT fk_payment_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
);
