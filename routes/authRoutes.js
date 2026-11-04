/**
 * NGALAM FIX PRO - Auth Routes (Internal Staff: Admin, Teknisi, Mitra Ojol)
 * Dedicated routes for staff authentication and sessions.
 */

const express = require('express');
const router = express.Router();
const {
  loginUser,
  verifySession,
  logoutUser,
  getUsers,
} = require('../services/authService');
const { sendAuthError } = require('../src/utils/authError');

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



module.exports = router;
