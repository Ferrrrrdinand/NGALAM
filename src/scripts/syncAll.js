const fs = require('fs');
const path = require('path');
const db = require('../models');
const { parseNumeric } = require('../utils/currency');
const { normalizePhone } = require('../utils/phone');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

function readJson(filename) {
  const p = path.join(DATA_DIR, filename);
  if (!fs.existsSync(p)) return [];
  try {
    const raw = fs.readFileSync(p, 'utf-8');
    const parsed = JSON.parse(raw.replace(/^\uFEFF/, ''));
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === 'object' && parsed !== null) return Object.values(parsed);
    return [];
  } catch (err) {
    console.warn(`[syncAll] Warning reading ${filename}:`, err.message);
    return [];
  }
}

async function syncAll() {
  console.log('🔄 [Sequelize Sync] Memulai sinkronisasi data ke PostgreSQL...');
  const stats = {};

  // 1. Users are managed directly in the PostgreSQL users table (not from JSON files).
  stats.users = 0;

  // 2. Sync Customers into the unified users table (role customer)
  const customers = readJson('customers.json');
  let custSynced = 0;
  for (const c of customers) {
    if (!c.id && !c.whatsapp) continue;
    const id = c.id || `CUST-${normalizePhone(c.whatsapp)}`;
    const username = c.username || `cust_${String(id).toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
    const raw = {
      ...c,
      district: c.district || 'Malang Raya',
      registeredAt: c.registeredAt || c.registered_at || new Date().toISOString(),
      registeredVia: c.registeredVia || c.registered_via || 'Portal Pelanggan Web'
    };
    await db.User.upsert({
      id,
      username,
      password: c.passwordHash || c.pin || '123456',
      name: c.name || 'Pelanggan',
      role: 'customer',
      category: 'Pelanggan',
      phone: c.whatsapp || '',
      email: c.email || '',
      referral_code: c.referredByMitra || '',
      status: 'Aktif',
      raw_data: raw
    });
    custSynced++;
  }
  stats.customers = custSynced;

  // 3. Sync Orders
  const orders = readJson('orders.json');
  let ordersSynced = 0;
  for (const o of orders) {
    if (!o.id) continue;
    await db.Order.upsert({
      id: o.id,
      customer_name: o.customerName || o.customer_name || 'Pelanggan',
      whatsapp: o.whatsapp || o.customerPhone || o.phone || '',
      device_type: o.deviceType || o.device_type || 'Smartphone',
      brand_model: o.brandModel || o.phoneType || o.brand_model || '-',
      damage_description: o.damageDescription || o.damage || '-',
      status: o.status || 'Registrasi & Masuk',
      cost: parseNumeric(o.cost || o.estimatedCost, 0),
      duration: o.duration || o.estimatedTime || '30 - 60 Menit',
      technician: typeof o.technician === 'string' ? o.technician : (o.assignedTechnician ? o.assignedTechnician.name : 'Teknisi Lab Meja 1'),
      step: parseInt(o.step || o.currentStep || 1, 10),
      raw_data: o
    });
    ordersSynced++;
  }
  stats.orders = ordersSynced;

  // 4. Sync Transactions
  const transactions = readJson('transactions.json');
  let trxSynced = 0;
  for (const t of transactions) {
    const id = t.id || t.invoiceNumber || t.ticketId;
    if (!id) continue;
    await db.Transaction.upsert({
      id,
      order_id: t.orderId || t.ticketId || '',
      invoice_number: t.invoiceNumber || id,
      customer_name: t.customerName || 'Pelanggan',
      total_amount: parseNumeric(t.totalAmount || t.totalPaid || t.amountReceived || t.amount, 0),
      payment_method: t.paymentMethod || 'Tunai (Cash)',
      cashier: t.cashierName || t.cashier || 'Kasir Meja 1',
      raw_data: t
    });
    trxSynced++;
  }
  stats.transactions = trxSynced;

  // 5. Sync Finances
  const finances = readJson('finances.json');
  let finSynced = 0;
  for (const f of finances) {
    if (!f.id) continue;
    await db.Finance.upsert({
      id: f.id,
      type: f.type || 'Pemasukan',
      category: f.category || 'Servis',
      amount: parseNumeric(f.amount !== undefined ? f.amount : (f.debit !== undefined ? f.debit : f.credit), 0),
      description: f.description || '',
      date: f.date || new Date().toISOString(),
      source: f.source || f.ref || 'Kasir',
      recorded_by: f.recordedBy || f.recorded_by || f.cashier || 'Admin',
      raw_data: f
    });
    finSynced++;
  }
  stats.finances = finSynced;

  // 6. Sync Banners
  const banners = readJson('banners.json').length > 0 ? readJson('banners.json') : readJson('promos.json');
  let bannerSynced = 0;
  for (const b of banners) {
    if (!b.id) continue;
    await db.Banner.upsert({
      id: b.id,
      title: b.title || 'Promo',
      description: b.description || '',
      image_url: b.image || b.imageUrl || b.image_url || 'images/promo-banner-1.jpg',
      badge_tag: b.badgeTag || b.badge_tag || '',
      badge_pill: b.badgePill || b.badge_pill || '',
      promo_code: b.promoCode || b.promo_code || '',
      button_text: b.buttonText || b.button_text || 'Lihat Promo',
      button_link: b.buttonLink || b.button_link || '#',
      active: b.active !== false,
      raw_data: b
    });
    bannerSynced++;
  }
  stats.banners = bannerSynced;

  // 7. Sync Promo Codes
  const promoCodes = readJson('promo_codes.json');
  let promoCodesSynced = 0;
  for (const p of promoCodes) {
    if (!p.code && !p.id) continue;
    const id = p.id || `PROMO-${p.code}`;
    await db.PromoCode.upsert({
      id,
      code: p.code || id,
      discount_type: p.discountType || p.discount_type || 'fixed',
      discount_value: parseNumeric(p.discountValue || p.discount_value, 0),
      min_spend: parseNumeric(p.minSpend || p.min_spend, 0),
      description: p.description || '',
      active: p.active !== false,
      raw_data: p
    });
    promoCodesSynced++;
  }
  stats.promoCodes = promoCodesSynced;

  // 8. Sync Testimonials
  const testimonials = readJson('testimonials.json');
  let testSynced = 0;
  for (const t of testimonials) {
    if (!t.id && !t.customerName) continue;
    const id = t.id || `TEST-${Date.now()}-${testSynced}`;
    await db.Testimonial.upsert({
      id,
      customer_name: t.customerName || t.customer_name || t.name || 'Pelanggan',
      rating: parseInt(t.rating || 5, 10),
      comment: t.comment || t.text || '',
      device: t.device || 'Smartphone',
      raw_data: t
    });
    testSynced++;
  }
  stats.testimonials = testSynced;

  // 9. Sync Commissions
  const commissions = readJson('commissions.json');
  let commSynced = 0;
  for (const c of commissions) {
    await db.Commission.create({
      referral_code: c.referral_code || c.referralCode || 'UNKNOWN',
      order_id: c.order_id || c.orderId || '',
      commission_amount: parseNumeric(c.commission_amount || c.amount, 0),
      status: c.status || 'Tercatat',
      raw_data: c
    });
    commSynced++;
  }
  stats.commissions = commSynced;

  // 10. Sync Sessions
  const sessions = readJson('sessions.json');
  let sessSynced = 0;
  for (const s of sessions) {
    if (!s.token) continue;
    await db.Session.upsert({
      token: s.token,
      user_id: s.userId || s.user_id || null,
      name: s.name || '',
      username: s.username || '',
      role: s.role || 'staff',
      access_level: s.accessLevel || s.access_level || 'standard',
      raw_data: s,
      login_at: s.loginAt || s.login_at || new Date()
    });
    sessSynced++;
  }
  stats.sessions = sessSynced;

  // 11. Sync Activity Logs (tanpa membuat ulang ID lokal)
  const activityLogs = readJson('activity_logs.json');
  await db.ActivityLog.destroy({ where: {}, truncate: true, restartIdentity: true });
  let activitySynced = 0;
  for (const log of activityLogs) {
    await db.ActivityLog.create({
      action: log.action || '',
      table_name: log.table_name || log.tableName || '',
      record_id: log.record_id || log.recordId || '',
      payload: log.payload || log.raw_data || log,
      performed_at: log.performed_at || log.timestamp || new Date()
    });
    activitySynced++;
  }
  stats.activityLogs = activitySynced;

  // 12. Sync Technician Logs (tanpa membuat ulang ID lokal)
  const technicianLogs = readJson('technician_logs.json');
  await db.TechnicianLog.destroy({ where: {}, truncate: true, restartIdentity: true });
  let techLogsSynced = 0;
  for (const log of technicianLogs) {
    await db.TechnicianLog.create({
      technician: log.technician || log.technicianName || log.username || '',
      action: log.action || '',
      details: log.details || '',
      raw_data: log,
      timestamp: log.timestamp || new Date()
    });
    techLogsSynced++;
  }
  stats.technicianLogs = techLogsSynced;

  console.log('✅ [Sequelize Sync] Sinkronisasi selesai! Statistik:', stats);
  return stats;
}

if (require.main === module) {
  syncAll()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ [Sequelize Sync Error]:', err);
      process.exit(1);
    });
}

module.exports = syncAll;
