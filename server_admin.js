/**
 * NGALAM FIX PRO - Standalone Dedicated Admin & Workshop Manager Server
 * Can be hosted independently on a separate subdomain (e.g., admin.ngalamfixpro.com),
 * private network, or dedicated port (Default: 3001).
 * Completely isolated from public customer pages and technician/mitra portals.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { loginUser, verifySession, logoutUser, getUsers } = require('./services/authService');

// Modular Route Handlers
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const customerRoutes = require('./routes/customerRoutes');
const technicianRoutes = require('./routes/technicianRoutes');
const financeRoutes = require('./routes/financeRoutes');
const promoRoutes = require('./routes/promoRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const mitraRoutes = require('./routes/mitraRoutes');
const exportRoutes = require('./routes/exportRoutes');

const app = express();
const ADMIN_PORT = process.env.ADMIN_PORT || 3001;

// Middlewares
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

// Helper: parse HTTP request cookies
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

// Check if static asset
function isAssetRequest(urlPath) {
  return /\.(js|css|png|jpg|jpeg|svg|webp|ico|json|woff2?|ttf|map)$/i.test(urlPath);
}

// Serve public static assets
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));
app.use('/css', express.static(path.join(__dirname, 'public', 'css')));
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));
app.use('/js', express.static(path.join(__dirname, 'public', 'js')));

// ==========================================
// AUTH GUARD MIDDLEWARE (DEDICATED ADMIN ONLY)
// ==========================================
app.use((req, res, next) => {
  const pathname = (req.path || '').toLowerCase();

  // Allow static files and the login page itself
  if (
    pathname === '/login' ||
    pathname === '/login.html' ||
    pathname === '/admin/login' ||
    pathname === '/admin/login.html' ||
    pathname === '/teknisi/login' ||
    pathname === '/teknisi/login.html' ||
    pathname.startsWith('/lacak') ||
    pathname.startsWith('/teknisi') ||
    pathname.startsWith('/layanan') ||
    pathname.startsWith('/pesan-servis') ||
    pathname.startsWith('/kontak') ||
    pathname === '/' ||
    isAssetRequest(pathname) ||
    pathname.startsWith('/css/') ||
    pathname.startsWith('/js/') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/api/auth/login')
  ) {
    return next();
  }

  // Allow API routes to handle their own auth responses
  if (pathname.startsWith('/api/')) {
    return next();
  }

  // Check auth cookie or token for web dashboard pages
  const cookies = parseCookies(req);
  const token = cookies.ngalam_token || req.query.token;
  const session = verifySession(token);

  if (!session || (session.role !== 'admin' && session.role !== 'owner' && session.role !== 'kasir')) {
    const redirectUrl = req.originalUrl || '/';
    return res.redirect(`/login.html?reason=required&redirect=${encodeURIComponent(redirectUrl)}`);
  }

  next();
});

// Dedicated Admin & Workshop Web Routes
app.get(['/login', '/login.html', '/admin/login', '/admin/login.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'login.html'));
});

app.get(['/teknisi/login', '/teknisi/login.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'teknisi', 'login.html'));
});

app.get(['/teknisi', '/teknisi.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'teknisi', 'index.html'));
});

app.get(['/lacak', '/lacak.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'lacak', 'index.html'));
});

app.get(['/layanan', '/layanan.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'layanan', 'index.html'));
});

app.get(['/pesan-servis', '/pesan-servis.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pesan-servis', 'index.html'));
});

app.get(['/kontak', '/kontak.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'kontak', 'index.html'));
});

app.get(['/export', '/export.html', '/admin/export', '/admin/export.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'export.html'));
});

app.get(['/', '/index.html', '/admin', '/admin/index.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// ==========================================
// AUTHENTICATION ENDPOINTS (ADMIN & MANAGER)
// ==========================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password, role, referralCode } = req.body;
    const result = await loginUser({ identifier, password, role, referralCode });

    if (result.user.role !== 'admin' && result.user.role !== 'owner' && result.user.role !== 'kasir') {
      return res.status(403).json({
        success: false,
        error: 'Akses Ditolak: Server ini khusus dihosting untuk Admin Meja 1, Kasir, dan Workshop Manager.',
      });
    }

    res.setHeader('Set-Cookie', `ngalam_token=${result.user.token}; Path=/; Max-Age=86400; SameSite=Lax`);
    res.json(result);
  } catch (err) {
    res.status(401).json({ success: false, error: err.message, message: err.message });
  }
});

app.get('/api/auth/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const cookies = parseCookies(req);
    const token = authHeader.replace(/^Bearer\s+/i, '') || req.query.token || cookies.ngalam_token;
    const session = verifySession(token);
    if (!session || (session.role !== 'admin' && session.role !== 'owner' && session.role !== 'kasir')) {
      return res.status(401).json({ success: false, error: 'Sesi login tidak valid atau bukan staf admin / kasir.' });
    }
    res.json({ success: true, user: session });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const cookies = parseCookies(req);
    const token = authHeader.replace(/^Bearer\s+/i, '') || req.body.token || cookies.ngalam_token;
    logoutUser(token);
    res.setHeader('Set-Cookie', 'ngalam_token=; Path=/; Max-Age=0; SameSite=Lax');
    res.json({ success: true, message: 'Berhasil keluar dari dashboard admin.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// ==========================================
// MOUNT MODULAR API ROUTERS
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customer', customerRoutes);
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
  res.status(404).json({ success: false, message: `Endpoint "${req.originalUrl}" tidak ditemukan di Server Admin.` });
});

// Start Isolated Admin Server
function startAdminServer(portToTry) {
  const server = app.listen(portToTry, async () => {
    console.log(`\n================================================================`);
    console.log(`🛡️  NGALAM FIX PRO - Standalone Dedicated Admin Server Berjalan!`);
    console.log(`📑 Dashboard Admin URL: http://localhost:${portToTry}`);
    console.log(`🔐 Admin Login URL:     http://localhost:${portToTry}/login.html`);
    console.log(`================================================================\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = Number(portToTry) + 1;
      console.warn(`[Admin Server] Port ${portToTry} in use, trying port ${nextPort}...`);
      startAdminServer(nextPort);
    } else {
      console.error('[Admin Server Error]', err);
    }
  });
}

startAdminServer(ADMIN_PORT);
