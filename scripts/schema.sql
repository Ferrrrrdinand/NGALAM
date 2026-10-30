-- ========================================================
-- NGALAM FIX PRO - PostgreSQL Database Schema
-- 8 Tabel Utama Sistem (users, customers, orders, logs, transactions, finances, commissions, banners)
-- ========================================================

-- 1. Tabel Users (Admin, Kasir, Teknisi, Mitra Driver)
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
    commission_rate NUMERIC DEFAULT 10,
    total_commission NUMERIC DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Siaga / Aktif',
    last_active VARCHAR(100),
    desk VARCHAR(255),
    specialty TEXT,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Customers (Pelanggan Servis)
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255),
    district VARCHAR(255),
    pin VARCHAR(50) DEFAULT '123456',
    registered_at VARCHAR(100),
    registered_via VARCHAR(100) DEFAULT 'Portal Pelanggan Web',
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Orders (Tiket Servis Antrian)
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(100) PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(50),
    device_type VARCHAR(100) DEFAULT 'Smartphone',
    brand_model VARCHAR(255),
    damage_description TEXT,
    status VARCHAR(100) DEFAULT 'Registrasi & Masuk',
    cost NUMERIC DEFAULT 0,
    duration VARCHAR(100) DEFAULT '30 - 60 Menit',
    technician VARCHAR(100) DEFAULT 'Teknisi Lab Meja 1',
    step INTEGER DEFAULT 1,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Technician Logs (Audit Log Aktivitas Lab)
CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    technician VARCHAR(100),
    action VARCHAR(100),
    details TEXT,
    raw_data JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel Transactions (Faktur & Transaksi Kasir)
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(100) PRIMARY KEY,
    order_id VARCHAR(100),
    invoice_number VARCHAR(100),
    customer_name VARCHAR(255),
    total_amount NUMERIC DEFAULT 0,
    payment_method VARCHAR(50) DEFAULT 'Tunai (Cash)',
    cashier VARCHAR(100) DEFAULT 'Ibu Sarah (Meja 1)',
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabel Finances (Buku Kas Masuk & Kas Keluar)
CREATE TABLE IF NOT EXISTS finances (
    id VARCHAR(100) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(100),
    amount NUMERIC DEFAULT 0,
    description TEXT,
    date VARCHAR(50),
    source VARCHAR(100),
    recorded_by VARCHAR(100),
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabel Commissions (Komisi Afiliasi Mitra)
CREATE TABLE IF NOT EXISTS commissions (
    id SERIAL PRIMARY KEY,
    referral_code VARCHAR(100) NOT NULL,
    order_id VARCHAR(100),
    commission_amount NUMERIC DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Tercatat',
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabel Banners (Banner Promosi Website)
CREATE TABLE IF NOT EXISTS banners (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    badge_tag VARCHAR(100),
    badge_pill VARCHAR(100),
    promo_code VARCHAR(100),
    button_text VARCHAR(100),
    button_link TEXT,
    active BOOLEAN DEFAULT TRUE,
    raw_data JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
