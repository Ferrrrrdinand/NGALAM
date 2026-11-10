const express = require('express');
const router = express.Router();
const db = require('../models');
const userService = require('../../services/userService');
const { loadTable } = require('../../services/localStore');

const MAX_LOG_STRING_LENGTH = 2000;

function sanitizeLogValue(value, depth = 0) {
  if (value === null || value === undefined) return value;
  if (depth > 4) return '[nested object omitted]';
  if (typeof value === 'string') {
    if (/^data:image\//i.test(value) || value.length > MAX_LOG_STRING_LENGTH) {
      return `[omitted ${value.length} chars]`;
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => sanitizeLogValue(item, depth + 1));
  }
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, 40)
        .map(([key, val]) => [key, sanitizeLogValue(val, depth + 1)])
    );
  }
  return value;
}

async function getSanitizedActivityLogs(limit = 100) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 500));
  let rows = [];
  try {
    // Potong payload besar (mis. base64 gambar banner) langsung di PostgreSQL
    // agar data 20MB tidak perlu ditransfer dari database ke server.
    rows = await db.sequelize.query(
      `SELECT id, action, table_name, record_id, performed_at,
              CASE
                WHEN action = 'BANNER_UPDATED'
                  THEN jsonb_build_object(
                    'id', payload->'id',
                    'title', payload->'title',
                    'active', payload->'active',
                    'truncated', true
                  )
                WHEN length(payload::text) > 4000
                  THEN jsonb_build_object('truncated', true, 'originalLength', length(payload::text))
                ELSE payload
              END AS payload
       FROM activity_logs
       ORDER BY performed_at DESC
       LIMIT ${safeLimit}`,
      { type: db.Sequelize.QueryTypes.SELECT }
    );
  } catch (_) {}

  if (!rows || rows.length === 0) rows = loadTable('activity_logs');

  return (rows || []).map((log) => {
    const item = typeof log?.toJSON === 'function' ? log.toJSON() : log;
    return { ...item, payload: sanitizeLogValue(item?.payload) };
  });
}

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
const adRoutes = require('../../routes/adRoutes');

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
router.use('/', adRoutes);

// ============================================================
// ADMIN DASHBOARD AGGREGATE ENDPOINT
// Satu request untuk semua data panel admin (menggantikan 6 request paralel).
// ============================================================
router.get('/admin/dashboard', async (req, res) => {
  const { getAllOrders } = require('../../services/orderService');
  const { readTransactions, generateMitraCode } = require('../../services/financeService');
  const { getAllPromos } = require('../../services/promoService');
  const userService = require('../../services/userService');
  const customerService = require('../../services/customerService');
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

  const [orders, transactions, promos, activityLogs, mitraUsers, customerList, adsList, prospectsList] = await Promise.all([
    safe(() => getAllOrders(), []),
    safe(async () => readTransactions(), []),
    safe(async () => getAllPromos(true), []),
    safe(async () => getSanitizedActivityLogs(100), []),
    safe(async () => userService.getMitraUsers(), []),
    safe(async () => {
      await customerService.refreshCustomersFromDb();
      return customerService.getAllCustomers();
    }, []),
    safe(async () => {
      const { getAllAds } = require('../../services/adService');
      return getAllAds({ onlyActive: false, location: 'all' });
    }, []),
    safe(async () => {
      const unregisteredUserService = require('../../services/unregisteredUserService');
      return unregisteredUserService.getAllProspects();
    }, [])
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
        vehicleType: d.vehicleType || d.category || '',
        plateNumber: d.plateNumber || '',
        bankAccount: d.bankAccount || '',
        avatar: d.avatar || (d.role === 'ojol' ? '🛵' : '🏪'),
        phone: d.phone,
        email: d.email || '',
        password: d.password || '',
        plainPassword: d.plainPassword || (d.password && !String(d.password).startsWith('$2') ? d.password : ''),
        isPasswordHashed: Boolean(d.password && String(d.password).startsWith('$2')),
        referralCode: refCode,
        commissionRate: d.commissionRate !== undefined ? d.commissionRate : 10,
        totalCommission: d.totalCommission || 0,
        balance: d.balance !== undefined ? d.balance : (d.totalCommission || 0),
        withdrawnCommission: d.withdrawnCommission || 0,
        status: d.status || 'Siaga / Aktif',
        lastActive: d.lastActive || 'Hari ini'
      };
    });

  const customers = (customerList || []).map((c) => {
    const custOrders = orders.filter((o) => {
      const oPhone = String(o.whatsapp || o.phone || o.customerWa || '').replace(/\D/g, '');
      const cPhone = String(c.whatsapp || c.phone || '').replace(/\D/g, '');
      const oEmail = String(o.email || o.customerEmail || '').toLowerCase();
      const cEmail = String(c.email || '').toLowerCase();
      return (cPhone && oPhone && (cPhone === oPhone || (cPhone.length >= 8 && oPhone.endsWith(cPhone.slice(-8))))) ||
             (cEmail && oEmail && cEmail === oEmail) ||
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
      totalSpent
    };
  });

  res.json({
    success: true,
    orders,
    transactions,
    promos,
    activityLogs,
    mitras,
    customers,
    prospects: prospectsList || [],
    ads: adsList || [],
    dbStatus: {
      connected: pgDb.isDbConnected(),
      mode: pgDb.isDbConnected() ? 'postgresql' : 'fallback'
    },
    generatedAt: new Date().toISOString()
  });
});

// ============================================================
// ADMIN LOG CALON PELANGGAN (LEADS DARI LANDING MODAL)
// ============================================================
router.get('/admin/prospects', async (req, res) => {
  try {
    const unregisteredUserService = require('../../services/unregisteredUserService');
    const list = await unregisteredUserService.getAllProspects();
    
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const todayCount = list.filter(p => {
      const pDate = p.createdAt ? new Date(p.createdAt).toISOString().slice(0, 10) : '';
      return pDate === todayStr;
    }).length;

    const withMitraCount = list.filter(p => Boolean(p.referredByMitra)).length;
    const claimedCount = list.filter(p => Boolean(p.claimed)).length;

    res.json({
      success: true,
      data: list,
      stats: {
        total: list.length,
        today: todayCount,
        withMitra: withMitraCount,
        claimed: claimedCount,
        unclaimed: list.length - claimedCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/admin/prospects/:id', async (req, res) => {
  try {
    const unregisteredUserService = require('../../services/unregisteredUserService');
    const ok = await unregisteredUserService.deleteProspect(req.params.id);
    if (ok) {
      res.json({ success: true, message: `Calon pelanggan #${req.params.id} berhasil dihapus.` });
    } else {
      res.status(404).json({ success: false, message: 'Data calon pelanggan tidak ditemukan.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Database live status endpoint
router.get('/database/status', async (req, res) => {  try {
    await db.sequelize.authenticate();
    const stats = {
      users_count: await db.User.count().catch(() => 0),
      customers_count: await db.User.count({ where: { role: ['customer', 'pelanggan'] } }).catch(() => 0),
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
router.get('/activity-logs', async (req, res) => {
  try {
    const logs = await getSanitizedActivityLogs(100);
    return res.json({ success: true, source: 'postgresql', logs });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
