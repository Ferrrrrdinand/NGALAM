/**
 * NGALAM FIX PRO - Mitra Driver, Ojol & Toko Rekanan Affiliate Routes
 * Handles Mitra registration, automatic unique affiliate code generation,
 * dynamic scannable QR Codes, and commission tracking.
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const userService = require('../services/userService');
const { hashPassword, verifyPassword } = require('../src/utils/security');
const { generateToken, verifyToken } = require('../src/utils/jwt');
const { sendAuthError } = require('../src/utils/authError');
const { isValidEmail, normalizeEmail } = require('../src/utils/phone');
const { refreshCustomersFromDb, findCustomerByPhone, findCustomerByEmail } = require('../services/customerService');

const {
  generateMitraCode,
  readOrders,
  payoutMitraCommission
} = require('../services/financeService');

function readUsers() {
  return userService.getMitraUsers();
}

function saveUsers(users) {
  return userService.saveMitraUsers(users);
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
 * Generate full affiliate link and QR code image URL
 */
function buildMitraAffiliateDetails(req, refCode) {
  // Scan QR mengarahkan ke dashboard utama, kode ref disimpan otomatis di localStorage
  const affiliateUrl = `${getBaseUrl(req)}/?ref=${encodeURIComponent(refCode)}`;
  const qrCodeUrl = `https://quickchart.io/qr?size=350&margin=2&text=${encodeURIComponent(affiliateUrl)}`;

  return {
    affiliateUrl,
    qrCodeUrl
  };
}

// ============================================================
// Google OAuth untuk Mitra
// ============================================================
const OAUTH_STATES = new Map();
const OAUTH_STATE_TTL = 10 * 60 * 1000;

function cleanupOAuthStates() {
  const now = Date.now();
  for (const [state, createdAt] of OAUTH_STATES.entries()) {
    if (now - createdAt > OAUTH_STATE_TTL) OAUTH_STATES.delete(state);
  }
}

function getBaseUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host');
  if (host) return `${proto}://${host}`;
  const configured = (process.env.APP_URL || '').trim();
  return configured ? configured.replace(/\/$/, '') : 'http://localhost:3000';
}

function getGoogleRedirectUri(req) {
  return process.env.GOOGLE_REDIRECT_URI_MITRA || `${getBaseUrl(req)}/api/mitra/auth/google/callback`;
}

function parseCookies(req) {
  const list = {};
  const raw = req.headers.cookie;
  if (!raw) return list;
  raw.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    list[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  });
  return list;
}

function appendSetCookie(res, value) {
  const existing = res.getHeader('Set-Cookie');
  res.setHeader('Set-Cookie', existing ? [].concat(existing, value) : value);
}

function getMitraToken(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader) return authHeader.replace(/^Bearer\s+/i, '');
  return parseCookies(req).ngalam_mitra_token || req.query.token || '';
}

function setMitraTokenCookie(res, token, maxAge) {
  appendSetCookie(res, `ngalam_mitra_token=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax`);
}

function findMitraByGoogle(users, profile) {
  const email = String(profile.email || '').trim().toLowerCase();
  const googleId = String(profile.sub || '');
  return users.find(u =>
    (googleId && u.googleId === googleId) ||
    (email && String(u.email || '').toLowerCase() === email)
  );
}

function generateUniqueMitraUsername(users, profile) {
  const email = String(profile.email || '').trim().toLowerCase();
  const base = (email.split('@')[0] || profile.name || 'mitra')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'mitra';
  let candidate = base;
  let i = 1;
  while (users.some(u => String(u.username || '').toLowerCase() === candidate)) {
    candidate = `${base}_${i}`;
    i += 1;
  }
  return candidate;
}

async function createMitraFromGoogle(users, profile) {
  const now = new Date();
  const username = generateUniqueMitraUsername(users, profile);
  let refCode = generateMitraCode(profile.name || username, username);
  while (users.some(u => String(u.referralCode || '').toUpperCase() === refCode)) {
    refCode = generateMitraCode(profile.name || username, username);
  }
  const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  const mitra = {
    id: `USR-MITRA-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(1000 + Math.random() * 9000))}`,
    username,
    password: hashPassword(crypto.randomBytes(24).toString('hex')),
    googleId: String(profile.sub || ''),
    authProvider: 'google',
    name: profile.name || username,
    role: 'mitra',
    category: 'Mitra Rekanan Google',
    vehicleType: 'Mitra Rekanan Google',
    plateNumber: '',
    bankAccount: '',
    avatar: '🤝',
    phone: '',
    email: String(profile.email || '').trim().toLowerCase(),
    referralCode: refCode,
    commissionRate: 10,
    totalCommission: 0,
    balance: 0,
    withdrawnCommission: 0,
    commissionHistory: [],
    status: 'Siaga / Aktif',
    lastActive: `${dateStr}, Baru Terdaftar via Google`
  };
  users.push(mitra);
  await saveUsers(users);
  return mitra;
}

function buildMitraAuthPayload(req, mitra) {
  const details = buildMitraAffiliateDetails(req, mitra.referralCode);
  const allOrders = readOrders();
  const myReferredOrders = allOrders.filter(o =>
    (o.affiliateRef && o.affiliateRef.toUpperCase() === String(mitra.referralCode).toUpperCase()) ||
    (o.partnerName && o.partnerName.toLowerCase().includes(String(mitra.name).toLowerCase()))
  );
  const safeMitra = { ...mitra };
  delete safeMitra.password;
  return {
    ...safeMitra,
    affiliateUrl: details.affiliateUrl,
    qrCodeUrl: details.qrCodeUrl,
    totalReferredOrders: myReferredOrders.length,
    referredOrders: myReferredOrders,
    needsPhone: !mitra.phone
  };
}

// GET /api/mitra/auth/google
router.get('/auth/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.redirect(`${getBaseUrl(req)}/mitra?auth=google&error=google_not_configured`);
  }

  cleanupOAuthStates();
  const state = crypto.randomBytes(24).toString('hex');
  OAUTH_STATES.set(state, Date.now());
  appendSetCookie(res, `ngalam_mitra_oauth_state=${state}; Path=/; Max-Age=600; HttpOnly; SameSite=Lax`);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleRedirectUri(req),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account'
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

// GET /api/mitra/auth/google/callback
router.get('/auth/google/callback', async (req, res) => {
  const frontendBase = getBaseUrl(req);
  const failRedirect = (reason) => res.redirect(`${frontendBase}/mitra?auth=google&error=${encodeURIComponent(reason)}`);

  try {
    const { code, state, error } = req.query;
    if (error) return failRedirect(error);
    if (!code) return failRedirect('missing_code');

    const cookieState = parseCookies(req).ngalam_mitra_oauth_state;
    const stateIsValid = Boolean(state) && (OAUTH_STATES.has(state) || cookieState === state);
    if (!stateIsValid) return failRedirect('invalid_state');
    OAUTH_STATES.delete(state);
    appendSetCookie(res, 'ngalam_mitra_oauth_state=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) return failRedirect('google_not_configured');

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(code),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: getGoogleRedirectUri(req),
        grant_type: 'authorization_code'
      }).toString()
    });
    const tokenData = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || !tokenData.access_token) {
      return failRedirect(tokenData.error || 'token_exchange_failed');
    }

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const profile = await profileRes.json().catch(() => ({}));
    if (!profileRes.ok || !profile.email) return failRedirect('profile_fetch_failed');

    const profileEmail = normalizeEmail(profile.email);
    await userService.refreshUsersFromDb();
    let users = readUsers();
    let mitra = findMitraByGoogle(users, profile);
    if (!mitra) {
      const linkedUser = userService.findUser(profileEmail);
      const linkedRole = String(linkedUser && linkedUser.role || '').toLowerCase();
      const linkedIsMitra = ['mitra', 'ojol', 'kurir'].includes(linkedRole);
      const linkedIsCustomer = ['customer', 'pelanggan'].includes(linkedRole);
      if (linkedUser && !linkedIsMitra && !linkedIsCustomer) {
        return failRedirect('staff_account_exists');
      }
      if (linkedIsMitra) {
        users = readUsers();
        mitra = users.find((user) => String(user.id || '') === String(linkedUser.id || '')) || findMitraByGoogle(users, profile);
      }
      
      if (!mitra) {
        const preCreatedSlot = users.find(u => 
          u.isPreCreated === true && 
          !u.googleId && 
          u.status === 'Menunggu Aktivasi'
        );
        
        if (preCreatedSlot) {
          preCreatedSlot.googleId = String(profile.sub || '');
          preCreatedSlot.authProvider = 'google';
          preCreatedSlot.email = profileEmail;
          preCreatedSlot.name = profile.name || preCreatedSlot.name;
          preCreatedSlot.isPreCreated = false;
          preCreatedSlot.claimedAt = new Date().toISOString();
          preCreatedSlot.status = 'Siaga / Aktif';
          preCreatedSlot.lastActive = new Date().toLocaleDateString('id-ID', { 
            day: '2-digit', month: 'short', year: 'numeric' 
          }) + ', Aktivasi via Google';
          
          await saveUsers(users);
          mitra = preCreatedSlot;
          
          console.log(`✅ Pre-created mitra claimed: ${mitra.referralCode} by ${mitra.email}`);
        }
      }
      
      if (!mitra) {
        mitra = await createMitraFromGoogle(users, profile);
      }
    } else if (!mitra.googleId) {
      mitra.googleId = String(profile.sub || '');
      mitra.authProvider = mitra.authProvider || 'google';
      if (!mitra.email) mitra.email = String(profile.email || '').trim().toLowerCase();
      await saveUsers(users);
    }

    const jwtInfo = generateToken({
      id: mitra.id,
      username: mitra.username,
      role: mitra.role || 'mitra',
      referralCode: mitra.referralCode
    }, true);

    setMitraTokenCookie(res, jwtInfo.token, jwtInfo.maxAge);
    res.redirect(`${frontendBase}/mitra?auth=google${mitra.phone ? '' : '&needsPhone=1'}`);
  } catch (err) {
    console.error('[Mitra Google OAuth] Callback error:', err.message);
    return failRedirect('server_error');
  }
});

// GET /api/mitra/auth/session - Pulihkan sesi mitra dari cookie (dipakai setelah redirect Google)
router.get('/auth/session', (req, res) => {
  try {
    const payload = verifyToken(getMitraToken(req));
    if (!payload) {
      return res.status(401).json({ success: false, message: 'Sesi mitra tidak valid atau sudah kedaluwarsa.' });
    }
    const users = readUsers();
    const mitra = users.find(u => u.id === payload.id || u.username === payload.username);
    if (!mitra) {
      return res.status(404).json({ success: false, message: 'Akun mitra tidak ditemukan.' });
    }
    res.json({ success: true, driver: buildMitraAuthPayload(req, mitra) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/mitra/auth/complete-profile - Nomor WhatsApp wajib untuk mitra yang daftar via Google
router.post('/auth/complete-profile', async (req, res) => {
  try {
    const payload = verifyToken(getMitraToken(req));
    if (!payload) {
      return res.status(401).json({
        success: false,
        code: 'SESSION_INVALID',
        message: 'Sesi mitra tidak valid atau sudah kedaluwarsa. Silakan login ulang.'
      });
    }
    const phone = String(req.body.phone || '').trim();
    const normalized = normalizePhone(phone);
    if (!normalized || normalized.length < 9 || normalized.length > 15) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_PHONE',
        field: 'phone',
        message: 'Nomor WhatsApp tidak valid. Gunakan format 08xxxxxxxxxx.'
      });
    }

    await userService.refreshUsersFromDb();
    await refreshCustomersFromDb();
    const users = readUsers();
    const mitra = users.find(u => u.id === payload.id || u.username === payload.username);
    if (!mitra) {
      return res.status(404).json({
        success: false,
        code: 'MITRA_ACCOUNT_NOT_FOUND',
        message: 'Akun mitra tidak ditemukan.'
      });
    }
    const duplicate = userService.getAllUsers().find(u => String(u.id) !== String(mitra.id) && phonesMatch(u.phone, normalized));
    if (duplicate) {
      return res.status(409).json({
        success: false,
        code: 'PHONE_TAKEN',
        field: 'phone',
        message: 'Nomor WhatsApp sudah digunakan akun lain.'
      });
    }
    if (findCustomerByPhone(normalized)) {
      return res.status(409).json({
        success: false,
        code: 'PHONE_TAKEN',
        field: 'phone',
        message: 'Nomor WhatsApp sudah terdaftar sebagai akun pelanggan.'
      });
    }

    mitra.phone = normalized;
    mitra.lastActive = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ', Profil Dilengkapi';
    await saveUsers(users);

    res.json({
      success: true,
      message: 'Nomor WhatsApp berhasil disimpan.',
      driver: buildMitraAuthPayload(req, mitra)
    });
  } catch (err) {
    return sendAuthError(res, err, 'Gagal melengkapi profil mitra.');
  }
});

// GET /api/mitra/check - Cek profil & saldo komisi mitra berdasarkan No WhatsApp / Kode Afiliasi
router.get('/check', async (req, res) => {
  try {
    const query = (req.query.phone || req.query.query || req.query.q || '').trim();
    if (!query) {
      return res.status(400).json({ success: false, message: 'Nomor WhatsApp atau kode mitra wajib disertakan.' });
    }

    try {
      await userService.refreshUsersFromDb();
    } catch (_) {}

    const cleanQuery = query.toUpperCase();
    const users = readUsers();
    const mitra = users.find(u => 
      (u.referralCode && u.referralCode.toUpperCase() === cleanQuery) ||
      phonesMatch(u.phone, query) ||
      (u.username && u.username.toUpperCase() === cleanQuery)
    );

    if (!mitra) {
      return res.status(404).json({
        success: false,
        message: 'Nomor WhatsApp atau kode mitra tidak ditemukan.'
      });
    }

    const details = buildMitraAffiliateDetails(req, mitra.referralCode);
    const { getAllOrders } = require('../services/orderService');
    const allOrders = await getAllOrders();
    const myReferredOrders = allOrders.filter(o =>
      (o.affiliateRef && o.affiliateRef.toUpperCase() === (mitra.referralCode || '').toUpperCase()) ||
      (o.partnerName && o.partnerName.toLowerCase().includes(mitra.name.toLowerCase()))
    );

    const balance = mitra.balance !== undefined ? mitra.balance : Math.max(0, (Number(mitra.totalCommission) || 0) - (Number(mitra.withdrawnCommission) || 0));

    res.json({
      success: true,
      data: {
        id: mitra.id,
        name: mitra.name,
        phone: mitra.phone,
        vehicleType: mitra.vehicleType || mitra.category,
        category: mitra.category,
        plateNumber: mitra.plateNumber || '',
        bankAccount: mitra.bankAccount || '',
        referralCode: mitra.referralCode,
        commissionRate: mitra.commissionRate !== undefined ? mitra.commissionRate : 10,
        totalCommission: mitra.totalCommission || 0,
        totalEarned: mitra.totalCommission || 0,
        balance: balance,
        unpaidCommission: balance,
        withdrawnCommission: mitra.withdrawnCommission || 0,
        affiliateUrl: details.affiliateUrl,
        qrCodeUrl: details.qrCodeUrl,
        totalOrders: myReferredOrders.length,
        commissionHistory: mitra.commissionHistory || []
      },
      mitra: {
        id: mitra.id,
        name: mitra.name,
        phone: mitra.phone,
        vehicleType: mitra.vehicleType || mitra.category,
        category: mitra.category,
        plateNumber: mitra.plateNumber || '',
        bankAccount: mitra.bankAccount || '',
        referralCode: mitra.referralCode,
        commissionRate: mitra.commissionRate !== undefined ? mitra.commissionRate : 10,
        totalCommission: mitra.totalCommission || 0,
        totalEarned: mitra.totalCommission || 0,
        balance: balance,
        unpaidCommission: balance,
        withdrawnCommission: mitra.withdrawnCommission || 0,
        affiliateUrl: details.affiliateUrl,
        qrCodeUrl: details.qrCodeUrl,
        totalOrders: myReferredOrders.length,
        commissionHistory: mitra.commissionHistory || []
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/mitra/ref/:code - Verifikasi kode afiliasi saat pelanggan membuka link booking / scan QR
router.get('/ref/:code', (req, res) => {
  try {
    const rawCode = (req.params.code || '').trim().toUpperCase();
    if (!rawCode) {
      return res.status(400).json({ success: false, message: 'Kode referral wajib disertakan.' });
    }

    const users = readUsers();
    const mitra = users.find(u => (u.referralCode || '').toUpperCase() === rawCode);

    if (!mitra) {
      return res.status(404).json({
        success: false,
        message: `Kode afiliasi "${rawCode}" tidak ditemukan atau belum terdaftar.`
      });
    }

    const details = buildMitraAffiliateDetails(req, mitra.referralCode);

    res.json({
      success: true,
      message: 'Kode afiliasi valid.',
      mitra: {
        id: mitra.id,
        name: mitra.name,
        category: mitra.category || (mitra.role === 'ojol' ? 'Mitra Kurir Ojek Online' : 'Mitra Bengkel / Toko Rekanan'),
        avatar: mitra.avatar || '🛵',
        referralCode: mitra.referralCode,
        commissionRate: mitra.commissionRate !== undefined ? mitra.commissionRate : 10,
        affiliateUrl: details.affiliateUrl
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/mitra/list - Daftar seluruh mitra driver & toko rekanan beserta kode unik & QR
router.get('/list', (req, res) => {
  try {
    const users = readUsers();
    const drivers = users.filter(u => u.role === 'ojol' || u.role === 'mitra');

    const formatted = drivers.map(d => {
      const refCode = d.referralCode || generateMitraCode(d.name, d.username);
      const details = buildMitraAffiliateDetails(req, refCode);

      return {
        id: d.id,
        username: d.username,
        name: d.name,
        role: d.role,
        category: d.category || (d.role === 'ojol' ? 'Mitra Kurir Ojek Online' : 'Mitra Bengkel / Toko Rekanan'),
        vehicleType: d.vehicleType || d.category || '',
        plateNumber: d.plateNumber || '',
        bankAccount: d.bankAccount || '',
        avatar: d.avatar || (d.role === 'ojol' ? '🛵' : '🏪'),
        phone: d.phone,
        email: d.email,
        email: d.email || '',
        password: d.password || '',
        plainPassword: d.plainPassword || (d.password && !String(d.password).startsWith('$2') ? d.password : ''),
        isPasswordHashed: Boolean(d.password && String(d.password).startsWith('$2')),
        referralCode: refCode,
        commissionRate: d.commissionRate !== undefined ? d.commissionRate : 10,
        totalCommission: d.totalCommission || 0,
        balance: d.balance !== undefined ? d.balance : (d.totalCommission || 0),
        withdrawnCommission: d.withdrawnCommission || 0,
        status: d.status || 'Siaga / Aktif',
        lastActive: d.lastActive || 'Hari ini',
        affiliateUrl: details.affiliateUrl,
        qrCodeUrl: details.qrCodeUrl
      };
    });

    res.json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/mitra/register - Pendaftaran Mitra Driver/Ojol Baru & Otomatisasi Kode Unik Afiliasi
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      username,
      password,
      phone,
      email = '',
      category = 'Mitra Kurir Ojek Online',
      vehicleType = '',
      plateNumber = '',
      bankAccount = '',
      customCode = ''
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama lengkap mitra wajib diisi.' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Nomor WhatsApp aktif wajib diisi.' });
    }

    const cleanPhone = normalizePhone(phone);
    const cleanEmail = normalizeEmail(email);
    if (!cleanPhone || cleanPhone.length < 9 || cleanPhone.length > 15) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_PHONE',
        field: 'phone',
        message: 'Nomor WhatsApp tidak valid. Gunakan format 08xxxxxxxxxx.'
      });
    }
    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_EMAIL',
        field: 'email',
        message: 'Format email tidak valid.'
      });
    }

    const cleanUser = (username && username.trim()) 
      ? username.trim().toLowerCase() 
      : `${name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}_${cleanPhone.slice(-4)}`;
    const explicitPassword = (password || '').trim();
    if (explicitPassword && explicitPassword.length < 6) {
      return res.status(400).json({
        success: false,
        code: 'WEAK_PASSWORD',
        field: 'password',
        message: 'Kata sandi minimal 6 karakter.'
      });
    }
    const cleanPass = explicitPassword || `mitra_${cleanPhone.slice(-4)}`;

    await userService.refreshUsersFromDb();
    await refreshCustomersFromDb();
    const users = readUsers();

    const existingCustomer = findCustomerByPhone(cleanPhone) || (cleanEmail ? findCustomerByEmail(cleanEmail) : null);
    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        code: 'CUSTOMER_ACCOUNT_EXISTS',
        field: findCustomerByPhone(cleanPhone) ? 'phone' : 'email',
        message: 'Kontak ini sudah terdaftar sebagai pelanggan. Gunakan kontak lain untuk akun mitra.'
      });
    }

    const allUsers = userService.getAllUsers().filter((user) => !['customer', 'pelanggan'].includes(String(user.role || '').toLowerCase()));
    const existingPhone = allUsers.find((user) => phonesMatch(user.phone, cleanPhone));
    if (existingPhone) {
      return res.status(409).json({
        success: false,
        code: 'PHONE_TAKEN',
        field: 'phone',
        message: 'Nomor WhatsApp sudah digunakan akun lain. Gunakan nomor lain atau masuk ke akun tersebut.'
      });
    }

    const existingEmail = cleanEmail ? allUsers.find((user) => String(user.email || '').toLowerCase() === cleanEmail) : null;
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        code: 'EMAIL_TAKEN',
        field: 'email',
        message: 'Email sudah digunakan akun lain. Gunakan email lain.'
      });
    }

    const existingUsername = users.find((user) => String(user.username || '').toLowerCase() === cleanUser);
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        code: 'USERNAME_TAKEN',
        field: 'username',
        message: 'Username sudah digunakan mitra lain. Pilih username yang berbeda.'
      });
    }

    // Auto-generate Unique Affiliate Referral Code
    let refCode = (customCode || '').trim().toUpperCase();
    if (!refCode) {
      refCode = generateMitraCode(name, cleanUser);
    }
    while (users.some(u => (u.referralCode || '').toUpperCase() === refCode)) {
      refCode = generateMitraCode(name, cleanUser);
    }

    const chosenCategory = vehicleType || category || 'Mitra Kurir Ojek Online';
    const isBengkel = chosenCategory.toLowerCase().includes('bengkel') || chosenCategory.toLowerCase().includes('toko');
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

    const newMitra = {
      id: `USR-MITRA-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(1000 + Math.random() * 9000))}`,
      username: cleanUser,
      password: hashPassword(cleanPass),
      plainPassword: cleanPass,
      name: name.trim(),
      role: isBengkel ? 'mitra' : 'ojol',
      category: chosenCategory.trim(),
      vehicleType: chosenCategory.trim(),
      plateNumber: (plateNumber || '').trim().toUpperCase(),
      bankAccount: (bankAccount || '').trim(),
      avatar: isBengkel ? '🏪' : '🛵',
      phone: cleanPhone,
      email: cleanEmail,
      referralCode: refCode,
      commissionRate: 10, // 10% komisi per servis
      totalCommission: 0,
      balance: 0,
      withdrawnCommission: 0,
      commissionHistory: [],
      status: 'Siaga / Aktif',
      lastActive: `${dateStr}, Baru Terdaftar`
    };

    users.push(newMitra);
    await saveUsers(users);

    const details = buildMitraAffiliateDetails(req, refCode);
    const safeMitra = { ...newMitra };
    delete safeMitra.password;

    const jwtInfo = generateToken({
      id: newMitra.id,
      username: newMitra.username,
      role: newMitra.role,
      referralCode: newMitra.referralCode
    }, false);
    setMitraTokenCookie(res, jwtInfo.token, jwtInfo.maxAge);

    const driver = {
      ...safeMitra,
      affiliateUrl: details.affiliateUrl,
      qrCodeUrl: details.qrCodeUrl,
      totalReferredOrders: 0,
      referredOrders: [],
      needsPhone: false
    };

    res.status(201).json({
      success: true,
      message: `Pendaftaran Mitra berhasil! Kode unik afiliasi Anda "${refCode}" telah aktif.`,
      token: jwtInfo.token,
      driver,
      data: driver,
      mitra: driver
    });
  } catch (err) {
    return sendAuthError(res, err, 'Pendaftaran mitra gagal.');
  }
});

// POST /api/mitra/payout - Catat Pencairan Saldo Komisi Mitra
router.post('/payout', async (req, res) => {
  try {
    const { referralCode, amount, note } = req.body;
    if (!referralCode) {
      return res.status(400).json({ success: false, message: 'Kode referral mitra wajib disertakan.' });
    }

    const result = await payoutMitraCommission(referralCode, amount, note);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Mitra tidak ditemukan.' });
    }
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/mitra/:id - Ubah / edit data mitra oleh admin
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    const updated = await userService.updateUserById(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: `Mitra dengan ID "${id}" tidak ditemukan.` });
    }
    res.json({
      success: true,
      message: `Data mitra "${updated.name}" berhasil diperbarui.`,
      data: updated
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/mitra/login - Login Mitra Driver & Toko Rekanan
router.post('/login', async (req, res) => {
  try {
    const { identifier = '', password = '' } = req.body;
    const cleanId = (identifier || '').trim();
    const cleanPass = (password || '').trim();

    if (!cleanId) {
      return res.status(400).json({
        success: false,
        code: 'IDENTIFIER_REQUIRED',
        field: 'identifier',
        message: 'Username, email, atau nomor WhatsApp akun mitra wajib diisi.'
      });
    }
    if (!cleanPass) {
      return res.status(400).json({
        success: false,
        code: 'PASSWORD_REQUIRED',
        field: 'password',
        message: 'Kata sandi akun mitra wajib diisi.'
      });
    }

    await userService.refreshUsersFromDb();
    const users = readUsers();
    const cleanLower = cleanId.toLowerCase();

    const matchedMitra = users.find(u => {
      const uUser = (u.username || '').toLowerCase();
      const uEmail = (u.email || '').toLowerCase();
      return uUser === cleanLower || uEmail === cleanLower || phonesMatch(u.phone, cleanId);
    });

    let driver = null;
    if (matchedMitra && verifyPassword(cleanPass, matchedMitra.password)) {
      driver = matchedMitra;
    } else if (matchedMitra) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_PASSWORD',
        field: 'password',
        message: 'Kata sandi akun mitra salah. Periksa kembali kata sandi Anda.'
      });
    }

    if (!driver) {
      const allStaff = userService.getAllUsers();
      const staffUser = allStaff.find(u => {
        const uUser = (u.username || '').toLowerCase();
        const uEmail = (u.email || '').toLowerCase();
        const matchId = uUser === cleanLower || uEmail === cleanLower || phonesMatch(u.phone, cleanId);
        return matchId && verifyPassword(cleanPass, u.password) && u.role === 'admin';
      });

      if (staffUser) {
        driver = {
          id: `USR-MITRA-${staffUser.id || 'ADMIN'}`,
          username: staffUser.username,
          name: staffUser.name,
          role: 'ojol',
          category: 'Mitra Prioritas Workshop',
          avatar: '👑',
          phone: staffUser.phone || '',
          email: staffUser.email || '',
          referralCode: staffUser.referralCode || 'NGALAM-SUPER-2026',
          commissionRate: 10,
          totalCommission: 0,
          status: 'Siaga / Aktif',
          lastActive: 'Hari ini'
        };
      }
    }

    if (!driver) {
      return res.status(404).json({
        success: false,
        code: 'ACCOUNT_NOT_FOUND',
        field: 'identifier',
        message: 'Akun mitra tidak ditemukan. Periksa username, email, atau nomor WhatsApp Anda.'
      });
    }

    const details = buildMitraAffiliateDetails(req, driver.referralCode);

    // Ambil riwayat order yang menggunakan kode afiliasi mitra ini
    const allOrders = readOrders();
    const myReferredOrders = allOrders.filter(o =>
      (o.affiliateRef && o.affiliateRef.toUpperCase() === driver.referralCode.toUpperCase()) ||
      (o.partnerName && o.partnerName.toLowerCase().includes(driver.name.toLowerCase()))
    );

    const safeDriver = { ...driver };
    delete safeDriver.password;

    const isRemember = req.body.rememberMe === true || req.body.rememberMe === 'true' || req.body.remember === true;
    const jwtInfo = generateToken({
      id: driver.id,
      username: driver.username,
      role: driver.role || 'mitra',
      referralCode: driver.referralCode
    }, isRemember);

    res.setHeader('Set-Cookie', `ngalam_mitra_token=${jwtInfo.token}; Path=/; Max-Age=${jwtInfo.maxAge}; SameSite=Lax`);
    res.json({
      success: true,
      message: `Selamat datang Mitra, ${driver.name}!`,
      token: jwtInfo.token,
      driver: {
        ...safeDriver,
        affiliateUrl: details.affiliateUrl,
        qrCodeUrl: details.qrCodeUrl,
        totalReferredOrders: myReferredOrders.length,
        referredOrders: myReferredOrders
      }
    });
  } catch (err) {
    return sendAuthError(res, err, 'Login mitra gagal.');
  }
});

// GET /api/mitra/dashboard - Data Dashboard & Performa Afiliasi Mitra
router.get('/dashboard', async (req, res) => {
  try {
    const refCode = (req.query.ref || '').trim().toUpperCase();
    if (!refCode) {
      return res.status(400).json({ success: false, message: 'Kode referral mitra wajib disertakan.' });
    }

    try {
      await userService.refreshUsersFromDb();
    } catch (_) {}

    const users = readUsers();
    const mitra = users.find(u => (u.referralCode || u.referral_code || '').toUpperCase() === refCode);

    if (!mitra) {
      return res.status(404).json({ success: false, message: 'Akun mitra tidak ditemukan.' });
    }

    const { getAllOrders } = require('../services/orderService');
    const { findCustomerByIdentifier } = require('../services/customerService');
    const allOrders = await getAllOrders();
    const myReferredOrders = allOrders.filter(o => {
      const orderRef = (o.affiliateRef || o.referralCode || '').toUpperCase();
      if (orderRef === refCode) return true;
      if (o.partnerName && o.partnerName.toLowerCase().includes(mitra.name.toLowerCase())) return true;
      
      const phone = o.whatsapp || o.phone || o.customerPhone || '';
      if (phone) {
        const c = findCustomerByIdentifier(phone);
        if (c && c.referredByMitra && c.referredByMitra.toUpperCase() === refCode) return true;
      }
      return false;
    });

    const details = buildMitraAffiliateDetails(req, refCode);
    const balance = mitra.balance !== undefined ? mitra.balance : (mitra.totalCommission || 0);

    res.json({
      success: true,
      mitra: {
        id: mitra.id,
        username: mitra.username,
        name: mitra.name,
        role: mitra.role,
        category: mitra.category || (mitra.role === 'ojol' ? 'Mitra Kurir Ojek Online' : 'Mitra Bengkel / Toko Rekanan'),
        avatar: mitra.avatar || '🛵',
        phone: mitra.phone,
        email: mitra.email,
        referralCode: mitra.referralCode,
        commissionRate: mitra.commissionRate !== undefined ? mitra.commissionRate : 10,
        totalCommission: mitra.totalCommission || 0,
        balance: balance,
        status: mitra.status || 'Siaga / Aktif',
        lastActive: mitra.lastActive,
        affiliateUrl: details.affiliateUrl,
        qrCodeUrl: details.qrCodeUrl,
        commissionHistory: Array.isArray(mitra.commissionHistory) ? mitra.commissionHistory : []
      },
      stats: {
        totalOrders: myReferredOrders.length,
        completedOrders: myReferredOrders.filter(o => o.currentStep >= 5 || o.step >= 5 || o.paid === true).length,
        activeOrders: myReferredOrders.filter(o => (o.currentStep || o.step || 1) < 5 && !o.paid).length,
        totalCommission: mitra.totalCommission || 0,
        balance: balance
      },
      orders: myReferredOrders
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/mitra/logout
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Berhasil keluar dari akun mitra.' });
});

module.exports = router;
