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
const { hashPassword } = require('../src/utils/security');

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

    const cleanRef = (referralCode || '').trim();
    const validRef = getAdminReferralCode();
    if (!cleanRef || cleanRef.toUpperCase() !== validRef.toUpperCase()) {
      return res.status(403).json({ success: false, message: 'Kode Otorisasi Super Admin salah atau tidak disertakan! Akses ditolak.' });
    }

    const isKasir = (role === 'kasir');
    const cleanUser = username.trim().toLowerCase();

    if (isKasir) {
      const kasirUsers = userService.getKasirUsers();
      const existingKasirIndex = kasirUsers.findIndex(u => (u.username || '').toLowerCase() === cleanUser);
      if (existingKasirIndex !== -1) {
        kasirUsers[existingKasirIndex].name = name.trim();
        kasirUsers[existingKasirIndex].password = hashPassword(password.trim());
        if (email) kasirUsers[existingKasirIndex].email = email.trim().toLowerCase();
        if (phone) kasirUsers[existingKasirIndex].phone = phone.trim();
        userService.saveKasirUsers(kasirUsers);
        return res.status(200).json({
          success: true,
          message: `Profil akun Kasir "${kasirUsers[existingKasirIndex].name}" berhasil diperbarui. Silakan login.`,
          user: {
            id: kasirUsers[existingKasirIndex].id,
            username: kasirUsers[existingKasirIndex].username,
            name: kasirUsers[existingKasirIndex].name,
            role: 'kasir'
          }
        });
      }

      const newKasir = {
        id: `USR-KASIR-${Date.now()}`,
        username: cleanUser,
        email: (email || '').trim().toLowerCase(),
        password: hashPassword(password.trim()),
        name: name.trim(),
        role: 'kasir',
        avatar: 'kasir-badge',
        phone: (phone || '').trim(),
        desk: 'Meja 1 - Front Desk & Kasir',
        specialty: 'Penerimaan Kerusakan Offline, Bagi Antrean & Cetak Struk',
        referralCode: getAdminReferralCode()
      };
      kasirUsers.push(newKasir);
      userService.saveKasirUsers(kasirUsers);
      return res.status(201).json({
        success: true,
        message: `Akun Kasir Meja 1 "${newKasir.name}" berhasil dibuat di database! Silakan login.`,
        user: {
          id: newKasir.id,
          username: newKasir.username,
          name: newKasir.name,
          role: 'kasir'
        }
      });
    }

    const adminUsers = userService.getAdminUsers();
    const existingIndex = adminUsers.findIndex(u => (u.username || '').toLowerCase() === cleanUser);

    if (existingIndex !== -1) {
      // Pembaruan kata sandi / profil akun admin yang sudah ada (dengan otorisasi)
      adminUsers[existingIndex].name = name.trim();
      adminUsers[existingIndex].password = hashPassword(password.trim());
      adminUsers[existingIndex].role = 'admin';
      if (email) adminUsers[existingIndex].email = email.trim().toLowerCase();
      if (phone) adminUsers[existingIndex].phone = phone.trim();
      userService.saveAdminUsers(adminUsers);
      return res.status(200).json({
        success: true,
        message: `Profil akun Admin "${adminUsers[existingIndex].name}" berhasil diperbarui. Silakan login.`,
        user: {
          id: adminUsers[existingIndex].id,
          username: adminUsers[existingIndex].username,
          name: adminUsers[existingIndex].name,
          role: adminUsers[existingIndex].role
        }
      });
    }

    if (adminUsers.length >= 2) {
      return res.status(403).json({
        success: false,
        message: 'Batas maksimum akun Admin tercapai.'
      });
    }

    const newStaff = {
      id: `USR-ADMIN-${Date.now()}`,
      username: cleanUser,
      email: (email || '').trim().toLowerCase(),
      password: hashPassword(password.trim()),
      name: name.trim(),
      role: 'admin',
      avatar: 'crown-shield',
      phone: (phone || '').trim(),
      desk: 'Ruang Workshop Manager',
      specialty: 'Super User Kontrol Sistem & Keuangan',
      referralCode: getAdminReferralCode()
    };

    adminUsers.push(newStaff);
    userService.saveAdminUsers(adminUsers);

    res.status(201).json({
      success: true,
      message: `Akun Admin (Super User) "${newStaff.name}" berhasil dibuat di database! Silakan login.`,
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
