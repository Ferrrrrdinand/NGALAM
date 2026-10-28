
/**
 * NGALAM FIX PRO - Authentication & User Management Service (Node.js Backend)
 * Handles internal staff login (Admin Meja 1, Teknisi Workshop, and Workshop Manager)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');
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
 * Load all users from data/users.json
 */
function getUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    }
  } catch (err) {
    console.warn('[AuthService] Error reading users.json:', err.message);
  }
  return [];
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
 * Authenticate user by username or email and password
 * @param {object} param0 { identifier, password, role, referralCode }
 */
async function loginUser({ identifier = '', password = '', role = '', referralCode = '' }) {
  const cleanId = (identifier || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  if (!cleanId) {
    throw new Error('Username atau Email wajib diisi.');
  }
  if (!cleanPass) {
    throw new Error('Kata sandi (password) wajib diisi.');
  }

  // =========================================================================
  // 1. INTEGRASI & VERIFIKASI KETAT GOOGLE SPREADSHEET (GATEKEEPING)
  // Wajib dicek ke Google Spreadsheet terlebih dahulu. Jika tidak ada di Spreadsheet -> DITOLAK!
  // =========================================================================
  const { 
    authTechnicianViaGoogleSheets, 
    authDriverViaGoogleSheets, 
    getConfig 
  } = require('./financeService');
  const cfg = getConfig();

  // A. KHUSUS AKUN TEKNISI (Sheet: AkunTeknisi)
  if (role === 'teknisi') {
    if (cfg && cfg.appsScriptUrl && cfg.appsScriptUrl.trim().length > 10) {
      const sheetAuth = await authTechnicianViaGoogleSheets(cleanId, cleanPass);
      if (sheetAuth) {
        if (sheetAuth.success && sheetAuth.technician) {
          const tech = sheetAuth.technician;
          const token = 'NGF-TOKEN-' + crypto.randomBytes(16).toString('hex');
          const sessionData = {
            userId: tech.id || 'USR-TECH-SS',
            name: tech.name || tech.username,
            username: tech.username,
            email: tech.email || '',
            role: 'teknisi',
            avatar: tech.avatar || '🔬',
            desk: tech.desk || 'Meja Lab Workshop - Teknisi Utama',
            specialty: tech.specialty || 'Spesialis Servis Smartphone & Hardware Lab',
            token: token,
            loginAt: new Date().toISOString(),
            source: 'google_spreadsheet'
          };

          activeSessions.set(token, sessionData);
          saveSessionsToDisk();

          try {
            const { setTechnicianOnline } = require('./technicianService');
            setTechnicianOnline(tech.username);
          } catch (e) {
            console.warn('[AuthService] Could not set technician online:', e.message);
          }

          return {
            success: true,
            message: `Selamat datang, ${sessionData.name}! (Terverifikasi Resmi dari Google Spreadsheet)`,
            user: sessionData,
            redirectUrl: '/teknisi',
          };
        } else {
          // DITOLAK: Tidak terdaftar di Google Spreadsheet atau sandi salah
          throw new Error(sheetAuth.message || 'Akun teknisi tidak terdaftar di Google Spreadsheet. Akses masuk ditolak!');
        }
      }
    }
  }

  // B. KHUSUS AKUN MITRA PENGEMUDI / OJOL / TOKO (Sheet: MitraDriver)
  if (role === 'mitra' || role === 'ojol') {
    const driverAuth = await authDriverViaGoogleSheets(cleanId, cleanPass);
    if (driverAuth) {
      if (driverAuth.success && driverAuth.driver) {
        const drv = driverAuth.driver;
        const token = 'NGF-TOKEN-' + crypto.randomBytes(16).toString('hex');
        const sessionData = {
          userId: drv.id || 'USR-MITRA-SS',
          name: drv.name,
          username: drv.username,
          email: drv.email || '',
          role: drv.role || 'ojol',
          category: drv.category || 'Mitra Kurir Ojek Online',
          avatar: drv.avatar || '🛵',
          referralCode: drv.referralCode,
          commissionRate: drv.commissionRate || 10,
          totalCommission: drv.totalCommission || 0,
          status: drv.status || 'Siaga / Aktif',
          token: token,
          loginAt: new Date().toISOString(),
          source: 'google_spreadsheet'
        };

        activeSessions.set(token, sessionData);
        saveSessionsToDisk();

        return {
          success: true,
          message: `Selamat datang Mitra, ${sessionData.name}! (Terverifikasi dari Google Spreadsheet)`,
          user: sessionData,
          redirectUrl: '/mitra',
        };
      } else {
        // DITOLAK: Tidak terdaftar di Google Spreadsheet
        throw new Error(driverAuth.message || 'Akun mitra tidak terdaftar di Google Spreadsheet (MitraDriver). Akses masuk ditolak!');
      }
    }
  }

  // =========================================================================
  // 2. VERIFIKASI LOKAL (USERS.JSON) / FALLBACK DEV
  // =========================================================================
  const users = getUsers();
  const digitsOnlyId = cleanId.replace(/\D/g, '');

  const user = users.find((u) => {
    if (u.password !== cleanPass) return false;

    const uUser = (u.username || '').toLowerCase();
    const uEmail = (u.email || '').toLowerCase();
    const uName = (u.name || '').toLowerCase();
    const uPhoneDigits = (u.phone || '').replace(/\D/g, '');

    // 1. Direct match username or email
    if (uUser === cleanId || uEmail === cleanId) return true;

    // 2. Full name or name contains/matches
    if (uName === cleanId || (cleanId.length >= 4 && (uName.includes(cleanId) || cleanId.includes(uUser)))) return true;

    // 3. Phone number match
    if (digitsOnlyId && uPhoneDigits && digitsOnlyId.length >= 8 && uPhoneDigits.endsWith(digitsOnlyId)) return true;

    return false;
  });

  if (!user) {
    throw new Error('Kredensial salah: Username/Email atau Kata Sandi tidak cocok.');
  }

  // Referral Code & Access Tier Enforcement
  const cleanReferral = (referralCode || '').trim();
  const validReferral = getAdminReferralCode();

  // If requesting super admin access with referral
  if (role === 'owner' || (role === 'admin' && cleanReferral)) {
    if (cleanReferral && cleanReferral !== validReferral) {
      throw new Error('Kode Referral Salah! Akses Super Admin ditolak.');
    }
  }

  // Group-based role match check:
  // Kelompok 1: Admin Staff & Kasir (admin, owner, kasir)
  // Kelompok 2: Teknisi & Mitra Ojek Online (teknisi, ojol, mitra)
  if (role && role !== 'all' && role !== 'any') {
    const isStaffPortal = (role === 'admin' || role === 'owner' || role === 'kasir');
    const userIsStaff = (user.role === 'admin' || user.role === 'owner' || user.role === 'kasir');

    if (isStaffPortal && userIsStaff) {
      // If user is explicitly registered as kasir and tries to enter as admin (super user)
      if (user.role === 'kasir' && (role === 'admin' || role === 'owner')) {
        throw new Error('Akun ini terdaftar sebagai KASIR. Anda tidak memiliki akses Super User (Admin).');
      }
    } else if (
      (role === 'teknisi' || role === 'ojol' || role === 'mitra') &&
      (user.role === 'teknisi' || user.role === 'ojol' || user.role === 'mitra')
    ) {
      // Allowed for technician & mitra ojek online portal
    } else if (user.role !== role) {
      throw new Error(`Akun ini terdaftar sebagai ${user.role.toUpperCase()}, bukan ${role.toUpperCase()}.`);
    }
  }

  // Determine effective access level and role
  const isKasir = (role === 'kasir' || user.role === 'kasir');
  const isSuperAdmin = !isKasir && (role === 'admin' || role === 'owner' || user.role === 'owner' || user.role === 'admin' || (cleanReferral && cleanReferral === validReferral));
  const effectiveRole = isKasir ? 'kasir' : (isSuperAdmin ? 'admin' : (user.role === 'teknisi' ? 'teknisi' : 'kasir'));
  const accessLevel = isSuperAdmin ? 'full' : (user.role === 'teknisi' ? 'technician' : 'limited');

  // Create token session
  const token = 'NGF-TOKEN-' + crypto.randomBytes(16).toString('hex');
  const sessionData = {
    userId: user.id,
    name: isSuperAdmin ? (user.name.includes('Super Admin') ? user.name : `${user.name} (Super Admin)`) : user.name,
    username: user.username,
    email: user.email,
    role: effectiveRole,
    accessLevel: accessLevel,
    isSuperAdmin: isSuperAdmin,
    avatar: isSuperAdmin ? '👑' : (isKasir ? '👩‍💼' : (user.avatar || '👩‍💼')),
    desk: user.desk || (isKasir ? 'Meja 1 - Front Desk & Kasir' : 'Ruang Workshop Manager'),
    specialty: user.specialty || (isKasir ? 'Penerimaan Kerusakan Offline, Bagi Antrean & Cetak Struk' : 'Super User Kontrol Sistem & Keuangan'),
    token: token,
    loginAt: new Date().toISOString(),
    source: 'local'
  };

  activeSessions.set(token, sessionData);
  saveSessionsToDisk();

  // Determine landing redirect URL based on role
  let redirectUrl = '/admin';
  if (user.role === 'teknisi' || user.role === 'ojol' || user.role === 'mitra') {
    redirectUrl = '/teknisi';
  }

  // Update live technician online presence
  if (user.role === 'teknisi') {
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
    user: sessionData,
    redirectUrl,
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


