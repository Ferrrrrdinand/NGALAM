/**
 * NGALAM FIX PRO - Order & Service Tickets Service
 * Mengelola tiket antrean servis, pelacakan progres pengerjaan, dan pesanan pelanggan.
 * Terintegrasi langsung ke PostgreSQL Database via services/db.js (dengan fallback data/ lokal).
 */

const fs = require('fs');
const path = require('path');
const db = require('./db');

const LOCAL_DATA_FILE = path.join(__dirname, '..', 'data', 'orders.json');

// Pastikan folder data dan orders.json tersedia (aman di serverless read-only)
const dataDir = path.join(__dirname, "..", "data");
try {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(LOCAL_DATA_FILE)) fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify([], null, 2), "utf-8");
} catch (_) {}

/**
 * Baca seluruh data pesanan servis (prioritas PostgreSQL)
 */
async function getAllOrders() {
  if (db.isDbConnected()) {
    try {
      const res = await db.query('SELECT raw_data FROM orders ORDER BY created_at DESC');
      if (res && res.rows) {
        return res.rows.map(r => r.raw_data || r);
      }
    } catch (err) {
      console.warn('[OrderService] PostgreSQL query gagal, menggunakan data lokal:', err.message);
    }
  }

  try {
    if (!fs.existsSync(LOCAL_DATA_FILE)) return [];
    const raw = fs.readFileSync(LOCAL_DATA_FILE, 'utf8');
    return JSON.parse(raw.replace(/^\uFEFF/, ''));
  } catch (err) {
    console.error('[OrderService] Error reading orders:', err.message);
    return [];
  }
}

/**
 * Ambil data tiket tunggal berdasarkan ID, WhatsApp, atau Email
 */
async function getOrderById(id) {
  if (!id) return null;
  const query = id.trim().toUpperCase();
  const cleanDigits = id.replace(/\D/g, '');

  if (db.isDbConnected()) {
    try {
      const res = await db.query(`
        SELECT raw_data FROM orders 
        WHERE UPPER(id) = $1 
           OR whatsapp = $1 
           OR (LENGTH($2) >= 6 AND whatsapp LIKE $3)
        LIMIT 1
      `, [query, cleanDigits, `%${cleanDigits}%`]);

      if (res.rows && res.rows.length > 0) {
        return res.rows[0].raw_data;
      }
    } catch (err) {
      console.warn('[OrderService] PostgreSQL getOrderById fallback:', err.message);
    }
  }

  const orders = await getAllOrders();
  return orders.find(
    (o) => (o.id && o.id.toUpperCase() === query) ||
      (o.whatsapp && o.whatsapp.includes(query)) ||
      (cleanDigits && cleanDigits.length >= 6 && (o.whatsapp || o.customerWa || o.phone || o.customerPhone || '').replace(/\D/g, '').includes(cleanDigits)) ||
      (o.email && o.email.toUpperCase() === query)
  ) || null;
}

/**
 * Tambah tiket servis baru ke PostgreSQL & sinkronkan ke cadangan lokal
 */
async function appendOrder(order) {
  if (!order.id) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    order.id = `NGF-${dateStr}-${rand}`;
  }
  if (!order.createdAt) {
    const now = new Date();
    order.createdAt = now.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  }

  const customerPhone = order.customerPhone || order.whatsapp || order.phone || order.buyerPhone || '-';
  const customerAddress = order.address || order.district || order.domisili || 'Malang';
  const deviceType = order.deviceType || order.brand || (order.phoneType ? order.phoneType.split(' - ')[0] : 'Smartphone');
  const brandModel = order.brandModel || order.modelColor || order.model || order.phoneType || '-';
  const screenCondition = order.screenCondition || order.kondisiLayar || 'Normal / Perlu diperiksa';
  const bodyCondition = order.bodyCondition || order.kondisiBodi || 'Mulus';
  const accessories = order.accessories || order.kelengkapan || 'Unit Handphone';
  const screenLock = order.screenLock || order.screenPin || order.pin || 'Tanpa Sandi / Privasi Aman';

  let problemText = 'Diagnosa & Pengecekan Menyeluruh';
  if (Array.isArray(order.problemTags) && order.problemTags.length > 0) {
    problemText = order.problemTags.join(', ');
  } else if (order.damageDescription) {
    problemText = order.damageDescription;
  } else if (order.damage) {
    problemText = order.damage;
  }

  const method = order.method || 'Walk-in Counter Meja 1';
  let techName = 'Teknisi Lab Meja 1';
  if (order.assignedTechnician && order.assignedTechnician.name) {
    techName = order.assignedTechnician.name;
  } else if (order.technician) {
    techName = order.technician;
  }

  const costVal = order.cost || order.estimatedCost || 0;
  const durationVal = order.duration || order.estimatedTime || '30 - 60 Menit';
  const statusVal = order.status || 'Registrasi & Masuk';
  const stepVal = parseInt(order.currentStep || order.step || 1, 10);
  const notesVal = order.diagnoseNote || order.technicianNotes || order.notes || 'Unit baru masuk dalam antrian registrasi.';

  order.customerPhone = customerPhone;
  order.whatsapp = customerPhone;
  order.phone = customerPhone;
  order.address = customerAddress;
  order.district = customerAddress;
  order.deviceType = deviceType;
  order.phoneType = order.phoneType || `${deviceType} - ${brandModel}`;
  order.brandModel = brandModel;
  order.modelColor = brandModel;
  order.screenCondition = screenCondition;
  order.bodyCondition = bodyCondition;
  order.accessories = accessories;
  order.screenLock = screenLock;
  order.screenPin = screenLock;
  order.problemTags = Array.isArray(order.problemTags) && order.problemTags.length > 0 ? order.problemTags : [problemText];
  order.damageDescription = problemText;
  order.method = method;
  order.assignedTechnician = { name: techName };
  order.technician = techName;
  order.estimatedCost = costVal;
  order.cost = costVal;
  order.estimatedTime = durationVal;
  order.duration = durationVal;
  order.status = statusVal;
  order.currentStep = stepVal;
  order.step = stepVal;
  order.technicianNotes = notesVal;
  order.diagnoseNote = notesVal;

  // 1. Simpan ke PostgreSQL jika terhubung
  if (db.isDbConnected()) {
    try {
      await db.query(`
        INSERT INTO orders (id, customer_name, whatsapp, device_type, brand_model, damage_description, status, cost, duration, technician, step, raw_data)
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
        order.id,
        order.customerName || order.buyerName || 'Pelanggan',
        customerPhone,
        deviceType,
        brandModel,
        problemText,
        statusVal,
        costVal,
        durationVal,
        techName,
        stepVal,
        JSON.stringify(order)
      ]);
    } catch (pgErr) {
      console.warn('[OrderService] PostgreSQL appendOrder error:', pgErr.message);
    }
  }

  // 2. Simpan cadangan ke data/orders.json
  try {
    let localOrders = [];
    if (fs.existsSync(LOCAL_DATA_FILE)) {
      const raw = fs.readFileSync(LOCAL_DATA_FILE, 'utf-8');
      localOrders = JSON.parse(raw.replace(/^\uFEFF/, '')) || [];
    }
    const updatedLocal = [order, ...localOrders.filter((o) => o.id && o.id !== order.id)];
    fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(updatedLocal, null, 2), 'utf-8');
  } catch (fsErr) {
    console.warn('[OrderService] Local backup write error:', fsErr.message);
  }

  // 3. Auto-register customer account jika nomor WA disediakan
  try {
    const { ensureCustomerAccount } = require('./customerService');
    if (customerPhone && customerPhone !== '-') {
      ensureCustomerAccount({
        name: order.customerName,
        whatsapp: customerPhone,
        email: order.email || '',
        district: customerAddress,
        referredByMitra: order.affiliateRef || order.referralCode || '',
        registeredVia: 'Pemesanan Servis Smartphone'
      });
    }
  } catch (custSyncErr) {
    console.warn('[OrderService] Auto customer account check warning:', custSyncErr.message);
  }

  return order;
}

/**
 * Update tiket servis yang ada di PostgreSQL & lokal
 */
async function updateOrder(ticketId, updates) {
  const cleanId = ticketId.trim().toUpperCase();

  // Ambil data order eksisting
  const current = await getOrderById(cleanId);
  if (!current) return null;

  const updatedOrder = { ...current, ...updates };

  // 1. Update di PostgreSQL jika terhubung
  if (db.isDbConnected()) {
    try {
      await db.query(`
        UPDATE orders 
        SET status = COALESCE($2, status),
            technician = COALESCE($3, technician),
            step = COALESCE($4, step),
            raw_data = $5,
            updated_at = CURRENT_TIMESTAMP
        WHERE UPPER(id) = $1
      `, [
        cleanId,
        updates.status || null,
        updates.technician || (updates.assignedTechnician ? updates.assignedTechnician.name : null),
        updates.step || updates.currentStep || null,
        JSON.stringify(updatedOrder)
      ]);
    } catch (pgErr) {
      console.warn('[OrderService] PostgreSQL updateOrder error:', pgErr.message);
    }
  }

  // 2. Update di lokal JSON
  try {
    if (fs.existsSync(LOCAL_DATA_FILE)) {
      const raw = fs.readFileSync(LOCAL_DATA_FILE, 'utf-8');
      const localOrders = JSON.parse(raw.replace(/^\uFEFF/, '')) || [];
      const index = localOrders.findIndex((o) => (o.id || '').toUpperCase() === cleanId);
      if (index !== -1) {
        localOrders[index] = updatedOrder;
        fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(localOrders, null, 2), 'utf-8');
      }
    }
  } catch (fsErr) {
    console.warn('[OrderService] Local update order error:', fsErr.message);
  }

  return updatedOrder;
}

/**
 * Kosongkan antrean tiket servis
 */
async function clearAllOrders() {
  if (db.isDbConnected()) {
    try {
      await db.query('TRUNCATE orders');
    } catch (pgErr) {
      console.warn('[OrderService] PostgreSQL truncate orders error:', pgErr.message);
    }
  }

  try {
    fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
  } catch (fsErr) {
    console.warn('[OrderService] Clear local orders error:', fsErr.message);
  }

  return [];
}

module.exports = {
  getAllOrders,
  getOrderById,
  appendOrder,
  updateOrder,
  clearAllOrders
};


