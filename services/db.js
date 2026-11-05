/**
 * NGALAM FIX PRO - PostgreSQL Database Client & Integration Layer
 * Menghubungkan aplikasi Node.js ke database PostgreSQL sesuai konfigurasi DATABASE_URL di .env.
 * Dilengkapi dengan auto-schema initialization dan fallback aman ke data/ lokal.
 */

const net = require('net');
if (typeof net.setDefaultAutoSelectFamily === 'function') {
  net.setDefaultAutoSelectFamily(false);
}

const { Pool } = require('pg');
const { upsertRecord, appendActivityLog } = require('./localStore');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

let pool = null;
let isConnected = false;
let lastError = null;
let connectionDetails = {
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || 'ngalam_fix_pro',
  user: process.env.PGUSER || 'postgres'
};

function createPool() {
  const connectionString = process.env.DATABASE_URL || process.env.PG_CONNECTION_STRING;

  if (connectionString) {
    try {
      const parsed = new URL(connectionString);
      connectionDetails = {
        host: parsed.hostname || 'localhost',
        port: parsed.port || 5432,
        database: (parsed.pathname || '').replace(/^\//, '') || 'ngalam_fix_pro',
        user: parsed.username || 'postgres'
      };
    } catch (e) {
      // Keep defaults
    }

    const isSslConnection =
      /supabase\.(co|com)/i.test(connectionString) ||
      connectionString.includes('sslmode=require') ||
      process.env.PG_SSL === 'true';

    return new Pool({
      connectionString: connectionString,
      ssl: isSslConnection ? { rejectUnauthorized: false } : undefined,
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 10000,
      max: 10
    });
  }

  const isSslLocal = process.env.PG_SSL === 'true';

  return new Pool({
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    database: process.env.PGDATABASE || 'ngalam_fix_pro',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '',
    ssl: isSslLocal ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 10000,
    max: 10
  });
}

let initInFlight = null;

/**
 * Inisialisasi pool dan schema tabel PostgreSQL
 */
async function runInitDb() {
  try {
    if (!pool) {
      pool = createPool();
      pool.on('error', (err) => {
        console.warn('[PostgreSQL Pool Warning]:', err.message);
        isConnected = false;
        lastError = err.message;
      });
    }

    const client = await pool.connect();
    try {
      // 1. Verifikasi koneksi aktif
      const res = await client.query('SELECT current_database() AS db, NOW() AS now');
      isConnected = true;
      lastError = null;
      console.log(`[PostgreSQL] Terhubung ke database "${res.rows[0].db}" pada ${res.rows[0].now}`);

      // 2. Buat tabel jika belum ada (Auto-migration)
      await client.query(`
        -- Tabel Akun Pengguna / Staf / Mitra / Teknisi
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(100) PRIMARY KEY,
          username VARCHAR(100) UNIQUE,
          password VARCHAR(255),
          name VARCHAR(255),
          role VARCHAR(50),
          category VARCHAR(100),
          avatar VARCHAR(50),
          phone VARCHAR(50),
          email VARCHAR(255),
          referral_code VARCHAR(100),
          commission_rate NUMERIC DEFAULT 10,
          total_commission NUMERIC DEFAULT 0,
          status VARCHAR(50),
          last_active VARCHAR(100),
          desk VARCHAR(255),
          specialty TEXT,
          raw_data JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Tabel Akun Pelanggan (Customers)
        CREATE TABLE IF NOT EXISTS customers (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(255),
          whatsapp VARCHAR(50),
          email VARCHAR(255),
          district VARCHAR(255),
          pin VARCHAR(255),
          registered_at VARCHAR(100),
          registered_via VARCHAR(100),
          raw_data JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Tabel Tiket Servis & Antrean Pesanan (Orders)
        CREATE TABLE IF NOT EXISTS orders (
          id VARCHAR(100) PRIMARY KEY,
          customer_name VARCHAR(255),
          whatsapp VARCHAR(50),
          device_type VARCHAR(100),
          brand_model VARCHAR(255),
          damage_description TEXT,
          status VARCHAR(100),
          cost NUMERIC DEFAULT 0,
          duration VARCHAR(100),
          technician VARCHAR(100),
          step INTEGER DEFAULT 1,
          raw_data JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Tabel Riwayat Transaksi Faktur / Kasir
        CREATE TABLE IF NOT EXISTS transactions (
          id VARCHAR(100) PRIMARY KEY,
          order_id VARCHAR(100),
          invoice_number VARCHAR(100),
          customer_name VARCHAR(255),
          total_amount NUMERIC DEFAULT 0,
          payment_method VARCHAR(50),
          cashier VARCHAR(100),
          raw_data JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Tabel Buku Kas & Catatan Keuangan (Finances)
        CREATE TABLE IF NOT EXISTS finances (
          id VARCHAR(100) PRIMARY KEY,
          type VARCHAR(50),
          category VARCHAR(100),
          amount NUMERIC DEFAULT 0,
          description TEXT,
          date VARCHAR(50),
          source VARCHAR(100),
          recorded_by VARCHAR(100),
          raw_data JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Tabel Audit Log Aktivitas Teknisi
        CREATE TABLE IF NOT EXISTS technician_logs (
          id SERIAL PRIMARY KEY,
          technician VARCHAR(100),
          action VARCHAR(100),
          details TEXT,
          raw_data JSONB,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Tabel Sesi Login Aktif (Sessions)
        CREATE TABLE IF NOT EXISTS sessions (
          token VARCHAR(1000) PRIMARY KEY,
          user_id VARCHAR(100),
          name VARCHAR(255),
          username VARCHAR(100),
          role VARCHAR(50),
          access_level VARCHAR(50),
          raw_data JSONB,
          login_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
          CREATE TABLE IF NOT EXISTS activity_logs (
            id SERIAL PRIMARY KEY,
            action VARCHAR(100),
            table_name VARCHAR(100),
            record_id VARCHAR(100),
            payload JSONB,
            performed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          -- Tabel Kode Promo & Voucher Diskon
          CREATE TABLE IF NOT EXISTS promo_codes (
            id VARCHAR(100) PRIMARY KEY,
            code VARCHAR(100) UNIQUE,
            name VARCHAR(255),
            description TEXT,
            discount_type VARCHAR(50),
            discount_value NUMERIC DEFAULT 0,
            min_spend NUMERIC DEFAULT 0,
            max_discount NUMERIC DEFAULT 0,
            valid_from VARCHAR(50),
            valid_until VARCHAR(50),
            usage_limit INTEGER DEFAULT 0,
            used_count INTEGER DEFAULT 0,
            active BOOLEAN DEFAULT TRUE,
            raw_data JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          -- Tabel Banner Promo Beranda
          CREATE TABLE IF NOT EXISTS banners (
            id VARCHAR(100) PRIMARY KEY,
            title VARCHAR(255),
            description TEXT,
            badge_tag VARCHAR(100),
            badge_pill VARCHAR(100),
            theme VARCHAR(50),
            promo_code VARCHAR(100),
            button_text VARCHAR(100),
            button_link VARCHAR(255),
            image_url TEXT,
            active BOOLEAN DEFAULT TRUE,
            raw_data JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          -- Tabel Riwayat Komisi Mitra Driver & Afiliasi
          CREATE TABLE IF NOT EXISTS commissions (
            id SERIAL PRIMARY KEY,
            referral_code VARCHAR(100),
            order_id VARCHAR(100),
            commission_amount NUMERIC DEFAULT 0,
            status VARCHAR(50) DEFAULT 'Tercatat',
            raw_data JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          CREATE INDEX IF NOT EXISTS idx_commissions_ref_code ON commissions(referral_code);
          CREATE INDEX IF NOT EXISTS idx_commissions_order_id ON commissions(order_id);

          -- Tabel Iklan Interaktif (Database Iklan Dinamis)
          CREATE TABLE IF NOT EXISTS ads (
            id VARCHAR(100) PRIMARY KEY,
            title VARCHAR(255),
            headline VARCHAR(255),
            description TEXT,
            badge VARCHAR(100),
            image_url TEXT,
            target_url VARCHAR(255),
            cta_text VARCHAR(100),
            location VARCHAR(100) DEFAULT 'home_under_steps',
            theme VARCHAR(50) DEFAULT 'gold',
            active BOOLEAN DEFAULT TRUE,
            views_count INTEGER DEFAULT 0,
            clicks_count INTEGER DEFAULT 0,
            raw_data JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          CREATE INDEX IF NOT EXISTS idx_ads_location ON ads(location);
          CREATE INDEX IF NOT EXISTS idx_ads_active ON ads(active);

          -- Pastikan kolom tabel promo_codes dan banners selalu lengkap (idempotent migration)
          ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS name VARCHAR(255);
          ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS max_discount NUMERIC DEFAULT 0;
          ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS valid_from VARCHAR(50);
          ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS valid_until VARCHAR(50);
          ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS usage_limit INTEGER DEFAULT 0;
          ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS used_count INTEGER DEFAULT 0;
          ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS raw_data JSONB;

          ALTER TABLE banners ADD COLUMN IF NOT EXISTS badge_tag VARCHAR(100);
          ALTER TABLE banners ADD COLUMN IF NOT EXISTS badge_pill VARCHAR(100);
          ALTER TABLE banners ADD COLUMN IF NOT EXISTS theme VARCHAR(50);
          ALTER TABLE banners ADD COLUMN IF NOT EXISTS promo_code VARCHAR(100);
          ALTER TABLE banners ADD COLUMN IF NOT EXISTS button_text VARCHAR(100);
          ALTER TABLE banners ADD COLUMN IF NOT EXISTS button_link VARCHAR(255);
          ALTER TABLE banners ADD COLUMN IF NOT EXISTS image_url TEXT;
          ALTER TABLE banners ADD COLUMN IF NOT EXISTS raw_data JSONB;
        `);
        console.log('[PostgreSQL] Skema seluruh tabel (users, customers, orders, transactions, finances, technician_logs, sessions, activity_logs, promo_codes, banners, commissions, ads) siap.');
    } finally {
      client.release();
    }
    return true;
  } catch (err) {
    isConnected = false;
    lastError = err.message;
    console.warn('[PostgreSQL Init] Belum dapat terhubung ke server PostgreSQL:', err.message);
    console.info('[PostgreSQL Fallback] Sistem otomatis beralih ke penyimpanan lokal (data/) hingga kredensial PostgreSQL terhubung.');
    return false;
  }
}

async function initDb() {
  if (initInFlight) return initInFlight;
  initInFlight = runInitDb();
  try {
    return await initInFlight;
  } finally {
    initInFlight = null;
  }
}

async function ensureDbReady() {
  if (pool && isConnected) return true;
  return initDb();
}

// Inisialisasi saat modul dimuat
initDb().catch(() => {});

/**
 * Eksekusi query dengan penanganan error aman dan sinkronisasi ke storage lokal
 */
async function query(text, params, syncTable = null) {
  if (!pool || !isConnected) {
    throw new Error('Database PostgreSQL belum terhubung.');
  }
  const res = await pool.query(text, params);
  // Determine if the query modifies data (INSERT, UPDATE, DELETE) for activity logging
  const lowered = text.trim().toLowerCase();
  const isWrite = lowered.startsWith('insert') || lowered.startsWith('update') || lowered.startsWith('delete');
  if (isWrite && syncTable && res && res.rows && res.rows[0]) {
    try {
      upsertRecord(syncTable, res.rows[0]);
      // Log activity to activity_logs table
      await logActivity(isWrite ? 'WRITE' : 'READ', syncTable, res.rows[0].id, res.rows[0]);
    } catch (e) {
      console.warn('[local sync] Gagal menyimpan ke local store atau log activity:', e.message);
    }
  } else if (syncTable && res && res.rows && res.rows[0]) {
    // For read queries we still sync local store without logging
    try {
      upsertRecord(syncTable, res.rows[0]);
    } catch (e) {
      console.warn('[local sync] Gagal menyimpan ke local store:', e.message);
    }
  }
  return res;
}

// Helper to log activity actions (Dual persistence: PostgreSQL + local data/activity_logs.json)
async function logActivity(action, table_name, record_id, payload) {
  // 1. Selalu rekam ke penyimpanan lokal
  try {
    appendActivityLog(action, table_name, record_id, payload);
  } catch (e) {
    console.warn('[activity log local] Gagal mencatat aktivitas lokal:', e.message);
  }

  // 2. Rekam ke PostgreSQL jika terhubung
  if (pool && isConnected) {
    const logQuery = `
      INSERT INTO activity_logs (action, table_name, record_id, payload)
      VALUES ($1, $2, $3, $4)
    `;
    try {
      await pool.query(logQuery, [action, table_name, record_id ? String(record_id) : null, JSON.stringify(payload || {})]);
    } catch (e) {
      console.warn('[activity log postgres] Gagal mencatat aktivitas ke PostgreSQL:', e.message);
    }
  }
}

/**
 * Uji koneksi dan periksa status database
 */
async function testConnection() {
  if (!pool) {
    pool = createPool();
  }

  try {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT NOW() AS now, current_database() AS db, version() AS ver');
      isConnected = true;
      lastError = null;

      // Ambil statistik jumlah baris tabel
      let stats = {};
      try {
        const counts = await client.query(`
          SELECT 
            (SELECT COUNT(*) FROM orders) AS orders_count,
            (SELECT COUNT(*) FROM users WHERE role IN ('customer', 'pelanggan')) AS customers_count,
            (SELECT COUNT(*) FROM users) AS users_count,
            (SELECT COUNT(*) FROM transactions) AS transactions_count,
            (SELECT COUNT(*) FROM finances) AS finances_count
        `);
        stats = counts.rows[0];
      } catch (e) {
        // Abaikan jika tabel baru dibuat
      }

      return {
        connected: true,
        database: res.rows[0].db,
        timestamp: res.rows[0].now,
        version: res.rows[0].ver,
        connection: connectionDetails,
        stats: stats,
        mode: 'postgresql'
      };
    } finally {
      client.release();
    }
  } catch (err) {
    isConnected = false;
    lastError = err.message;
    return {
      connected: false,
      error: err.message,
      connection: connectionDetails,
      fallbackMode: 'data/ local storage',
      hint: 'Periksa username dan password PostgreSQL di file .env atau pastikan database ngalam_fix_pro telah dibuat.'
    };
  }
}

function isDbConnected() {
  return isConnected;
}

function getLastError() {
  return lastError;
}

function getConnectionDetails() {
  return { ...connectionDetails, isConnected };
}

module.exports = {
  initDb,
  ensureDbReady,
  query,
  logActivity,
  testConnection,
  isDbConnected,
  getLastError,
  getConnectionDetails,
  getPool: () => pool
};
