/**
 * NGALAM FIX PRO - Auth Routes (Internal Staff: Admin, Teknisi, Mitra Ojol)
 * Dedicated routes for staff authentication and sessions.
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const {
  loginUser,
  verifySession,
  logoutUser,
  getUsers,
} = require('../services/authService');
const { sendAuthError } = require('../src/utils/authError');
const unregisteredUserService = require('../services/unregisteredUserService');
const userService = require('../services/userService');

// Helper to parse cookies from request
function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      if (parts.length >= 2) {
        const key = parts.shift().trim();
        list[key] = decodeURIComponent(parts.join('='));
      }
    });
  }
  return list;
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const identifier = req.body.identifier || req.body.username || req.body.email || '';
    const password = req.body.password || '';
    const role = req.body.role || '';
    const referralCode = req.body.referralCode || req.body.code || '';
    const rememberMe = req.body.rememberMe === true || req.body.rememberMe === 'true' || req.body.remember === true;

    const result = await loginUser({ identifier, password, role, referralCode, rememberMe });
    const maxAge = result.user.maxAge || (rememberMe ? 2592000 : 86400);

    res.setHeader('Set-Cookie', `ngalam_token=${result.user.token}; Path=/; Max-Age=${maxAge}; SameSite=Lax`);
    res.json(result);
  } catch (err) {
    return sendAuthError(res, err, 'Login gagal. Periksa kredensial Anda.');
  }
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const cookies = parseCookies(req);
    const token = authHeader.replace(/^Bearer\s+/i, '') || req.query.token || cookies.ngalam_token;
    const session = verifySession(token);
    if (!session) {
      return sendAuthError(res, {
        status: 401,
        code: 'SESSION_INVALID',
        message: 'Sesi login tidak valid atau sudah kedaluwarsa. Silakan login kembali.'
      });
    }
    res.json({ success: true, user: session });
  } catch (err) {
    return sendAuthError(res, err, 'Gagal memeriksa sesi login.');
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const cookies = parseCookies(req);
    const token = authHeader.replace(/^Bearer\s+/i, '') || req.body.token || cookies.ngalam_token;
    const username = req.body.username || '';
    await logoutUser(token, username);
    res.setHeader('Set-Cookie', `ngalam_token=; Path=/; Max-Age=0; SameSite=Lax`);
    res.json({ success: true, message: 'Berhasil keluar dari akun.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/setup-status
router.get('/setup-status', (req, res) => {
  try {
    const users = getUsers();
    const hasAdmin = users.some(u => u.role === 'admin' || u.role === 'owner' || u.role === 'kasir');
    res.json({
      success: true,
      hasAdmin,
      totalUsers: users.length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/register-initial - Landing modal form submission
router.post('/register-initial', async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        code: 'NAME_REQUIRED',
        field: 'name',
        message: 'Nama lengkap wajib diisi.'
      });
    }
    
    if (!phone || !phone.trim()) {
      return res.status(400).json({
        success: false,
        code: 'PHONE_REQUIRED',
        field: 'phone',
        message: 'Nomor WhatsApp wajib diisi.'
      });
    }
    
    const refCode = req.body.ref || req.body.referredByMitra || '';
    const cleanRefCode = refCode.trim().toUpperCase();
    
    const unregUser = await unregisteredUserService.createUnregisteredUser({
      name: name.trim(),
      phone: phone.trim(),
      referredByMitra: cleanRefCode
    });
    
    res.json({
      success: true,
      message: 'Data berhasil disimpan. Silakan lanjutkan dengan Google untuk verifikasi akun.',
      tempUserId: unregUser.id,
      referralCode: unregUser.referralCode,
      referredByMitra: unregUser.referredByMitra
    });
  } catch (err) {
    console.error('[Register Initial] Error:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan saat menyimpan data. Silakan coba lagi.',
      error: err.message 
    });
  }
});

// GET /api/auth/admin/pre-created-mitra - List all pre-created mitra
router.get('/admin/pre-created-mitra', async (req, res) => {
  try {
    await userService.refreshUsersFromDb();
    const allUsers = userService.getAllUsers();
    const preCreatedMitra = allUsers
      .filter(u => u.isPreCreated === true || u.role === 'mitra')
      .map(m => ({
        id: m.id,
        username: m.username,
        name: m.name,
        email: m.email,
        phone: m.phone,
        referralCode: m.referralCode,
        status: m.status,
        isPreCreated: m.isPreCreated,
        claimed: !m.isPreCreated && m.googleId,
        claimedAt: m.claimedAt,
        qrCodeUrl: `${req.protocol}://${req.get('host')}/qr-codes/${m.referralCode}.png`,
        affiliateUrl: `${req.protocol}://${req.get('host')}/?ref=${m.referralCode}`
      }))
      .sort((a, b) => {
        const aNum = parseInt(a.referralCode.replace(/\D/g, ''));
        const bNum = parseInt(b.referralCode.replace(/\D/g, ''));
        return aNum - bNum;
      });
    
    res.json({
      success: true,
      count: preCreatedMitra.length,
      data: preCreatedMitra
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/admin/qr-batch-download - Download ZIP
router.get('/admin/qr-batch-download', (req, res) => {
  const zipPath = path.join(__dirname, '..', 'public', 'qr-codes', 'qr-codes-batch.zip');
  if (fs.existsSync(zipPath)) {
    res.download(zipPath);
  } else {
    res.status(404).json({ success: false, message: 'ZIP file not found. Run QR generation script first.' });
  }
});

// GET /api/auth/admin/qr-pdf-download - Download PDF
router.get('/admin/qr-pdf-download', (req, res) => {
  const pdfPath = path.join(__dirname, '..', 'public', 'qr-codes', 'qr-codes-print-sheet.pdf');
  if (fs.existsSync(pdfPath)) {
    res.download(pdfPath);
  } else {
    res.status(404).json({ success: false, message: 'PDF file not found. Run QR generation script first.' });
  }
});

module.exports = router;
