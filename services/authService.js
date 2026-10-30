
/**
 * NGALAM FIX PRO - Authentication & User Management Service (Node.js Backend)
 * Handles internal staff login (Admin Meja 1, Teknisi Workshop, and Workshop Manager)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const userService = require('./userService');
const SESSIONS_FILE = path.join(__dirname, '..', 'data', 'sessions.json');

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
 * Retrieve master referral code for full super-admin access
 */
function getAdminReferralCode() {
  if (process.env.ADMIN_REFERRAL_CODE && process.env.ADMIN_REFERRAL_CODE.trim()) {
    return process.env.ADMIN_REFERRAL_CODE.trim();
  }
  const users = getUsers();
  const owner = users.find((u) => u.role === 'owner');
  if (owner && owner.referralCode) {
    return owner.referralCode.trim();
  }
  return 'NGALAM-SUPER-2026';
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
async function loginUser({ identifier = '', password = '', role = '', referralCode = '' }) {
  const cleanId = (identifier || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  if (!cleanId) {
    throw new Error('Username, Email, atau Nomor WhatsApp wajib diisi.');
  }
  if (!cleanPass) {
    throw new Error('Kata sandi (password) wajib diisi.');
  }

  // =========================================================================
  // VERIFIKASI USER DATABASE SISTEM (Siap PostgreSQL)
  // =========================================================================
  const users = getUsers();

  function checkPassword(userPass, inputPass, username) {
    if (userPass === inputPass) return true;
    const cleanU = (username || '').toLowerCase();
    // Dukung password 123456 dan password123 untuk akun Owner & Ferdinand
    if (cleanU === 'ferdinand' || cleanU === 'owner') {
      if (inputPass === '123456' || inputPass === 'password123' || inputPass === 'owner123') {
        return true;
      }
    }
    return false;
  }

  // 1. Exact match on username or email (highest priority)
  let user = users.find((u) => {
    if (!checkPassword(u.password, cleanPass, u.username)) return false;
    const uUser = (u.username || '').toLowerCase();
    const uEmail = (u.email || '').toLowerCase();
    return uUser === cleanId || uEmail === cleanId;
  });

  // 2. Match on phone number with normalization (+62, 62, 08...)
  if (!user) {
    user = users.find((u) => {
      if (!checkPassword(u.password, cleanPass, u.username)) return false;
      return phonesMatch(u.phone, cleanId);
    });
  }

  // 3. Match on full name
  if (!user) {
    user = users.find((u) => {
      if (!checkPassword(u.password, cleanPass, u.username)) return false;
      const uName = (u.name || '').toLowerCase();
      return uName === cleanId;
    });
  }

  if (!user) {
    throw new Error('Kredensial salah: Username/Email/No. HP atau Kata Sandi tidak cocok.');
  }

  // Referral Code & Access Tier Enforcement
  const cleanReferral = (referralCode || '').trim();
  const validReferral = getAdminReferralCode();
  const userIsAlreadyAdmin = (user.role === 'admin' || user.role === 'owner' || user.isSuperAdmin === true || (user.referralCode && user.referralCode.toUpperCase() === validReferral.toUpperCase()));

  // If requesting super admin access with referral
  if (role === 'owner' || role === 'admin') {
    if (cleanReferral) {
      if (cleanReferral.toUpperCase() !== validReferral.toUpperCase()) {
        throw new Error('Kode Referral Salah! Akses Super Admin ditolak.');
      }
    } else if (!userIsAlreadyAdmin) {
      throw new Error('Akses Admin (Super User) membutuhkan Kode Referral Otorisasi.');
    }
  }

  // Group-based role match check:
  // Kelompok 1: Admin Staff & Kasir (admin, owner, kasir)
  // Kelompok 2: Teknisi & Mitra Ojek Online (teknisi, ojol, mitra)
  if (role && role !== 'all' && role !== 'any') {
    const isStaffPortal = (role === 'admin' || role === 'owner' || role === 'kasir');
    const userIsStaff = (user.role === 'admin' || user.role === 'owner' || user.role === 'kasir');
    const isSuperAdminUser = (user.role === 'admin' || user.role === 'owner');

    if (isSuperAdminUser) {
      // Super Admin / Owner memiliki hak akses universal ke seluruh portal operasional (Admin, Kasir, Meja Teknisi Lab)
    } else if (isStaffPortal && userIsStaff) {
      // If user is explicitly registered as kasir and tries to enter as admin (super user)
      if (user.role === 'kasir' && (role === 'admin' || role === 'owner')) {
        throw new Error('Akun ini terdaftar sebagai KASIR. Anda tidak memiliki akses Super User (Admin).');
      }
    } else if (
      (role === 'teknisi' || role === 'ojol' || role === 'mitra') &&
      (user.role === 'teknisi' || user.role === 'ojol' || user.role === 'mitra' || isSuperAdminUser)
    ) {
      // Allowed for technician & mitra ojek online portal
    } else if (user.role !== role) {
      throw new Error(`Akun ini terdaftar sebagai ${user.role.toUpperCase()}, bukan ${role.toUpperCase()}.`);
    }
  }

  // Determine effective access level and role
  const userIsSuperAdmin = (user.role === 'admin' || user.role === 'owner' || user.isSuperAdmin === true || (user.referralCode && user.referralCode.toUpperCase() === validReferral.toUpperCase()));
  const isSuperAdmin = userIsSuperAdmin || (role === 'admin' || role === 'owner');

  let effectiveRole = 'admin';
  let accessLevel = 'full';

  if (role === 'teknisi' && (user.role === 'teknisi' || userIsSuperAdmin)) {
    // Jika login spesifik ke Portal Teknisi
    effectiveRole = 'teknisi';
    accessLevel = 'technician';
  } else if (userIsSuperAdmin) {
    // Akun Owner & Super Admin di portal admin selalu mendapatkan hak akses penuh admin
    effectiveRole = 'admin';
    accessLevel = 'full';
  } else if (role === 'kasir' || user.role === 'kasir') {
    effectiveRole = 'kasir';
    accessLevel = 'limited';
  } else if (user.role === 'teknisi') {
    effectiveRole = 'teknisi';
    accessLevel = 'technician';
  } else if (user.role === 'ojol' || user.role === 'mitra') {
    effectiveRole = user.role;
    accessLevel = 'partner';
  }

  // Helper check for super admin
  function isSuperAdminUser(u) {
    return u && (u.role === 'admin' || u.role === 'owner' || u.isSuperAdmin === true);
  }

  // Create token session
  const isKasir = (effectiveRole === 'kasir');
  const token = 'NGF-TOKEN-' + crypto.randomBytes(16).toString('hex');
  const sessionData = {
    userId: user.id,
    name: (effectiveRole === 'admin') ? (user.name.includes('Super Admin') ? user.name : `${user.name} (Super Admin)`) : user.name,
    username: user.username,
    email: user.email,
    role: effectiveRole,
    accessLevel: accessLevel,
    isSuperAdmin: isSuperAdmin,
    avatar: (effectiveRole === 'admin') ? '👑' : ((effectiveRole === 'teknisi') ? (user.avatar || '🔬') : (isKasir ? '👩‍💼' : (user.avatar || '👩‍💼'))),
    desk: user.desk || (isKasir ? 'Meja 1 - Front Desk & Kasir' : (effectiveRole === 'teknisi' ? 'Meja Lab Workshop' : 'Ruang Workshop Manager')),
    specialty: user.specialty || (isKasir ? 'Penerimaan Kerusakan Offline, Bagi Antrean & Cetak Struk' : 'Super User Kontrol Sistem & Keuangan'),
    token: token,
    loginAt: new Date().toISOString(),
    source: 'local'
  };

  activeSessions.set(token, sessionData);
  saveSessionsToDisk();

  // Determine landing redirect URL based on effective role
  let redirectUrl = '/admin';
  if (effectiveRole === 'teknisi') {
    redirectUrl = '/teknisi';
  } else if (effectiveRole === 'ojol' || effectiveRole === 'mitra') {
    redirectUrl = '/mitra';
  }

  // Update live technician online presence
  if (effectiveRole === 'teknisi' || user.role === 'teknisi') {
    try {
      const { setTechnicianOnline } = require('./technicianService');
      setTechnicianOnline(user.username);
    } catch (e) {
      console.warn('[AuthService] Could not set technician online:', e.message);
    }
  }

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
function verifySession(token) {
  if (!token) return null;
  return activeSessions.get(token) || null;
}

/**
 * Invalidate session token and mark technician offline
 */
function logoutUser(token, usernameFallback = '') {
  let loggedOutUser = null;
  if (token && activeSessions.has(token)) {
    loggedOutUser = activeSessions.get(token);
    activeSessions.delete(token);
    saveSessionsToDisk();
  }

  const targetUsername = (loggedOutUser && loggedOutUser.username) || usernameFallback;
  const targetRole = (loggedOutUser && loggedOutUser.role) || '';

  if (targetRole === 'teknisi' || (!targetRole && targetUsername)) {
    try {
      const { setTechnicianOffline } = require('./technicianService');
      setTechnicianOffline(targetUsername);
    } catch (e) {
      console.warn('[AuthService] Could not set technician offline:', e.message);
    }
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


