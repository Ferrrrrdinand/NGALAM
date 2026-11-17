-- ========================================================
-- NGALAM FIX PRO - MySQL Database Schema (Rumahweb cPanel)
-- Cocok untuk phpMyAdmin MySQL / MariaDB Rumahweb
-- ========================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Tabel Users (Admin, Kasir, Teknisi, 100 Mitra Driver)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'kasir',
    category VARCHAR(100),
    avatar VARCHAR(50) DEFAULT '👤',
    phone VARCHAR(50),
    email VARCHAR(255),
    referral_code VARCHAR(100),
    commission_rate DECIMAL(10,2) DEFAULT 5.00,
    total_commission DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Siaga / Aktif',
    last_active VARCHAR(100),
    desk VARCHAR(255),
    specialty TEXT,
    raw_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tabel Customers (Member & Pelanggan Servis)
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(50),
    email VARCHAR(255),
    district VARCHAR(255),
    pin VARCHAR(255) DEFAULT '123456',
    registered_at VARCHAR(100),
    registered_via VARCHAR(100) DEFAULT 'Portal Pelanggan Web',
    raw_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tabel Orders (Tiket Servis Antrean)
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(100) PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(50),
    device_type VARCHAR(100) DEFAULT 'Smartphone',
    brand_model VARCHAR(255),
    damage_description TEXT,
    status VARCHAR(100) DEFAULT 'Registrasi & Masuk',
    cost DECIMAL(15,2) DEFAULT 0.00,
    duration VARCHAR(100) DEFAULT '30 - 60 Menit',
    technician VARCHAR(100) DEFAULT 'Teknisi Lab Meja 1',
    step INT DEFAULT 1,
    raw_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tabel Transactions (Faktur & Kasir)
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(100) PRIMARY KEY,
    order_id VARCHAR(100),
    invoice_number VARCHAR(100),
    customer_name VARCHAR(255),
    total_amount DECIMAL(15,2) DEFAULT 0.00,
    payment_method VARCHAR(50) DEFAULT 'Tunai (Cash)',
    cashier VARCHAR(100) DEFAULT 'Kasir Meja 1',
    raw_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Tabel Finances (Buku Kas Keuangan)
CREATE TABLE IF NOT EXISTS finances (
    id VARCHAR(100) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(100),
    amount DECIMAL(15,2) DEFAULT 0.00,
    description TEXT,
    date VARCHAR(50),
    source VARCHAR(100),
    recorded_by VARCHAR(100),
    raw_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Tabel Activity Logs (Audit Log Keamanan)
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(100),
    table_name VARCHAR(100),
    record_id VARCHAR(100),
    payload JSON,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Tabel Promo Codes (Voucher & Kupon Diskon)
CREATE TABLE IF NOT EXISTS promo_codes (
    id VARCHAR(100) PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255),
    description TEXT,
    discount_type VARCHAR(50),
    discount_value DECIMAL(10,2) DEFAULT 0.00,
    min_spend DECIMAL(15,2) DEFAULT 0.00,
    max_discount DECIMAL(15,2) DEFAULT 0.00,
    valid_from VARCHAR(50),
    valid_until VARCHAR(50),
    usage_limit INT DEFAULT 0,
    used_count INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    raw_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Tabel Ads (Iklan Promo Beranda)
CREATE TABLE IF NOT EXISTS ads (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    headline VARCHAR(255),
    description TEXT,
    badge VARCHAR(100),
    image_url TEXT,
    target_url VARCHAR(255),
    cta_text VARCHAR(100),
    location VARCHAR(100) DEFAULT 'home_under_steps',
    theme VARCHAR(50) DEFAULT 'gold',
    active BOOLEAN DEFAULT TRUE,
    views_count INT DEFAULT 0,
    clicks_count INT DEFAULT 0,
    raw_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Tabel Warranties (Sertifikat Garansi Servis)
CREATE TABLE IF NOT EXISTS warranties (
    id VARCHAR(100) PRIMARY KEY,
    ticket_id VARCHAR(100),
    order_id VARCHAR(100),
    invoice_number VARCHAR(100),
    customer_id VARCHAR(100),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    device_model VARCHAR(255),
    damage_repaired TEXT,
    warranty_type VARCHAR(100) DEFAULT 'Garansi Resmi Workshop',
    duration_days INT DEFAULT 30,
    start_date VARCHAR(50),
    expiry_date VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Aktif',
    claim_status VARCHAR(50) DEFAULT 'none',
    technician VARCHAR(100),
    notes TEXT,
    raw_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Tabel Sessions (Sesi Login)
CREATE TABLE IF NOT EXISTS sessions (
    token VARCHAR(500) PRIMARY KEY,
    user_id VARCHAR(100),
    name VARCHAR(255),
    username VARCHAR(100),
    role VARCHAR(50),
    access_level VARCHAR(50),
    raw_data JSON,
    login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
