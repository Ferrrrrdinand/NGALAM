const express = require('express');
const router = express.Router();
const db = require('../models');
const userService = require('../../services/userService');

router.use(async (req, res, next) => {
  try {
    await userService.refreshUsersFromDb();
  } catch (_) {}
  next();
});

// Domain Routers
const authRoutes = require('../../routes/authRoutes');
const customerRoutes = require('../../routes/customerRoutes');
const orderRoutes = require('../../routes/orderRoutes');
const technicianRoutes = require('../../routes/technicianRoutes');
const financeRoutes = require('../../routes/financeRoutes');
const promoRoutes = require('../../routes/promoRoutes');
const chatbotRoutes = require('../../routes/chatbotRoutes');
const mitraRoutes = require('../../routes/mitraRoutes');
const exportRoutes = require('../../routes/exportRoutes');

// Mount Domain Routers
router.use('/auth', authRoutes);
router.use('/customer', customerRoutes);
router.use('/orders', orderRoutes);
router.use('/technicians', technicianRoutes);
router.use('/finance', financeRoutes);
router.use('/export', exportRoutes);
router.use('/mitra', mitraRoutes);
router.use('/', promoRoutes);
router.use('/', chatbotRoutes);

// ============================================================
// ADMIN DASHBOARD AGGREGATE ENDPOINT
// Satu request untuk semua data panel admin (menggantikan 6 request paralel).
// ============================================================
router.get('/admin/dashboard', async (req, res) => {
  const { getAllOrders } = require('../../services/orderService');
  const { readTransactions, generateMitraCode } = require('../../services/financeService');
  const { getAllPromos } = require('../../services/promoService');
  const userService = require('../../services/userService');
  const pgDb = require('../../services/db');
  const { loadTable } = require('../../services/localStore');

  const safe = async (fn, fallback) => {
    try {
      return await fn();
    } catch (err) {
      console.warn('[Admin Dashboard] Partial data warning:', err.message);
      return fallback;
    }
  };

  const [orders, transactions, promos, activityLogs, mitraUsers] = await Promise.all([
    safe(() => getAllOrders(), []),
    safe(async () => readTransactions(), []),
    safe(async () => getAllPromos(true), []),
    safe(async () => {
      const dbLogs = await db.ActivityLog.findAll({
        order: [['performed_at', 'DESC']],
        limit: 100
      });
      return dbLogs && dbLogs.length > 0 ? dbLogs : loadTable('activity_logs');
    }, loadTable('activity_logs')),
    safe(async () => userService.getMitraUsers(), [])
  ]);

  const mitras = (mitraUsers || [])
    .filter((u) => u.role === 'ojol' || u.role === 'mitra')
    .map((d) => {
      const refCode = d.referralCode || generateMitraCode(d.name, d.username);
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
        lastActive: d.lastActive || 'Hari ini'
      };
    });

  res.json({
    success: true,
    orders,
    transactions,
    promos,
    activityLogs,
    mitras,
    dbStatus: {
      connected: pgDb.isDbConnected(),
      mode: pgDb.isDbConnected() ? 'postgresql' : 'fallback'
    },
    generatedAt: new Date().toISOString()
  });
});

// Database live status endpoint
router.get('/database/status', async (req, res) => {  try {
    await db.sequelize.authenticate();
    const stats = {
      users_count: await db.User.count().catch(() => 0),
      customers_count: await db.Customer.count().catch(() => 0),
      orders_count: await db.Order.count().catch(() => 0),
      transactions_count: await db.Transaction.count().catch(() => 0),
      finances_count: await db.Finance.count().catch(() => 0)
    };

    res.json({
      success: true,
      connected: true,
      database: db.sequelize.config.database || 'postgres',
      mode: 'sequelize_postgresql',
      stats,
      message: `Terhubung ke database PostgreSQL via Sequelize ORM.`
    });
  } catch (err) {
    res.json({
      success: true,
      connected: false,
      mode: 'fallback',
      error: err.message,
      message: 'Sistem aktif dalam mode penyimpanan data lokal.'
    });
  }
});

// Database 2-way sync trigger endpoint
const syncAll = require('../scripts/syncAll');
router.all(['/database/sync', '/sync-database'], async (req, res) => {
  try {
    const stats = await syncAll();
    res.json({
      success: true,
      message: 'Sinkronisasi seluruh data ke PostgreSQL berhasil.',
      stats
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Activity logs endpoint
const { loadTable } = require('../../services/localStore');
router.get('/activity-logs', async (req, res) => {
  try {
    const dbLogs = await db.ActivityLog.findAll({
      order: [['performed_at', 'DESC']],
      limit: 100
    });
    if (dbLogs && dbLogs.length > 0) {
      return res.json({ success: true, source: 'sequelize_postgresql', logs: dbLogs });
    }
  } catch (_) {}
  const localLogs = loadTable('activity_logs');
  return res.json({ success: true, source: 'local_storage', logs: localLogs });
});

module.exports = router;
