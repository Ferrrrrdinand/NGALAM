
/**
 * NGALAM FIX PRO - Authentication & User Management Service (Node.js Backend)
 * Handles internal staff login (Admin Meja 1, Teknisi Workshop, and Workshop Manager)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { generateToken, verifyToken, decodeToken } = require('../src/utils/jwt');
const { hashPassword, verifyPassword } = require('../src/utils/security');
const { AuthError } = require('../src/utils/authError');

const userService = require('./userService');
const db = require('./db');
const SESSIONS_FILE = path.join(__dirname, '..', 'data', 'sessions.json');

const SINGLE_ADMIN_USERNAME = String(process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
const SINGLE_ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || 'fixprongalam2026');

// In-memory and persisted active tokens cache
const activeSessions = new Map();

/**
 * Load persisted sessions from disk on startup
 */
function loadPersistedSessions() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const raw = fs.readFileSync(SESSIONS_FILE, 'utf-8');
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        list.forEach((s) => {
          if (s && s.token) {
            activeSessions.set(s.token, s);
          }
        });
      }
    }
  } catch (err) {
    console.warn('[AuthService] Error reading sessions.json:', err.message);
  }
}
loadPersistedSessions();

async function ensureSingleAdminAccount() {
  const ready = await userService.refreshUsersFromDb(true);
  if (!ready) {
    throw new AuthError('Database akun admin belum dapat dihubungi. Coba beberapa saat lagi.', {
      status: 503,
      code: 'AUTH_DATABASE_UNAVAILABLE'
    });
  }

  const adminUsers = userService.getAdminUsers();
  const target = adminUsers.find((user) => String(user.username || '').toLowerCase() === SINGLE_ADMIN_USERNAME);
  const otherAdmins = adminUsers.filter((user) => String(user.username || '').toLowerCase() !== SINGLE_ADMIN_USERNAME);
  const passwordMatches = target ? verifyPassword(SINGLE_ADMIN_PASSWORD, target.password) : false;

  if (target && passwordMatches && otherAdmins.length === 0) {
    return target;
  }

  const source = target || adminUsers[0] || {};
  const admin = {
    ...source,
    id: source.id || 'USR-ADMIN-01',
    username: SINGLE_ADMIN_USERNAME,
    password: hashPassword(SINGLE_ADMIN_PASSWORD),
    name: source.name || 'Admin Super User',
    role: 'admin',
    category: source.category || 'Super Admin',
    avatar: source.avatar || 'crown-shield',
    phone: source.phone || '',
    email: source.email || 'admin@ngalamfixpro.com',
    desk: source.desk || 'Ruang Workshop Manager',
    specialty: source.specialty || 'Super User Kontrol Sistem & Keuangan',
    referralCode: source.referralCode || 'NGALAM-SUPER-2026',
    status: 'Siaga / Aktif'
  };

  await userService.saveAdminUsers([admin]);
  await userService.refreshUsersFromDb(true);
  return admin;
}

/**
 * Save active sessions to disk
 */
function saveSessionsToDisk() {
  try {
    const list = Array.from(activeSessions.values());
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[AuthService] Error writing sessions.json:', err.message);
  }
}

/**
 * Load all users from separate files configured via .env (admin, teknisi, mitra)
 */
function getUsers() {
  return userService.getAllUsers();
}

/**
 * Retrieve the super-admin referral code stored on the owner/admin account.
 */
function getAdminReferralCode() {
  const users = getUsers();
  const owner = users.find((u) => u.role === 'owner' && u.referralCode) ||
    users.find((u) => (u.role === 'admin' || u.role === 'superadmin') && u.referralCode);
  return owner && owner.referralCode ? owner.referralCode.trim() : '';
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
 * Authenticate user by username, email, phone and password
 * @param {object} param0 { identifier, password, role, referralCode }
 */
async function loginUser({ identifier = '', password = '', role = '', referralCode = '', rememberMe = false }) {
  const cleanId = (identifier || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  if (!cleanId) {
    throw new AuthError('Username, email, atau nomor WhatsApp wajib diisi.', {
      status: 400,
      code: 'IDENTIFIER_REQUIRED',
      field: 'identifier'
    });
  }
  if (!cleanPass) {
    throw new AuthError('Kata sandi wajib diisi.', {
      status: 400,
      code: 'PASSWORD_REQUIRED',
      field: 'password'
    });
  }

  let user = null;

  if (role === 'admin' || role === 'owner' || cleanId === SINGLE_ADMIN_USERNAME) {
    const admin = await ensureSingleAdminAccount();
    if (role === 'admin' || role === 'owner') {
      if (cleanId !== SINGLE_ADMIN_USERNAME) {
        throw new AuthError('Portal admin hanya dapat diakses oleh akun admin.', {
          status: 403,
          code: 'ADMIN_ACCOUNT_ONLY',
          field: 'identifier'
        });
      }
      if (cleanPass !== SINGLE_ADMIN_PASSWORD) {
        throw new AuthError('Kata sandi admin salah.', {
          status: 401,
          code: 'INVALID_ADMIN_PASSWORD',
          field: 'password'
        });
      }
      user = admin;
    } else if (cleanId === SINGLE_ADMIN_USERNAME) {
      if (cleanPass !== SINGLE_ADMIN_PASSWORD) {
        throw new AuthError('Kata sandi admin salah.', {
          status: 401,
          code: 'INVALID_ADMIN_PASSWORD',
          field: 'password'
        });
      }
      user = admin;
    }
  }

  if (!user) {
    const ready = await userService.refreshUsersFromDb();
    if (!ready) {
      throw new AuthError('Database akun belum dapat dihubungi. Coba beberapa saat lagi.', {
        status: 503,
        code: 'AUTH_DATABASE_UNAVAILABLE'
      });
    }
    const users = getUsers();

    user = users.find((u) => {
      if (!verifyPassword(cleanPass, u.password)) return false;
      const uUser = (u.username || '').toLowerCase();
      const uEmail = (u.email || '').toLowerCase();
      return uUser === cleanId || uEmail === cleanId;
    });

    if (!user) {
      user = users.find((u) => verifyPassword(cleanPass, u.password) && phonesMatch(u.phone, cleanId));
    }

    if (!user) {
      const identifierExists = users.some((u) => {
        const uUser = (u.username || '').toLowerCase();
        const uEmail = (u.email || '').toLowerCase();
        return uUser === cleanId || uEmail === cleanId || phonesMatch(u.phone, cleanId);
      });
      if (identifierExists) {
        throw new AuthError('Kata sandi salah. Periksa kembali kata sandi akun Anda.', {
          status: 401,
          code: 'INVALID_PASSWORD',
          field: 'password'
        });
      }
      throw new AuthError('Akun tidak ditemukan. Periksa username, email, atau nomor WhatsApp Anda.', {
        status: 404,
        code: 'ACCOUNT_NOT_FOUND',
        field: 'identifier'
      });
    }
  }

  if (['customer', 'pelanggan'].includes(String(user.role || '').toLowerCase())) {
    throw new AuthError('Akun pelanggan hanya dapat masuk melalui portal pelanggan.', {
      status: 403,
      code: 'CUSTOMER_ACCOUNT_ONLY',
      field: 'identifier'
    });
  }

  // Referral Code & Access Tier Enforcement
  const cleanReferral = (referralCode || '').trim();
  const validReferral = getAdminReferralCode();
  const userIsAlreadyAdmin = (user.role === 'admin' || user.role === 'owner' || user.isSuperAdmin === true || (user.referralCode && user.referralCode.toUpperCase() === validReferral.toUpperCase()));

  // Super admin / Owner unified access check
  if (role && role !== 'all' && role !== 'any') {
    const isSuperAdminUser = (user.role === 'admin' || user.role === 'owner' || userIsAlreadyAdmin);

    if (role === 'admin' || role === 'owner') {
      if (!isSuperAdminUser) {
        throw new AuthError(`Akun ini terdaftar sebagai ${String(user.role || '').toUpperCase()}, bukan admin.`, {
          status: 403,
          code: 'ROLE_MISMATCH',
          field: 'role'
        });
      }
    } else if (role === 'kasir' || role === 'teknisi') {
      if (!isSuperAdminUser && user.role !== role) {
        throw new AuthError(`Akun ini bukan ${role}. Gunakan portal login yang sesuai.`, {
          status: 403,
          code: 'ROLE_MISMATCH',
          field: 'role'
        });
      }
    } else if (role === 'ojol' || role === 'mitra') {
      if (user.role !== 'ojol' && user.role !== 'mitra' && !isSuperAdminUser) {
        throw new AuthError(`Akun ini terdaftar sebagai ${String(user.role || '').toUpperCase()}, bukan mitra.`, {
          status: 403,
          code: 'ROLE_MISMATCH',
          field: 'role'
        });
      }
    }
  }

  // Determine effective access level and role
  const userIsSuperAdmin = (user.role === 'admin' || user.role === 'owner' || user.isSuperAdmin === true || (user.referralCode && user.referralCode.toUpperCase() === validReferral.toUpperCase()));

  let effectiveRole = user.role || 'admin';
  let accessLevel = 'staff';

  if (userIsSuperAdmin) {
    effectiveRole = (role === 'kasir' || role === 'teknisi') ? role : 'admin';
    accessLevel = 'full';
  } else if (user.role === 'kasir') {
    effectiveRole = 'kasir';
    accessLevel = 'kasir_frontdesk';
  } else if (user.role === 'teknisi') {
    effectiveRole = 'teknisi';
    accessLevel = 'workshop_lab';
  } else if (user.role === 'ojol' || user.role === 'mitra') {
    effectiveRole = user.role;
    accessLevel = 'partner';
  }

  // Create token session with JWT and remember me support
  const isRemember = Boolean(rememberMe);
  const jwtInfo = generateToken({
    userId: user.id || user.username,
    name: user.name,
    username: user.username,
    email: user.email,
    role: effectiveRole,
    accessLevel: accessLevel,
    isSuperAdmin: userIsSuperAdmin
  }, isRemember);

  const token = jwtInfo.token;
  const sessionData = {
    userId: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: effectiveRole,
    accessLevel: accessLevel,
    isSuperAdmin: userIsSuperAdmin,
    canAccessKasir: true,
    canAccessTeknisi: true,
    canAccessAdmin: true,
    avatar: 'admin',
    desk: user.desk || 'Workshop Manager & Lab',
    specialty: user.specialty || 'Super User Kontrol Sistem & Meja Lab',
    token: token,
    rememberMe: isRemember,
    expiresIn: jwtInfo.expiresIn,
    maxAge: jwtInfo.maxAge,
    loginAt: new Date().toISOString(),
    source: 'jwt'
  };

  activeSessions.set(token, sessionData);
  saveSessionsToDisk();

  // Determine landing redirect URL based on requested or effective role
  let redirectUrl = '/admin';
  if (role === 'teknisi') {
    redirectUrl = '/teknisi';
  } else if (role === 'kasir') {
    redirectUrl = '/admin';
  } else if (effectiveRole === 'ojol' || effectiveRole === 'mitra') {
    redirectUrl = '/mitra';
  }

  // Update live technician online presence
  if (effectiveRole === 'teknisi' || user.role === 'teknisi') {
    try {
      const { setTechnicianOnline } = require('./technicianService');
      await setTechnicianOnline(user.username);
    } catch (e) {
      console.warn('[AuthService] Could not set technician online:', e.message);
    }
  }

  // Catat riwayat login akun ke activity logs (PostgreSQL & local)
  try {
    db.logActivity('STAFF_LOGIN', 'users', user.id, {
      username: user.username,
      name: user.name,
      role: effectiveRole,
      loginAt: sessionData.loginAt
    });
  } catch (_) {}

  return {
    success: true,
    message: `Selamat datang kembali, ${user.name}!`,
    redirectUrl: redirectUrl,
    user: sessionData
  };
}

/**
 * Verify session token
 */
function isAllowedAdminSession(session) {
  const role = String(session && session.role || '').toLowerCase();
  if (role !== 'admin' && role !== 'owner') return true;
  return String(session.username || '').toLowerCase() === SINGLE_ADMIN_USERNAME;
}

function verifySession(token) {
  if (!token) return null;

  if (activeSessions.has(token)) {
    const session = activeSessions.get(token);
    if (!isAllowedAdminSession(session)) {
      activeSessions.delete(token);
      saveSessionsToDisk();
      return null;
    }
    if (token.includes('.')) {
      const decoded = verifyToken(token);
      if (!decoded) {
        activeSessions.delete(token);
        saveSessionsToDisk();
        return null;
      }
    }
    return session;
  }

  const decoded = verifyToken(token);
  if (!decoded) return null;
  if (!isAllowedAdminSession(decoded)) return null;

  const userIsSuperAdmin = Boolean(decoded.isSuperAdmin || decoded.role === 'admin' || decoded.role === 'owner');
  const sessionData = {
    userId: decoded.userId || decoded.username,
    name: decoded.name || decoded.username,
    username: decoded.username,
    email: decoded.email || '',
    role: decoded.role || 'admin',
    accessLevel: decoded.accessLevel || 'full',
    isSuperAdmin: userIsSuperAdmin,
    canAccessKasir: true,
    canAccessTeknisi: true,
    canAccessAdmin: true,
    avatar: 'admin',
    desk: decoded.desk || 'Workshop Manager & Lab',
    specialty: decoded.specialty || 'Super User Kontrol Sistem & Meja Lab',
    token: token,
    rememberMe: Boolean(decoded.rememberMe),
    loginAt: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : new Date().toISOString(),
    source: 'jwt'
  };

  activeSessions.set(token, sessionData);
  return sessionData;
}

/**
 * Invalidate session token and mark technician offline
 */
async function logoutUser(token, usernameFallback = '') {
  let loggedOutUser = null;
  if (token && activeSessions.has(token)) {
    loggedOutUser = activeSessions.get(token);
    activeSessions.delete(token);
    saveSessionsToDisk();
  }

  if (!loggedOutUser && token) {
    const decoded = verifyToken(token) || decodeToken(token);
    if (decoded) {
      loggedOutUser = {
        userId: decoded.userId || decoded.username,
        username: decoded.username,
        role: decoded.role,
        name: decoded.name
      };
    }
  }

  const targetUsername = (loggedOutUser && loggedOutUser.username) || usernameFallback;
  const targetRole = (loggedOutUser && loggedOutUser.role) || '';

  if (targetRole === 'teknisi' || (!targetRole && targetUsername)) {
    try {
      const { setTechnicianOffline } = require('./technicianService');
      await setTechnicianOffline(targetUsername);
    } catch (e) {
      console.warn('[AuthService] Could not set technician offline:', e.message);
    }
  }

  if (loggedOutUser) {
    try {
      db.logActivity('STAFF_LOGOUT', 'users', loggedOutUser.userId || targetUsername, {
        username: loggedOutUser.username,
        name: loggedOutUser.name,
        role: loggedOutUser.role,
        logoutAt: new Date().toISOString()
      });
    } catch (_) {}
  }

  return true;
}

module.exports = {
  getUsers,
  loginUser,
  verifySession,
  logoutUser,
  getAdminReferralCode,
};


