/**
 * NGALAM FIX PRO - PostgreSQL Database Client & Integration Layer
 * Menghubungkan aplikasi Node.js ke database PostgreSQL sesuai konfigurasi DATABASE_URL di .env.
 * Dilengkapi dengan auto-schema initialization dan fallback aman ke data/ lokal.
 */

const { Pool } = require('pg');
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
  const connectionString = process.env.DATABASE_URL;

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

    return new Pool({
      connectionString: connectionString,
      connectionTimeoutMillis: 4000,
      idleTimeoutMillis: 10000,
      max: 10
    });
  }

  return new Pool({
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    database: process.env.PGDATABASE || 'ngalam_fix_pro',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '',
    connectionTimeoutMillis: 4000,
    idleTimeoutMillis: 10000,
    max: 10
  });
}

/**
 * Inisialisasi pool dan schema tabel PostgreSQL
 */
async function initDb() {
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
          whatsapp VARCHAR(50) UNIQUE,
          email VARCHAR(255),
          district VARCHAR(255),
          pin VARCHAR(50),
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
          token VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(100),
          name VARCHAR(255),
          username VARCHAR(100),
          role VARCHAR(50),
          access_level VARCHAR(50),
          raw_data JSONB,
          login_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log('[PostgreSQL] Skema seluruh tabel (users, customers, orders, transactions, finances, technician_logs, sessions) siap.');
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

// Inisialisasi saat modul dimuat
initDb().catch(() => {});

/**
 * Eksekusi query dengan penanganan error aman
 */
async function query(text, params) {
  if (!pool || !isConnected) {
    throw new Error('Database PostgreSQL belum terhubung.');
  }
  return pool.query(text, params);
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
            (SELECT COUNT(*) FROM customers) AS customers_count,
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
  query,
  testConnection,
  isDbConnected,
  getLastError,
  getConnectionDetails,
  getPool: () => pool
};
