require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../services/db');
const userService = require('../services/userService');
const customerService = require('../services/customerService');

const INITIAL_DEMO_USER_IDS = [
  'USR-KASIR-01',
  'USR-KASIR-02',
  'USR-TEKNISI-01',
  'USR-MITRA-02',
  'USR-MITRA-DUMMY',
  'USR-MITRA-EXAMPLE'
];

function readLegacyCustomersFromDb() {
  return db.query('SELECT * FROM customers ORDER BY created_at ASC');
}

function buildCustomerUsername(customer) {
  const suffix = String(customer.id || customer.whatsapp || customer.email || Date.now())
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `cust_${suffix || Date.now()}`;
}

function normalizeLegacyCustomer(row) {
  const raw = row && row.raw_data && typeof row.raw_data === 'object' ? row.raw_data : {};
  return {
    ...raw,
    id: raw.id || row.id,
    name: raw.name || row.name || 'Pelanggan',
    whatsapp: raw.whatsapp !== undefined ? raw.whatsapp : (row.whatsapp || ''),
    email: raw.email || row.email || '',
    district: raw.district || row.district || 'Malang Raya',
    pin: raw.pin || row.pin || '',
    passwordHash: raw.passwordHash || raw.pin || row.pin || '',
    googleId: raw.googleId || '',
    referredByMitra: raw.referredByMitra || '',
    registeredAt: raw.registeredAt || row.registered_at || '',
    registeredVia: raw.registeredVia || row.registered_via || 'Portal Pelanggan Web',
    avatar: raw.avatar || ''
  };
}

async function upsertCustomerUser(customer) {
  const username = customer.username || buildCustomerUsername(customer);
  await db.query(`
    INSERT INTO users (
      id, username, password, name, role, category, avatar, phone, email,
      referral_code, commission_rate, total_commission, status, last_active, desk, specialty, raw_data
    )
    VALUES ($1, $2, $3, $4, 'customer', 'Pelanggan', $5, $6, $7, $8, 0, 0, 'Aktif', $9, '', '', $10)
    ON CONFLICT (id) DO NOTHING
  `, [
    customer.id,
    username,
    customer.passwordHash || customer.pin || '',
    customer.name || '',
    customer.avatar && String(customer.avatar).length <= 50 ? customer.avatar : '👤',
    customer.whatsapp || '',
    customer.email || '',
    customer.referredByMitra || '',
    customer.registeredAt || '',
    JSON.stringify(customer)
  ]);
}

async function run() {
  await db.ensureDbReady();
  if (!db.isDbConnected()) {
    throw new Error('PostgreSQL belum terhubung.');
  }

  const legacyCustomers = (await readLegacyCustomersFromDb()).rows || [];
  const nonAdminUsers = (await db.query(
    `SELECT * FROM users WHERE id = ANY($1::text[]) ORDER BY created_at ASC`,
    [INITIAL_DEMO_USER_IDS]
  )).rows || [];

  const backupPath = path.join('/tmp', `ngalam-users-backup-${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify({ nonAdminUsers, legacyCustomers }, null, 2), 'utf8');

  for (const row of legacyCustomers) {
    const customer = normalizeLegacyCustomer(row);
    if (!customer.id) continue;
    await upsertCustomerUser(customer);
  }

  if (nonAdminUsers.length > 0) {
    const ids = nonAdminUsers.map((user) => user.id).filter(Boolean);
    await db.query('DELETE FROM users WHERE id = ANY($1::text[])', [ids]);
    await db.query('DELETE FROM sessions WHERE user_id = ANY($1::text[])', [ids]);
  }

  await userService.refreshUsersFromDb(true);
  await customerService.refreshCustomersFromDb(true);

  const counts = (await db.query(`
    SELECT role, COUNT(*)::int AS total
    FROM users
    GROUP BY role
    ORDER BY role
  `)).rows;

  console.log(`Backup affected accounts: ${backupPath}`);
  console.log(`Legacy customers migrated: ${legacyCustomers.length}`);
  console.log(`Initial demo accounts removed: ${nonAdminUsers.length}`);
  console.log('Users by role:', JSON.stringify(counts));
  console.log(`Customers readable from users table: ${customerService.getAllCustomers().length}`);
}

run().then(() => process.exit(0)).catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
