/**
 * NGALAM FIX PRO - Modular User Service
 * Menghubungkan masing-masing kelompok data user ke file mandiri yang terhubung via Environment Variables (.env):
 * 1. USERS_ADMIN_FILE   -> data/users_admin.json (Admin, Kasir & Super Admin)
 * 2. USERS_TEKNISI_FILE -> data/users_teknisi.json (Teknisi Lab Workshop)
 * 3. USERS_MITRA_FILE   -> data/users_mitra.json (Mitra Ojol & Toko Rekanan)
 */

const fs = require('fs');
const path = require('path');

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

const FILE_PATHS = {
  get admin() {
    return resolveFilePath('USERS_ADMIN_FILE', 'data/users_admin.json');
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
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`[UserService] Error writing ${filePath}:`, err.message);
    return false;
  }
}

/**
 * 1. GET & SAVE ADMIN / KASIR USERS
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
 * 2. GET & SAVE TEKNISI USERS
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
 * 3. GET & SAVE MITRA / OJOL / REKANAN USERS
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
    const techs = readJson(FILE_PATHS.teknisi);
    const mitras = readJson(FILE_PATHS.mitra);

    const mergedMap = new Map();

    // Prioritas: Admin > Teknisi > Mitra
    admins.forEach(u => { if (u && (u.id || u.username)) mergedMap.set(u.id || u.username, u); });
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
 * Ambil seluruh pengguna (gabungan admin, teknisi, mitra) untuk keperluan login universal
 */
function getAllUsers() {
  const admins = getAdminUsers().map(u => ({ ...u, _fileSource: 'admin' }));
  const techs = getTeknisiUsers().map(u => ({ ...u, _fileSource: 'teknisi' }));
  const mitras = getMitraUsers().map(u => ({ ...u, _fileSource: 'mitra' }));

  const userMap = new Map();

  admins.forEach(u => {
    if (u && (u.id || u.username)) {
      userMap.set(u.id || u.username, { ...u, roles: [u.role] });
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

  if (role === 'admin' || role === 'owner' || role === 'kasir' || role === 'superadmin') {
    const list = getAdminUsers();
    const idx = list.findIndex(u => (u.id && u.id === user.id) || (u.username && u.username.toLowerCase() === (user.username || '').toLowerCase()));
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...user };
    } else {
      list.push(user);
    }
    return saveAdminUsers(list);
  }

  if (role === 'teknisi') {
    const list = getTeknisiUsers();
    const idx = list.findIndex(u => (u.id && u.id === user.id) || (u.username && u.username.toLowerCase() === (user.username || '').toLowerCase()));
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...user };
    } else {
      list.push(user);
    }
    return saveTeknisiUsers(list);
  }

  if (role === 'ojol' || role === 'mitra' || role === 'kurir') {
    const list = getMitraUsers();
    const idx = list.findIndex(u => (u.id && u.id === user.id) || (u.username && u.username.toLowerCase() === (user.username || '').toLowerCase()));
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...user };
    } else {
      list.push(user);
    }
    return saveMitraUsers(list);
  }

  // Fallback ke admin users jika role lain
  const list = getAdminUsers();
  list.push(user);
  return saveAdminUsers(list);
}

/**
 * Informasi path dan status masing-masing file untuk API status database
 */
function getUserFileDetails() {
  const adminPath = FILE_PATHS.admin;
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
  FILE_PATHS,
  getAdminUsers,
  saveAdminUsers,
  getTeknisiUsers,
  saveTeknisiUsers,
  getMitraUsers,
  saveMitraUsers,
  getAllUsers,
  findUser,
  saveUserByRole,
  syncLegacyUsersFile,
  getUserFileDetails
};
