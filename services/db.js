/**
 * NGALAM FIX PRO - Database Client & Integration Layer
 * Mendukung dual dialect: MySQL (cPanel / Production) dan PostgreSQL (Supabase / Local).
 * Auto-detect berdasarkan DB_DIALECT=mysql atau variabel konfigurasi MySQL lainnya.
 */

const net = require('net');
if (typeof net.setDefaultAutoSelectFamily === 'function') {
  net.setDefaultAutoSelectFamily(false);
}

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { upsertRecord, appendActivityLog } = require('./localStore');

const isMySql = (process.env.DB_DIALECT || '').toLowerCase() === 'mysql' ||
  !!process.env.DB_USER ||
  !!process.env.MYSQL_DATABASE;

let pool = null;
let isConnected = false;
let lastError = null;
let connectionDetails = {};
let initInFlight = null;

// =====================================================================
// SQL TRANSLATION / ADAPTATION UTILITIES (PostgreSQL -> MySQL)
// =====================================================================

function convertPgQueryToMysql(text, params = []) {
  let convertedText = text;
  let rawParams = params ? [...params] : [];

  // 1. Convert = ANY($1::text[]) or = ANY($1) -> IN (?)
  convertedText = convertedText.replace(/=\s*ANY\s*\(\s*\$(\d+)(?:::text\[\])?\s*\)/gi, (match, paramNum) => {
    return 'IN (?)';
  });

  // 2. Convert ON CONFLICT (col) DO NOTHING -> ON DUPLICATE KEY UPDATE id=id
  convertedText = convertedText.replace(/ON\s+CONFLICT\s*\([^\)]+\)\s*DO\s+NOTHING/gi, 'ON DUPLICATE KEY UPDATE id=id');

  // 3. Convert ON CONFLICT (col) DO UPDATE SET col1 = EXCLUDED.col1, ... -> ON DUPLICATE KEY UPDATE col1 = VALUES(col1), ...
  convertedText = convertedText.replace(/ON\s+CONFLICT\s*\([^\)]+\)\s*DO\s+UPDATE\s+SET/gi, 'ON DUPLICATE KEY UPDATE');
  convertedText = convertedText.replace(/EXCLUDED\.([a-zA-Z0-9_]+)/gi, 'VALUES($1)');

  // 4. Convert PostgreSQL specific functions to MySQL equivalents
  convertedText = convertedText.replace(/current_database\(\)/gi, 'DATABASE()');

  // 5. Safely reorder parameters matching the exact order $1, $2, $3 appears in SQL
  const reorderedParams = [];
  convertedText = convertedText.replace(/\$(\d+)/g, (match, numStr) => {
    const idx = parseInt(numStr, 10) - 1;
    if (idx >= 0 && idx < rawParams.length) {
      reorderedParams.push(rawParams[idx]);
    } else {
      reorderedParams.push(null);
    }
    return '?';
  });

  const convertedParams = reorderedParams.length > 0 ? reorderedParams : rawParams;
  return { text: convertedText, params: convertedParams };
}

// =====================================================================
// POOL CREATION
// =====================================================================

function createPool() {
  if (isMySql) {
    const mysql = require('mysql2/promise');
    connectionDetails = {
      dialect: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      database: process.env.DB_NAME || 'ngad2562_ngalamfixpro',
      user: process.env.DB_USER || 'ngad2562_root'
    };

    return mysql.createPool({
      host: connectionDetails.host,
      port: connectionDetails.port,
      user: connectionDetails.user,
      password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
      database: connectionDetails.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 15000,
      dateStrings: true
    });
  }

  // Fallback to PostgreSQL (pg)
  const { Pool } = require('pg');
  const connectionString = process.env.DATABASE_URL || process.env.PG_CONNECTION_STRING;

  if (connectionString) {
    try {
      const parsed = new URL(connectionString);
      connectionDetails = {
        dialect: 'postgres',
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

  connectionDetails = {
    dialect: 'postgres',
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    database: process.env.PGDATABASE || 'ngalam_fix_pro',
    user: process.env.PGUSER || 'postgres'
  };

  return new Pool({
    host: connectionDetails.host,
    port: connectionDetails.port,
    database: connectionDetails.database,
    user: connectionDetails.user,
    password: process.env.PGPASSWORD || '',
    ssl: isSslLocal ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 10000,
    max: 10
  });
}

// =====================================================================
// INIT DATABASE
// =====================================================================

async function runInitDb() {
  try {
    if (!pool) {
      pool = createPool();
      if (!isMySql && pool.on) {
        pool.on('error', (err) => {
          console.warn('[Database Pool Warning]:', err.message);
          isConnected = false;
          lastError = err.message;
        });
      }
    }

    if (isMySql) {
      const [rows] = await pool.query('SELECT DATABASE() AS db, NOW() AS now');
      isConnected = true;
      lastError = null;
      console.log(`[MySQL] Terhubung ke database "${rows[0].db}" pada ${rows[0].now}`);
      return true;
    }

    // PostgreSQL connection test
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT current_database() AS db, NOW() AS now');
      isConnected = true;
      lastError = null;
      console.log(`[PostgreSQL] Terhubung ke database "${res.rows[0].db}" pada ${res.rows[0].now}`);
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    isConnected = false;
    lastError = err.message;
    console.warn(`[Database Init] Belum dapat terhubung ke ${isMySql ? 'MySQL' : 'PostgreSQL'}:`, err.message);
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

// =====================================================================
// QUERY EXECUTION (UNIFIED PG & MYSQL ADAPTER)
// =====================================================================

async function query(text, params = [], syncTable = null) {
  if (!pool || !isConnected) {
    const ok = await ensureDbReady();
    if (!ok) {
      throw new Error(`Database ${isMySql ? 'MySQL' : 'PostgreSQL'} belum terhubung: ${lastError || 'Unknown error'}`);
    }
  }

  let rows = [];
  let rowCount = 0;

  if (isMySql) {
    const converted = convertPgQueryToMysql(text, params);
    const [result] = await pool.query(converted.text, converted.params);

    if (Array.isArray(result)) {
      rows = result;
      rowCount = result.length;
    } else if (result && typeof result === 'object') {
      rowCount = result.affectedRows || 0;
      rows = [];
    }
  } else {
    const res = await pool.query(text, params);
    rows = res.rows || [];
    rowCount = res.rowCount || 0;
  }

  const resObj = { rows, rowCount };

  // Determine if the query modifies data for activity logging & local sync
  const lowered = text.trim().toLowerCase();
  const isWrite = lowered.startsWith('insert') || lowered.startsWith('update') || lowered.startsWith('delete');
  if (isWrite && syncTable && rows && rows[0]) {
    try {
      upsertRecord(syncTable, rows[0]);
      await logActivity(isWrite ? 'WRITE' : 'READ', syncTable, rows[0].id, rows[0]);
    } catch (e) {
      console.warn('[local sync] Gagal menyimpan ke local store atau log activity:', e.message);
    }
  } else if (syncTable && rows && rows[0]) {
    try {
      upsertRecord(syncTable, rows[0]);
    } catch (e) {
      console.warn('[local sync] Gagal menyimpan ke local store:', e.message);
    }
  }

  return resObj;
}

// Activity logging
async function logActivity(action, table_name, record_id, payload) {
  try {
    appendActivityLog(action, table_name, record_id, payload);
  } catch (e) {
    console.warn('[activity log local] Gagal mencatat aktivitas lokal:', e.message);
  }

  if (pool && isConnected) {
    try {
      if (isMySql) {
        await pool.query(
          'INSERT INTO activity_logs (action, table_name, record_id, payload) VALUES (?, ?, ?, ?)',
          [action, table_name, record_id ? String(record_id) : null, JSON.stringify(payload || {})]
        );
      } else {
        await pool.query(
          'INSERT INTO activity_logs (action, table_name, record_id, payload) VALUES ($1, $2, $3, $4)',
          [action, table_name, record_id ? String(record_id) : null, JSON.stringify(payload || {})]
        );
      }
    } catch (e) {
      console.warn('[activity log db] Gagal mencatat aktivitas ke DB:', e.message);
    }
  }
}

// Test connection
async function testConnection() {
  if (!pool) {
    pool = createPool();
  }

  try {
    if (isMySql) {
      const [rows] = await pool.query('SELECT NOW() AS now, DATABASE() AS db, VERSION() AS ver');
      isConnected = true;
      lastError = null;

      let stats = {};
      try {
        const [counts] = await pool.query(`
          SELECT 
            (SELECT COUNT(*) FROM orders) AS orders_count,
            (SELECT COUNT(*) FROM users WHERE role IN ('customer', 'pelanggan')) AS customers_count,
            (SELECT COUNT(*) FROM users) AS users_count,
            (SELECT COUNT(*) FROM transactions) AS transactions_count,
            (SELECT COUNT(*) FROM finances) AS finances_count
        `);
        stats = counts[0] || {};
      } catch (e) {
        // Abaikan jika ada tabel kosong/baru
      }

      return {
        connected: true,
        database: rows[0].db,
        timestamp: rows[0].now,
        version: rows[0].ver,
        connection: connectionDetails,
        stats: stats,
        mode: 'mysql'
      };
    }

    const client = await pool.connect();
    try {
      const res = await client.query('SELECT NOW() AS now, current_database() AS db, version() AS ver');
      isConnected = true;
      lastError = null;

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
        // Abaikan
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
      fallbackMode: 'data/ local storage'
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
