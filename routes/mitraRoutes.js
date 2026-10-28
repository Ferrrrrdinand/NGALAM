/**
 * NGALAM FIX PRO - Mitra Driver, Ojol & Toko Rekanan Affiliate Routes
 * Handles Mitra registration, automatic unique affiliate code generation,
 * dynamic scannable QR Codes, and commission tracking integrated with Google Sheets.
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const {
  readUsers,
  authDriverViaGoogleSheets,
  generateMitraCode,
  syncDriversToGoogleSheets,
  readOrders,
  getConfig
} = require('../services/financeService');

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');

function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[MitraRoutes] Error writing users.json:', err.message);
    return false;
  }
}

/**
 * Generate full affiliate link and QR code image URL
 */
function buildMitraAffiliateDetails(req, refCode) {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol || 'http';
  const affiliateUrl = `${protocol}://${host}/pesan-servis/index.html?ref=${encodeURIComponent(refCode)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&margin=12&data=${encodeURIComponent(affiliateUrl)}`;

  return {
    affiliateUrl,
    qrCodeUrl
  };
}

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
      customCode = ''
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama lengkap mitra wajib diisi.' });
    }
    if (!username || !username.trim()) {
      return res.status(400).json({ success: false, message: 'Username akun mitra wajib diisi.' });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ success: false, message: 'Kata sandi mitra wajib diisi.' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Nomor WhatsApp aktif wajib diisi.' });
    }

    const cleanUser = username.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const users = readUsers();

    // Cek apakah username atau no telp sudah ada
    const existing = users.find(u =>
      (u.username || '').toLowerCase() === cleanUser ||
      (u.phone || '').replace(/\D/g, '') === cleanPhone.replace(/\D/g, '')
    );

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Username atau Nomor WhatsApp sudah terdaftar dengan nama "${existing.name}". Silakan gunakan akun yang ada atau masuk.`
      });
    }

    // Auto-generate Unique Affiliate Referral Code
    let refCode = (customCode || '').trim().toUpperCase();
    if (!refCode) {
      refCode = generateMitraCode(name, cleanUser);
    }
    // Pastikan benar-benar unik
    while (users.some(u => (u.referralCode || '').toUpperCase() === refCode)) {
      refCode = generateMitraCode(name, cleanUser);
    }

    const isBengkel = category.toLowerCase().includes('bengkel') || category.toLowerCase().includes('toko');
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

    const newMitra = {
      id: `USR-MITRA-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(1000 + Math.random() * 9000))}`,
      username: cleanUser,
      password: password.trim(),
      name: name.trim(),
      role: isBengkel ? 'mitra' : 'ojol',
      category: category.trim(),
      avatar: isBengkel ? '🏪' : '🛵',
      phone: cleanPhone,
      email: (email || '').trim().toLowerCase(),
      referralCode: refCode,
      commissionRate: 10, // 10% komisi per servis
      totalCommission: 0,
      status: 'Siaga / Aktif',
      lastActive: `${dateStr}, Baru Terdaftar`
    };

    users.push(newMitra);
    saveUsers(users);

    // Sinkronkan langsung akun mitra baru ke Google Spreadsheet (Sheet: MitraDriver)
    try {
      await syncDriversToGoogleSheets();
    } catch (sheetSyncErr) {
      console.warn('[MitraRoutes] Background sync driver to Google Sheets warning:', sheetSyncErr.message);
    }

    const details = buildMitraAffiliateDetails(req, refCode);

    res.status(201).json({
      success: true,
      message: `Pendaftaran Mitra berhasil! Kode unik afiliasi Anda "${refCode}" telah aktif dan tersinkronkan ke Google Spreadsheet MitraDriver.`,
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

// POST /api/mitra/login - Login Mitra dengan Verifikasi Ketat ke Google Spreadsheet
router.post('/login', async (req, res) => {
  try {
    const { identifier = '', password = '' } = req.body;
    const cleanId = (identifier || '').trim();
    const cleanPass = (password || '').trim();

    if (!cleanId) {
      return res.status(400).json({ success: false, message: 'Username, WhatsApp, atau Email wajib diisi.' });
    }
    if (!cleanPass) {
      return res.status(400).json({ success: false, message: 'Kata sandi wajib diisi.' });
    }

    // Cek ke Google Spreadsheet (MitraDriver)
    const authResult = await authDriverViaGoogleSheets(cleanId, cleanPass);

    if (!authResult || !authResult.success) {
      return res.status(403).json({
        success: false,
        message: (authResult && authResult.message) || 'Akses Ditolak: Akun mitra tidak ditemukan di Google Spreadsheet (MitraDriver).'
      });
    }

    const driver = authResult.driver;
    const details = buildMitraAffiliateDetails(req, driver.referralCode);

    // Ambil riwayat order yang menggunakan kode afiliasi mitra ini
    const allOrders = readOrders();
    const myReferredOrders = allOrders.filter(o =>
      (o.affiliateRef && o.affiliateRef.toUpperCase() === driver.referralCode.toUpperCase()) ||
      (o.partnerName && o.partnerName.toLowerCase().includes(driver.name.toLowerCase()))
    );

    res.json({
      success: true,
      message: authResult.message || `Selamat datang Mitra, ${driver.name}!`,
      token: 'MTR-TOKEN-' + crypto.randomBytes(16).toString('hex'),
      driver: {
        ...driver,
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

module.exports = router;
