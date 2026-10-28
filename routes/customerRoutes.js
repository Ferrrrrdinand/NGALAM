/**
 * NGALAM FIX PRO - Customer Authentication & Portal Routes
 * Dedicated routes for customer login, member registration, personal device service history,
 * 90-day official lab warranty tracking, and Google Spreadsheet (DataCustomer) synchronization.
 */

const express = require('express');
const router = express.Router();
const { getAllOrders } = require('../services/googleSheets');
const {
  findCustomerByIdentifier,
  registerNewCustomer,
  getAllCustomers,
  syncCustomersWithGoogleSpreadsheet,
} = require('../services/customerService');
const { readTransactions, getConfig } = require('../services/financeService');

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
 * Helper untuk mengambil seluruh riwayat servis gabungan (Orders + POS Transactions)
 */
async function getCombinedCustomerOrders(cleanId, cleanDigits) {
  const rawOrders = await getAllOrders();
  const rawTransactions = readTransactions();

  const matched = [];
  const seenIds = new Set();

  // 1. Dari data orders.json / Google Sheets TiketServis
  rawOrders.forEach(o => {
    const id = (o.id || '').toLowerCase();
    const wa = (o.whatsapp || o.customerWa || o.phone || o.customerPhone || '').replace(/\D/g, '');
    const email = (o.email || '').toLowerCase();

    let isMatch = false;
    if (id === cleanId || id.includes(cleanId)) isMatch = true;
    if (cleanDigits && cleanDigits.length >= 6 && wa.includes(cleanDigits)) isMatch = true;
    if (email && cleanId && email === cleanId) isMatch = true;

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

    const wa = (tx.customerPhone || '').replace(/\D/g, '');
    const name = (tx.customerName || '').toLowerCase();

    let isMatch = false;
    if (ticketId.toLowerCase() === cleanId) isMatch = true;
    if (cleanDigits && cleanDigits.length >= 6 && wa.includes(cleanDigits)) isMatch = true;

    if (isMatch) {
      seenIds.add(ticketId);
      matched.push({
        id: ticketId,
        customerName: tx.customerName || 'Pelanggan Ngalam Fix Pro',
        whatsapp: tx.customerPhone || '-',
        email: '',
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
    const { name, whatsapp, email = '', district = 'Klojen, Kota Malang', pin = '123456' } = req.body;
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
      registeredVia: 'Portal Pelanggan Web'
    });

    const cleanDigits = cleanWa.replace(/\D/g, '');
    const matched = await getCombinedCustomerOrders(cleanWa.toLowerCase(), cleanDigits);
    const formattedList = matched.map(formatCustomerOrder);
    const activeWarrantiesCount = formattedList.filter(o => o.warranty && o.warranty.isActive).length;

    const customerSession = {
      isCustomer: true,
      name: newCust.name,
      whatsapp: newCust.whatsapp,
      email: newCust.email,
      district: newCust.district,
      totalOrders: formattedList.length,
      activeOrders: formattedList.filter(o => o.step < 5).length,
      completedOrders: formattedList.filter(o => o.step >= 5).length,
      activeWarranties: activeWarrantiesCount,
      spreadsheetConnected: true,
      token: 'CUST-TOKEN-' + Math.random().toString(36).substring(2, 12),
      loginAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: `Registrasi berhasil! Akun Anda terhubung ke Google Spreadsheet DataCustomer. Selamat bergabung, ${newCust.name}!`,
      customer: customerSession,
      orders: formattedList,
      spreadsheetSync: {
        connected: true,
        sheetName: 'DataCustomer'
      }
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
    const cleanDigits = cleanId.replace(/\D/g, '');

    if (!cleanId) {
      return res.status(400).json({ success: false, message: 'Nomor WhatsApp atau Email wajib diisi.' });
    }

    const { authCustomerViaGoogleSheets } = require('../services/financeService');
    const sheetAuth = await authCustomerViaGoogleSheets(cleanId, pin);

    // Wajib dicek di Google Spreadsheet (DataCustomer) terlebih dahulu. Jika tidak ada -> DITOLAK MASUK!
    if (!sheetAuth || !sheetAuth.success) {
      return res.status(403).json({
        success: false,
        needRegister: true,
        message: (sheetAuth && sheetAuth.message) || 'Akses Ditolak: Akun Anda belum terdaftar di Google Spreadsheet DataCustomer. Silakan lakukan registrasi akun terlebih dahulu.'
      });
    }

    const registeredCust = sheetAuth.customer || findCustomerByIdentifier(cleanId);
    const matchedOrders = await getCombinedCustomerOrders(cleanId, cleanDigits);

    const formattedList = matchedOrders.map(formatCustomerOrder);
    const activeWarrantiesCount = formattedList.filter(o => o.warranty && o.warranty.isActive).length;

    const customerSession = {
      isCustomer: true,
      name: registeredCust.name,
      whatsapp: registeredCust.whatsapp,
      email: registeredCust.email,
      district: registeredCust.district,
      totalOrders: formattedList.length,
      activeOrders: formattedList.filter((o) => o.step < 5).length,
      completedOrders: formattedList.filter((o) => o.step >= 5).length,
      activeWarranties: activeWarrantiesCount,
      spreadsheetConnected: true,
      token: 'CUST-TOKEN-' + Math.random().toString(36).substring(2, 12),
      loginAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: `Selamat datang kembali, ${registeredCust.name}! Data akun dan riwayat servis Anda tersinkron dengan Google Spreadsheet.`,
      customer: customerSession,
      orders: formattedList,
      spreadsheetSync: {
        connected: true,
        sheetName: 'DataCustomer'
      }
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

// POST /api/customer/sync-spreadsheet
// Sinkronisasi paksa seluruh akun pelanggan ke Google Spreadsheet tab "DataCustomer"
router.post('/sync-spreadsheet', async (req, res) => {
  try {
    const result = await syncCustomersWithGoogleSpreadsheet();
    res.json({
      success: true,
      message: 'Seluruh data akun pelanggan berhasil disinkronkan ke Google Spreadsheet sheet "DataCustomer".',
      data: result
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal sinkronisasi ke spreadsheet: ' + err.message });
  }
});

// GET /api/customer/spreadsheet-status
router.get('/spreadsheet-status', (req, res) => {
  const cfg = getConfig();
  const customers = getAllCustomers();
  res.json({
    success: true,
    connected: !!cfg.appsScriptUrl || !!cfg.customersSpreadsheetId,
    appsScriptActive: !!cfg.appsScriptUrl,
    sheetName: cfg.customersSheetName || 'DataCustomer',
    totalCustomersCount: customers.length,
    lastSyncTime: cfg.lastSyncTime
  });
});

module.exports = router;
module.exports.formatCustomerOrder = formatCustomerOrder;
module.exports.calculateWarranty = calculateWarranty;
