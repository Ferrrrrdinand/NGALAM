/**
 * NGALAM FIX PRO - Customer Authentication & Portal Routes
 * Dedicated routes for customer login, member registration, personal device service history,
 * 90-day official lab warranty tracking, and PostgreSQL database synchronization.
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { getAllOrders } = require('../services/orderService');
const {
  refreshCustomersFromDb,
  findCustomerByIdentifier,
  findCustomerByEmail,
  findCustomerByPhone,
  registerNewCustomer,
  getAllCustomers,
  upsertGoogleCustomer,
  updateCustomerById,
} = require('../services/customerService');
const { readTransactions } = require('../services/financeService');
const userService = require('../services/userService');
const db = require('../services/db');
const { generateToken, verifyToken } = require('../src/utils/jwt');
const { verifyPassword } = require('../src/utils/security');
const { sendAuthError } = require('../src/utils/authError');
const { isValidEmail, normalizeEmail } = require('../src/utils/phone');

router.use(async (req, res, next) => {
  try {
    await refreshCustomersFromDb();
  } catch (_) {}
  next();
});

// ============================================================
// Google OAuth & Session Helpers
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
  return process.env.GOOGLE_REDIRECT_URI || `${getBaseUrl(req)}/api/customer/auth/google/callback`;
}

function parseAuthCookies(req) {
  const list = {};
  const raw = req.headers.cookie;
  if (!raw) return list;
  raw.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const key = part.slice(0, idx).trim();
    list[key] = decodeURIComponent(part.slice(idx + 1).trim());
  });
  return list;
}

function getCustomerToken(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader) return authHeader.replace(/^Bearer\s+/i, '');
  const cookies = parseAuthCookies(req);
  return cookies.ngalam_customer_token || req.query.token || '';
}

function setCustomerTokenCookie(res, token, maxAge) {
  const cookieValue = `ngalam_customer_token=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax`;
  const existing = res.getHeader('Set-Cookie');
  res.setHeader('Set-Cookie', existing ? [].concat(existing, cookieValue) : cookieValue);
}

function buildCustomerSession(cust, tokenInfo, rememberMe, extra = {}) {
  const hasPhone = Boolean(cust.whatsapp && String(cust.whatsapp).trim());
  return {
    isCustomer: true,
    accountType: cust.accountType || 'customer',
    id: cust.id,
    mitraId: cust.mitraId || '',
    username: cust.username || '',
    referralCode: cust.referralCode || '',
    name: cust.name,
    whatsapp: cust.whatsapp || '',
    email: cust.email || '',
    district: cust.district || '',
    referredByMitra: cust.referredByMitra || '',
    avatar: cust.avatar || '',
    needsPhone: !hasPhone,
    totalOrders: extra.totalOrders || 0,
    activeOrders: extra.activeOrders || 0,
    completedOrders: extra.completedOrders || 0,
    activeWarranties: extra.activeWarranties || 0,
    databaseConnected: true,
    token: tokenInfo ? tokenInfo.token : '',
    rememberMe: Boolean(rememberMe),
    expiresIn: tokenInfo ? tokenInfo.expiresIn : '',
    maxAge: tokenInfo ? tokenInfo.maxAge : 0,
    loginAt: new Date().toISOString()
  };
}

function isMitraRole(role) {
  return ['mitra', 'ojol', 'kurir'].includes(String(role || '').toLowerCase());
}

function isCustomerRole(role) {
  return ['customer', 'pelanggan'].includes(String(role || '').toLowerCase());
}

function findMitraAccount(identifier) {
  const clean = String(identifier || '').trim().toLowerCase();
  if (!clean) return null;
  return userService.getAllUsers().find((user) => {
    if (!isMitraRole(user.role)) return false;
    const username = String(user.username || '').toLowerCase();
    const email = String(user.email || '').toLowerCase();
    return username === clean || email === clean || phonesMatch(user.phone, clean);
  }) || null;
}

function findMitraById(id) {
  const clean = String(id || '').trim().toLowerCase();
  if (!clean) return null;
  return userService.getAllUsers().find((user) => {
    if (!isMitraRole(user.role)) return false;
    return String(user.id || '').toLowerCase() === clean || String(user.username || '').toLowerCase() === clean;
  }) || null;
}

function buildMitraCustomerData(mitra) {
  return {
    accountType: 'mitra',
    id: mitra.id,
    mitraId: mitra.id,
    username: mitra.username || '',
    name: mitra.name || mitra.username || 'Mitra',
    whatsapp: mitra.phone || '',
    email: mitra.email || '',
    district: '',
    referralCode: mitra.referralCode || '',
    avatar: mitra.avatar || '🛵',
    needsPhone: !mitra.phone
  };
}

async function buildMitraCustomerLogin(req, mitra, rememberMe) {
  const contact = mitra.phone || mitra.email || '';
  const matched = await getCombinedCustomerOrders(
    String(contact).toLowerCase(),
    mitra.phone || '',
    mitra.email || ''
  );
  const formattedList = matched.map(formatCustomerOrder);
  const activeWarrantiesCount = formattedList.filter((order) => order.warranty && order.warranty.isActive).length;
  const jwtInfo = generateToken({
    customerId: mitra.id,
    userId: mitra.id,
    name: mitra.name,
    username: mitra.username,
    whatsapp: mitra.phone || '',
    email: mitra.email || '',
    role: 'customer',
    accountType: 'mitra',
    mitraId: mitra.id
  }, rememberMe);
  const customer = buildCustomerSession(buildMitraCustomerData(mitra), jwtInfo, rememberMe, {
    totalOrders: formattedList.length,
    activeOrders: formattedList.filter((order) => order.step < 5).length,
    completedOrders: formattedList.filter((order) => order.step >= 5).length,
    activeWarranties: activeWarrantiesCount
  });
  return { customer, orders: formattedList, jwtInfo };
}

/**
 * Hitung Status Garansi Resmi 90 Hari Workshop Lab
 */
function calculateWarranty(orderDateStr, step = 5, ticketId = '', phoneType = '', customerName = '', damageTypeOrDesc = '') {
  let orderDate = new Date();
  if (orderDateStr) {
    const parsed = new Date(orderDateStr);
    if (!isNaN(parsed.getTime())) {
      orderDate = parsed;
    } else {
      // Indonesian date string parser, e.g. "23 Okt 2026, 11.00"
      const match = String(orderDateStr).match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
      if (match) {
        const months = {
          'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'mei': 4, 'may': 4, 'jun': 5,
          'jul': 6, 'agu': 7, 'aug': 7, 'sep': 8, 'okt': 9, 'oct': 9, 'nov': 10, 'des': 11, 'dec': 11
        };
        const day = parseInt(match[1], 10);
        const mKey = match[2].toLowerCase().substring(0, 3);
        const month = months[mKey] !== undefined ? months[mKey] : 9;
        const year = parseInt(match[3], 10);
        orderDate = new Date(year, month, day);
      }
    }
  }

  // Tentukan durasi garansi: Baterai = 90 Hari, lainnya 7 s/d 30 Hari
  const damageStr = String(damageTypeOrDesc || '').toLowerCase();
  let warrantyDurationDays = 30; // default 1 bulan
  let warrantyTypeLabel = 'Garansi Servis (30 Hari / 1 Bulan)';

  if (/baterai|battery|batre/i.test(damageStr)) {
    warrantyDurationDays = 90; // Khusus Baterai: 90 Hari (3 Bulan)
    warrantyTypeLabel = 'Garansi Baterai Original (90 Hari / 3 Bulan)';
  } else if (/software|virus|malware|flash|bootloop|sandi|pola/i.test(damageStr)) {
    warrantyDurationDays = 7; // Software: 1 Minggu
    warrantyTypeLabel = 'Garansi Software & Sistem (7 Hari / 1 Minggu)';
  } else if (/cas|charge|charger|port|konektor/i.test(damageStr)) {
    warrantyDurationDays = 14; // Port Cas: 2 Minggu
    warrantyTypeLabel = 'Garansi Port Charger (14 Hari / 2 Minggu)';
  } else {
    warrantyDurationDays = 30; // LCD, OLED, Kaca OCA, Fleksibel, IC Motherboard, Kamera OIS: 1 Bulan
    warrantyTypeLabel = 'Garansi Servis Hardware (30 Hari / 1 Bulan)';
  }
  const startDate = new Date(orderDate);
  const endDate = new Date(startDate.getTime() + (warrantyDurationDays * 24 * 60 * 60 * 1000));
  const today = new Date();

  // Reset hours to start of day for accurate remaining days
  const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const diffTime = endDay.getTime() - todayDay.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const isExpired = diffTime < 0;
  const isDone = parseInt(step, 10) >= 5;

  const formatDate = (d) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const startDateFormatted = formatDate(startDate);
  const endDateFormatted = formatDate(endDate);

  const cleanNum = String(ticketId).replace(/[^0-9]/g, '').slice(-8) || `${warrantyDurationDays}D`;
  const warrantyCode = `GAR-${warrantyDurationDays}D-${cleanNum}`;

  let statusLabel = '';
  let statusBadgeClass = '';
  if (!isDone) {
    statusLabel = `⏳ Garansi Siaga (Aktif Penuh ${warrantyDurationDays} Hari Setelah Unit Selesai Diambil)`;
    statusBadgeClass = 'pending';
  } else if (!isExpired) {
    statusLabel = `🛡️ ${warrantyTypeLabel} Aktif (Sisa ${daysRemaining} Hari)`;
    statusBadgeClass = 'active';
  } else {
    statusLabel = `⚠️ Masa Garansi ${warrantyDurationDays} Hari Telah Berakhir (${endDateFormatted})`;
    statusBadgeClass = 'expired';
  }

  // Pre-filled WhatsApp claim message
  const waText = encodeURIComponent(
    `Halo Admin & CS Ngalam Fix Pro,\n\nSaya ingin klaim ${warrantyTypeLabel} untuk unit servis saya:\n` +
    `• Nomor Tiket: ${ticketId || '-'}\n` +
    `• Tipe Smartphone: ${phoneType || '-'}\n` +
    `• Nama Pemilik: ${customerName || '-'}\n` +
    `• Kode Sertifikat: ${warrantyCode}\n` +
    `• Masa Berlaku: s/d ${endDateFormatted} (Sisa ${daysRemaining} Hari)\n\n` +
    `Mohon dibantu jadwal pengecekan unit di workshop. Terima kasih!`
  );
  const claimWaUrl = `https://wa.me/6281330304321?text=${waText}`;

  return {
    warrantyCode,
    warrantyTypeLabel,
    durationDays: warrantyDurationDays,
    startDate: startDateFormatted,
    endDate: endDateFormatted,
    daysRemaining: daysRemaining,
    isExpired: isExpired,
    isActive: isDone && !isExpired,
    isPendingCompletion: !isDone,
    statusLabel,
    statusBadgeClass,
    coverage: 'Garansi Komponen/Sparepart Asli, Kalibrasi Hardware & Bebas Biaya Jasa Pemasangan Ulang',
    claimWaUrl
  };
}

// Helper to format order for transparent customer tracking & member area
function formatCustomerOrder(o) {
  if (!o) return null;
  const step = parseInt(o.step || o.currentStep || 1, 10);
  const costStr = typeof o.cost === 'string' && o.cost
    ? o.cost
    : o.estimatedCost ? `Rp ${Number(o.estimatedCost).toLocaleString('id-ID')}` : 'Rp 250.000';

  const ticketId = o.id || 'NGF-TICKET';
  const phoneType = o.phoneType || o.brandModel || 'Smartphone';
  const customerName = o.customerName || o.name || 'Pelanggan Ngalam Fix Pro';
  const damageText = o.damageDescription || o.damage || o.damageType || (Array.isArray(o.problemTags) ? o.problemTags.join(' ') : 'Servis Komponen');
  const warranty = calculateWarranty(o.createdAt || o.paidAt, step, ticketId, phoneType, customerName, damageText);

  return {
    id: ticketId,
    customerName: customerName,
    whatsapp: o.whatsapp || o.customerWa || o.phone || o.customerPhone || '',
    email: o.email || '',
    district: o.district || o.domicile || o.address || 'Malang Raya',
    phoneType: phoneType,
    modelColor: o.modelColor || '',
    damageDescription: o.damageDescription || o.damage || (Array.isArray(o.problemTags) ? o.problemTags.join(', ') : 'Servis Komponen & Hardware'),
    technician: typeof o.technician === 'string' ? o.technician : (o.assignedTechnician ? o.assignedTechnician.name : 'Workshop Meja 1'),
    cost: costStr,
    duration: o.duration || o.estimatedDuration || o.estimatedTime || '30 - 60 Menit',
    status: o.status || 'Registrasi & Masuk',
    step: step,
    diagnoseNote: o.diagnoseNote || o.technicianNotes || 'Unit sedang dalam penanganan teknisi meja lab workshop.',
    createdAt: o.createdAt || 'Baru Masuk',
    warranty: warranty,
    isPartner: !!o.isPartner,
    partnerName: o.partnerName || ''
  };
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
 * Helper untuk mengambil seluruh riwayat servis gabungan (Orders + POS Transactions)
 */
async function getCombinedCustomerOrders(cleanId, additionalWa = '', additionalEmail = '') {
  const rawOrders = await getAllOrders();
  const rawTransactions = readTransactions();

  const matched = [];
  const seenIds = new Set();
  const targetId = (cleanId || '').toLowerCase();
  const targetWa = additionalWa || cleanId;
  const targetEmail = (additionalEmail || '').toLowerCase();

  // 1. Dari data orders.json / Tiket Servis
  rawOrders.forEach(o => {
    const id = (o.id || '').toLowerCase();
    const wa = o.whatsapp || o.customerWa || o.phone || o.customerPhone || '';
    const email = (o.email || '').toLowerCase();

    let isMatch = false;
    if (id === targetId || id.includes(targetId)) isMatch = true;
    if (phonesMatch(wa, targetWa) || phonesMatch(wa, targetId)) isMatch = true;
    if (email && (email === targetId || (targetEmail && email === targetEmail))) isMatch = true;

    if (isMatch) {
      const orderId = (o.id || '').toUpperCase();
      if (!seenIds.has(orderId)) {
        seenIds.add(orderId);
        matched.push(o);
      }
    }
  });

  // 2. Dari data transactions.json (Faktur Kasir Workshop yang selesai)
  rawTransactions.forEach(tx => {
    const ticketId = (tx.ticketId || tx.invoiceNumber || '').toUpperCase();
    if (seenIds.has(ticketId)) return;

    const wa = tx.customerPhone || '';
    const email = (tx.customerEmail || '').toLowerCase();

    let isMatch = false;
    if (ticketId.toLowerCase() === targetId) isMatch = true;
    if (phonesMatch(wa, targetWa) || phonesMatch(wa, targetId)) isMatch = true;
    if (email && (email === targetId || (targetEmail && email === targetEmail))) isMatch = true;

    if (isMatch) {
      seenIds.add(ticketId);
      matched.push({
        id: ticketId,
        customerName: tx.customerName || 'Pelanggan Ngalam Fix Pro',
        whatsapp: tx.customerPhone || '-',
        email: tx.customerEmail || '',
        district: 'Malang',
        phoneType: tx.phoneType || 'Smartphone',
        modelColor: '',
        damageDescription: tx.serviceItem || 'Servis Komponen & Hardware',
        technician: tx.technician || 'Workshop Lab',
        cost: `Rp ${Number(tx.totalPaid || 0).toLocaleString('id-ID')}`,
        duration: 'Selesai',
        status: 'Selesai & Lunas Kasir',
        step: 5,
        diagnoseNote: `Faktur kasir resmi: ${tx.invoiceNumber} via ${tx.paymentMethod}. Pengerjaan selesai dan terproteksi garansi resmi lab (${/baterai|battery/i.test(tx.serviceItem || '') ? '90 Hari Baterai' : '7 s/d 30 Hari'}).`,
        createdAt: tx.displayTime || tx.paidAt
      });
    }
  });

  return matched;
}

// POST /api/customer/register
router.post('/register', async (req, res) => {
  try {
    const { name, whatsapp, email = '', district = 'Klojen, Kota Malang', pin = '', password = '', referredByMitra = '' } = req.body;
    const secret = String(password || pin || '').trim();
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama lengkap wajib diisi.' });
    }
    if (!whatsapp || !whatsapp.trim()) {
      return res.status(400).json({ success: false, message: 'Nomor WhatsApp aktif wajib diisi.' });
    }
    if (secret.length < 6) {
      return res.status(400).json({ success: false, message: 'Password wajib diisi minimal 6 karakter.' });
    }

    const cleanWa = normalizePhone(whatsapp);
    const cleanEmail = normalizeEmail(email);
    if (!cleanWa || cleanWa.length < 9 || cleanWa.length > 15) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_PHONE',
        field: 'whatsapp',
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

    const existingPhone = findCustomerByPhone(cleanWa);
    if (existingPhone) {
      return res.status(409).json({
        success: false,
        alreadyRegistered: true,
        code: 'CUSTOMER_PHONE_TAKEN',
        field: 'whatsapp',
        message: `Nomor WhatsApp sudah terdaftar sebagai pelanggan (${existingPhone.name}). Silakan langsung masuk.`
      });
    }

    const existingEmail = cleanEmail ? findCustomerByEmail(cleanEmail) : null;
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        alreadyRegistered: true,
        code: 'CUSTOMER_EMAIL_TAKEN',
        field: 'email',
        message: `Email sudah terdaftar sebagai pelanggan (${existingEmail.name}). Silakan langsung masuk.`
      });
    }

    await userService.refreshUsersFromDb();
    const registeredUser = userService.findUser(cleanWa) || (cleanEmail ? userService.findUser(cleanEmail) : null);
    if (registeredUser && !isCustomerRole(registeredUser.role)) {
      const isMitra = isMitraRole(registeredUser.role);
      return res.status(409).json({
        success: false,
        code: isMitra ? 'MITRA_ACCOUNT_EXISTS' : 'STAFF_ACCOUNT_EXISTS',
        field: userService.findUser(cleanWa) ? 'whatsapp' : 'email',
        message: isMitra
          ? 'Kontak ini sudah terdaftar sebagai mitra. Masuk ke portal pelanggan menggunakan username atau nomor WhatsApp akun mitra Anda.'
          : 'Kontak ini sudah terdaftar sebagai akun staf. Gunakan kontak lain.'
      });
    }

    const newCust = await registerNewCustomer({
      name,
      whatsapp: cleanWa,
      email: cleanEmail,
      district,
      password: secret,
      pin: secret,
      referredByMitra,
      registeredVia: 'Portal Pelanggan Web'
    });

    const matched = await getCombinedCustomerOrders(cleanWa.toLowerCase(), cleanWa, cleanEmail);
    const formattedList = matched.map(formatCustomerOrder);
    const activeWarrantiesCount = formattedList.filter(o => o.warranty && o.warranty.isActive).length;

    const isRememberReg = req.body.rememberMe === true || req.body.rememberMe === 'true' || req.body.remember === true;
    const regJwtInfo = generateToken({
      customerId: newCust.id || newCust.whatsapp,
      name: newCust.name,
      whatsapp: newCust.whatsapp,
      email: newCust.email,
      role: 'customer'
    }, isRememberReg);

    const customerSession = {
      isCustomer: true,
      id: newCust.id,
      name: newCust.name,
      whatsapp: newCust.whatsapp,
      email: newCust.email,
      district: newCust.district,
      referredByMitra: newCust.referredByMitra || '',
      needsPhone: !newCust.whatsapp,
      totalOrders: formattedList.length,
      activeOrders: formattedList.filter(o => o.step < 5).length,
      completedOrders: formattedList.filter(o => o.step >= 5).length,
      activeWarranties: activeWarrantiesCount,
      databaseConnected: true,
      token: regJwtInfo.token,
      rememberMe: isRememberReg,
      expiresIn: regJwtInfo.expiresIn,
      maxAge: regJwtInfo.maxAge,
      loginAt: new Date().toISOString()
    };

    res.setHeader('Set-Cookie', `ngalam_customer_token=${regJwtInfo.token}; Path=/; Max-Age=${regJwtInfo.maxAge}; SameSite=Lax`);
    res.status(201).json({
      success: true,
      message: `Registrasi berhasil! Selamat bergabung, ${newCust.name}! Anda mendapatkan voucher diskon 10% (Kode: MEMBER10).`,
      customer: customerSession,
      orders: formattedList,
      memberVoucher: {
        code: 'MEMBER10',
        discount: '10%',
        description: 'Potongan harga 10% langsung untuk servis smartphone Anda di Ngalam Fix Pro.'
      }
    });
  } catch (err) {
    return sendAuthError(res, err, 'Pendaftaran pelanggan gagal.');
  }
});

// POST /api/customer/login
router.post('/login', async (req, res) => {
  try {
    const { identifier = '', pin = '', password = '' } = req.body;
    const isRemember = req.body.rememberMe === true || req.body.rememberMe === 'true' || req.body.remember === true;
    const cleanId = (identifier || '').trim().toLowerCase();
    const secret = String(password || pin || '').trim();

    if (!cleanId) {
      return res.status(400).json({
        success: false,
        code: 'IDENTIFIER_REQUIRED',
        field: 'identifier',
        message: 'Email, nomor WhatsApp, atau username mitra wajib diisi.'
      });
    }
    if (!secret) {
      return res.status(400).json({
        success: false,
        code: 'PASSWORD_REQUIRED',
        field: 'password',
        message: 'Password wajib diisi.'
      });
    }

    let mitraAccount = null;
    try {
      const usersReady = await userService.refreshUsersFromDb();
      if (usersReady) mitraAccount = findMitraAccount(cleanId);
    } catch (_) {}

    if (mitraAccount && verifyPassword(secret, mitraAccount.password)) {
      const result = await buildMitraCustomerLogin(req, mitraAccount, isRemember);
      try {
        db.logActivity('CUSTOMER_LOGIN', 'users', mitraAccount.id, {
          name: mitraAccount.name,
          whatsapp: mitraAccount.phone || '',
          accountType: 'mitra',
          loginAt: result.customer.loginAt
        });
      } catch (_) {}
      res.setHeader('Set-Cookie', `ngalam_customer_token=${result.jwtInfo.token}; Path=/; Max-Age=${result.jwtInfo.maxAge}; SameSite=Lax`);
      return res.json({
        success: true,
        message: `Selamat datang kembali, ${mitraAccount.name}! Akun mitra Anda juga aktif sebagai pelanggan.`,
        customer: result.customer,
        orders: result.orders
      });
    }

    const registeredCust = mitraAccount
      ? (findCustomerByPhone(cleanId) || findCustomerByEmail(cleanId))
      : findCustomerByIdentifier(cleanId);

    if (registeredCust) {
      const validCustSecret = registeredCust.passwordHash || registeredCust.pin || '';
      if (verifyPassword(secret, validCustSecret)) {
        const matchedOrders = await getCombinedCustomerOrders(cleanId, registeredCust.whatsapp, registeredCust.email);
        const formattedList = matchedOrders.map(formatCustomerOrder);
        const activeWarrantiesCount = formattedList.filter(o => o.warranty && o.warranty.isActive).length;

        const jwtInfo = generateToken({
          customerId: registeredCust.id || registeredCust.whatsapp,
          name: registeredCust.name,
          whatsapp: registeredCust.whatsapp,
          email: registeredCust.email,
          role: 'customer',
          accountType: 'customer'
        }, isRemember);

        const customerSession = buildCustomerSession(registeredCust, jwtInfo, isRemember, {
          totalOrders: formattedList.length,
          activeOrders: formattedList.filter((o) => o.step < 5).length,
          completedOrders: formattedList.filter((o) => o.step >= 5).length,
          activeWarranties: activeWarrantiesCount
        });

        try {
          db.logActivity('CUSTOMER_LOGIN', 'customers', registeredCust.id || registeredCust.whatsapp, {
            name: registeredCust.name,
            whatsapp: registeredCust.whatsapp,
            district: registeredCust.district,
            loginAt: customerSession.loginAt
          });
        } catch (_) {}

        res.setHeader('Set-Cookie', `ngalam_customer_token=${jwtInfo.token}; Path=/; Max-Age=${jwtInfo.maxAge}; SameSite=Lax`);
        return res.json({
          success: true,
          message: `Selamat datang kembali, ${registeredCust.name}!`,
          customer: customerSession,
          orders: formattedList
        });
      }
    }

    if (mitraAccount) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_MITRA_PASSWORD',
        field: 'password',
        message: 'Kata sandi akun mitra salah. Periksa kembali kata sandi Anda.'
      });
    }

    if (registeredCust) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_PASSWORD',
        field: 'password',
        message: 'Password atau PIN pelanggan tidak sesuai. Silakan coba lagi.'
      });
    }

    return res.status(404).json({
      success: false,
      needRegister: true,
      code: 'ACCOUNT_NOT_FOUND',
      field: 'identifier',
      message: 'Akun tidak ditemukan. Daftar sebagai pelanggan atau masuk menggunakan akun mitra Anda.'
    });
  } catch (err) {
    return sendAuthError(res, err, 'Login pelanggan gagal.');
  }
});

// GET /api/customer/orders
router.get('/orders', async (req, res) => {
  try {
    let query = (req.query.query || '').trim().toLowerCase();
    
    // Auto-detect dari sesi token JWT jika query parameter tidak disertakan
    if (!query) {
      const token = getCustomerToken(req);
      if (token) {
        const payload = verifyToken(token);
        if (payload) {
          query = (payload.whatsapp || payload.phone || payload.email || payload.customerId || '').trim().toLowerCase();
        }
      }
    }

    if (!query) {
      return res.status(400).json({ success: false, message: 'Nomor WhatsApp atau Nomor Tiket wajib diisi.' });
    }
    const cleanDigits = query.replace(/\D/g, '');
    const matched = await getCombinedCustomerOrders(query, cleanDigits);

    if (matched.length === 0) {
      return res.json({
        success: true,
        count: 0,
        customer: {
          name: 'Pelanggan Member',
          whatsapp: query,
          email: '',
          district: 'Malang',
          totalOrders: 0,
          activeOrders: 0,
          completedOrders: 0,
          activeWarranties: 0
        },
        orders: [],
        message: 'Belum ada riwayat transaksi atau unit servis untuk akun ini.'
      });
    }

    const formattedList = matched.map(formatCustomerOrder);
    const primary = formattedList[0];
    const activeWarrantiesCount = formattedList.filter(o => o.warranty && o.warranty.isActive).length;

    res.json({
      success: true,
      count: formattedList.length,
      customer: {
        name: primary.customerName,
        whatsapp: primary.whatsapp,
        email: primary.email,
        district: primary.district,
        totalOrders: formattedList.length,
        activeOrders: formattedList.filter(o => o.step < 5).length,
        completedOrders: formattedList.filter(o => o.step >= 5).length,
        activeWarranties: activeWarrantiesCount
      },
      orders: formattedList
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/customer/claim-warranty - Pengajuan Klaim Garansi Resmi dari Akun Pelanggan
router.post('/claim-warranty', async (req, res) => {
  try {
    const {
      ticketId,
      warrantyCode,
      phoneType,
      customerName,
      whatsapp,
      damageDescription,
      issueComplaint,
      claimMethod = 'Datang Langsung ke Workshop',
      notes = ''
    } = req.body;

    if (!ticketId) {
      return res.status(400).json({ success: false, message: 'Nomor Tiket servis wajib disertakan.' });
    }
    if (!issueComplaint || !String(issueComplaint).trim()) {
      return res.status(400).json({ success: false, message: 'Harap jelaskan kendala atau keluhan unit untuk pengajuan klaim garansi.' });
    }

    // Cari order terkait untuk verifikasi
    const cleanId = String(ticketId).trim();
    const cleanDigits = cleanId.replace(/\D/g, '');
    const matched = await getCombinedCustomerOrders(cleanId, cleanDigits);
    const targetOrder = matched.length > 0 ? formatCustomerOrder(matched[0]) : null;

    const claimId = `CLM-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const claimDate = new Date();
    const claimDateFormatted = claimDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const finalCustomerName = customerName || (targetOrder ? targetOrder.customerName : 'Pelanggan');
    const finalPhone = whatsapp || (targetOrder ? targetOrder.whatsapp : '');
    const finalPhoneType = phoneType || (targetOrder ? targetOrder.phoneType : 'Smartphone');
    const finalWarrantyCode = warrantyCode || (targetOrder && targetOrder.warranty ? targetOrder.warranty.warrantyCode : `GAR-CLAIM-${cleanId}`);
    const warrantyType = targetOrder && targetOrder.warranty ? targetOrder.warranty.warrantyTypeLabel : 'Garansi Servis Resmi';

    // Format pesan WhatsApp klaim garansi otomatis untuk CS / Meja Workshop
    const waText = encodeURIComponent(
      `Halo Tim Servis Ngalam Fix Pro,\n\n` +
      `Saya ingin mengajukan KLAIM GARANSI resmi untuk unit servis saya:\n` +
      `---------------------------------------\n` +
      `📋 No. Tiket Klaim: ${claimId}\n` +
      `🎫 No. Tiket Servis: ${cleanId}\n` +
      `📱 Tipe HP: ${finalPhoneType}\n` +
      `👤 Nama Pemilik: ${finalCustomerName}\n` +
      `📞 WhatsApp: ${finalPhone}\n` +
      `🛡️ Jenis Garansi: ${warrantyType}\n` +
      `🏷️ Kode Sertifikat: ${finalWarrantyCode}\n` +
      `🚗 Metode: ${claimMethod}\n` +
      `---------------------------------------\n` +
      `⚠️ Kendala / Keluhan Garansi:\n` +
      `"${issueComplaint.trim()}"\n\n` +
      `Mohon konfirmasi kesiapan teknisi lab untuk pengecekan unit. Terima kasih!`
    );
    const claimWaUrl = `https://wa.me/6281330304321?text=${waText}`;

    // Catat ke Audit Trail / Log Aktivitas Database
    try {
      db.logActivity('WARRANTY_CLAIM_SUBMITTED', 'orders', cleanId, {
        claimId,
        ticketId: cleanId,
        warrantyCode: finalWarrantyCode,
        customerName: finalCustomerName,
        whatsapp: finalPhone,
        phoneType: finalPhoneType,
        complaint: issueComplaint.trim(),
        claimMethod,
        claimedAt: claimDateFormatted
      });
    } catch (e) {
      console.warn('[Claim Warranty] Audit log warning:', e.message);
    }

    return res.json({
      success: true,
      claimId,
      ticketId: cleanId,
      customerName: finalCustomerName,
      whatsapp: finalPhone,
      phoneType: finalPhoneType,
      warrantyCode: finalWarrantyCode,
      warrantyType,
      claimDate: claimDateFormatted,
      complaint: issueComplaint.trim(),
      claimMethod,
      claimWaUrl,
      message: 'Pengajuan klaim garansi resmi Anda berhasil dicatat dalam sistem lab workshop.'
    });
  } catch (err) {
    console.error('[Claim Warranty Error]', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/customer/lookup (Pencarian data member terdaftar untuk auto-fill formulir)
router.get('/lookup', async (req, res) => {
  try {
    const identifier = (req.query.identifier || req.query.phone || '').trim().toLowerCase();
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Nomor WhatsApp atau Email wajib diisi.' });
    }
    const registeredCust = findCustomerByIdentifier(identifier);
    if (!registeredCust) {
      return res.status(404).json({ success: false, message: 'Pelanggan belum terdaftar.' });
    }
    res.json({
      success: true,
      customer: {
        name: registeredCust.name,
        whatsapp: registeredCust.whatsapp,
        email: registeredCust.email || '',
        district: registeredCust.district || 'Malang',
        referredByMitra: registeredCust.referredByMitra || ''
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Status Database Pelanggan
router.get('/database-status', async (req, res) => {
  const customers = getAllCustomers();
  res.json({
    success: true,
    mode: 'database_mode',
    totalCustomersCount: customers.length
  });
});

// GET /api/customer/list - Daftar semua akun pelanggan untuk admin
router.get('/list', async (req, res) => {
  try {
    await refreshCustomersFromDb();
    const customers = getAllCustomers();
    const orders = getAllOrders();

    const formatted = customers.map(c => {
      const custPhone = normalizePhone(c.whatsapp || c.phone || '');
      const custEmail = String(c.email || '').toLowerCase();
      const custOrders = orders.filter(o => {
        const oPhone = normalizePhone(o.whatsapp || o.phone || o.customerWa || '');
        const oEmail = String(o.email || o.customerEmail || '').toLowerCase();
        return (custPhone && oPhone && phonesMatch(custPhone, oPhone)) ||
               (custEmail && oEmail && custEmail === oEmail) ||
               (o.customerId && o.customerId === c.id);
      });

      const totalSpent = custOrders.reduce((sum, o) => sum + (Number(o.price || o.totalAmount || o.paidAmount) || 0), 0);

      return {
        id: c.id,
        name: c.name,
        username: c.username || `cust_${(c.whatsapp || c.id || '').replace(/\D/g, '')}`,
        whatsapp: c.whatsapp,
        phone: c.whatsapp,
        email: c.email || '',
        district: c.district || 'Kota Malang',
        password: c.pin || c.passwordHash || '',
        plainPassword: c.plainPassword || (c.pin && !String(c.pin).startsWith('$2') ? c.pin : ''),
        isPasswordHashed: Boolean((c.pin && String(c.pin).startsWith('$2')) || (c.passwordHash && String(c.passwordHash).startsWith('$2'))),
        referredByMitra: c.referredByMitra || '',
        registeredAt: c.registeredAt || 'Baru Terdaftar',
        registeredVia: c.registeredVia || 'Web',
        status: c.status || 'Aktif',
        ordersCount: custOrders.length,
        totalSpent,
        orders: custOrders.slice(0, 5).map(o => ({
          id: o.id,
          phoneType: o.phoneType,
          status: o.status,
          price: o.price,
          createdAt: o.createdAt
        }))
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

// PATCH /api/customer/:id - Ubah / edit data pelanggan oleh admin
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    const updated = await updateCustomerById(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: `Pelanggan dengan ID "${id}" tidak ditemukan.` });
    }
    res.json({
      success: true,
      message: `Data pelanggan "${updated.name}" berhasil diperbarui.`,
      data: updated
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/customer/logout
router.post('/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'ngalam_customer_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
  res.json({
    success: true,
    message: 'Berhasil keluar dari akun member pelanggan.'
  });
});

// ============================================================
// GOOGLE OAUTH 2.0 & CUSTOMER SESSION
// ============================================================

// GET /api/customer/auth/google
// Mulai login Google. Tambahkan URL ini sebagai tombol "Masuk dengan Google".
router.get('/auth/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.redirect(`${getBaseUrl(req)}/login?auth=google&error=google_not_configured`);
  }

  cleanupOAuthStates();
  const state = crypto.randomBytes(24).toString('hex');
  OAUTH_STATES.set(state, Date.now());
  res.setHeader('Set-Cookie', `ngalam_oauth_state=${state}; Path=/; Max-Age=600; HttpOnly; SameSite=Lax`);

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

// GET /api/customer/auth/google/callback
// Callback URL resmi yang didaftarkan di Google Cloud Console.
router.get('/auth/google/callback', async (req, res) => {
  const frontendBase = getBaseUrl(req);
  const failRedirect = (reason) => res.redirect(`${frontendBase}/login?auth=google&error=${encodeURIComponent(reason)}`);

  try {
    const { code, state, error } = req.query;
    if (error) return failRedirect(error);
    if (!code) return failRedirect('missing_code');
    const cookieState = parseAuthCookies(req).ngalam_oauth_state;
    const stateIsValid = Boolean(state) && (OAUTH_STATES.has(state) || cookieState === state);
    if (!stateIsValid) return failRedirect('invalid_state');
    OAUTH_STATES.delete(state);
    res.setHeader('Set-Cookie', 'ngalam_oauth_state=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');

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
    const linkedUser = userService.findUser(profileEmail);

    if (linkedUser && !isMitraRole(linkedUser.role) && !isCustomerRole(linkedUser.role)) {
      return failRedirect('staff_account_exists');
    }

    if (linkedUser && isMitraRole(linkedUser.role)) {
      const jwtInfo = generateToken({
        customerId: linkedUser.id,
        userId: linkedUser.id,
        name: linkedUser.name,
        username: linkedUser.username,
        whatsapp: linkedUser.phone || '',
        email: linkedUser.email || profileEmail,
        role: 'customer',
        accountType: 'mitra',
        mitraId: linkedUser.id
      }, true);
      setCustomerTokenCookie(res, jwtInfo.token, jwtInfo.maxAge);
      return res.redirect(`${frontendBase}/login?auth=google${linkedUser.phone ? '' : '&needsPhone=1'}`);
    }

    const cust = await upsertGoogleCustomer({
      googleId: profile.sub || '',
      email: profileEmail,
      name: profile.name || '',
      avatar: profile.picture || ''
    });

    const jwtInfo = generateToken({
      customerId: cust.id || cust.whatsapp || cust.email,
      name: cust.name,
      whatsapp: cust.whatsapp || '',
      email: cust.email || '',
      role: 'customer',
      accountType: 'customer'
    }, true);

    setCustomerTokenCookie(res, jwtInfo.token, jwtInfo.maxAge);
    res.redirect(`${frontendBase}/login?auth=google${cust.whatsapp ? '' : '&needsPhone=1'}`);
  } catch (err) {
    console.error('[Google OAuth] Callback error:', err.message);
    return failRedirect('server_error');
  }
});

// GET /api/customer/me - Ambil sesi member dari cookie / token (dipakai setelah redirect OAuth)
router.get('/me', async (req, res) => {
  try {
    const token = getCustomerToken(req);
    const payload = verifyToken(token);
    if (!payload || payload.role !== 'customer') {
      return res.status(401).json({
        success: false,
        code: 'SESSION_INVALID',
        message: 'Sesi member tidak valid atau sudah kedaluwarsa. Silakan login ulang.'
      });
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const maxAge = payload.exp ? Math.max(0, payload.exp - nowSec) : 86400;

    if (payload.accountType === 'mitra') {
      await userService.refreshUsersFromDb();
      const mitra = findMitraById(payload.mitraId || payload.customerId || payload.username);
      if (!mitra) {
        return res.status(404).json({
          success: false,
          code: 'MITRA_ACCOUNT_NOT_FOUND',
          message: 'Akun mitra untuk sesi ini tidak ditemukan.'
        });
      }
      const matchedOrders = await getCombinedCustomerOrders(mitra.phone || mitra.email || '', mitra.phone || '', mitra.email || '');
      const formattedList = matchedOrders.map(formatCustomerOrder);
      const customerSession = buildCustomerSession(buildMitraCustomerData(mitra), { token, expiresIn: '', maxAge }, payload.rememberMe, {
        totalOrders: formattedList.length,
        activeOrders: formattedList.filter((order) => order.step < 5).length,
        completedOrders: formattedList.filter((order) => order.step >= 5).length,
        activeWarranties: formattedList.filter((order) => order.warranty && order.warranty.isActive).length
      });
      return res.json({ success: true, customer: customerSession });
    }

    const cust = findCustomerByIdentifier(payload.customerId) ||
      findCustomerByEmail(payload.email) ||
      findCustomerByIdentifier(payload.whatsapp);

    if (!cust) {
      return res.status(404).json({
        success: false,
        code: 'CUSTOMER_ACCOUNT_NOT_FOUND',
        message: 'Akun pelanggan tidak ditemukan.'
      });
    }

    const customerSession = buildCustomerSession(cust, { token, expiresIn: '', maxAge }, payload.rememberMe);
    res.json({ success: true, customer: customerSession });
  } catch (err) {
    return sendAuthError(res, err, 'Gagal memuat sesi pelanggan.');
  }
});

// POST /api/customer/complete-profile - Nomor telepon wajib dilengkapi setelah registrasi Google
router.post('/complete-profile', async (req, res) => {
  try {
    const token = getCustomerToken(req);
    const payload = verifyToken(token);
    if (!payload || payload.role !== 'customer') {
      return res.status(401).json({
        success: false,
        code: 'SESSION_INVALID',
        message: 'Sesi member tidak valid. Silakan login ulang.'
      });
    }

    const rawPhone = String(req.body.whatsapp || req.body.phone || '').trim();
    const digits = normalizePhone(rawPhone);
    if (!digits || digits.length < 9 || digits.length > 15) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_PHONE',
        field: 'whatsapp',
        message: 'Nomor WhatsApp aktif wajib diisi dengan format yang benar.'
      });
    }

    if (payload.accountType === 'mitra') {
      await userService.refreshUsersFromDb();
      const mitra = findMitraById(payload.mitraId || payload.customerId || payload.username);
      if (!mitra) {
        return res.status(404).json({
          success: false,
          code: 'MITRA_ACCOUNT_NOT_FOUND',
          message: 'Akun mitra tidak ditemukan.'
        });
      }
      const duplicateUser = userService.getAllUsers().find((user) =>
        String(user.id || '') !== String(mitra.id || '') && phonesMatch(user.phone, digits)
      );
      if (duplicateUser) {
        return res.status(409).json({
          success: false,
          code: 'PHONE_TAKEN',
          field: 'whatsapp',
          message: 'Nomor WhatsApp sudah digunakan akun lain.'
        });
      }
      if (findCustomerByPhone(digits)) {
        return res.status(409).json({
          success: false,
          code: 'PHONE_TAKEN',
          field: 'whatsapp',
          message: 'Nomor WhatsApp sudah terdaftar sebagai akun pelanggan.'
        });
      }

      mitra.phone = digits;
      await userService.saveMitraUsers(userService.getMitraUsers().map((user) =>
        String(user.id) === String(mitra.id) ? mitra : user
      ));
      const jwtInfo = generateToken({
        customerId: mitra.id,
        userId: mitra.id,
        name: mitra.name,
        username: mitra.username,
        whatsapp: mitra.phone,
        email: mitra.email || '',
        role: 'customer',
        accountType: 'mitra',
        mitraId: mitra.id
      }, true);
      setCustomerTokenCookie(res, jwtInfo.token, jwtInfo.maxAge);
      return res.json({
        success: true,
        message: 'Nomor WhatsApp akun mitra berhasil disimpan.',
        customer: buildCustomerSession(buildMitraCustomerData(mitra), jwtInfo, true)
      });
    }

    const cust = findCustomerByIdentifier(payload.customerId) ||
      findCustomerByEmail(payload.email);
    if (!cust) {
      return res.status(404).json({
        success: false,
        code: 'CUSTOMER_ACCOUNT_NOT_FOUND',
        message: 'Akun pelanggan tidak ditemukan.'
      });
    }

    const duplicate = findCustomerByPhone(digits);
    if (duplicate && String(duplicate.id) !== String(cust.id)) {
      return res.status(409).json({
        success: false,
        code: 'PHONE_TAKEN',
        field: 'whatsapp',
        message: 'Nomor WhatsApp ini sudah digunakan akun pelanggan lain.'
      });
    }
    await userService.refreshUsersFromDb();
    const staffOrMitra = userService.findUser(digits);
    if (staffOrMitra && !isCustomerRole(staffOrMitra.role)) {
      return res.status(409).json({
        success: false,
        code: isMitraRole(staffOrMitra.role) ? 'MITRA_ACCOUNT_EXISTS' : 'STAFF_ACCOUNT_EXISTS',
        field: 'whatsapp',
        message: isMitraRole(staffOrMitra.role)
          ? 'Nomor WhatsApp ini terdaftar sebagai mitra. Masuk melalui akun mitra Anda.'
          : 'Nomor WhatsApp ini terdaftar sebagai akun staf.'
      });
    }

    const updated = await updateCustomerById(cust.id, {
      whatsapp: digits,
      district: (req.body.district || cust.district || 'Malang').trim()
    });

    const jwtInfo = generateToken({
      customerId: updated.id || updated.whatsapp,
      name: updated.name,
      whatsapp: updated.whatsapp,
      email: updated.email,
      role: 'customer',
      accountType: 'customer'
    }, true);

    setCustomerTokenCookie(res, jwtInfo.token, jwtInfo.maxAge);
    res.json({
      success: true,
      message: 'Nomor WhatsApp berhasil disimpan.',
      customer: buildCustomerSession(updated, jwtInfo, true)
    });
  } catch (err) {
    return sendAuthError(res, err, 'Gagal melengkapi profil pelanggan.');
  }
});

module.exports = router;
module.exports.formatCustomerOrder = formatCustomerOrder;
module.exports.calculateWarranty = calculateWarranty;

