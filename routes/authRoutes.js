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
  getAdminReferralCode,
} = require('../services/authService');

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
    const result = await loginUser({ identifier, password, role, referralCode });
    res.setHeader('Set-Cookie', `ngalam_token=${result.user.token}; Path=/; Max-Age=86400; SameSite=Lax`);
    res.json(result);
  } catch (err) {
    res.status(401).json({ success: false, error: err.message, message: err.message });
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
      return res.status(401).json({ success: false, error: 'Sesi login tidak valid atau sudah kedaluwarsa.' });
    }
    res.json({ success: true, user: session });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const cookies = parseCookies(req);
    const token = authHeader.replace(/^Bearer\s+/i, '') || req.body.token || cookies.ngalam_token;
    const username = req.body.username || '';
    logoutUser(token, username);
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

// POST /api/auth/register-admin (Pendaftaran Akun Kasir / Admin Super User Baru)
router.post('/register-admin', async (req, res) => {
  const userService = require('../services/userService');

  try {
    const { username, password, name, email = '', phone = '', role = 'kasir', referralCode = '' } = req.body;
    if (!username || !password || !name) {
      return res.status(400).json({ success: false, message: 'Nama lengkap, username, dan kata sandi wajib diisi.' });
    }

    const isKasir = (role === 'kasir');
    if (!isKasir) {
      const cleanRef = (referralCode || '').trim();
      const validRef = getAdminReferralCode();
      if (!cleanRef) {
        return res.status(400).json({ success: false, message: 'Kode Referral Otorisasi Super Admin wajib diisi untuk peran Admin.' });
      }
      if (cleanRef.toUpperCase() !== validRef.toUpperCase()) {
        return res.status(403).json({ success: false, message: 'Kode Referral Otorisasi Super Admin salah! Akses pendaftaran Admin ditolak.' });
      }
    }

    const adminUsers = userService.getAdminUsers();
    const cleanUser = username.trim().toLowerCase();
    const existingIndex = adminUsers.findIndex(u => (u.username || '').toLowerCase() === cleanUser);

    if (existingIndex !== -1) {
      if (!isKasir) {
        // Pembaruan/upgrade akun yang ada menjadi Admin Super User dengan otorisasi resmi
        adminUsers[existingIndex].name = name.trim();
        adminUsers[existingIndex].password = password.trim();
        adminUsers[existingIndex].role = 'admin';
        adminUsers[existingIndex].category = 'Owner & Super Admin Lab';
        adminUsers[existingIndex].avatar = '👑';
        if (email) adminUsers[existingIndex].email = email.trim().toLowerCase();
        if (phone) adminUsers[existingIndex].phone = phone.trim();
        adminUsers[existingIndex].referralCode = getAdminReferralCode();
        userService.saveAdminUsers(adminUsers);
        return res.status(200).json({
          success: true,
          message: `Akun Admin (Super User) "${adminUsers[existingIndex].name}" berhasil diperbarui di database! Silakan login.`,
          user: {
            id: adminUsers[existingIndex].id,
            username: adminUsers[existingIndex].username,
            name: adminUsers[existingIndex].name,
            role: adminUsers[existingIndex].role
          }
        });
      }
      return res.status(409).json({ success: false, message: `Username "${cleanUser}" sudah digunakan.` });
    }

    const newStaff = {
      id: isKasir ? `USR-KASIR-${Date.now()}` : `USR-ADMIN-${Date.now()}`,
      username: cleanUser,
      email: (email || '').trim().toLowerCase(),
      password: password.trim(),
      name: name.trim(),
      role: isKasir ? 'kasir' : 'admin',
      avatar: isKasir ? '👩‍💼' : '👑',
      phone: (phone || '').trim(),
      desk: isKasir ? 'Meja 1 - Front Desk & Kasir' : 'Ruang Workshop Manager',
      specialty: isKasir ? 'Penerimaan Kerusakan Offline, Bagi Antrean & Cetak Struk' : 'Super User Kontrol Sistem & Keuangan'
    };

    if (!isKasir) {
      newStaff.referralCode = getAdminReferralCode();
    }

    adminUsers.push(newStaff);
    userService.saveAdminUsers(adminUsers);

    const roleLabel = isKasir ? 'Kasir Meja 1' : 'Admin (Super User)';
    res.status(201).json({
      success: true,
      message: `Akun ${roleLabel} "${newStaff.name}" berhasil dibuat di database! Silakan login.`,
      user: {
        id: newStaff.id,
        username: newStaff.username,
        name: newStaff.name,
        role: newStaff.role
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
