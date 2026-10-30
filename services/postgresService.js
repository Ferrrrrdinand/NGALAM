/**
 * NGALAM FIX PRO - PostgreSQL Database Connection & Pool Manager
 * Hybrid fallback: Uses PostgreSQL if PG_CONNECTION_STRING / PGHOST is provided,
 * otherwise falls back gracefully to JSON storage.
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

let pool = null;
let isPostgresConnected = false;

function getPostgresPool() {
    if (pool) return pool;

    const connectionString = process.env.DATABASE_URL || process.env.PG_CONNECTION_STRING;
    const pgConfig = connectionString
        ? { connectionString, ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false }
        : {
            host: process.env.PGHOST || 'localhost',
            port: parseInt(process.env.PGPORT, 10) || 5432,
            database: process.env.PGDATABASE || 'ngalam_fix_pro',
            user: process.env.PGUSER || 'postgres',
            password: process.env.PGPASSWORD || '',
            ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false,
        };

    pool = new Pool(pgConfig);

    pool.on('error', (err) => {
        console.error('[PostgreSQL] Unexpected error on idle client:', err.message);
    });

    return pool;
}

/**
 * Initialize PostgreSQL tables from schema.sql
 */
async function initPostgresDatabase() {
    const connectionString = process.env.DATABASE_URL || process.env.PG_CONNECTION_STRING;
    const hasPgEnv = connectionString || process.env.PGDATABASE;

    if (!hasPgEnv) {
        console.log('ℹ️ [PostgreSQL] Tidak ada konfigurasi DATABASE_URL / PGDATABASE di .env. Menggunakan mode penyimpanan lokal.');
        return false;
    }

    try {
        const p = getPostgresPool();
        const client = await p.connect();
        console.log('✅ [PostgreSQL] Berhasil terhubung ke database PostgreSQL!');

        // Read and run schema.sql
        const schemaPath = path.join(__dirname, '..', 'scripts', 'schema.sql');
        if (fs.existsSync(schemaPath)) {
            const sql = fs.readFileSync(schemaPath, 'utf-8');
            await client.query(sql);
            console.log('✅ [PostgreSQL] 8 Tabel & Seed Data (users, customers, orders, logs, transactions, finances, commissions, banners) siap digunakan.');
        }
        client.release();
        isPostgresConnected = true;
        return true;
    } catch (err) {
        console.warn('⚠️ [PostgreSQL] Gagal inisialisasi PostgreSQL (' + err.message + '). Sistem berjalan dengan mode fallback lokal.');
        isPostgresConnected = false;
        return false;
    }
}

/**
 * Helper to execute queries safely
 */
async function query(text, params) {
    const p = getPostgresPool();
    return p.query(text, params);
}

module.exports = {
    getPostgresPool,
    initPostgresDatabase,
    query,
    isPostgresReady: () => isPostgresConnected
};