require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { verifySession } = require('./services/authService');
const { initPostgresDatabase } = require('./services/postgresService');

// Modular Route Handlers (Separated per domain)
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const orderRoutes = require('./routes/orderRoutes');
const technicianRoutes = require('./routes/technicianRoutes');
const financeRoutes = require('./routes/financeRoutes');
const promoRoutes = require('./routes/promoRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const mitraRoutes = require('./routes/mitraRoutes');
const exportRoutes = require('./routes/exportRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Gracefully handle malformed JSON payload errors without crashing
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ success: false, error: 'Format JSON request body tidak valid.' });
  }
  next(err);
});

// Helper to parse HTTP request cookies
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

// Check if request is for static asset file (js, css, images, etc.)
function isAssetRequest(urlPath) {
  return /\.(js|css|png|jpg|jpeg|svg|webp|ico|json|woff2?|ttf|map)$/i.test(urlPath);
}

// ==========================================
// AUTH GUARD MIDDLEWARES FOR ADMIN
// ==========================================
app.use((req, res, next) => {
  const pathname = (req.path || '').toLowerCase();

  // Allow dedicated admin & manager login page directly
  if (pathname === '/admin/login' || pathname === '/admin/login.html') {
    return next();
  }

  const isAdminPage =
    pathname === '/admin' ||
    pathname === '/admin/' ||
    pathname === '/admin/index.html' ||
    pathname === '/admin.html';

  if (isAdminPage && !isAssetRequest(pathname)) {
    const cookies = parseCookies(req);
    const token = cookies.ngalam_token || req.query.token;
    const session = verifySession(token);
    if (!session || (session.role !== 'admin' && session.role !== 'owner' && session.role !== 'kasir')) {
      const redirectUrl = req.originalUrl || '/admin/index.html';
      return res.redirect(`/admin/login.html?reason=required&redirect=${encodeURIComponent(redirectUrl)}`);
    }
  }
  next();
});

// ==========================================
// STATIC ASSET SERVING
// ==========================================
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'public', 'css')));
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));
app.use('/js', express.static(path.join(__dirname, 'public', 'js')));

// Handle relative static assets from named routes like /layanan/css/style.css
app.use('/:route/css', express.static(path.join(__dirname, 'public', 'css')));
app.use('/:route/images', express.static(path.join(__dirname, 'public', 'images')));
app.use('/:route/js', express.static(path.join(__dirname, 'public', 'js')));

// ==========================================
// CLEAN PAGE ROUTES (SEPARATED & MODULAR)
// ==========================================

// 1. Beranda Publik
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 2. Layanan Servis
app.get(['/layanan', '/layanan.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'layanan', 'index.html'));
});

// 3. Pemesanan Servis Online
app.get(['/pesan-servis', '/pesan-servis.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pesan-servis', 'index.html'));
});

// 4. Kontak & Lokasi Workshop
app.get(['/kontak', '/kontak.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'kontak', 'index.html'));
});

// 5. Khusus Pelacakan Status Unit Servis (Dedicated Pure Tracking)
app.get(['/lacak', '/lacak.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'lacak', 'index.html'));
});

// 6. Khusus Login & Registrasi Pelanggan (Dedicated Customer Member Auth)
app.get(['/login', '/login.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login', 'index.html'));
});

// 7. Khusus Login Staf Admin & Kasir (Dedicated Admin Login)
app.get(['/admin/login', '/admin/login.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'login.html'));
});

// 8. Dashboard Admin & Kasir (Protected)
app.get(['/admin', '/admin.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// 8b. Halaman Khusus Ekspor Riwayat Transaksi ke Excel (Khusus Role Admin Super User)
app.get(['/admin/export', '/admin/export.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'export.html'));
});

// 9. Khusus Login Teknisi Lab & Kurir Ojol (Dedicated Technician Login)
app.get(['/teknisi/login', '/teknisi/login.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'teknisi', 'login.html'));
});

// 10. Dashboard Meja Kerja Teknisi & Armada Ojol
app.get(['/teknisi', '/teknisi.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'teknisi', 'index.html'));
});

// 11. Portal Khusus Mitra Driver, Ojol & Afiliasi QR Code
app.get(['/mitra', '/mitra.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'mitra', 'index.html'));
});

// ==========================================
// MOUNT MODULAR API ROUTERS (SEPARATED FILES)
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/mitra', mitraRoutes);
app.use('/api', promoRoutes);
app.use('/api', chatbotRoutes);

const db = require('./services/db');

// Database status badge endpoint (Dynamic live PostgreSQL status)
app.get('/api/database/status', async (req, res) => {
  try {
    const status = await db.testConnection();
    res.json({
      success: true,
      ...status,
      message: status.connected 
        ? `Terhubung ke database PostgreSQL "${status.database}".` 
        : `PostgreSQL belum terhubung (${status.error || 'Cek kredensial .env'}). Sistem berjalan dengan penyimpanan lokal.`
    });
  } catch (err) {
    res.json({
      success: true,
      connected: false,
      mode: 'fallback',
      message: 'Sistem aktif dalam mode penyimpanan data lokal.'
    });
  }
});

// Fallback for API 404
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: `Endpoint API "${req.originalUrl}" tidak ditemukan.` });
});

// Global Express Error Handler
app.use((err, req, res, next) => {
  console.error('[Internal Server Error]', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ success: false, error: 'Terjadi kesalahan internal pada server.' });
});

// Process-level unhandled exception and rejection guards
process.on('uncaughtException', (err) => {
  console.error('[Process Uncaught Exception]', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process Unhandled Rejection]', reason);
});

// Start Express Server with automatic fallback if port is in use
function startServer(portToTry) {
  const server = app.listen(portToTry, async () => {
    console.log(`\n======================================================`);
    console.log(`🚀 NGALAM FIX PRO - Modular Server Berjalan!`);
    console.log(`📡 URL Website: http://localhost:${portToTry}`);
    console.log(`📑 Admin Dashboard: http://localhost:${portToTry}/admin`);
    console.log(`🔐 Admin Login: http://localhost:${portToTry}/admin/login`);
    console.log(`🔧 Portal Teknisi: http://localhost:${portToTry}/teknisi`);
    console.log(`🛠️ Teknisi Login: http://localhost:${portToTry}/teknisi/login`);
    console.log(`🔍 Lacak Unit: http://localhost:${portToTry}/lacak`);
    console.log(`👤 Login Pelanggan: http://localhost:${portToTry}/login`);
    console.log(`======================================================\n`);

    // Inisialisasi Database PostgreSQL & Skema Tabel
    try {
      await initPostgresDatabase();
    } catch (pgErr) {
      console.warn('[PostgreSQL] Inisialisasi awal database:', pgErr.message);
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = Number(portToTry) + 1;
      console.warn(`[Server] Port ${portToTry} sedang digunakan. Mencoba port alternatif ${nextPort}...`);
      startServer(nextPort);
    } else {
      console.error('[Server Error]', err);
    }
  });
}

startServer(PORT);
