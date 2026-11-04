/**
 * NGALAM FIX PRO - Customer Management Service
 * Mengelola database akun dan profil pelanggan smartphone.
 * Terintegrasi ke PostgreSQL Database via services/db.js (dengan fallback data/ lokal).
 */

const fs = require('fs');
const path = require('path');
const db = require('./db');
const userService = require('./userService');
const { hashPassword } = require('../src/utils/security');
const { AuthError } = require('../src/utils/authError');
const { isValidEmail, normalizeEmail } = require('../src/utils/phone');

const CUSTOMERS_FILE = path.join(__dirname, '..', 'data', 'customers.json');

let customerCache = null;
let customersHydratedAt = 0;
let customersHydration = null;

function normalizeDbCustomer(row) {
  const raw = row && row.raw_data && typeof row.raw_data === 'object' ? row.raw_data : {};
  return {
    ...raw,
    id: raw.id || row.id,
    username: raw.username || row.username || '',
    name: raw.name || row.name || '',
    whatsapp: raw.whatsapp !== undefined ? raw.whatsapp : (row.phone || row.whatsapp),
    email: raw.email || row.email || '',
    district: raw.district || row.district || '',
    pin: raw.pin || row.password || row.pin || '',
    passwordHash: raw.passwordHash || raw.pin || row.password || row.pin || '',
    googleId: raw.googleId || '',
    referredByMitra: raw.referredByMitra || '',
    registeredAt: raw.registeredAt || row.registered_at || '',
    registeredVia: raw.registeredVia || row.registered_via || '',
    avatar: raw.avatar || row.avatar || ''
  };
}

async function refreshCustomersFromDb(force = false) {
  const now = Date.now();
  if (!force && customersHydratedAt && now - customersHydratedAt < 3000) return true;
  if (customersHydration) return customersHydration;

  customersHydration = (async () => {
    try {
      if (!db.isDbConnected()) await db.ensureDbReady();
      if (!db.isDbConnected()) return false;

      const res = await db.query("SELECT * FROM users WHERE role IN ('customer', 'pelanggan') ORDER BY created_at ASC");
      customerCache = (res.rows || []).map(normalizeDbCustomer).filter((c) => c.id);
      customersHydratedAt = Date.now();
      return true;
    } catch (err) {
      console.warn('[CustomerService] PostgreSQL hydrate warning:', err.message);
      return false;
    } finally {
      customersHydration = null;
    }
  })();

  return customersHydration;
}

/**
 * Baca seluruh pelanggan dari file lokal
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
 * Simpan data pelanggan ke file lokal
 */
function saveCustomers(customers) {
  customerCache = Array.isArray(customers) ? customers : [];
  try {
    fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify(customerCache, null, 2), 'utf8');
  } catch (err) {
    console.warn('[CustomerService] Disk write skipped for customers.json:', err.message);
  }
  return true;
}

/**
 * Ambil seluruh data pelanggan (cache PostgreSQL, fallback lokal)
 */
function getAllCustomers() {
  return customerCache || getLocalCustomers();
}

function buildCustomerUsername(customer) {
  const existing = String(customer.username || '').trim().toLowerCase();
  if (existing) return existing;
  const suffix = String(customer.id || customer.whatsapp || customer.email || Date.now())
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || String(Date.now());
  return `cust_${suffix}`;
}

async function persistCustomerUser(customer) {
  if (!customer || !customer.id || !db.isDbConnected()) return false;
  const username = buildCustomerUsername(customer);
  await db.query(`
    INSERT INTO users (
      id, username, password, name, role, category, avatar, phone, email,
      referral_code, commission_rate, total_commission, status, last_active, desk, specialty, raw_data
    )
    VALUES ($1, $2, $3, $4, 'customer', $5, $6, $7, $8, $9, 0, 0, $10, $11, '', '', $12)
    ON CONFLICT (id) DO UPDATE SET
      username = EXCLUDED.username,
      password = EXCLUDED.password,
      name = EXCLUDED.name,
      role = 'customer',
      category = EXCLUDED.category,
      avatar = EXCLUDED.avatar,
      phone = EXCLUDED.phone,
      email = EXCLUDED.email,
      referral_code = EXCLUDED.referral_code,
      status = EXCLUDED.status,
      last_active = EXCLUDED.last_active,
      raw_data = EXCLUDED.raw_data
  `, [
    customer.id,
    username,
    customer.passwordHash || customer.pin || '',
    customer.name || '',
    customer.category || 'Pelanggan',
    customer.avatar && String(customer.avatar).length <= 50 ? customer.avatar : '👤',
    customer.whatsapp || '',
    customer.email || '',
    customer.referredByMitra || '',
    customer.status || 'Aktif',
    customer.registeredAt || '',
    JSON.stringify(customer)
  ], 'users');
  return true;
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
 * Cari pelanggan berdasarkan identifier (ID, No. WA, Email, atau No. Tiket Servis)
 */
function findCustomerByIdentifier(identifier) {
  if (!identifier) return null;
  const customers = getAllCustomers();
  const clean = String(identifier).trim().toLowerCase();

  return customers.find((customer) => {
    const customerId = String(customer.id || '').toLowerCase();
    const customerPhone = customer.whatsapp || '';
    const customerEmail = String(customer.email || '').toLowerCase();
    return customerId === clean || phonesMatch(customerPhone, clean) || (customerEmail && customerEmail === clean);
  }) || null;
}

/**
 * Daftarkan akun pelanggan baru
 */
async function registerNewCustomer({ name, whatsapp, email = '', district = 'Klojen, Kota Malang', pin = '', password = '', registeredVia = 'Portal Pelanggan Web', referredByMitra = '', googleId = '' }) {
  if (!name || !name.trim()) {
    throw new AuthError('Nama lengkap pelanggan wajib diisi.', {
      status: 400,
      code: 'NAME_REQUIRED',
      field: 'name'
    });
  }
  if (!whatsapp || !whatsapp.trim()) {
    throw new AuthError('Nomor WhatsApp aktif wajib diisi.', {
      status: 400,
      code: 'PHONE_REQUIRED',
      field: 'whatsapp'
    });
  }

  const cleanWa = normalizePhone(whatsapp);
  const cleanEmail = normalizeEmail(email);
  if (cleanWa.length < 9 || cleanWa.length > 15) {
    throw new AuthError('Nomor WhatsApp tidak valid. Gunakan format 08xxxxxxxxxx.', {
      status: 400,
      code: 'INVALID_PHONE',
      field: 'whatsapp'
    });
  }
  if (!isValidEmail(cleanEmail)) {
    throw new AuthError('Format email tidak valid.', {
      status: 400,
      code: 'INVALID_EMAIL',
      field: 'email'
    });
  }

  const existingPhone = findCustomerByPhone(cleanWa);
  if (existingPhone) {
    throw new AuthError(`Nomor WhatsApp sudah terdaftar dengan nama ${existingPhone.name}. Silakan langsung masuk.`, {
      status: 409,
      code: 'CUSTOMER_PHONE_TAKEN',
      field: 'whatsapp'
    });
  }

  const existingEmail = cleanEmail ? findCustomerByEmail(cleanEmail) : null;
  if (existingEmail) {
    throw new AuthError(`Email sudah terdaftar dengan nama ${existingEmail.name}. Silakan langsung masuk.`, {
      status: 409,
      code: 'CUSTOMER_EMAIL_TAKEN',
      field: 'email'
    });
  }

  try {
    const usersReady = await userService.refreshUsersFromDb();
    if (usersReady) {
      const registeredUser = userService.findUser(cleanWa) || (cleanEmail ? userService.findUser(cleanEmail) : null);
      const isCustomer = registeredUser && ['customer', 'pelanggan'].includes(String(registeredUser.role || '').toLowerCase());
      if (registeredUser && !isCustomer) {
        const isMitra = ['mitra', 'ojol', 'kurir'].includes(String(registeredUser.role || '').toLowerCase());
        throw new AuthError(
          isMitra
            ? 'Kontak ini sudah terdaftar sebagai mitra. Masuk ke portal pelanggan menggunakan akun mitra Anda.'
            : 'Kontak ini sudah terdaftar sebagai akun staf. Gunakan kontak lain.',
          {
            status: 409,
            code: isMitra ? 'MITRA_ACCOUNT_EXISTS' : 'STAFF_ACCOUNT_EXISTS',
            field: userService.findUser(cleanWa) ? 'whatsapp' : 'email'
          }
        );
      }
    }
  } catch (err) {
    if (err instanceof AuthError) throw err;
  }

  const customers = getAllCustomers();
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');

  const newId = `CUST-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(1000 + Math.random() * 9000))}`;

  const passwordHash = hashPassword(password || pin || '123456');

  const newCust = {
    id: newId,
    name: name.trim(),
    whatsapp: cleanWa,
    email: cleanEmail,
    district: district.trim(),
    pin: passwordHash,
    passwordHash,
    googleId: googleId || '',
    referredByMitra: (referredByMitra || '').trim().toUpperCase(),
    registeredAt: `${dateStr}, ${timeStr}`,
    registeredVia: registeredVia
  };

  // 1. Simpan ke cache local dan tabel users (role customer)
  customers.push(newCust);
  saveCustomers(customers);

  try {
    await persistCustomerUser(newCust);
  } catch (pgErr) {
    console.warn('[CustomerService] PostgreSQL insert customer warning:', pgErr.message);
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

  return newCust;
}

/**
 * Pastikan akun pelanggan tersedia (otomatis dibuat jika belum ada)
 */
async function ensureCustomerAccount({ name, whatsapp, email = '', district = 'Klojen, Kota Malang', pin = '123456', registeredVia = 'Sistem Servis', referredByMitra = '' }) {
  if (!whatsapp) return null;
  const existing = findCustomerByIdentifier(whatsapp);
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
      const customers = getAllCustomers();
      const idx = customers.findIndex(c => c.id === existing.id);
      if (idx !== -1) {
        customers[idx] = existing;
        saveCustomers(customers);
        try {
          await persistCustomerUser(existing);
        } catch (pgErr) {
          console.warn('[CustomerService] PostgreSQL ensure customer warning:', pgErr.message);
        }
      }
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
    console.warn('[CustomerService] ensureCustomerAccount fallback:', err.message);
    return null;
  }
}

/**
 * Simpan / perbarui satu record pelanggan (lokal + PostgreSQL)
 */
async function saveCustomerRecord(customer) {
  if (!customer || !customer.id) return customer;
  const customers = getAllCustomers();
  const idx = customers.findIndex((c) => c.id === customer.id);
  if (idx !== -1) {
    customers[idx] = { ...customers[idx], ...customer };
  } else {
    customers.push(customer);
  }
  saveCustomers(customers);

  try {
    await persistCustomerUser(customer);
  } catch (pgErr) {
    console.warn('[CustomerService] PostgreSQL save customer warning:', pgErr.message);
  }

  return idx !== -1 ? customers[idx] : customer;
}

/**
 * Cari pelanggan berdasarkan email (case-insensitive)
 */
function findCustomerByEmail(email) {
  if (!email) return null;
  const clean = String(email).trim().toLowerCase();
  return getAllCustomers().find((c) => (c.email || '').toLowerCase() === clean) || null;
}

function findCustomerByPhone(phone) {
  if (!phone) return null;
  return getAllCustomers().find((c) => phonesMatch(c.whatsapp, phone)) || null;
}

/**
 * Cari pelanggan berdasarkan Google Account ID
 */
function findCustomerByGoogleId(googleId) {
  if (!googleId) return null;
  return getAllCustomers().find((c) => c.googleId === googleId) || null;
}

/**
 * Buat / hubungkan akun pelanggan dari Google OAuth
 */
async function upsertGoogleCustomer({ googleId = '', email = '', name = '', avatar = '' }) {
  if (!email) throw new Error('Email Google tidak tersedia.');
  const cleanEmail = String(email).trim().toLowerCase();
  const existing = findCustomerByGoogleId(googleId) || findCustomerByEmail(cleanEmail);

  if (existing) {
    const updates = {
      ...existing,
      googleId: googleId || existing.googleId || '',
      email: cleanEmail,
      name: name || existing.name,
      avatar: avatar || existing.avatar || ''
    };
    return await saveCustomerRecord(updates);
  }

  const now = new Date();
  const newCust = {
    id: `CUST-G-${now.getTime()}`,
    name: (name || cleanEmail.split('@')[0] || 'Pelanggan').trim(),
    whatsapp: '',
    email: cleanEmail,
    district: '',
    pin: '',
    passwordHash: '',
    googleId,
    avatar,
    referredByMitra: '',
    registeredAt: now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    registeredVia: 'Google OAuth'
  };
  await saveCustomerRecord(newCust);
  return newCust;
}

/**
 * Perbarui data pelanggan berdasarkan ID
 */
async function updateCustomerById(id, updates = {}) {
  const customers = getAllCustomers();
  const idx = customers.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const updated = { ...customers[idx], ...updates };
  customers[idx] = updated;
  saveCustomers(customers);

  try {
    await persistCustomerUser(updated);
  } catch (pgErr) {
    console.warn('[CustomerService] PostgreSQL update customer warning:', pgErr.message);
  }

  return updated;
}

module.exports = {
  refreshCustomersFromDb,
  getAllCustomers,
  saveCustomers,
  findCustomerByIdentifier,
  findCustomerByEmail,
  findCustomerByPhone,
  findCustomerByGoogleId,
  registerNewCustomer,
  ensureCustomerAccount,
  saveCustomerRecord,
  updateCustomerById,
  upsertGoogleCustomer
};
