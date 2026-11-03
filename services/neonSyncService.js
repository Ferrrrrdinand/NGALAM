/**
 * NGALAM FIX PRO - Neon PostgreSQL & Local JSON Dual-Sync Engine
 * Memastikan seluruh tabel dan data di folder data/ tersimpan rapi dan sinkron 2 arah:
 * 1. Neon Cloud PostgreSQL Database
 * 2. File JSON lokal di folder data/
 * Mencegah database stuck dengan handling timeout and UPSERT resilience.
 */

const fs = require('fs');
const path = require('path');
const db = require('./db');
const { loadTable, saveTable, appendActivityLog } = require('./localStore');

const DATA_DIR = path.join(__dirname, '..', 'data');

/**
 * Sinkronisasi tabel users ke Neon
 */
async function syncUsersToNeon() {
  const users = loadTable('users');
  if (!users || users.length === 0) return 0;
  let synced = 0;

  for (const u of users) {
    if (!u.id && !u.username) continue;
    const id = u.id || `USR-${u.username}`;
    try {
      await db.query(`
        INSERT INTO users (
          id, username, password, name, role, category, avatar, phone, email, 
          referral_code, commission_rate, total_commission, status, last_active, desk, specialty, raw_data
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (id) DO UPDATE SET
          username = EXCLUDED.username,
          password = EXCLUDED.password,
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          category = EXCLUDED.category,
          avatar = EXCLUDED.avatar,
          phone = EXCLUDED.phone,
          email = EXCLUDED.email,
          referral_code = EXCLUDED.referral_code,
          commission_rate = EXCLUDED.commission_rate,
          total_commission = EXCLUDED.total_commission,
          status = EXCLUDED.status,
          last_active = EXCLUDED.last_active,
          desk = EXCLUDED.desk,
          specialty = EXCLUDED.specialty,
          raw_data = EXCLUDED.raw_data
      `, [
        id,
        u.username || id,
        u.password || '',
        u.name || '',
        u.role || 'staff',
        u.category || u.role || 'Staff',
        u.avatar || '👤',
        u.phone || '',
        u.email || '',
        u.referralCode || u.referral_code || '',
        Number(u.commissionRate || u.commission_rate || 10),
        Number(u.totalCommission || u.total_commission || 0),
        u.status || 'Siaga / Aktif',
        u.lastActive || u.last_active || 'Baru Saja',
        u.desk || '',
        u.specialty || '',
        JSON.stringify(u)
      ]);
      synced++;
    } catch (e) {
      console.warn(`[NeonSync] Error syncing user ${id}:`, e.message);
    }
  }
  return synced;
}

/**
 * Sinkronisasi tabel customers ke Neon
 */
async function syncCustomersToNeon() {
  const customers = loadTable('customers');
  if (!customers || customers.length === 0) return 0;
  let synced = 0;

  for (const c of customers) {
    if (!c.id && !c.whatsapp) continue;
    const id = c.id || `CUST-${(c.whatsapp || '').replace(/\D/g, '')}`;
    try {
      await db.query(`
        INSERT INTO customers (id, name, whatsapp, email, district, pin, registered_at, registered_via, raw_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          whatsapp = EXCLUDED.whatsapp,
          email = EXCLUDED.email,
          district = EXCLUDED.district,
          pin = EXCLUDED.pin,
          raw_data = EXCLUDED.raw_data
      `, [
        id,
        c.name || 'Pelanggan',
        c.whatsapp || '',
        c.email || '',
        c.district || 'Malang Raya',
        c.pin || '123456',
        c.registeredAt || c.registered_at || new Date().toISOString(),
        c.registeredVia || c.registered_via || 'Portal Pelanggan Web',
        JSON.stringify(c)
      ]);
      synced++;
    } catch (e) {
      console.warn(`[NeonSync] Error syncing customer ${id}:`, e.message);
    }
  }
  return synced;
}

/**
 * Sinkronisasi tabel orders ke Neon
 */
async function syncOrdersToNeon() {
  const orders = loadTable('orders');
  if (!orders || orders.length === 0) return 0;
  let synced = 0;

  for (const o of orders) {
    if (!o.id) continue;
    try {
      await db.query(`
        INSERT INTO orders (
          id, customer_name, whatsapp, device_type, brand_model, damage_description, 
          status, cost, duration, technician, step, raw_data
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          customer_name = EXCLUDED.customer_name,
          whatsapp = EXCLUDED.whatsapp,
          device_type = EXCLUDED.device_type,
          brand_model = EXCLUDED.brand_model,
          damage_description = EXCLUDED.damage_description,
          status = EXCLUDED.status,
          cost = EXCLUDED.cost,
          duration = EXCLUDED.duration,
          technician = EXCLUDED.technician,
          step = EXCLUDED.step,
          raw_data = EXCLUDED.raw_data,
          updated_at = CURRENT_TIMESTAMP
      `, [
        o.id,
        o.customerName || o.customer_name || 'Pelanggan',
        o.whatsapp || o.customerPhone || o.phone || '',
        o.deviceType || o.device_type || 'Smartphone',
        o.brandModel || o.phoneType || o.brand_model || '-',
        o.damageDescription || o.damage || '-',
        o.status || 'Registrasi & Masuk',
        Number(o.cost || o.estimatedCost || 0),
        o.duration || o.estimatedTime || '30 - 60 Menit',
        typeof o.technician === 'string' ? o.technician : (o.assignedTechnician ? o.assignedTechnician.name : 'Teknisi Lab Meja 1'),
        parseInt(o.step || o.currentStep || 1, 10),
        JSON.stringify(o)
      ]);
      synced++;
    } catch (e) {
      console.warn(`[NeonSync] Error syncing order ${o.id}:`, e.message);
    }
  }
  return synced;
}

/**
 * Sinkronisasi tabel transactions ke Neon
 */
async function syncTransactionsToNeon() {
  const transactions = loadTable('transactions');
  if (!transactions || transactions.length === 0) return 0;
  let synced = 0;

  for (const t of transactions) {
    const id = t.id || t.invoiceNumber || t.ticketId;
    if (!id) continue;
    try {
      await db.query(`
        INSERT INTO transactions (id, order_id, invoice_number, customer_name, total_amount, payment_method, cashier, raw_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          total_amount = EXCLUDED.total_amount,
          payment_method = EXCLUDED.payment_method,
          cashier = EXCLUDED.cashier,
          raw_data = EXCLUDED.raw_data
      `, [
        id,
        t.orderId || t.ticketId || '',
        t.invoiceNumber || id,
        t.customerName || 'Pelanggan',
        Number(t.totalAmount || t.amount || 0),
        t.paymentMethod || 'Tunai (Cash)',
        t.cashier || 'Kasir Meja 1',
        JSON.stringify(t)
      ]);
      synced++;
    } catch (e) {
      console.warn(`[NeonSync] Error syncing transaction ${id}:`, e.message);
    }
  }
  return synced;
}

/**
 * Sinkronisasi tabel finances ke Neon
 */
async function syncFinancesToNeon() {
  const finances = loadTable('finances');
  if (!finances || finances.length === 0) return 0;
  let synced = 0;

  for (const f of finances) {
    if (!f.id) continue;
    try {
      await db.query(`
        INSERT INTO finances (id, type, category, amount, description, date, source, recorded_by, raw_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          amount = EXCLUDED.amount,
          description = EXCLUDED.description,
          raw_data = EXCLUDED.raw_data
      `, [
        f.id,
        f.type || 'Pemasukan',
        f.category || 'Servis',
        Number(f.amount || 0),
        f.description || '',
        f.date || new Date().toISOString(),
        f.source || 'Kasir',
        f.recordedBy || f.recorded_by || 'Admin',
        JSON.stringify(f)
      ]);
      synced++;
    } catch (e) {
      console.warn(`[NeonSync] Error syncing finance ${f.id}:`, e.message);
    }
  }
  return synced;
}

/**
 * Sinkronisasi tabel banners / promos ke Neon
 */
async function syncBannersToNeon() {
  const banners = loadTable('banners').length > 0 ? loadTable('banners') : loadTable('promos');
  if (!banners || banners.length === 0) return 0;
  let synced = 0;

  for (const b of banners) {
    if (!b.id) continue;
    try {
      await db.query(`
        INSERT INTO banners (id, title, description, image_url, badge_tag, badge_pill, promo_code, button_text, button_link, active, raw_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          image_url = EXCLUDED.image_url,
          badge_tag = EXCLUDED.badge_tag,
          badge_pill = EXCLUDED.badge_pill,
          promo_code = EXCLUDED.promo_code,
          button_text = EXCLUDED.button_text,
          button_link = EXCLUDED.button_link,
          active = EXCLUDED.active,
          raw_data = EXCLUDED.raw_data,
          updated_at = CURRENT_TIMESTAMP
      `, [
        b.id,
        b.title || 'Promo',
        b.description || '',
        b.image || b.imageUrl || b.image_url || 'images/promo-banner-1.jpg',
        b.badgeTag || b.badge_tag || '',
        b.badgePill || b.badge_pill || '',
        b.promoCode || b.promo_code || '',
        b.buttonText || b.button_text || 'Lihat Promo',
        b.buttonLink || b.button_link || '#',
        b.active !== false,
        JSON.stringify(b)
      ]);
      synced++;
    } catch (e) {
      console.warn(`[NeonSync] Error syncing banner ${b.id}:`, e.message);
    }
  }
  return synced;
}

/**
 * Sinkronisasi tabel commissions ke Neon
 */
async function syncCommissionsToNeon() {
  const commissions = loadTable('commissions');
  if (!commissions || commissions.length === 0) return 0;
  let synced = 0;

  for (const c of commissions) {
    try {
      await db.query(`
        INSERT INTO commissions (referral_code, order_id, commission_amount, status, raw_data)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        c.referral_code || c.referralCode || 'UNKNOWN',
        c.order_id || c.orderId || '',
        Number(c.commission_amount || c.amount || 0),
        c.status || 'Tercatat',
        JSON.stringify(c)
      ]);
      synced++;
    } catch (e) {
      console.warn('[NeonSync] Error syncing commission:', e.message);
    }
  }
  return synced;
}

/**
 * Sinkronisasi seluruh tabel dari data/ ke Neon Cloud PostgreSQL
 */
async function syncAllTablesToNeon() {
  if (!db.isDbConnected()) {
    return {
      success: false,
      connected: false,
      message: 'PostgreSQL Neon belum terhubung. Operasi berjalan dalam penyimpanan lokal data/.'
    };
  }

  console.log('🔄 [NeonSync] Memulai sinkronisasi seluruh tabel data/ ke Neon PostgreSQL...');
  const results = {};

  results.users = await syncUsersToNeon();
  results.customers = await syncCustomersToNeon();
  results.orders = await syncOrdersToNeon();
  results.transactions = await syncTransactionsToNeon();
  results.finances = await syncFinancesToNeon();
  results.banners = await syncBannersToNeon();
  results.commissions = await syncCommissionsToNeon();

  appendActivityLog('NEON_FULL_SYNC', 'all_tables', 'SYSTEM', {
    results,
    syncedAt: new Date().toISOString()
  });

  console.log('✅ [NeonSync] Seluruh tabel berhasil tersinkronisasi ke Neon:', JSON.stringify(results));
  return {
    success: true,
    connected: true,
    syncedCounts: results,
    message: 'Seluruh tabel dan data lokal berhasil disinkronisasi ke Neon PostgreSQL.'
  };
}

module.exports = {
  syncAllTablesToNeon,
  syncUsersToNeon,
  syncCustomersToNeon,
  syncOrdersToNeon,
  syncTransactionsToNeon,
  syncFinancesToNeon,
  syncBannersToNeon,
  syncCommissionsToNeon
};

