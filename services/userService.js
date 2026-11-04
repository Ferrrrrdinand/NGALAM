/**
 * NGALAM FIX PRO - Modular User Service
 * Menghubungkan masing-masing kelompok data user ke file mandiri yang terhubung via Environment Variables (.env):
 * 1. USERS_ADMIN_FILE   -> data/users_admin.json (Admin, Kasir & Super Admin)
 * 2. USERS_TEKNISI_FILE -> data/users_teknisi.json (Teknisi Lab Workshop)
 * 3. USERS_MITRA_FILE   -> data/users_mitra.json (Mitra Ojol & Toko Rekanan)
 */

const fs = require('fs');
const path = require('path');
const db = require('./db');

const ROOT_DIR = path.join(__dirname, '..');

/**
 * Resolusi path file user dari environment variable atau fallback default
 */
function resolveFilePath(envKey, defaultRelativePath) {
  const envVal = process.env[envKey];
  if (envVal && typeof envVal === 'string' && envVal.trim()) {
    const trimmed = envVal.trim();
    return path.isAbsolute(trimmed) ? trimmed : path.join(ROOT_DIR, trimmed);
  }
  return path.join(ROOT_DIR, defaultRelativePath);
}

const memoryTables = new Map();
let usersHydratedAt = 0;
let usersHydration = null;

const FILE_PATHS = {
  get admin() {
    return resolveFilePath('USERS_ADMIN_FILE', 'data/users_admin.json');
  },
  get kasir() {
    return resolveFilePath('USERS_KASIR_FILE', 'data/users_kasir.json');
  },
  get teknisi() {
    return resolveFilePath('USERS_TEKNISI_FILE', 'data/users_teknisi.json');
  },
  get mitra() {
    return resolveFilePath('USERS_MITRA_FILE', 'data/users_mitra.json');
  },
  get legacy() {
    return path.join(ROOT_DIR, 'data/users.json');
  }
};

/**
 * Baca file JSON dengan pembersihan BOM aman
 */
function readJson(filePath, defaultValue = []) {
  if (memoryTables.has(filePath)) return memoryTables.get(filePath);
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw.replace(/^\uFEFF/, ''));
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error(`[UserService] Error reading ${filePath}:`, err.message);
  }
  return defaultValue;
}

/**
 * Tulis file JSON dengan format rapi
 */
function writeJson(filePath, data) {
  memoryTables.set(filePath, data);
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn(`[UserService] Disk write skipped for ${filePath}:`, err.message);
  }
  return true;
}

function normalizeDbUser(row) {
  const raw = row && row.raw_data && typeof row.raw_data === 'object' ? row.raw_data : {};
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
    commissionRate: raw.commissionRate !== undefined ? raw.commissionRate : Number(row.commission_rate || 10),
    totalCommission: raw.totalCommission !== undefined ? raw.totalCommission : Number(row.total_commission || 0),
    status: raw.status || row.status || 'Active',
    lastActive: raw.lastActive || row.last_active || 'Baru Saja',
    desk: raw.desk || row.desk || '',
    specialty: raw.specialty || row.specialty || ''
  };
}

async function refreshUsersFromDb(force = false) {
  const now = Date.now();
  if (!force && usersHydratedAt && now - usersHydratedAt < 3000) return true;
  if (usersHydration) return usersHydration;

  usersHydration = (async () => {
    try {
      if (!db.isDbConnected()) await db.ensureDbReady();
      if (!db.isDbConnected()) return false;

      const res = await db.query('SELECT * FROM users ORDER BY created_at ASC');
      const users = (res.rows || []).map(normalizeDbUser).filter((u) => u.id || u.username);
      const admins = [];
      const kasirs = [];
      const teknisis = [];
      const mitras = [];

      users.forEach((u) => {
        const role = String(u.role || '').toLowerCase();
        if (role === 'admin' || role === 'owner' || role === 'superadmin') admins.push(u);
        else if (role === 'kasir') kasirs.push(u);
        else if (role === 'teknisi') teknisis.push(u);
        else mitras.push(u);
      });

      memoryTables.set(FILE_PATHS.admin, admins);
      memoryTables.set(FILE_PATHS.kasir, kasirs);
      memoryTables.set(FILE_PATHS.teknisi, teknisis);
      memoryTables.set(FILE_PATHS.mitra, mitras);
      memoryTables.set(FILE_PATHS.legacy, users);
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

/**
 * 1. GET & SAVE ADMIN USERS
 */
function getAdminUsers() {
  return readJson(FILE_PATHS.admin);
}

function saveAdminUsers(users) {
  const ok = writeJson(FILE_PATHS.admin, users);
  syncLegacyUsersFile();
  return ok;
}

/**
 * 2. GET & SAVE KASIR / FRONT DESK USERS
 */
function getKasirUsers() {
  return readJson(FILE_PATHS.kasir);
}

function saveKasirUsers(users) {
  const ok = writeJson(FILE_PATHS.kasir, users);
  syncLegacyUsersFile();
  return ok;
}

/**
 * 3. GET & SAVE TEKNISI USERS
 */
function getTeknisiUsers() {
  return readJson(FILE_PATHS.teknisi);
}

function saveTeknisiUsers(users) {
  const ok = writeJson(FILE_PATHS.teknisi, users);
  syncLegacyUsersFile();
  return ok;
}

/**
 * 4. GET & SAVE MITRA / OJOL / REKANAN USERS
 */
function getMitraUsers() {
  return readJson(FILE_PATHS.mitra);
}

function saveMitraUsers(users) {
  const ok = writeJson(FILE_PATHS.mitra, users);
  syncLegacyUsersFile();
  return ok;
}

/**
 * Sinkronkan file legacy data/users.json sebagai cermin gabungan
 * agar kompatibilitas ke belakang tetap terjaga 100%
 */
function syncLegacyUsersFile() {
  try {
    const admins = readJson(FILE_PATHS.admin);
    const kasirs = readJson(FILE_PATHS.kasir);
    const techs = readJson(FILE_PATHS.teknisi);
    const mitras = readJson(FILE_PATHS.mitra);

    const mergedMap = new Map();

    // Prioritas: Admin > Kasir > Teknisi > Mitra
    admins.forEach(u => { if (u && (u.id || u.username)) mergedMap.set(u.id || u.username, u); });
    kasirs.forEach(u => {
      const key = u.id || u.username;
      if (!mergedMap.has(key)) {
        mergedMap.set(key, u);
      }
    });
    techs.forEach(u => {
      const key = u.id || u.username;
      if (!mergedMap.has(key)) {
        mergedMap.set(key, u);
      }
    });
    mitras.forEach(u => {
      const key = u.id || u.username;
      if (!mergedMap.has(key)) {
        mergedMap.set(key, u);
      }
    });

    const mergedList = Array.from(mergedMap.values());
    writeJson(FILE_PATHS.legacy, mergedList);
  } catch (err) {
    console.warn('[UserService] Error syncing legacy users.json:', err.message);
  }
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
 * Ambil seluruh pengguna (gabungan admin, kasir, teknisi, mitra) untuk keperluan login universal
 */
function getAllUsers() {
  const admins = getAdminUsers().map(u => ({ ...u, _fileSource: 'admin' }));
  const kasirs = getKasirUsers().map(u => ({ ...u, _fileSource: 'kasir' }));
  const techs = getTeknisiUsers().map(u => ({ ...u, _fileSource: 'teknisi' }));
  const mitras = getMitraUsers().map(u => ({ ...u, _fileSource: 'mitra' }));

  const userMap = new Map();

  admins.forEach(u => {
    if (u && (u.id || u.username)) {
      userMap.set(u.id || u.username, { ...u, roles: [u.role] });
    }
  });

  kasirs.forEach(u => {
    const key = u.id || u.username;
    if (userMap.has(key)) {
      const existing = userMap.get(key);
      if (!existing.roles.includes('kasir')) existing.roles.push('kasir');
      existing.desk = existing.desk || u.desk;
      existing.specialty = existing.specialty || u.specialty;
    } else {
      userMap.set(key, { ...u, roles: [u.role] });
    }
  });

  techs.forEach(u => {
    const key = u.id || u.username;
    if (userMap.has(key)) {
      const existing = userMap.get(key);
      if (!existing.roles.includes('teknisi')) existing.roles.push('teknisi');
      existing.desk = existing.desk || u.desk;
      existing.specialty = existing.specialty || u.specialty;
    } else {
      userMap.set(key, { ...u, roles: [u.role] });
    }
  });

  mitras.forEach(u => {
    const key = u.id || u.username;
    if (userMap.has(key)) {
      const existing = userMap.get(key);
      if (!existing.roles.includes(u.role)) existing.roles.push(u.role);
    } else {
      userMap.set(key, { ...u, roles: [u.role] });
    }
  });

  return Array.from(userMap.values());
}

/**
 * Cari pengguna berdasarkan id, username, email, atau nomor HP
 */
function findUser(identifier) {
  if (!identifier) return null;
  const clean = String(identifier).trim().toLowerCase();

  const all = getAllUsers();
  return all.find(u => {
    const uUser = (u.username || '').toLowerCase();
    const uId = (u.id || '').toLowerCase();
    const uEmail = (u.email || '').toLowerCase();

    if (uUser === clean || uId === clean || uEmail === clean) return true;
    if (phonesMatch(u.phone, clean)) return true;
    return false;
  }) || null;
}

/**
 * Simpan atau tambah user ke file masing-masing berdasarkan perannya (role)
 */
function saveUserByRole(user) {
  if (!user || !user.role) {
    throw new Error('User data dan role wajib disertakan.');
  }

  const role = user.role.toLowerCase();

  let ok = false;
  if (role === 'admin' || role === 'owner' || role === 'superadmin') {
    const list = getAdminUsers();
    const idx = list.findIndex(u => (u.id && u.id === user.id) || (u.username && u.username.toLowerCase() === (user.username || '').toLowerCase()));
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...user };
    } else {
      list.push(user);
    }
    ok = saveAdminUsers(list);
  } else if (role === 'kasir') {
    const list = getKasirUsers();
    const idx = list.findIndex(u => (u.id && u.id === user.id) || (u.username && u.username.toLowerCase() === (user.username || '').toLowerCase()));
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...user };
    } else {
      list.push(user);
    }
    ok = saveKasirUsers(list);
  } else if (role === 'teknisi') {
    const list = getTeknisiUsers();
    const idx = list.findIndex(u => (u.id && u.id === user.id) || (u.username && u.username.toLowerCase() === (user.username || '').toLowerCase()));
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...user };
    } else {
      list.push(user);
    }
    ok = saveTeknisiUsers(list);
  } else if (role === 'ojol' || role === 'mitra' || role === 'kurir') {
    const list = getMitraUsers();
    const idx = list.findIndex(u => (u.id && u.id === user.id) || (u.username && u.username.toLowerCase() === (user.username || '').toLowerCase()));
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...user };
    } else {
      list.push(user);
    }
    ok = saveMitraUsers(list);
  } else {
    // Fallback ke admin users jika role lain
    const list = getAdminUsers();
    list.push(user);
    ok = saveAdminUsers(list);
  }

  // Sinkronisasi otomatis ke Neon PostgreSQL dan catat ke activity_logs
  syncUserToNeon(user, 'USER_UPSERT').catch(() => {});
  return ok;
}

/**
 * Sinkronisasi satu user ke Neon PostgreSQL & activity_logs
 */
async function syncUserToNeon(user, action = 'USER_UPSERT') {
  if (!user || !user.id) return false;

  // 1. Selalu catat di activity_logs (data/activity_logs.json & PostgreSQL)
  try {
    await db.logActivity(action, 'users', user.id, {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      category: user.category || user.role,
      desk: user.desk || '',
      phone: user.phone || '',
      action: action
    });
  } catch (err) {
    console.warn('[UserService] Log activity warning:', err.message);
  }

  // 2. Jika database PostgreSQL / Neon terhubung, simpan / perbarui ke tabel users
  if (db.isDbConnected()) {
    try {
      const q = `
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
          raw_data = EXCLUDED.raw_data;
      `;
      await db.query(q, [
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
      return true;
    } catch (err) {
      console.warn('[UserService] Neon syncUserToNeon error:', err.message);
      return false;
    }
  }
  return false;
}

/**
 * Sinkronisasi seluruh user dari data/ lokal ke database Neon PostgreSQL
 */
async function syncAllUsersToPostgres() {
  if (!db.isDbConnected()) return false;
  try {
    const all = getAllUsers();
    for (const u of all) {
      await syncUserToNeon(u, 'INITIAL_SYNC');
    }
    console.log(`✅ [PostgreSQL/Neon] Sinkronisasi ${all.length} akun ke database Neon selesai.`);
    return true;
  } catch (e) {
    console.warn('[UserService] Gagal sinkronisasi seluruh user ke Neon:', e.message);
    return false;
  }
}

/**
 * Informasi path dan status masing-masing file untuk API status database
 */
function getUserFileDetails() {
  const adminPath = FILE_PATHS.admin;
  const kasirPath = FILE_PATHS.kasir;
  const teknisiPath = FILE_PATHS.teknisi;
  const mitraPath = FILE_PATHS.mitra;

  return {
    admin: {
      envVar: 'USERS_ADMIN_FILE',
      path: path.relative(ROOT_DIR, adminPath).replace(/\\/g, '/'),
      absolutePath: adminPath,
      exists: fs.existsSync(adminPath),
      count: getAdminUsers().length
    },
    kasir: {
      envVar: 'USERS_KASIR_FILE',
      path: path.relative(ROOT_DIR, kasirPath).replace(/\\/g, '/'),
      absolutePath: kasirPath,
      exists: fs.existsSync(kasirPath),
      count: getKasirUsers().length
    },
    teknisi: {
      envVar: 'USERS_TEKNISI_FILE',
      path: path.relative(ROOT_DIR, teknisiPath).replace(/\\/g, '/'),
      absolutePath: teknisiPath,
      exists: fs.existsSync(teknisiPath),
      count: getTeknisiUsers().length
    },
    mitra: {
      envVar: 'USERS_MITRA_FILE',
      path: path.relative(ROOT_DIR, mitraPath).replace(/\\/g, '/'),
      absolutePath: mitraPath,
      exists: fs.existsSync(mitraPath),
      count: getMitraUsers().length
    }
  };
}

module.exports = {
  refreshUsersFromDb,
  syncUserToNeon,
  FILE_PATHS,
  getAdminUsers,
  saveAdminUsers,
  getKasirUsers,
  saveKasirUsers,
  getTeknisiUsers,
  saveTeknisiUsers,
  getMitraUsers,
  saveMitraUsers,
  getAllUsers,
  findUser,
  saveUserByRole,
  syncLegacyUsersFile,
  getUserFileDetails,
  syncUserToNeon,
  syncAllUsersToPostgres
};
