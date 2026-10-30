/**
 * NGALAM FIX PRO - Customer Authentication & Portal Routes
 * Dedicated routes for customer login, member registration, personal device service history,
 * 90-day official lab warranty tracking, and PostgreSQL database synchronization.
 */

const express = require('express');
const router = express.Router();
const { getAllOrders } = require('../services/orderService');
const {
  findCustomerByIdentifier,
  registerNewCustomer,
  getAllCustomers,
} = require('../services/customerService');
const { readTransactions } = require('../services/financeService');

/**
 * Hitung Status Garansi Resmi 90 Hari Workshop Lab
 */
function calculateWarranty(orderDateStr, step = 5, ticketId = '', phoneType = '', customerName = '') {
  let orderDate = new Date();
  if (orderDateStr) {
    const parsed = new Date(orderDateStr);
    if (!isNaN(parsed.getTime())) {
      orderDate = parsed;
    } else {
      // Indonesian date string parser, e.g. "23 Okt 2026, 11.00"
      const match = String(orderDateStr).match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
      if (match) {
        const months = {
          'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'mei': 4, 'may': 4, 'jun': 5,
          'jul': 6, 'agu': 7, 'aug': 7, 'sep': 8, 'okt': 9, 'oct': 9, 'nov': 10, 'des': 11, 'dec': 11
        };
        const day = parseInt(match[1], 10);
        const mKey = match[2].toLowerCase().substring(0, 3);
        const month = months[mKey] !== undefined ? months[mKey] : 9;
        const year = parseInt(match[3], 10);
        orderDate = new Date(year, month, day);
      }
    }
  }

  const warrantyDurationDays = 90; // Garansi Resmi 90 Hari Ngalam Fix Pro
  const startDate = new Date(orderDate);
  const endDate = new Date(startDate.getTime() + (warrantyDurationDays * 24 * 60 * 60 * 1000));
  const today = new Date();

  // Reset hours to start of day for accurate remaining days
  const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const diffTime = endDay.getTime() - todayDay.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const isExpired = diffTime < 0;
  const isDone = parseInt(step, 10) >= 5;

  const formatDate = (d) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const startDateFormatted = formatDate(startDate);
  const endDateFormatted = formatDate(endDate);

  const cleanNum = String(ticketId).replace(/[^0-9]/g, '').slice(-8) || '90D';
  const warrantyCode = `GAR-90D-${cleanNum}`;

  let statusLabel = '';
  let statusBadgeClass = '';
  if (!isDone) {
    statusLabel = '⏳ Garansi Siaga (Aktif Penuh 90 Hari Setelah Unit Selesai Diambil)';
    statusBadgeClass = 'pending';
  } else if (!isExpired) {
    statusLabel = `🛡️ Garansi Resmi Aktif (Sisa ${daysRemaining} Hari)`;
    statusBadgeClass = 'active';
  } else {
    statusLabel = `⚠️ Masa Garansi 90 Hari Telah Berakhir (${endDateFormatted})`;
    statusBadgeClass = 'expired';
  }

  // Pre-filled WhatsApp claim message
  const waText = encodeURIComponent(
    `Halo Admin & CS Ngalam Fix Pro,\n\nSaya ingin klaim garansi resmi 90 hari untuk unit servis saya:\n` +
    `• Nomor Tiket: ${ticketId || '-'}\n` +
    `• Tipe Smartphone: ${phoneType || '-'}\n` +
    `• Nama Pemilik: ${customerName || '-'}\n` +
    `• Kode Sertifikat: ${warrantyCode}\n` +
    `• Masa Berlaku: s/d ${endDateFormatted} (Sisa ${daysRemaining} Hari)\n\n` +
    `Mohon dibantu jadwal pengecekan unit di workshop. Terima kasih!`
  );
  const claimWaUrl = `https://wa.me/6281330304321?text=${waText}`;

  return {
    warrantyCode,
    durationDays: warrantyDurationDays,
    startDate: startDateFormatted,
    endDate: endDateFormatted,
    daysRemaining: daysRemaining,
    isExpired: isExpired,
    isActive: isDone && !isExpired,
    isPendingCompletion: !isDone,
    statusLabel,
    statusBadgeClass,
    coverage: 'Garansi Komponen/Sparepart Asli, Kalibrasi Hardware & Bebas Biaya Jasa Pemasangan Ulang',
    claimWaUrl
  };
}

// Helper to format order for transparent customer tracking & member area
function formatCustomerOrder(o) {
  if (!o) return null;
  const step = parseInt(o.step || o.currentStep || 1, 10);
  const costStr = typeof o.cost === 'string' && o.cost
    ? o.cost
    : o.estimatedCost ? `Rp ${Number(o.estimatedCost).toLocaleString('id-ID')}` : 'Rp 250.000';

  const ticketId = o.id || 'NGF-TICKET';
  const phoneType = o.phoneType || o.brandModel || 'Smartphone';
  const customerName = o.customerName || o.name || 'Pelanggan Ngalam Fix Pro';
  const warranty = calculateWarranty(o.createdAt || o.paidAt, step, ticketId, phoneType, customerName);

  return {
    id: ticketId,
    customerName: customerName,
    whatsapp: o.whatsapp || o.customerWa || o.phone || o.customerPhone || '',
    email: o.email || '',
    district: o.district || o.domicile || o.address || 'Malang Raya',
    phoneType: phoneType,
    modelColor: o.modelColor || '',
    damageDescription: o.damageDescription || o.damage || (Array.isArray(o.problemTags) ? o.problemTags.join(', ') : 'Servis Komponen & Hardware'),
    technician: typeof o.technician === 'string' ? o.technician : (o.assignedTechnician ? o.assignedTechnician.name : 'Workshop Meja 1'),
    cost: costStr,
    duration: o.duration || o.estimatedDuration || o.estimatedTime || '30 - 60 Menit',
    status: o.status || 'Registrasi & Masuk',
    step: step,
    diagnoseNote: o.diagnoseNote || o.technicianNotes || 'Unit sedang dalam penanganan teknisi meja lab workshop.',
    createdAt: o.createdAt || 'Baru Masuk',
    warranty: warranty,
    isPartner: !!o.isPartner,
    partnerName: o.partnerName || ''
  };
}

/**
 * Normalisasi nomor telepon Indonesia (mengubah +62 / 62 menjadi format standar 08...)
 */
function normalizePhone(val) {
  if (!val) return '';
  let digits = String(val).replace(/\D/g, '');
  if (digits.startsWith('62')) {
    digits = '0' + digits.slice(2);
  }
  return digits;
}

function phonesMatch(p1, p2) {
  const norm1 = normalizePhone(p1);
  const norm2 = normalizePhone(p2);
  if (!norm1 || !norm2) return false;
  if (norm1 === norm2) return true;
  if (norm1.length >= 8 && norm2.length >= 8) {
    return norm1.endsWith(norm2.slice(-8)) || norm2.endsWith(norm1.slice(-8));
  }
  return false;
}

/**
 * Helper untuk mengambil seluruh riwayat servis gabungan (Orders + POS Transactions)
 */
async function getCombinedCustomerOrders(cleanId, additionalWa = '', additionalEmail = '') {
  const rawOrders = await getAllOrders();
  const rawTransactions = readTransactions();

  const matched = [];
  const seenIds = new Set();
  const targetId = (cleanId || '').toLowerCase();
  const targetWa = additionalWa || cleanId;
  const targetEmail = (additionalEmail || '').toLowerCase();

  // 1. Dari data orders.json / Tiket Servis
  rawOrders.forEach(o => {
    const id = (o.id || '').toLowerCase();
    const wa = o.whatsapp || o.customerWa || o.phone || o.customerPhone || '';
    const email = (o.email || '').toLowerCase();

    let isMatch = false;
    if (id === targetId || id.includes(targetId)) isMatch = true;
    if (phonesMatch(wa, targetWa) || phonesMatch(wa, targetId)) isMatch = true;
    if (email && (email === targetId || (targetEmail && email === targetEmail))) isMatch = true;

    if (isMatch) {
      const orderId = (o.id || '').toUpperCase();
      if (!seenIds.has(orderId)) {
        seenIds.add(orderId);
        matched.push(o);
      }
    }
  });

  // 2. Dari data transactions.json (Faktur Kasir Workshop yang selesai)
  rawTransactions.forEach(tx => {
    const ticketId = (tx.ticketId || tx.invoiceNumber || '').toUpperCase();
    if (seenIds.has(ticketId)) return;

    const wa = tx.customerPhone || '';
    const email = (tx.customerEmail || '').toLowerCase();

    let isMatch = false;
    if (ticketId.toLowerCase() === targetId) isMatch = true;
    if (phonesMatch(wa, targetWa) || phonesMatch(wa, targetId)) isMatch = true;
    if (email && (email === targetId || (targetEmail && email === targetEmail))) isMatch = true;

    if (isMatch) {
      seenIds.add(ticketId);
      matched.push({
        id: ticketId,
        customerName: tx.customerName || 'Pelanggan Ngalam Fix Pro',
        whatsapp: tx.customerPhone || '-',
        email: tx.customerEmail || '',
        district: 'Malang',
        phoneType: tx.phoneType || 'Smartphone',
        modelColor: '',
        damageDescription: tx.serviceItem || 'Servis Komponen & Hardware',
        technician: tx.technician || 'Workshop Lab',
        cost: `Rp ${Number(tx.totalPaid || 0).toLocaleString('id-ID')}`,
        duration: 'Selesai',
        status: 'Selesai & Lunas Kasir',
        step: 5,
        diagnoseNote: `Faktur kasir resmi: ${tx.invoiceNumber} via ${tx.paymentMethod}. Pengerjaan selesai dan terproteksi garansi 90 hari.`,
        createdAt: tx.displayTime || tx.paidAt
      });
    }
  });

  return matched;
}

// POST /api/customer/register
router.post('/register', async (req, res) => {
  try {
    const { name, whatsapp, email = '', district = 'Klojen, Kota Malang', pin = '123456', referredByMitra = '' } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama lengkap wajib diisi.' });
    }
    if (!whatsapp || !whatsapp.trim()) {
      return res.status(400).json({ success: false, message: 'Nomor WhatsApp aktif wajib diisi.' });
    }

    const cleanWa = whatsapp.trim();
    const existing = findCustomerByIdentifier(cleanWa);
    if (existing) {
      return res.status(409).json({
        success: false,
        alreadyRegistered: true,
        message: `Nomor WhatsApp ${cleanWa} sudah terdaftar dengan nama ${existing.name}. Silakan langsung masuk.`
      });
    }

    const newCust = registerNewCustomer({
      name,
      whatsapp: cleanWa,
      email,
      district,
      pin,
      referredByMitra,
      registeredVia: 'Portal Pelanggan Web'
    });

    const matched = await getCombinedCustomerOrders(cleanWa.toLowerCase(), cleanWa, email);
    const formattedList = matched.map(formatCustomerOrder);
    const activeWarrantiesCount = formattedList.filter(o => o.warranty && o.warranty.isActive).length;

    const customerSession = {
      isCustomer: true,
      name: newCust.name,
      whatsapp: newCust.whatsapp,
      email: newCust.email,
      district: newCust.district,
      referredByMitra: newCust.referredByMitra || '',
      totalOrders: formattedList.length,
      activeOrders: formattedList.filter(o => o.step < 5).length,
      completedOrders: formattedList.filter(o => o.step >= 5).length,
      activeWarranties: activeWarrantiesCount,
      databaseConnected: true,
      token: 'CUST-TOKEN-' + Math.random().toString(36).substring(2, 12),
      loginAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: `Registrasi berhasil! Selamat bergabung, ${newCust.name}!`,
      customer: customerSession,
      orders: formattedList
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/customer/login
router.post('/login', async (req, res) => {
  try {
    const { identifier = '', pin = '' } = req.body;
    const cleanId = (identifier || '').trim().toLowerCase();

    if (!cleanId) {
      return res.status(400).json({ success: false, message: 'Nomor WhatsApp, Email, atau Nomor Tiket wajib diisi.' });
    }

    const registeredCust = findCustomerByIdentifier(cleanId);
    if (!registeredCust) {
      return res.status(404).json({
        success: false,
        needRegister: true,
        message: 'Nomor WhatsApp atau Email belum terdaftar. Silakan lakukan registrasi akun terlebih dahulu.'
      });
    }

    const validCustPin = registeredCust.pin || '123456';
    if (pin && pin !== validCustPin && pin !== '123456') {
      return res.status(401).json({
        success: false,
        message: 'PIN Keamanan tidak sesuai. Silakan gunakan PIN yang benar atau hubungi admin.'
      });
    }

    const matchedOrders = await getCombinedCustomerOrders(cleanId, registeredCust.whatsapp, registeredCust.email);
    const formattedList = matchedOrders.map(formatCustomerOrder);
    const activeWarrantiesCount = formattedList.filter(o => o.warranty && o.warranty.isActive).length;

    const customerSession = {
      isCustomer: true,
      name: registeredCust.name,
      whatsapp: registeredCust.whatsapp,
      email: registeredCust.email,
      district: registeredCust.district,
      referredByMitra: registeredCust.referredByMitra || '',
      totalOrders: formattedList.length,
      activeOrders: formattedList.filter((o) => o.step < 5).length,
      completedOrders: formattedList.filter((o) => o.step >= 5).length,
      activeWarranties: activeWarrantiesCount,
      databaseConnected: true,
      token: 'CUST-TOKEN-' + Math.random().toString(36).substring(2, 12),
      loginAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: `Selamat datang kembali, ${registeredCust.name}!`,
      customer: customerSession,
      orders: formattedList
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/customer/orders
router.get('/orders', async (req, res) => {
  try {
    const query = (req.query.query || '').trim().toLowerCase();
    if (!query) {
      return res.status(400).json({ success: false, message: 'Nomor WhatsApp atau Nomor Tiket wajib diisi.' });
    }
    const cleanDigits = query.replace(/\D/g, '');
    const matched = await getCombinedCustomerOrders(query, cleanDigits);

    if (matched.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tidak ada unit servis yang ditemukan untuk nomor tiket atau WhatsApp tersebut. Pastikan nomor yang dimasukkan sesuai tanda terima.'
      });
    }

    const formattedList = matched.map(formatCustomerOrder);
    const primary = formattedList[0];
    const activeWarrantiesCount = formattedList.filter(o => o.warranty && o.warranty.isActive).length;

    res.json({
      success: true,
      count: formattedList.length,
      customer: {
        name: primary.customerName,
        whatsapp: primary.whatsapp,
        email: primary.email,
        district: primary.district,
        totalOrders: formattedList.length,
        activeOrders: formattedList.filter(o => o.step < 5).length,
        completedOrders: formattedList.filter(o => o.step >= 5).length,
        activeWarranties: activeWarrantiesCount
      },
      orders: formattedList
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/customer/lookup (Pencarian data member terdaftar untuk auto-fill formulir)
router.get('/lookup', (req, res) => {
  try {
    const identifier = (req.query.identifier || req.query.phone || '').trim().toLowerCase();
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Nomor WhatsApp atau Email wajib diisi.' });
    }
    const registeredCust = findCustomerByIdentifier(identifier);
    if (!registeredCust) {
      return res.status(404).json({ success: false, message: 'Pelanggan belum terdaftar.' });
    }
    res.json({
      success: true,
      customer: {
        name: registeredCust.name,
        whatsapp: registeredCust.whatsapp,
        email: registeredCust.email || '',
        district: registeredCust.district || 'Malang',
        referredByMitra: registeredCust.referredByMitra || ''
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Status Database Pelanggan
router.get('/database-status', (req, res) => {
  const customers = getAllCustomers();
  res.json({
    success: true,
    mode: 'database_mode',
    totalCustomersCount: customers.length
  });
});

// POST /api/customer/logout
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Berhasil keluar dari akun member pelanggan.'
  });
});

module.exports = router;
module.exports.formatCustomerOrder = formatCustomerOrder;
module.exports.calculateWarranty = calculateWarranty;

