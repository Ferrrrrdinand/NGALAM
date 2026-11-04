/**
 * NGALAM FIX PRO - Customer Management Service
 * Mengelola database akun dan profil pelanggan smartphone.
 * Terintegrasi realtime ke PostgreSQL Database via services/db.js (dengan fallback data/ lokal).
 */

const fs = require('fs');
const path = require('path');
const db = require('./db');

const CUSTOMERS_FILE = path.join(__dirname, '..', 'data', 'customers.json');

/**
 * Baca seluruh pelanggan dari file lokal (fallback)
 */
function getLocalCustomers() {
  try {
    if (!fs.existsSync(CUSTOMERS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(CUSTOMERS_FILE, 'utf8');
    return JSON.parse(raw.replace(/^\uFEFF/, ''));
  } catch (err) {
    console.error('[CustomerService] Error reading customers.json:', err.message);
    return [];
  }
}

/**
 * Simpan data pelanggan ke file lokal (cadangan aman)
 */
function saveCustomers(customers) {
  try {
    fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify(customers, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('[CustomerService] Error writing customers.json:', err.message);
    return false;
  }
}

/**
 * Ambil seluruh data pelanggan realtime (Prioritas: PostgreSQL Database)
 */
async function getAllCustomersAsync() {
  if (db.isDbConnected()) {
    try {
      const res = await db.query('SELECT raw_data FROM customers ORDER BY created_at DESC');
      if (res && res.rows && res.rows.length > 0) {
        return res.rows.map(r => r.raw_data || r);
      }
    } catch (err) {
      console.warn('[CustomerService] PostgreSQL getAllCustomersAsync fallback:', err.message);
    }
  }
  return getLocalCustomers();
}

function getAllCustomers() {
  return getLocalCustomers();
}

/**
 * Normalisasi nomor telepon Indonesia (mengubah +62 / 62 menjadi format standar 08...)
 */
function normalizePhone(val) {
  if (!val) return '';
  let digits = String(val).replace(/\D/g, '');
  if (digits.startsWith('62')) {
    digits = '0' + digits.slice(2);
  }
  return digits;
}

function phonesMatch(p1, p2) {
  const norm1 = normalizePhone(p1);
  const norm2 = normalizePhone(p2);
  if (!norm1 || !norm2) return false;
  if (norm1 === norm2) return true;
  if (norm1.length >= 8 && norm2.length >= 8) {
    return norm1.endsWith(norm2.slice(-8)) || norm2.endsWith(norm1.slice(-8));
  }
  return false;
}

/**
 * Cari pelanggan realtime berdasarkan identifier (ID, No. WA, Email, atau No. Tiket Servis)
 */
async function findCustomerByIdentifier(identifier) {
  if (!identifier) return null;
  const clean = identifier.trim().toLowerCase();
  const digits = clean.replace(/\D/g, '');

  // 1. Prioritas Database PostgreSQL Realtime
  if (db.isDbConnected()) {
    try {
      const res = await db.query(`
        SELECT raw_data FROM customers 
        WHERE LOWER(id) = $1 
           OR LOWER(email) = $1 
           OR whatsapp = $1 
           OR (LENGTH($2) >= 6 AND whatsapp LIKE $3)
        LIMIT 1
      `, [clean, digits, `%${digits}%`]);

      if (res && res.rows && res.rows.length > 0) {
        return res.rows[0].raw_data;
      }
    } catch (err) {
      console.warn('[CustomerService] PostgreSQL findCustomerByIdentifier error:', err.message);
    }
  }

  // 2. Fallback Memori Lokal
  const customers = getAllCustomers();
  let found = customers.find(c => {
    const cId = (c.id || '').toLowerCase();
    const cWa = c.whatsapp || '';
    const cEmail = (c.email || '').toLowerCase();

    if (cId === clean) return true;
    if (phonesMatch(cWa, clean)) return true;
    if (cEmail && cEmail === clean) return true;
    return false;
  });

  if (found) return found;

  // 3. Fallback Tiket Servis Orders (Orders Table di PostgreSQL)
  try {
    const { getAllOrders } = require('./orderService');
    const orders = await getAllOrders();
    if (Array.isArray(orders)) {
      const matchedOrder = orders.find(o => {
        const oId = (o.id || '').toLowerCase();
        const oWa = o.whatsapp || o.customerPhone || o.phone || '';
        const oEmail = (o.email || '').toLowerCase();
        return oId === clean || phonesMatch(oWa, clean) || (oEmail && oEmail === clean);
      });

      if (matchedOrder) {
        const autoWa = matchedOrder.whatsapp || matchedOrder.customerPhone || matchedOrder.phone || clean;
        const autoCust = {
          id: `CUST-${(matchedOrder.id || '').replace(/[^0-9]/g, '') || Date.now()}`,
          name: matchedOrder.customerName || matchedOrder.name || 'Pelanggan Ngalam Fix Pro',
          whatsapp: autoWa,
          email: matchedOrder.email || '',
          district: matchedOrder.district || matchedOrder.address || 'Malang Raya',
          pin: '123456',
          registeredAt: matchedOrder.createdAt || new Date().toLocaleDateString('id-ID'),
          registeredVia: 'Otomatisasi Tiket Servis'
        };

        // Simpan langsung ke PostgreSQL
        if (db.isDbConnected()) {
          db.query(`
            INSERT INTO customers (id, name, whatsapp, email, district, pin, registered_at, registered_via, raw_data)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (id) DO UPDATE SET raw_data = EXCLUDED.raw_data
          `, [
            autoCust.id, autoCust.name, autoCust.whatsapp, autoCust.email,
            autoCust.district, autoCust.pin, autoCust.registeredAt, autoCust.registeredVia,
            JSON.stringify(autoCust)
          ], 'customers').catch(() => {});
        }

        customers.push(autoCust);
        saveCustomers(customers);
        return autoCust;
      }
    }
  } catch (err) {
    console.warn('[CustomerService] Fallback order search error:', err.message);
  }

  return null;
}

/**
 * Daftarkan akun pelanggan baru secara Realtime ke PostgreSQL Database
 */
async function registerNewCustomer({ name, whatsapp, email = '', district = 'Klojen, Kota Malang', pin = '123456', registeredVia = 'Portal Pelanggan Web', referredByMitra = '' }) {
  if (!name || !name.trim()) {
    throw new Error('Nama lengkap pelanggan wajib diisi.');
  }
  if (!whatsapp || !whatsapp.trim()) {
    throw new Error('Nomor WhatsApp aktif wajib diisi.');
  }

  const cleanWa = whatsapp.trim();
  const existing = await findCustomerByIdentifier(cleanWa);
  if (existing) {
    throw new Error(`Nomor WhatsApp ${cleanWa} sudah terdaftar dengan nama ${existing.name}. Silakan langsung masuk.`);
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');

  const newId = `CUST-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(1000 + Math.random() * 9000))}`;

  const newCust = {
    id: newId,
    name: name.trim(),
    whatsapp: cleanWa,
    email: (email || '').trim().toLowerCase(),
    district: district.trim(),
    pin: pin ? pin.trim() : '123456',
    referredByMitra: (referredByMitra || '').trim().toUpperCase(),
    registeredAt: `${dateStr}, ${timeStr}`,
    registeredVia: registeredVia
  };

  // 1. Simpan ke PostgreSQL jika terhubung (Await Realtime)
  if (db.isDbConnected()) {
    try {
      await db.query(`
        INSERT INTO customers (id, name, whatsapp, email, district, pin, registered_at, registered_via, raw_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          district = EXCLUDED.district,
          raw_data = EXCLUDED.raw_data
      `, [
        newCust.id,
        newCust.name,
        newCust.whatsapp,
        newCust.email,
        newCust.district,
        newCust.pin,
        newCust.registeredAt,
        newCust.registeredVia,
        JSON.stringify(newCust)
      ], 'customers');
    } catch (err) {
      console.warn('[CustomerService] PostgreSQL insert customer warning:', err.message);
    }
  }

  // Catat aktivitas registrasi pelanggan
  try {
    await db.logActivity('CUSTOMER_REGISTER', 'customers', newCust.id, {
      name: newCust.name,
      whatsapp: newCust.whatsapp,
      district: newCust.district,
      registeredVia: newCust.registeredVia
    });
  } catch (_) {}

  // 2. Simpan cadangan ke file lokal jika diperbolehkan
  try {
    const customers = getLocalCustomers();
    customers.push(newCust);
    saveCustomers(customers);
  } catch (_) {}

  return newCust;
}

/**
 * Pastikan akun pelanggan tersedia secara Realtime (otomatis dibuat jika belum ada)
 */
async function ensureCustomerAccount({ name, whatsapp, email = '', district = 'Klojen, Kota Malang', pin = '123456', registeredVia = 'Sistem Servis', referredByMitra = '' }) {
  if (!whatsapp) return null;
  const existing = await findCustomerByIdentifier(whatsapp);
  if (existing) {
    let changed = false;
    if (email && !existing.email) {
      existing.email = email.trim().toLowerCase();
      changed = true;
    }
    if (district && (!existing.district || existing.district === 'Malang')) {
      existing.district = district.trim();
      changed = true;
    }
    if (referredByMitra && !existing.referredByMitra) {
      existing.referredByMitra = referredByMitra.trim().toUpperCase();
      changed = true;
    }
    if (changed) {
      if (db.isDbConnected()) {
        try {
          await db.query(`
            UPDATE customers SET email = $1, district = $2, raw_data = $3 WHERE id = $4
          `, [existing.email, existing.district, JSON.stringify(existing), existing.id]);
        } catch (_) {}
      }
      try {
        const customers = getLocalCustomers();
        const idx = customers.findIndex(c => c.id === existing.id);
        if (idx !== -1) {
          customers[idx] = existing;
          saveCustomers(customers);
        }
      } catch (_) {}
    }
    return existing;
  }

  try {
    return await registerNewCustomer({
      name: name || 'Pelanggan Setia',
      whatsapp: whatsapp,
      email: email,
      district: district,
      pin: pin,
      referredByMitra: referredByMitra,
      registeredVia: registeredVia
    });
  } catch (err) {
    console.warn('[CustomerService] ensureCustomerAccount auto-register warning:', err.message);
    return null;
  }
}

module.exports = {
  getAllCustomers,
  getAllCustomersAsync,
  findCustomerByIdentifier,
  registerNewCustomer,
  ensureCustomerAccount,
  saveCustomers,
  normalizePhone,
  phonesMatch
};
