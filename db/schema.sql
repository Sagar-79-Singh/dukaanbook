-- DukaanBook Database Schema for Railway MySQL
-- Railway MySQL dashboard mein "Query" tab mein yeh poora paste karo

CREATE DATABASE IF NOT EXISTS dukaanbook CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dukaanbook;

-- ─── USERS (Login) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','user') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default users (passwords will be set by setup script)
-- admin / admin123
-- dad / dad123
-- (Change these after first login!)

-- ─── UNITS (Compound unit support) ──────────────────────────
-- Example: "Pkt" = 20 Pcs  → base_unit_id = id of "Pcs", conversion_qty = 20
-- Simple unit: base_unit_id = NULL, conversion_qty = NULL
CREATE TABLE IF NOT EXISTS units (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  base_unit_id INT DEFAULT NULL,       -- NULL = simple unit
  conversion_qty DECIMAL(10,3) DEFAULT NULL, -- 1 of this unit = X of base unit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (base_unit_id) REFERENCES units(id) ON DELETE SET NULL
);

-- ─── GROUPS / CATEGORIES ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS groups_master (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── ITEMS / PRODUCTS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  group_id INT DEFAULT NULL,
  unit_id INT DEFAULT NULL,
  purchase_price DECIMAL(10,2) DEFAULT 0,
  sale_price DECIMAL(10,2) DEFAULT 0,
  opening_stock DECIMAL(10,3) DEFAULT 0,
  current_stock DECIMAL(10,3) DEFAULT 0,
  low_stock_alert DECIMAL(10,3) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES groups_master(id) ON DELETE SET NULL,
  FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL
);

-- ─── CUSTOMERS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(15) DEFAULT NULL,
  address TEXT DEFAULT NULL,
  balance DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── SUPPLIERS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(15) DEFAULT NULL,
  address TEXT DEFAULT NULL,
  balance DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── SALES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_date DATE NOT NULL,
  customer_id INT DEFAULT NULL,
  customer_name VARCHAR(200) DEFAULT NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_mode ENUM('cash','credit','partial') DEFAULT 'cash',
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sale_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  item_id INT DEFAULT NULL,
  item_name VARCHAR(200) NOT NULL,
  qty DECIMAL(10,3) NOT NULL,
  unit_name VARCHAR(50) DEFAULT '',
  rate DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL
);

-- ─── PURCHASES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_date DATE NOT NULL,
  supplier_id INT DEFAULT NULL,
  supplier_name VARCHAR(200) DEFAULT NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_mode ENUM('cash','credit','partial') DEFAULT 'cash',
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS purchase_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_id INT NOT NULL,
  item_id INT DEFAULT NULL,
  item_name VARCHAR(200) NOT NULL,
  qty DECIMAL(10,3) NOT NULL,
  unit_name VARCHAR(50) DEFAULT '',
  rate DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL
);

-- ─── LEDGER ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ledger_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entry_date DATE NOT NULL,
  party_type ENUM('customer','supplier') NOT NULL,
  party_id INT NOT NULL,
  entry_type ENUM('sale','purchase','payment_received','payment_made','adjustment') NOT NULL,
  reference_id INT DEFAULT NULL,
  debit DECIMAL(10,2) DEFAULT 0,
  credit DECIMAL(10,2) DEFAULT 0,
  balance DECIMAL(10,2) DEFAULT 0,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── SEED DATA ────────────────────────────────────────────────

-- Simple units
INSERT IGNORE INTO units (name) VALUES
  ('Pcs'), ('Box'), ('Dozen'), ('Kg'), ('Gram'),
  ('Litre'), ('Packet'), ('Ream'), ('Bundle'), ('Roll'), ('Metre');

-- Compound units (run AFTER simple units are inserted)
-- 1 Box = 12 Pcs
INSERT IGNORE INTO units (name, base_unit_id, conversion_qty)
  SELECT 'Box (12 Pcs)', id, 12 FROM units WHERE name='Pcs';
-- 1 Dozen = 12 Pcs
INSERT IGNORE INTO units (name, base_unit_id, conversion_qty)
  SELECT 'Dozen (12 Pcs)', id, 12 FROM units WHERE name='Pcs';
-- 1 Pkt = 20 Pcs
INSERT IGNORE INTO units (name, base_unit_id, conversion_qty)
  SELECT 'Pkt (20 Pcs)', id, 20 FROM units WHERE name='Pcs';
-- 1 Pkt = 10 Pcs
INSERT IGNORE INTO units (name, base_unit_id, conversion_qty)
  SELECT 'Pkt (10 Pcs)', id, 10 FROM units WHERE name='Pcs';
-- 1 Ream = 500 Pcs (sheets)
INSERT IGNORE INTO units (name, base_unit_id, conversion_qty)
  SELECT 'Ream (500 Sheets)', id, 500 FROM units WHERE name='Pcs';

-- Item Groups
INSERT IGNORE INTO groups_master (name) VALUES
  ('Pen & Pencil'), ('Paper & Notebook'), ('File & Folder'),
  ('Ink & Refill'), ('Stationery Misc'), ('Computer Accessories'),
  ('Art & Craft'), ('Rubber & Eraser');

-- ─── USERS (bcrypt hashed passwords) ─────────────────────────
-- Password: admin123  → hash below
INSERT IGNORE INTO users (username, password_hash, role) VALUES
  ('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');
-- Password: dad123
INSERT IGNORE INTO users (username, password_hash, role) VALUES
  ('dad', '$2b$10$YEpRG0yVGMc6v4NKQpK.F.LJpvUCuVDJOOWjHJmilTLAfbHfNqhLi', 'user');

-- NOTE: These are demo hashes. Run the setup script to generate proper hashes.
-- OR use the /api/setup endpoint once (then disable it).
