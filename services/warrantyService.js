/**
 * NGALAM FIX PRO - Warranty Service & Dual Persistence Engine
 * Handles warranty certificates, 90-day battery & hardware warranties,
 * customer member warranty linking, and warranty claim tracking.
 */

const fs = require('fs');
const path = require('path');
const db = require('./db');
const { loadTable, saveTable, upsertRecord } = require('./localStore');
const { phonesMatch, normalizePhone } = require('../src/utils/phone');

let warrantyCache = null;
let isHydrated = false;

// 1. Tentukan durasi garansi & label resmi berdasarkan jenis kerusakan / servis
function determineWarrantyPolicy(serviceText = '') {
  const text = String(serviceText || '').toLowerCase();

  if (/baterai|battery|batre/i.test(text)) {
    return {
      durationDays: 90,
      label: 'Garansi Baterai Original (90 Hari / 3 Bulan)',
      coverage: 'Garansi kesehatan sel baterai 100%, stabilitas fast-charging, bebas panas abnormal, dan ganti unit baru jika kembung.'
    };
  }
  if (/software|virus|malware|flash|bootloop|sandi|pola|unlock/i.test(text)) {
    return {
      durationDays: 7,
      label: 'Garansi Software & OS (7 Hari / 1 Minggu)',
      coverage: 'Garansi kestabilan flashing OS, bebas malware berulang, dan backup pemulihan data sistem.'
    };
  }
  if (/cas|charge|charger|port|konektor/i.test(text)) {
    return {
      durationDays: 14,
      label: 'Garansi Port Charger (14 Hari / 2 Minggu)',
      coverage: 'Garansi konektivitas pengisian daya, soket presisi, dan arus pengisian stabil.'
    };
  }
  // Default: Layar LCD/OLED, Fleksibel, Kaca OCA, Mesin/IC, Kamera OIS
  return {
    durationDays: 30,
    label: 'Garansi Servis Hardware (30 Hari / 1 Bulan)',
    coverage: 'Garansi suku cadang original, fungsi sentuh & sensor layar, dan bebas biaya jasa lab.'
  };
}

// 2. Format tanggal lokal Indonesia
function formatDateId(dateInput) {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// 3. Hitung status garansi aktif, sisa hari, dan kedaluwarsa
function enrichWarrantyCalculations(w) {
  const now = new Date();
  const start = w.start_date ? new Date(w.start_date) : now;
  const duration = Number(w.duration_days) || 30;
  const end = w.end_date ? new Date(w.end_date) : new Date(start.getTime() + duration * 24 * 60 * 60 * 1000);

  const diffTime = end.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const isExpired = diffTime < 0;

  let computedStatus = w.status || 'active';
  if (isExpired && computedStatus === 'active') {
    computedStatus = 'expired';
  }

  // Pre-filled WhatsApp claim message
  const waText = encodeURIComponent(
    `Halo Admin & CS Ngalam Fix Pro,\n\n` +
    `Saya ingin konsultasi / klaim garansi resmi untuk unit servis saya:\n` +
    `---------------------------------------\n` +
    `🏷️ Kode Garansi: ${w.warranty_code}\n` +
    `📋 No. Tiket: ${w.order_id || w.invoice_number || '-'}\n` +
    `📱 Perangkat: ${w.brand_model || w.device_type || 'Smartphone'}\n` +
    `👤 Pemilik: ${w.customer_name}\n` +
    `📞 WhatsApp: ${w.customer_whatsapp || '-'}\n` +
    `🛡️ Jenis: ${w.warranty_type_label}\n` +
    `⏳ Masa Berlaku: s/d ${formatDateId(end)} (Sisa ${daysRemaining} Hari)\n` +
    `---------------------------------------\n` +
    `Mohon info ketersediaan teknisi lab workshop. Terima kasih!`
  );
  const claimWaUrl = `https://wa.me/628113185858?text=${waText}`;

  return {
    ...w,
    startDateFormatted: formatDateId(start),
    endDateFormatted: formatDateId(end),
    durationDays: duration,
    daysRemaining,
    isExpired,
    isActive: !isExpired && computedStatus !== 'void',
    status: computedStatus,
    claimStatus: w.claim_status || 'none',
    claimCount: Number(w.claim_count) || 0,
    claimHistory: Array.isArray(w.claim_history) ? w.claim_history : [],
    claimWaUrl
  };
}

// 4. Sinkronisasi dari PostgreSQL & Fallback JSON
async function ensureHydrated() {
  if (isHydrated && Array.isArray(warrantyCache)) {
    return warrantyCache;
  }

  let list = [];
  try {
    const isDbReady = await db.ensureDbReady();
    if (isDbReady) {
      const res = await db.query(`
        SELECT 
          id, warranty_code, order_id, invoice_number, customer_id, customer_name,
          customer_whatsapp, customer_email, device_type, brand_model, service_item,
          warranty_type_label, duration_days, start_date, end_date, status,
          claim_status, claim_count, claim_history, technician_notes, raw_data,
          created_at, updated_at
        FROM warranties
        ORDER BY created_at DESC
      `);
      if (res && res.rows && res.rows.length > 0) {
        list = res.rows.map(r => ({
          id: r.id,
          warranty_code: r.warranty_code,
          order_id: r.order_id,
          invoice_number: r.invoice_number,
          customer_id: r.customer_id,
          customer_name: r.customer_name,
          customer_whatsapp: r.customer_whatsapp,
          customer_email: r.customer_email,
          device_type: r.device_type,
          brand_model: r.brand_model,
          service_item: r.service_item,
          warranty_type_label: r.warranty_type_label,
          duration_days: Number(r.duration_days) || 30,
          start_date: r.start_date,
          end_date: r.end_date,
          status: r.status,
          claim_status: r.claim_status,
          claim_count: Number(r.claim_count) || 0,
          claim_history: Array.isArray(r.claim_history) ? r.claim_history : (r.claim_history ? JSON.parse(r.claim_history) : []),
          technician_notes: r.technician_notes || '',
          raw_data: r.raw_data,
          created_at: r.created_at,
          updated_at: r.updated_at
        }));
      }
    }
  } catch (err) {
    console.warn('[WarrantyService] PostgreSQL read warning:', err.message);
  }

  if (list.length === 0) {
    list = loadTable('warranties');
  }

  // Jika masih kosong sama sekali, seed dari transactions.json & orders.json
  if (list.length === 0) {
    list = await seedFromExistingCompletedOrders();
  }

  warrantyCache = list;
  isHydrated = true;
  return warrantyCache;
}

// 5. Seed otomatis garansi awal dari data transaksi faktur dan tiket servis yang telah selesai
async function seedFromExistingCompletedOrders() {
  const seeded = [];
  const seenKeys = new Set();

  try {
    const rawTx = loadTable('transactions');
    for (const tx of rawTx) {
      const orderKey = tx.ticketId || tx.invoiceNumber || tx.id;
      if (!orderKey || seenKeys.has(orderKey)) continue;
      seenKeys.add(orderKey);

      const policy = determineWarrantyPolicy(tx.serviceItem || tx.damageDescription || tx.phoneType || '');
      const txDate = tx.date ? new Date(tx.date) : new Date();
      const endDate = new Date(txDate.getTime() + policy.durationDays * 24 * 60 * 60 * 1000);
      const cleanDigits = String(tx.ticketId || tx.invoiceNumber || tx.id).replace(/\D/g, '').slice(-6) || Math.floor(100000 + Math.random() * 900000);
      const warrantyCode = `GAR-${policy.durationDays}D-${cleanDigits}`;

      const warrantyItem = {
        id: `WARR-${Date.now().toString().slice(-6)}-${cleanDigits}`,
        warranty_code: warrantyCode,
        order_id: tx.ticketId || null,
        invoice_number: tx.invoiceNumber || tx.id || null,
        customer_id: tx.customerId || null,
        customer_name: tx.customerName || 'Pelanggan Ngalam Fix Pro',
        customer_whatsapp: tx.customerPhone || tx.whatsapp || '',
        customer_email: tx.customerEmail || '',
        device_type: tx.deviceType || 'Smartphone',
        brand_model: tx.phoneType || 'Smartphone',
        service_item: tx.serviceItem || 'Pergantian Komponen & Servis Lab',
        warranty_type_label: policy.label,
        duration_days: policy.durationDays,
        start_date: txDate.toISOString(),
        end_date: endDate.toISOString(),
        status: new Date() > endDate ? 'expired' : 'active',
        claim_status: tx.warrantyClaimStatus === 'claimed' ? 'pending' : 'none',
        claim_count: tx.warrantyClaimStatus === 'claimed' ? 1 : 0,
        claim_history: tx.warrantyClaimStatus === 'claimed' ? [{
          claimId: `CLM-INIT-${cleanDigits}`,
          claimedAt: tx.updatedAt || txDate.toISOString(),
          status: 'pending',
          complaint: tx.warrantyClaimNotes || 'Klaim garansi unit diajukan oleh pelanggan.'
        }] : [],
        technician_notes: tx.technicianName ? `Dikerjakan oleh ${tx.technicianName}` : '',
        created_at: txDate.toISOString(),
        updated_at: new Date().toISOString()
      };

      seeded.push(warrantyItem);
    }
  } catch (seedErr) {
    console.warn('[WarrantyService] Seeding transactions error:', seedErr.message);
  }

  // Simpan ke localStore
  saveTable('warranties', seeded);

  // Sync ke PostgreSQL jika aktif
  try {
    for (const w of seeded) {
      await syncWarrantyToPostgres(w);
    }
  } catch (_) {}

  return seeded;
}

// 6. Sinkronisasi satu record garansi ke PostgreSQL
async function syncWarrantyToPostgres(w) {
  try {
    const isDbReady = await db.ensureDbReady();
    if (!isDbReady) return false;

    const queryText = `
      INSERT INTO warranties (
        id, warranty_code, order_id, invoice_number, customer_id, customer_name,
        customer_whatsapp, customer_email, device_type, brand_model, service_item,
        warranty_type_label, duration_days, start_date, end_date, status,
        claim_status, claim_count, claim_history, technician_notes, raw_data,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      ON CONFLICT (id) DO UPDATE SET
        warranty_code = EXCLUDED.warranty_code,
        order_id = EXCLUDED.order_id,
        invoice_number = EXCLUDED.invoice_number,
        customer_id = EXCLUDED.customer_id,
        customer_name = EXCLUDED.customer_name,
        customer_whatsapp = EXCLUDED.customer_whatsapp,
        customer_email = EXCLUDED.customer_email,
        brand_model = EXCLUDED.brand_model,
        service_item = EXCLUDED.service_item,
        warranty_type_label = EXCLUDED.warranty_type_label,
        duration_days = EXCLUDED.duration_days,
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        status = EXCLUDED.status,
        claim_status = EXCLUDED.claim_status,
        claim_count = EXCLUDED.claim_count,
        claim_history = EXCLUDED.claim_history,
        technician_notes = EXCLUDED.technician_notes,
        updated_at = NOW();
    `;

    const values = [
      w.id,
      w.warranty_code,
      w.order_id || null,
      w.invoice_number || null,
      w.customer_id || null,
      w.customer_name,
      w.customer_whatsapp || null,
      w.customer_email || null,
      w.device_type || 'Smartphone',
      w.brand_model || null,
      w.service_item || null,
      w.warranty_type_label,
      w.duration_days || 30,
      w.start_date || new Date().toISOString(),
      w.end_date || null,
      w.status || 'active',
      w.claim_status || 'none',
      w.claim_count || 0,
      JSON.stringify(w.claim_history || []),
      w.technician_notes || null,
      JSON.stringify(w.raw_data || {}),
      w.created_at || new Date().toISOString(),
      w.updated_at || new Date().toISOString()
    ];

    await db.query(queryText, values);
    return true;
  } catch (err) {
    console.warn('[WarrantyService] syncWarrantyToPostgres warning:', err.message);
    return false;
  }
}

// 7. Ambil semua data garansi lengkap dengan statistik
async function getAllWarranties(filter = {}) {
  const list = await ensureHydrated();
  const enrichedList = list.map(enrichWarrantyCalculations);

  let filtered = enrichedList;

  if (filter.status && filter.status !== 'all') {
    if (filter.status === 'active') {
      filtered = filtered.filter(w => w.isActive);
    } else if (filter.status === 'expired') {
      filtered = filtered.filter(w => w.isExpired);
    } else {
      filtered = filtered.filter(w => w.status === filter.status);
    }
  }

  if (filter.claimStatus && filter.claimStatus !== 'all') {
    filtered = filtered.filter(w => w.claimStatus === filter.claimStatus);
  }

  if (filter.search) {
    const q = filter.search.toLowerCase().trim();
    filtered = filtered.filter(w => 
      String(w.warranty_code || '').toLowerCase().includes(q) ||
      String(w.order_id || '').toLowerCase().includes(q) ||
      String(w.invoice_number || '').toLowerCase().includes(q) ||
      String(w.customer_name || '').toLowerCase().includes(q) ||
      String(w.customer_whatsapp || '').toLowerCase().includes(q) ||
      String(w.brand_model || '').toLowerCase().includes(q)
    );
  }

  // Ringkasan Statistik Garansi
  const totalWarranties = enrichedList.length;
  const activeWarranties = enrichedList.filter(w => w.isActive).length;
  const expiredWarranties = enrichedList.filter(w => w.isExpired).length;
  const pendingClaims = enrichedList.filter(w => w.claimStatus === 'pending').length;
  const inRepairClaims = enrichedList.filter(w => w.claimStatus === 'in_repair').length;
  const resolvedClaims = enrichedList.filter(w => w.claimStatus === 'resolved').length;

  return {
    warranties: filtered,
    stats: {
      total: totalWarranties,
      active: activeWarranties,
      expired: expiredWarranties,
      pendingClaims,
      inRepairClaims,
      resolvedClaims
    }
  };
}

// 8. Ambil data garansi khusus untuk satu akun member
async function getWarrantiesByCustomer(customerId, phone, email) {
  const list = await ensureHydrated();
  const enriched = list.map(enrichWarrantyCalculations);

  const cleanPhone = normalizePhone(phone);
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanId = String(customerId || '').trim();

  return enriched.filter(w => {
    if (cleanId && w.customer_id && String(w.customer_id).trim() === cleanId) return true;
    if (cleanPhone && phonesMatch(w.customer_whatsapp, cleanPhone)) return true;
    if (cleanEmail && w.customer_email && String(w.customer_email).toLowerCase().trim() === cleanEmail) return true;
    return false;
  });
}

// 9. Cari garansi berdasarkan ID, warranty_code, atau order_id
async function findWarranty(key) {
  if (!key) return null;
  const list = await ensureHydrated();
  const clean = String(key).trim().toUpperCase();

  const found = list.find(w => 
    String(w.id || '').toUpperCase() === clean ||
    String(w.warranty_code || '').toUpperCase() === clean ||
    String(w.order_id || '').toUpperCase() === clean ||
    String(w.invoice_number || '').toUpperCase() === clean
  );

  return found ? enrichWarrantyCalculations(found) : null;
}

// 10. Otomatis buat atau perbarui catatan garansi saat pesanan selesai / dibayar
async function createOrUpdateWarrantyForOrder(orderOrTx) {
  if (!orderOrTx) return null;

  const list = await ensureHydrated();

  const orderId = orderOrTx.ticketId || orderOrTx.id || null;
  const invoiceNo = orderOrTx.invoiceNumber || orderOrTx.invoiceNo || null;
  const customerName = orderOrTx.customerName || orderOrTx.name || 'Pelanggan';
  const phone = orderOrTx.customerPhone || orderOrTx.whatsapp || orderOrTx.phone || '';
  const email = orderOrTx.customerEmail || orderOrTx.email || '';
  const brandModel = orderOrTx.phoneType || orderOrTx.brandModel || orderOrTx.deviceType || 'Smartphone';
  const serviceText = orderOrTx.serviceItem || orderOrTx.damageDescription || orderOrTx.damage || '';

  // Cari apakah akun member terdaftar
  let customerId = orderOrTx.customerId || null;
  if (!customerId && phone) {
    try {
      const { findCustomerByIdentifier } = require('./customerService');
      const registered = findCustomerByIdentifier(phone);
      if (registered) customerId = registered.id;
    } catch (_) {}
  }

  // Tentukan kebijakan garansi (Baterai 90 hari, Software 7 hari, Cas 14 hari, Hardware 30 hari)
  const policy = determineWarrantyPolicy(serviceText || brandModel);

  const startDate = orderOrTx.paidAt || orderOrTx.completedAt || orderOrTx.createdAt || new Date().toISOString();
  const start = new Date(startDate);
  const end = new Date(start.getTime() + policy.durationDays * 24 * 60 * 60 * 1000);

  // Buat kode garansi unik
  const cleanDigits = String(orderId || invoiceNo || Date.now()).replace(/\D/g, '').slice(-6) || Math.floor(100000 + Math.random() * 900000);
  const warrantyCode = `GAR-${policy.durationDays}D-${cleanDigits}`;

  // Cek apakah garansi sudah ada sebelumnya
  const existingIdx = list.findIndex(w => 
    (orderId && w.order_id === orderId) ||
    (invoiceNo && w.invoice_number === invoiceNo)
  );

  let record;
  if (existingIdx >= 0) {
    record = {
      ...list[existingIdx],
      customer_id: customerId || list[existingIdx].customer_id,
      customer_name: customerName || list[existingIdx].customer_name,
      customer_whatsapp: phone || list[existingIdx].customer_whatsapp,
      customer_email: email || list[existingIdx].customer_email,
      brand_model: brandModel || list[existingIdx].brand_model,
      service_item: serviceText || list[existingIdx].service_item,
      warranty_type_label: policy.label,
      duration_days: policy.durationDays,
      start_date: list[existingIdx].start_date || start.toISOString(),
      end_date: list[existingIdx].end_date || end.toISOString(),
      updated_at: new Date().toISOString()
    };
    list[existingIdx] = record;
  } else {
    record = {
      id: `WARR-${Date.now().toString().slice(-6)}-${cleanDigits}`,
      warranty_code: warrantyCode,
      order_id: orderId,
      invoice_number: invoiceNo,
      customer_id: customerId,
      customer_name: customerName,
      customer_whatsapp: phone,
      customer_email: email,
      device_type: orderOrTx.deviceType || 'Smartphone',
      brand_model: brandModel,
      service_item: serviceText,
      warranty_type_label: policy.label,
      duration_days: policy.durationDays,
      start_date: start.toISOString(),
      end_date: end.toISOString(),
      status: 'active',
      claim_status: 'none',
      claim_count: 0,
      claim_history: [],
      technician_notes: orderOrTx.technicianNotes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    list.unshift(record);
  }

  // Simpan ke localStore dan PostgreSQL
  warrantyCache = list;
  saveTable('warranties', list);
  await syncWarrantyToPostgres(record);

  // Catat ke log aktivitas audit
  try {
    db.logActivity('WARRANTY_RECORDED', 'warranties', record.id, {
      warrantyCode: record.warranty_code,
      orderId: record.order_id,
      invoiceNumber: record.invoice_number,
      customerName: record.customer_name,
      customerWhatsapp: record.customer_whatsapp,
      warrantyType: record.warranty_type_label,
      durationDays: record.duration_days
    });
  } catch (_) {}

  return enrichWarrantyCalculations(record);
}

// 11. Pengajuan Klaim Garansi oleh Pelanggan / Member
async function submitWarrantyClaim(warrantyIdOrCode, claimData) {
  const list = await ensureHydrated();
  const clean = String(warrantyIdOrCode || '').trim().toUpperCase();

  const idx = list.findIndex(w => 
    String(w.id || '').toUpperCase() === clean ||
    String(w.warranty_code || '').toUpperCase() === clean ||
    String(w.order_id || '').toUpperCase() === clean ||
    String(w.invoice_number || '').toUpperCase() === clean
  );

  if (idx < 0) {
    throw new Error(`Data garansi dengan kode / tiket "${warrantyIdOrCode}" tidak ditemukan.`);
  }

  const w = list[idx];
  const claimId = `CLM-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
  const nowIso = new Date().toISOString();

  const complaintText = String(claimData.complaint || claimData.issueComplaint || '').trim();
  if (!complaintText) {
    throw new Error('Keluhan atau kendala pada unit wajib dijelaskan.');
  }

  const claimEntry = {
    claimId,
    complaint: complaintText,
    claimMethod: claimData.claimMethod || 'Datang Langsung ke Workshop',
    customerName: claimData.customerName || w.customer_name,
    whatsapp: claimData.whatsapp || w.customer_whatsapp,
    claimedAt: nowIso,
    status: 'pending', // pending, approved, in_repair, resolved, rejected
    notes: claimData.notes || '',
    timeline: [
      {
        status: 'pending',
        timestamp: nowIso,
        title: 'Pengajuan Klaim Diterima',
        note: 'Klaim garansi dicatat dalam sistem dan menunggu peninjauan teknisi lab.'
      }
    ]
  };

  const updatedHistory = Array.isArray(w.claim_history) ? [...w.claim_history, claimEntry] : [claimEntry];

  w.claim_status = 'pending';
  w.claim_count = (Number(w.claim_count) || 0) + 1;
  w.claim_history = updatedHistory;
  w.updated_at = nowIso;

  list[idx] = w;
  warrantyCache = list;
  saveTable('warranties', list);
  await syncWarrantyToPostgres(w);

  // Catat ke log aktivitas audit
  try {
    db.logActivity('WARRANTY_CLAIM_SUBMITTED', 'warranties', w.id, {
      claimId,
      warrantyCode: w.warranty_code,
      orderId: w.order_id,
      customerName: w.customer_name,
      complaint: complaintText,
      claimedAt: nowIso
    });
  } catch (_) {}

  const enriched = enrichWarrantyCalculations(w);

  return {
    success: true,
    claimId,
    warranty: enriched,
    claimReceipt: claimEntry,
    message: 'Pengajuan klaim garansi resmi Anda berhasil dicatat dalam database lab workshop.'
  };
}

// 12. Update Status Klaim oleh Admin / Workshop Lab
async function updateClaimStatus(warrantyId, updateData) {
  const list = await ensureHydrated();
  const clean = String(warrantyId || '').trim();

  const idx = list.findIndex(w => w.id === clean || w.warranty_code === clean);
  if (idx < 0) {
    throw new Error(`Data garansi "${warrantyId}" tidak ditemukan.`);
  }

  const w = list[idx];
  const newStatus = updateData.claimStatus; // 'approved', 'in_repair', 'resolved', 'rejected', 'none'
  const technicianNotes = updateData.technicianNotes || '';
  const nowIso = new Date().toISOString();

  let history = Array.isArray(w.claim_history) ? [...w.claim_history] : [];
  if (history.length > 0) {
    const latestClaim = { ...history[history.length - 1] };
    latestClaim.status = newStatus;
    latestClaim.resolvedAt = ['resolved', 'rejected'].includes(newStatus) ? nowIso : latestClaim.resolvedAt;
    latestClaim.technicianNotes = technicianNotes || latestClaim.technicianNotes;

    const timeline = Array.isArray(latestClaim.timeline) ? [...latestClaim.timeline] : [];
    let title = 'Status Diperbarui';
    if (newStatus === 'approved') title = 'Klaim Disetujui';
    else if (newStatus === 'in_repair') title = 'Unit Dalam Pengerjaan Lab';
    else if (newStatus === 'resolved') title = 'Klaim Selesai Diganti / Diperbaiki';
    else if (newStatus === 'rejected') title = 'Klaim Ditolak / Tidak Memenuhi Syarat';

    timeline.push({
      status: newStatus,
      timestamp: nowIso,
      title,
      note: technicianNotes || `Status klaim diubah menjadi ${newStatus} oleh tim lab.`
    });

    latestClaim.timeline = timeline;
    history[history.length - 1] = latestClaim;
  }

  w.claim_status = newStatus;
  w.technician_notes = technicianNotes || w.technician_notes;
  w.claim_history = history;
  w.updated_at = nowIso;

  list[idx] = w;
  warrantyCache = list;
  saveTable('warranties', list);
  await syncWarrantyToPostgres(w);

  // Catat ke log aktivitas audit
  try {
    db.logActivity('WARRANTY_CLAIM_STATUS_UPDATED', 'warranties', w.id, {
      warrantyCode: w.warranty_code,
      claimStatus: newStatus,
      technicianNotes
    });
  } catch (_) {}

  return enrichWarrantyCalculations(w);
}

module.exports = {
  getAllWarranties,
  getWarrantiesByCustomer,
  findWarranty,
  createOrUpdateWarrantyForOrder,
  submitWarrantyClaim,
  updateClaimStatus,
  determineWarrantyPolicy
};

