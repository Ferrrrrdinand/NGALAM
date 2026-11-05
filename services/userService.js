/**
 * NGALAM FIX PRO - PostgreSQL User Service
 * Sumber data tunggal: tabel `users` di PostgreSQL/Supabase.
 * Empat kelompok pengguna (admin, kasir, teknisi, mitra) dibedakan dari kolom `role`.
 */

const db = require('./db');

const ROLE_GROUPS = {
  admin: ['admin', 'owner', 'superadmin'],
  kasir: ['kasir'],
  teknisi: ['teknisi'],
  mitra: ['mitra', 'ojol', 'kurir'],
  customer: ['customer', 'pelanggan']
};

const memoryTables = new Map();
let usersHydratedAt = 0;
let usersHydration = null;

function getBucket(bucket) {
  const list = memoryTables.get(bucket);
  return Array.isArray(list) ? list : [];
}

function setBucket(bucket, users) {
  memoryTables.set(bucket, Array.isArray(users) ? users : []);
}

function classifyUser(user) {
  const role = String(user.role || '').toLowerCase();
  if (ROLE_GROUPS.admin.includes(role)) return 'admin';
  if (ROLE_GROUPS.kasir.includes(role)) return 'kasir';
  if (ROLE_GROUPS.teknisi.includes(role)) return 'teknisi';
  if (ROLE_GROUPS.customer.includes(role)) return 'customer';
  return 'mitra';
}

function bucketForRole(role) {
  const clean = String(role || '').toLowerCase();
  if (ROLE_GROUPS.admin.includes(clean)) return 'admin';
  if (ROLE_GROUPS.kasir.includes(clean)) return 'kasir';
  if (ROLE_GROUPS.teknisi.includes(clean)) return 'teknisi';
  if (ROLE_GROUPS.customer.includes(clean)) return 'customer';
  return 'mitra';
}

function normalizeDbUser(row) {
  let raw = {};
  if (row && row.raw_data) {
    if (typeof row.raw_data === 'object') {
      raw = row.raw_data;
    } else if (typeof row.raw_data === 'string') {
      try {
        raw = JSON.parse(row.raw_data);
      } catch (_) {
        raw = {};
      }
    }
  }

  const totalCommission = raw.totalCommission !== undefined 
    ? Number(raw.totalCommission) 
    : Number(row.total_commission || 0);
  const withdrawnCommission = raw.withdrawnCommission !== undefined 
    ? Number(raw.withdrawnCommission) 
    : 0;
  const balance = raw.balance !== undefined 
    ? Number(raw.balance) 
    : Math.max(0, totalCommission - withdrawnCommission);
  return {
    ...raw,
    id: raw.id || row.id,
    username: raw.username || row.username || '',
    password: raw.password || row.password || '',
    name: raw.name || row.name || '',
    role: raw.role || row.role || 'staff',
    category: raw.category || row.category || '',
    avatar: raw.avatar || row.avatar || '',
    phone: raw.phone || row.phone || '',
    email: raw.email || row.email || '',
    referralCode: raw.referralCode || raw.referral_code || row.referral_code || '',
    commissionRate: raw.commissionRate !== undefined ? Number(raw.commissionRate) : Number(row.commission_rate || 10),
    totalCommission,
    withdrawnCommission,
    balance,
    commissionHistory: Array.isArray(raw.commissionHistory) ? raw.commissionHistory : [],
    status: raw.status || row.status || 'Active',
    lastActive: raw.lastActive || row.last_active || 'Baru Saja',
    desk: raw.desk || row.desk || '',
    specialty: raw.specialty || row.specialty || '',
    whatsapp: raw.whatsapp || row.phone || '',
    district: raw.district || '',
    registeredAt: raw.registeredAt || '',
    registeredVia: raw.registeredVia || '',
    googleId: raw.googleId || '',
    referredByMitra: raw.referredByMitra || '',
    passwordHash: raw.passwordHash || raw.pin || row.password || '',
    plainPassword: raw.plainPassword || (row.password && !row.password.startsWith('$2') ? row.password : ''),
    vehicleType: raw.vehicleType || raw.category || row.category || '',
    plateNumber: raw.plateNumber || '',
    bankAccount: raw.bankAccount || ''
  };
}

async function ensureDatabase(attempts = 3) {
  for (let i = 0; i < attempts; i += 1) {
    if (db.isDbConnected()) return;
    await db.ensureDbReady();
    if (db.isDbConnected()) return;
    if (i < attempts - 1) await new Promise((resolve) => setTimeout(resolve, 750));
  }
  throw new Error('PostgreSQL/Supabase belum terhubung.');
}

async function refreshUsersFromDb(force = false) {
  const now = Date.now();
  if (!force && usersHydratedAt && now - usersHydratedAt < 3000) return true;
  if (usersHydration) return usersHydration;

  usersHydration = (async () => {
    try {
      await ensureDatabase();
      const res = await db.query('SELECT * FROM users ORDER BY created_at ASC');
      const users = (res.rows || []).map(normalizeDbUser).filter((u) => u.id || u.username);
      const buckets = { admin: [], kasir: [], teknisi: [], mitra: [], customer: [] };

      users.forEach((user) => {
        buckets[classifyUser(user)].push(user);
      });

      Object.entries(buckets).forEach(([bucket, list]) => setBucket(bucket, list));
      setBucket('legacy', users);
      usersHydratedAt = Date.now();
      return true;
    } catch (err) {
      console.warn('[UserService] PostgreSQL hydrate warning:', err.message);
      return false;
    } finally {
      usersHydration = null;
    }
  })();

  return usersHydration;
}

function getAdminUsers() {
  return getBucket('admin');
}

function getKasirUsers() {
  return getBucket('kasir');
}

function getTeknisiUsers() {
  return getBucket('teknisi');
}

function getMitraUsers() {
  return getBucket('mitra');
}

function getCustomerUsers() {
  return getBucket('customer');
}

function getAllUsers() {
  const admins = getAdminUsers().map((u) => ({ ...u, _source: 'admin' }));
  const kasirs = getKasirUsers().map((u) => ({ ...u, _source: 'kasir' }));
  const techs = getTeknisiUsers().map((u) => ({ ...u, _source: 'teknisi' }));
  const mitras = getMitraUsers().map((u) => ({ ...u, _source: 'mitra' }));
  const customers = getCustomerUsers().map((u) => ({ ...u, _source: 'customer' }));
  const userMap = new Map();

  admins.forEach((u) => {
    if (u && (u.id || u.username)) userMap.set(u.id || u.username, { ...u, roles: [u.role] });
  });

  const merge = (list, roleName) => {
    list.forEach((u) => {
      const key = u.id || u.username;
      if (!key) return;
      if (userMap.has(key)) {
        const existing = userMap.get(key);
        if (!existing.roles.includes(roleName)) existing.roles.push(roleName);
        existing.desk = existing.desk || u.desk;
        existing.specialty = existing.specialty || u.specialty;
      } else {
        userMap.set(key, { ...u, roles: [u.role] });
      }
    });
  };

  merge(kasirs, 'kasir');
  merge(techs, 'teknisi');
  merge(mitras, 'mitra');
  merge(customers, 'customer');

  return Array.from(userMap.values());
}

function normalizePhone(val) {
  if (!val) return '';
  let digits = String(val).replace(/\D/g, '');
  if (digits.startsWith('62')) digits = '0' + digits.slice(2);
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

function findUser(identifier) {
  if (!identifier) return null;
  const clean = String(identifier).trim().toLowerCase();
  return getAllUsers().find((u) => {
    const username = (u.username || '').toLowerCase();
    const id = (u.id || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    return username === clean || id === clean || email === clean || phonesMatch(u.phone, clean);
  }) || null;
}

async function upsertUserRow(user) {
  if (!user || !user.id) throw new Error('ID user wajib disertakan.');
  await db.query(`
    INSERT INTO users (
      id, username, password, name, role, category, avatar, phone, email,
      referral_code, commission_rate, total_commission, status, last_active, desk, specialty, raw_data
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    ON CONFLICT (id) DO UPDATE SET
      username = EXCLUDED.username,
      password = EXCLUDED.password,
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      category = EXCLUDED.category,
      avatar = EXCLUDED.avatar,
      phone = EXCLUDED.phone,
      email = EXCLUDED.email,
      referral_code = EXCLUDED.referral_code,
      commission_rate = EXCLUDED.commission_rate,
      total_commission = EXCLUDED.total_commission,
      status = EXCLUDED.status,
      last_active = EXCLUDED.last_active,
      desk = EXCLUDED.desk,
      specialty = EXCLUDED.specialty,
      raw_data = EXCLUDED.raw_data
  `, [
    user.id,
    user.username || user.id,
    user.password || '',
    user.name || '',
    user.role || 'staff',
    user.category || user.role || 'Staff',
    user.avatar || '👤',
    user.phone || '',
    user.email || '',
    user.referralCode || user.referral_code || '',
    Number(user.commissionRate || user.commission_rate || 10),
    Number(user.totalCommission || user.total_commission || 0),
    user.status || 'Active',
    user.lastActive || user.last_active || 'Baru Saja',
    user.desk || '',
    user.specialty || '',
    JSON.stringify(user)
  ], 'users');
}

async function saveRoleBucket(bucket, users) {
  if (!usersHydratedAt) {
    throw new Error('Cache user belum dimuat dari PostgreSQL. Muat ulang data user sebelum menyimpan.');
  }

  const list = Array.isArray(users) ? users : [];
  const previous = [...getBucket(bucket)];
  const ids = list.map((u) => u && u.id).filter(Boolean);
  const removedIds = previous.map((u) => u && u.id).filter((id) => id && !ids.includes(id));

  await ensureDatabase();

  for (const user of list) {
    if (!user || !user.id) continue;
    await upsertUserRow(user);
  }

  if (removedIds.length > 0) {
    const roles = ROLE_GROUPS[bucket] || [bucket];
    await db.query(
      'DELETE FROM users WHERE id = ANY($1::text[]) AND role = ANY($2::text[])',
      [removedIds, roles]
    );
  }

  setBucket(bucket, list);
  usersHydratedAt = Date.now();
  return true;
}

function saveAdminUsers(users) {
  return saveRoleBucket('admin', users);
}

function saveKasirUsers(users) {
  return saveRoleBucket('kasir', users);
}

function saveTeknisiUsers(users) {
  return saveRoleBucket('teknisi', users);
}

function saveMitraUsers(users) {
  return saveRoleBucket('mitra', users);
}

function saveCustomerUsers(users) {
  return saveRoleBucket('customer', users);
}

async function saveUserByRole(user) {
  if (!user || !user.role) throw new Error('User data dan role wajib disertakan.');
  await refreshUsersFromDb();

  const bucket = bucketForRole(user.role);
  const list = [...getBucket(bucket)];
  const idx = list.findIndex((u) => (u.id && u.id === user.id) ||
    (u.username && String(u.username).toLowerCase() === String(user.username || '').toLowerCase()));

  if (idx !== -1) list[idx] = { ...list[idx], ...user };
  else list.push(user);

  await saveRoleBucket(bucket, list);
  return true;
}

async function syncUserToPostgres(user, action = 'USER_UPSERT') {
  if (!user || !user.id) return false;

  try {
    await db.logActivity(action, 'users', user.id, {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      category: user.category || user.role,
      desk: user.desk || '',
      phone: user.phone || '',
      action
    });
  } catch (err) {
    console.warn('[UserService] Log activity warning:', err.message);
  }

  await ensureDatabase();
  await upsertUserRow(user);
  usersHydratedAt = 0;
  return true;
}

async function syncAllUsersToPostgres() {
  await refreshUsersFromDb(true);
  const all = getAllUsers();
  await ensureDatabase();
  for (const user of all) await upsertUserRow(user);
  usersHydratedAt = 0;
  console.log(`✅ [PostgreSQL] Sinkronisasi ${all.length} akun user selesai.`);
  return true;
}

function getUserTableDetails() {
  const connected = db.isDbConnected();
  const details = {};
  Object.keys(ROLE_GROUPS).forEach((bucket) => {
    details[bucket] = {
      table: 'users',
      roles: ROLE_GROUPS[bucket],
      connected,
      count: getBucket(bucket).length
    };
  });
  return details;
}

async function updateUserById(id, updates = {}) {
  await refreshUsersFromDb();
  const allUsers = getAllUsers();
  const user = allUsers.find(u => u.id === id || u.username === id);
  if (!user) return null;

  const merged = {
    ...user,
    ...updates,
    id: user.id
  };

  if (updates.password && String(updates.password).trim().length > 0) {
    const { hashPassword } = require('../src/utils/security');
    const cleanPass = String(updates.password).trim();
    merged.password = hashPassword(cleanPass);
    merged.passwordHash = merged.password;
    merged.plainPassword = cleanPass;
  }

  const bucket = bucketForRole(merged.role);
  const list = [...getBucket(bucket)];
  const idx = list.findIndex(u => u.id === user.id);
  if (idx !== -1) {
    list[idx] = merged;
  } else {
    list.push(merged);
  }

  await saveRoleBucket(bucket, list);
  return merged;
}

module.exports = {
  refreshUsersFromDb,
  syncUserToPostgres,
  getAdminUsers,
  saveAdminUsers,
  getKasirUsers,
  saveKasirUsers,
  getTeknisiUsers,
  saveTeknisiUsers,
  getMitraUsers,
  saveMitraUsers,
  getCustomerUsers,
  saveCustomerUsers,
  getAllUsers,
  findUser,
  saveUserByRole,
  updateUserById,
  getUserTableDetails,
  syncAllUsersToPostgres
};
