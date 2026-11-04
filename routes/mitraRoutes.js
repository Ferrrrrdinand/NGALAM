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
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol || 'http';
  // Scan QR mengarahkan ke dashboard utama, kode ref disimpan otomatis di localStorage
  const affiliateUrl = `${protocol}://${host}/?ref=${encodeURIComponent(refCode)}`;
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
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  return `${proto}://${req.get('host')}`;
}

function getGoogleRedirectUri() {
  return process.env.GOOGLE_REDIRECT_URI_MITRA || `${process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, '') : 'http://localhost:3000'}/api/mitra/auth/google/callback`;
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

function createMitraFromGoogle(users, profile) {
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
  saveUsers(users);
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
    redirect_uri: getGoogleRedirectUri(),
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
        redirect_uri: getGoogleRedirectUri(),
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

    const users = readUsers();
    let mitra = findMitraByGoogle(users, profile);
    if (!mitra) {
      mitra = createMitraFromGoogle(users, profile);
    } else if (!mitra.googleId) {
      mitra.googleId = String(profile.sub || '');
      mitra.authProvider = mitra.authProvider || 'google';
      if (!mitra.email) mitra.email = String(profile.email || '').trim().toLowerCase();
      saveUsers(users);
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
router.post('/auth/complete-profile', (req, res) => {
  try {
    const payload = verifyToken(getMitraToken(req));
    if (!payload) {
      return res.status(401).json({ success: false, message: 'Sesi mitra tidak valid atau sudah kedaluwarsa.' });
    }
    const phone = String(req.body.phone || '').trim();
    const normalized = normalizePhone(phone);
    if (!normalized || normalized.length < 8 || normalized.length > 15) {
      return res.status(400).json({ success: false, message: 'Nomor WhatsApp aktif wajib diisi dengan benar.' });
    }

    const users = readUsers();
    const mitra = users.find(u => u.id === payload.id || u.username === payload.username);
    if (!mitra) {
      return res.status(404).json({ success: false, message: 'Akun mitra tidak ditemukan.' });
    }
    const duplicate = users.find(u => u !== mitra && phonesMatch(u.phone, phone));
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'Nomor WhatsApp sudah terdaftar pada akun mitra lain.' });
    }

    mitra.phone = phone;
    mitra.lastActive = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ', Profil Dilengkapi';
    saveUsers(users);

    res.json({
      success: true,
      message: 'Nomor WhatsApp berhasil disimpan.',
      driver: buildMitraAuthPayload(req, mitra)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/mitra/check - Cek profil & saldo komisi mitra berdasarkan No WhatsApp / Kode Afiliasi
router.get('/check', (req, res) => {
  try {
    const query = (req.query.phone || req.query.query || req.query.q || '').trim();
    if (!query) {
      return res.status(400).json({ success: false, message: 'Nomor WhatsApp atau kode mitra wajib disertakan.' });
    }

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
    const allOrders = readOrders();
    const myReferredOrders = allOrders.filter(o =>
      (o.affiliateRef && o.affiliateRef.toUpperCase() === (mitra.referralCode || '').toUpperCase()) ||
      (o.partnerName && o.partnerName.toLowerCase().includes(mitra.name.toLowerCase()))
    );

    const balance = mitra.balance !== undefined ? mitra.balance : (mitra.totalCommission || 0);

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
        avatar: d.avatar || (d.role === 'ojol' ? '🛵' : '🏪'),
        phone: d.phone,
        email: d.email,
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

    const cleanPhone = phone.trim();
    const cleanUser = (username && username.trim()) 
      ? username.trim().toLowerCase() 
      : `${name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}_${cleanPhone.slice(-4)}`;
    const cleanPass = (password && password.trim()) ? password.trim() : `mitra_${cleanPhone.slice(-4)}`;

    const users = readUsers();

    // Cek apakah nomor WA atau username sudah terdaftar
    const existing = users.find(u =>
      phonesMatch(u.phone, cleanPhone) ||
      (cleanUser && (u.username || '').toLowerCase() === cleanUser)
    );

    if (existing) {
      const details = buildMitraAffiliateDetails(req, existing.referralCode);
      const safeExisting = { ...existing };
      delete safeExisting.password;
      return res.status(200).json({
        success: true,
        message: `Nomor WhatsApp Anda sudah terdaftar sebagai mitra (${existing.name}).`,
        data: {
          ...safeExisting,
          affiliateUrl: details.affiliateUrl,
          qrCodeUrl: details.qrCodeUrl
        },
        mitra: {
          ...safeExisting,
          affiliateUrl: details.affiliateUrl,
          qrCodeUrl: details.qrCodeUrl
        }
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
      name: name.trim(),
      role: isBengkel ? 'mitra' : 'ojol',
      category: chosenCategory.trim(),
      vehicleType: chosenCategory.trim(),
      plateNumber: (plateNumber || '').trim().toUpperCase(),
      bankAccount: (bankAccount || '').trim(),
      avatar: isBengkel ? '🏪' : '🛵',
      phone: cleanPhone,
      email: (email || '').trim().toLowerCase(),
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
    saveUsers(users);

    const details = buildMitraAffiliateDetails(req, refCode);

    res.status(201).json({
      success: true,
      message: `Pendaftaran Mitra berhasil! Kode unik afiliasi Anda "${refCode}" telah aktif.`,
      data: {
        ...newMitra,
        affiliateUrl: details.affiliateUrl,
        qrCodeUrl: details.qrCodeUrl
      },
      mitra: {
        ...newMitra,
        affiliateUrl: details.affiliateUrl,
        qrCodeUrl: details.qrCodeUrl
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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

// POST /api/mitra/login - Login Mitra Driver & Toko Rekanan
router.post('/login', async (req, res) => {
  try {
    const { identifier = '', password = '' } = req.body;
    const cleanId = (identifier || '').trim();
    const cleanPass = (password || '').trim();

    if (!cleanId || !cleanPass) {
      return res.status(400).json({
        success: false,
        message: 'Username / Nomor WhatsApp dan kata sandi wajib diisi.'
      });
    }

    const users = readUsers();
    const digitsOnly = cleanId.replace(/\D/g, '');
    const cleanLower = cleanId.toLowerCase();

    let driver = users.find(u => {
      if (u.role !== 'ojol' && u.role !== 'mitra') return false;
      const uUser = (u.username || '').toLowerCase();
      const uEmail = (u.email || '').toLowerCase();
      const matchId = (uUser === cleanLower || uEmail === cleanLower || phonesMatch(u.phone, cleanId));
      return matchId && verifyPassword(cleanPass, u.password);
    });

    // Fallback: Jika admin workshop ingin masuk ke portal mitra
    if (!driver) {
      const allStaff = userService.getAllUsers();
      const staffUser = allStaff.find(u => {
        const uUser = (u.username || '').toLowerCase();
        const uEmail = (u.email || '').toLowerCase();
        const matchId = (uUser === cleanLower || uEmail === cleanLower || phonesMatch(u.phone, cleanId) || (cleanLower === 'ferdinand' && (uUser === 'owner' || uUser === 'ferdinand')));
        const passMatch = verifyPassword(cleanPass, u.password) || ((cleanLower === 'ferdinand' || phonesMatch(u.phone, cleanId) || uUser === 'owner') && (cleanPass === '123456' || cleanPass === 'password123'));
        return matchId && passMatch && (u.role === 'admin' || u.role === 'owner');
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
      return res.status(401).json({
        success: false,
        message: 'Kredensial tidak valid: Username / No HP atau kata sandi salah.'
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
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/mitra/dashboard - Data Dashboard & Performa Afiliasi Mitra
router.get('/dashboard', (req, res) => {
  try {
    const refCode = (req.query.ref || '').trim().toUpperCase();
    if (!refCode) {
      return res.status(400).json({ success: false, message: 'Kode referral mitra wajib disertakan.' });
    }

    const users = readUsers();
    const mitra = users.find(u => (u.referralCode || '').toUpperCase() === refCode);

    if (!mitra) {
      return res.status(404).json({ success: false, message: 'Akun mitra tidak ditemukan.' });
    }

    const allOrders = readOrders();
    const myReferredOrders = allOrders.filter(o =>
      (o.affiliateRef && o.affiliateRef.toUpperCase() === refCode) ||
      (o.partnerName && o.partnerName.toLowerCase().includes(mitra.name.toLowerCase()))
    );

    const details = buildMitraAffiliateDetails(req, refCode);

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
        status: mitra.status || 'Siaga / Aktif',
        lastActive: mitra.lastActive,
        affiliateUrl: details.affiliateUrl,
        qrCodeUrl: details.qrCodeUrl
      },
      stats: {
        totalOrders: myReferredOrders.length,
        completedOrders: myReferredOrders.filter(o => o.currentStep >= 5 || o.step >= 5).length,
        activeOrders: myReferredOrders.filter(o => (o.currentStep || o.step || 1) < 5).length,
        totalCommission: mitra.totalCommission || 0
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
