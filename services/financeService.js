/**
 * NGALAM FIX PRO - Finance & Transaction Service
 * Mengelola pencatatan keuangan internal dan riwayat transaksi faktur kasir.
 * Terintegrasi ke PostgreSQL Database via services/db.js (dengan fallback data/ lokal).
 */

const fs = require('fs');
const path = require('path');
const db = require('./db');

const FINANCES_FILE = path.join(__dirname, '..', 'data', 'finances.json');
const TRANSACTIONS_FILE = path.join(__dirname, '..', 'data', 'transactions.json');
const CUSTOMERS_FILE = path.join(__dirname, '..', 'data', 'customers.json');
const userService = require('./userService');
const ORDERS_FILE = path.join(__dirname, '..', 'data', 'orders.json');

/**
 * Konfigurasi database sistem
 */
function getConfig() {
  const conn = db.getConnectionDetails();
  return {
    mode: 'postgresql',
    database: conn.database,
    host: conn.host,
    port: conn.port,
    user: conn.user,
    isConnected: db.isDbConnected(),
    databaseUrl: process.env.DATABASE_URL ? 'postgresql://***@' + conn.host + ':' + conn.port + '/' + conn.database : null,
    autoSync: true,
    lastSyncTime: new Date().toISOString()
  };
}

function saveConfig(updates = {}) {
  return { ...getConfig(), ...updates };
}

function getCredentialsInfo() {
  const isConnected = db.isDbConnected();
  return {
    exists: true,
    mode: 'postgresql',
    connected: isConnected,
    clientEmail: isConnected ? 'PostgreSQL Active (Live Connection)' : 'PostgreSQL Configured (.env Ready)',
    projectId: process.env.PGDATABASE || 'ngalam_fix_pro'
  };
}

/**
 * Baca file data lokal dengan pembersihan BOM aman
 */
function readCustomers() {
  try {
    if (fs.existsSync(CUSTOMERS_FILE)) {
      const raw = fs.readFileSync(CUSTOMERS_FILE, 'utf-8');
      return JSON.parse(raw.replace(/^\uFEFF/, ''));
    }
  } catch (err) {
    console.error('[FinanceService] Error reading customers.json:', err.message);
  }
  return [];
}

function readUsers() {
  return userService.getAllUsers();
}

function readOrders() {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const raw = fs.readFileSync(ORDERS_FILE, 'utf-8');
      return JSON.parse(raw.replace(/^\uFEFF/, ''));
    }
  } catch (err) {
    console.error('[FinanceService] Error reading orders.json:', err.message);
  }
  return [];
}

/**
 * Baca Catatan Keuangan (Kas Masuk & Keluar)
 */
function readFinances() {
  try {
    if (fs.existsSync(FINANCES_FILE)) {
      const raw = fs.readFileSync(FINANCES_FILE, 'utf-8');
      return JSON.parse(raw.replace(/^\uFEFF/, ''));
    }
  } catch (err) {
    console.error('[FinanceService] Error reading finances.json:', err.message);
  }
  return [];
}

/**
 * Tulis Catatan Keuangan ke JSON
 */
function writeFinances(list) {
  try {
    fs.writeFileSync(FINANCES_FILE, JSON.stringify(list, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[FinanceService] Error writing finances.json:', err.message);
    return false;
  }
}

/**
 * Baca Riwayat Transaksi Faktur / Nota Kasir
 */
function readTransactions() {
  try {
    if (fs.existsSync(TRANSACTIONS_FILE)) {
      const raw = fs.readFileSync(TRANSACTIONS_FILE, 'utf-8');
      return JSON.parse(raw.replace(/^\uFEFF/, ''));
    }
  } catch (err) {
    console.error('[FinanceService] Error reading transactions.json:', err.message);
  }
  return [];
}

/**
 * Helper: Memperkaya transaksi kasir dengan data garansi servis dan status klaim
 */
function enrichTransactionWarranty(tx, orderMap = null) {
  if (!tx) return tx;

  let serviceItem = tx.serviceItem || tx.serviceName || tx.damageDescription || '';
  let warrantyClaimStatus = tx.warrantyClaimStatus || 'unclaimed'; // 'unclaimed' (Belum Klaim) | 'claimed' (Sudah Klaim) | 'resolved' (Klaim Selesai)
  let warrantyClaimDate = tx.warrantyClaimDate || null;
  let warrantyClaimNotes = tx.warrantyClaimNotes || '';

  // 1. Cari data tiket servis terkait jika ada
  let matchedOrder = null;
  const cleanTicket = String(tx.ticketId || '').trim().toUpperCase();
  if (orderMap && cleanTicket) {
    matchedOrder = orderMap.get(cleanTicket);
  } else if (cleanTicket) {
    try {
      const orders = readOrders();
      matchedOrder = orders.find(o => o.id && String(o.id).trim().toUpperCase() === cleanTicket);
    } catch (_) {}
  }

  if (matchedOrder) {
    if (!serviceItem || serviceItem === 'ILMORA' || serviceItem === '-') {
      serviceItem = matchedOrder.damageDescription || matchedOrder.damage || (Array.isArray(matchedOrder.problemTags) ? matchedOrder.problemTags.join(', ') : '');
    }
    if (matchedOrder.warrantyClaimStatus && !tx.warrantyClaimStatus) {
      warrantyClaimStatus = matchedOrder.warrantyClaimStatus;
    }
    if (matchedOrder.warrantyClaimDate && !tx.warrantyClaimDate) {
      warrantyClaimDate = matchedOrder.warrantyClaimDate;
    }
    if (matchedOrder.warrantyClaimNotes && !tx.warrantyClaimNotes) {
      warrantyClaimNotes = matchedOrder.warrantyClaimNotes;
    }
  }

  // 2. Deduksi nama layanan cerdas jika masih kosong
  if (!serviceItem || serviceItem === 'ILMORA' || serviceItem === '-') {
    const cost = Number(tx.totalPaid || tx.amount || 0);
    const phone = String(tx.phoneType || '').toLowerCase();
    if (cost === 450000 || /iphone 15|iphone 14|iphone 13|iphone 12|iphone 11/i.test(phone) && cost <= 500000 && cost >= 400000) {
      serviceItem = 'Ganti Baterai Original 100% Health';
    } else if (cost >= 1000000) {
      serviceItem = 'Ganti Layar OLED / Super Retina Display';
    } else if (cost <= 250000) {
      serviceItem = 'Servis Port Cas & Konektor Charger';
    } else if (cost >= 700000) {
      serviceItem = 'Perbaikan Kamera OIS & Modul Sensor';
    } else {
      serviceItem = 'Perbaikan Hardware & Komponen Mesin';
    }
  }

  // 3. Tentukan durasi garansi berdasarkan komponen servis
  const sLower = serviceItem.toLowerCase();
  let warrantyDurationDays = 30;
  let warrantyTypeLabel = 'Garansi Hardware (30 Hari / 1 Bulan)';

  if (/baterai|battery|batre/i.test(sLower)) {
    warrantyDurationDays = 90;
    warrantyTypeLabel = 'Garansi Baterai Original (90 Hari / 3 Bulan)';
  } else if (/software|flash|bootloop|virus|sandi|pola/i.test(sLower)) {
    warrantyDurationDays = 7;
    warrantyTypeLabel = 'Garansi Software & OS (7 Hari / 1 Minggu)';
  } else if (/cas|charge|charger|port|konektor/i.test(sLower)) {
    warrantyDurationDays = 14;
    warrantyTypeLabel = 'Garansi Port Charger (14 Hari / 2 Minggu)';
  } else if (/layar|lcd|oled|retina|amoled|kaca/i.test(sLower)) {
    warrantyDurationDays = 30;
    warrantyTypeLabel = 'Garansi Layar & Kaca (30 Hari / 1 Bulan)';
  } else {
    warrantyDurationDays = 30;
    warrantyTypeLabel = 'Garansi Servis Resmi (30 Hari / 1 Bulan)';
  }

  // 4. Hitung tanggal mulai, tanggal kedaluwarsa, dan sisa hari garansi
  let startDate = new Date();
  if (tx.date) {
    const parsed = new Date(tx.date);
    if (!isNaN(parsed.getTime())) startDate = parsed;
  }
  const endDate = new Date(startDate.getTime() + (warrantyDurationDays * 24 * 60 * 60 * 1000));
  const today = new Date();

  const diffTime = endDate.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const isExpired = diffTime < 0;

  const formatDate = (d) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const warrantyValidUntil = formatDate(endDate);
  const warrantyStartDate = formatDate(startDate);

  const cleanNum = String(tx.ticketId || tx.invoiceNumber || '').replace(/[^0-9]/g, '').slice(-6) || '90D';
  const warrantyCode = tx.warrantyCode || `GAR-${warrantyDurationDays}D-${cleanNum}`;

  return {
    ...tx,
    serviceItem,
    warrantyDurationDays,
    warrantyTypeLabel,
    warrantyStartDate,
    warrantyValidUntil,
    daysRemaining,
    isExpired,
    warrantyCode,
    warrantyClaimStatus, // 'unclaimed' | 'claimed' | 'resolved'
    warrantyClaimDate,
    warrantyClaimNotes
  };
}

/**
 * Ambil seluruh transaksi kasir lengkap dengan kalkulasi garansi & status klaim
 */
function getAllTransactionsWithWarranty() {
  const transactions = readTransactions();
  let orderMap = new Map();
  try {
    const orders = readOrders();
    orders.forEach(o => {
      if (o.id) orderMap.set(String(o.id).trim().toUpperCase(), o);
    });
  } catch (_) {}

  return transactions.map(tx => enrichTransactionWarranty(tx, orderMap));
}

/**
 * Update Status Klaim Garansi pada Transaksi Faktur Kasir
 */
async function updateTransactionWarranty(invoiceOrId, updates = {}) {
  const transactions = readTransactions();
  const cleanKey = String(invoiceOrId).trim().toUpperCase();
  const idx = transactions.findIndex(t => 
    (t.invoiceNumber && t.invoiceNumber.toUpperCase() === cleanKey) ||
    (t.id && t.id.toUpperCase() === cleanKey) ||
    (t.ticketId && t.ticketId.toUpperCase() === cleanKey)
  );

  if (idx === -1) {
    throw new Error(`Transaksi dengan faktur "${invoiceOrId}" tidak ditemukan.`);
  }

  const target = transactions[idx];
  if (updates.warrantyClaimStatus) {
    target.warrantyClaimStatus = updates.warrantyClaimStatus;
  }
  if (updates.warrantyClaimNotes !== undefined) {
    target.warrantyClaimNotes = updates.warrantyClaimNotes;
  }
  if (updates.warrantyClaimDate !== undefined) {
    target.warrantyClaimDate = updates.warrantyClaimDate;
  } else if (updates.warrantyClaimStatus === 'claimed' && !target.warrantyClaimDate) {
    target.warrantyClaimDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
  if (updates.serviceItem) {
    target.serviceItem = updates.serviceItem;
  }
  target.updatedAt = new Date().toISOString();

  transactions[idx] = target;
  writeTransactions(transactions);

  // Sinkronkan ke tiket order terkait jika ada
  if (target.ticketId) {
    try {
      const { updateOrder } = require('./orderService');
      await updateOrder(target.ticketId, {
        warrantyClaimStatus: target.warrantyClaimStatus,
        warrantyClaimDate: target.warrantyClaimDate,
        warrantyClaimNotes: target.warrantyClaimNotes
      });
    } catch (_) {}
  }

  // Sinkronkan ke PostgreSQL jika terhubung
  if (db.isDbConnected()) {
    try {
      await db.query(`
        UPDATE transactions
        SET raw_data = $2
        WHERE UPPER(invoice_number) = $1 OR UPPER(id) = $1 OR UPPER(order_id) = $1
      `, [cleanKey, JSON.stringify(target)]);
    } catch (pgErr) {
      console.warn('[FinanceService] PostgreSQL update transaction warranty warning:', pgErr.message);
    }
  }

  // Rekam ke Log Audit Keamanan
  try {
    await db.logActivity('WARRANTY_CLAIM_STATUS_UPDATED', 'transactions', target.invoiceNumber, {
      invoiceNumber: target.invoiceNumber,
      ticketId: target.ticketId,
      customerName: target.customerName,
      serviceItem: target.serviceItem,
      warrantyClaimStatus: target.warrantyClaimStatus,
      warrantyClaimDate: target.warrantyClaimDate,
      warrantyClaimNotes: target.warrantyClaimNotes
    });
  } catch (_) {}

  return enrichTransactionWarranty(target);
}

/**
 * Tulis Riwayat Transaksi ke JSON
 */
function writeTransactions(list) {
  try {
    fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify(list, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[FinanceService] Error writing transactions.json:', err.message);
    return false;
  }
}

/**
 * Tambah Catatan Buku Kas (Pemasukan / Pengeluaran)
 */
async function addFinancialRecord(entry) {
  const finances = readFinances();
  const lastEntry = finances[finances.length - 1];
  const lastBalance = lastEntry && typeof lastEntry.balance === 'number' ? lastEntry.balance : 0;

  const debit = Math.max(0, parseInt(entry.debit, 10) || 0);
  const credit = Math.max(0, parseInt(entry.credit, 10) || 0);
  const newBalance = lastBalance + debit - credit;

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);

  const newRecord = {
    id: entry.id || `FIN-${todayStr}-${rand}`,
    date: entry.date || now.toISOString(),
    displayDate: entry.displayDate || now.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
    ref: entry.ref || `REF-${rand}`,
    type: entry.type === 'pengeluaran' ? 'pengeluaran' : 'pemasukan',
    category: entry.category || (entry.type === 'pengeluaran' ? 'Operasional' : 'Jasa Servis'),
    description: entry.description || 'Pencatatan keuangan workshop',
    debit: debit,
    credit: credit,
    balance: newBalance,
    cashier: entry.cashier || 'Ibu Sarah (Meja 1)'
  };

  // Simpan ke PostgreSQL jika terhubung
  if (db.isDbConnected()) {
    db.query(`
      INSERT INTO finances (id, type, category, amount, description, date, source, recorded_by, raw_data)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO NOTHING
    `, [
      newRecord.id,
      newRecord.type,
      newRecord.category,
      debit || credit,
      newRecord.description,
      newRecord.date,
      newRecord.ref,
      newRecord.cashier,
      JSON.stringify(newRecord)
    ]).catch(err => {
      console.warn('[FinanceService] PostgreSQL insert finances error:', err.message);
    });
  }

  finances.push(newRecord);
  writeFinances(finances);

  return newRecord;
}

/**
 * Format Tanggal & Jam Zona Waktu WIT (Jayapura / UTC+9)
 */
function getWitDisplayTime(dateInput = new Date()) {
  const d = (dateInput instanceof Date) ? dateInput : new Date(dateInput);
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  const dateStr = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jayapura'
  }).format(validDate);
  const timeStr = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jayapura'
  }).format(validDate).replace(/:/g, '.');
  return `${dateStr}, ${timeStr} WIT`;
}

/**
 * Nama Periode Bulan & Tahun WIT
 */
function getWitMonthYearPeriod(dateInput = new Date()) {
  const d = (dateInput instanceof Date) ? dateInput : new Date(dateInput);
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jayapura'
  }).format(validDate);
}

/**
 * Catat Transaksi Pembayaran Kasir (Faktur / Nota)
 */
async function recordNewTransaction(txData) {
  const transactions = readTransactions();
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);

  const txId = txData.id || `TRX-${dateStr}-${rand}`;
  const invoiceNumber = txData.invoiceNumber || `INV-${dateStr}-${rand}`;

  const baseCost = Math.max(0, parseInt(txData.baseCost, 10) || 0);
  const discount = Math.max(0, parseInt(txData.discount, 10) || 0);
  const deliveryFee = Math.max(0, parseInt(txData.deliveryFee, 10) || 0);
  const totalPaid = Math.max(0, parseInt(txData.totalPaid, 10) || (baseCost - discount + deliveryFee));
  const amountReceived = Math.max(0, parseInt(txData.amountReceived, 10) || totalPaid);
  const change = Math.max(0, parseInt(txData.change, 10) || (amountReceived - totalPaid));

  const newTx = {
    id: txId,
    invoiceNumber: invoiceNumber,
    date: txData.date || now.toISOString(),
    displayDate: txData.displayDate || getWitDisplayTime(now),
    ticketId: txData.ticketId || `NGF-${rand}`,
    customerName: txData.customerName || 'Pelanggan Meja 1',
    customerPhone: txData.customerPhone || '-',
    deviceType: txData.deviceType || 'Smartphone',
    phoneType: txData.phoneType || 'Smartphone',
    technicianName: txData.technicianName || 'Teknisi Lab Meja 1',
    baseCost: baseCost,
    discount: discount,
    promoCode: txData.promoCode || '-',
    deliveryFee: deliveryFee,
    totalPaid: totalPaid,
    paymentMethod: txData.paymentMethod || 'Tunai (Cash)',
    amountReceived: amountReceived,
    change: change,
    status: txData.status || 'Lunas',
    cashierName: txData.cashierName || 'Ibu Sarah (Meja 1)',
    serviceItem: txData.serviceItem || txData.serviceName || txData.damageDescription || '',
    warrantyClaimStatus: txData.warrantyClaimStatus || 'unclaimed',
    warrantyClaimDate: txData.warrantyClaimDate || null,
    warrantyClaimNotes: txData.warrantyClaimNotes || ''
  };

  const enrichedTx = enrichTransactionWarranty(newTx);

  // Simpan ke PostgreSQL jika terhubung
  if (db.isDbConnected()) {
    db.query(`
      INSERT INTO transactions (id, order_id, invoice_number, customer_name, total_amount, payment_method, cashier, raw_data)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO NOTHING
    `, [
      enrichedTx.id,
      enrichedTx.ticketId,
      enrichedTx.invoiceNumber,
      enrichedTx.customerName,
      enrichedTx.totalPaid,
      enrichedTx.paymentMethod,
      enrichedTx.cashierName,
      JSON.stringify(enrichedTx)
    ]).catch(err => {
      console.warn('[FinanceService] PostgreSQL insert transactions error:', err.message);
    });
  }

  transactions.unshift(enrichedTx);
  writeTransactions(transactions);

  // Otomatis catat ke buku kas keuangan
  await addFinancialRecord({
    ref: invoiceNumber,
    type: 'pemasukan',
    category: 'Jasa Servis Smartphone',
    description: `Pembayaran tiket ${enrichedTx.ticketId} - ${enrichedTx.phoneType} (${enrichedTx.customerName}) via ${enrichedTx.paymentMethod} [${enrichedTx.serviceItem || 'Servis'}]`,
    debit: totalPaid,
    credit: 0,
    cashier: enrichedTx.cashierName
  });

  return enrichedTx;
}

/**
 * Ringkasan Keuangan Eksekutif (Pemasukan, Pengeluaran, Laba Bersih, Metode Bayar)
 */
function getFinancialSummary() {
  const finances = readFinances();
  const transactions = readTransactions();

  let totalIncome = 0;
  let totalExpense = 0;

  finances.forEach((f) => {
    totalIncome += f.debit || 0;
    totalExpense += f.credit || 0;
  });

  const netProfit = totalIncome - totalExpense;
  const lastEntry = finances[finances.length - 1];
  const currentBalance = lastEntry && typeof lastEntry.balance === 'number' ? lastEntry.balance : netProfit;

  const methods = {
    qris: 0,
    cash: 0,
    transfer: 0,
    other: 0
  };

  transactions.forEach((tx) => {
    const m = (tx.paymentMethod || '').toLowerCase();
    const amt = tx.totalPaid || 0;
    if (m.includes('qris')) {
      methods.qris += amt;
    } else if (m.includes('tunai') || m.includes('cash')) {
      methods.cash += amt;
    } else if (m.includes('transfer') || m.includes('bca') || m.includes('bri') || m.includes('mandiri')) {
      methods.transfer += amt;
    } else {
      methods.other += amt;
    }
  });

  return {
    totalIncome,
    totalExpense,
    netProfit,
    currentBalance,
    transactionCount: transactions.length,
    paymentMethods: methods,
    period: getWitMonthYearPeriod(),
    currentTimeWit: getWitDisplayTime()
  };
}

/**
 * Generator Kode Referral Unik Mitra Driver Ojol
 */
function generateMitraCode(name = 'MITRA') {
  const clean = name.trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5) || 'MITRA';
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `MTR-${clean}-${rand}`;
}

/**
 * Catat Penambahan Komisi Afiliasi Mitra
 */
async function recordMitraCommission(refCode, commissionAmount, orderId = '') {
  const cleanRef = String(refCode || '').trim().toUpperCase();
  const commNum = Math.max(0, parseInt(commissionAmount, 10) || 0);
  if (!cleanRef || commNum <= 0) return null;

  try {
    await userService.refreshUsersFromDb();
  } catch (_) {}

  const allUsers = userService.getAllUsers();
  const targetMitra = allUsers.find(u => 
    (u.referralCode && String(u.referralCode).toUpperCase() === cleanRef) ||
    (u.referral_code && String(u.referral_code).toUpperCase() === cleanRef) ||
    (u.username && String(u.username).toUpperCase() === cleanRef) ||
    (u.id && String(u.id).toUpperCase() === cleanRef)
  );

  let updatedMitra = null;
  if (targetMitra) {
    const newTotal = (Number(targetMitra.totalCommission) || 0) + commNum;
    const newBalance = (Number(targetMitra.balance) || 0) + commNum;
    const lastActive = new Date().toLocaleString('id-ID');

    const history = Array.isArray(targetMitra.commissionHistory) ? [...targetMitra.commissionHistory] : [];
    const historyItem = {
      orderId,
      amount: commNum,
      type: 'credit',
      date: new Date().toISOString(),
      note: `Komisi bagi hasil nota order ${orderId}`
    };
    history.push(historyItem);

    updatedMitra = await userService.updateUserById(targetMitra.id, {
      totalCommission: newTotal,
      balance: newBalance,
      lastActive,
      commissionHistory: history
    });

    // Sync langsung ke tabel commissions di basis data PostgreSQL
    try {
      const db = require('./db');
      if (db.isDbConnected()) {
        await db.query(`
          INSERT INTO commissions (referral_code, order_id, commission_amount, status, raw_data, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
        `, [
          cleanRef,
          orderId,
          commNum,
          'Tercatat',
          JSON.stringify({
            mitraId: targetMitra.id,
            mitraName: targetMitra.name,
            phone: targetMitra.phone,
            orderId,
            amount: commNum,
            type: 'credit',
            note: `Komisi bagi hasil nota order ${orderId}`,
            createdAt: new Date().toISOString()
          })
        ]);

        await db.logActivity('COMMISSION_RECORDED', 'commissions', orderId, {
          referralCode: cleanRef,
          orderId,
          amount: commNum,
          mitraName: targetMitra.name
        });
      }
    } catch (pgCommErr) {
      console.warn('[FinanceService] Error inserting into commissions table:', pgCommErr.message);
    }
  }

  return {
    success: Boolean(updatedMitra),
    referralCode: cleanRef,
    amount: commNum,
    orderId,
    mitra: updatedMitra
  };
}

/**
 * Payout / Tarik Saldo Komisi Mitra oleh Kasir / Admin
 */
async function payoutMitraCommission(refCode, amount = null, note = 'Pencairan komisi kasir') {
  const cleanRef = String(refCode || '').trim().toUpperCase();
  if (!cleanRef) return null;

  try {
    await userService.refreshUsersFromDb();
  } catch (_) {}

  const mitras = userService.getMitraUsers();
  const mitraIdx = mitras.findIndex(u => (u.referralCode || u.referral_code || '').toUpperCase() === cleanRef);
  if (mitraIdx === -1) return null;

  const currentBalance = mitras[mitraIdx].balance !== undefined ? Number(mitras[mitraIdx].balance) : Math.max(0, (Number(mitras[mitraIdx].totalCommission) || 0) - (Number(mitras[mitraIdx].withdrawnCommission) || 0));
  const payoutAmount = amount !== null ? Math.min(currentBalance, Math.max(0, parseInt(amount, 10) || 0)) : currentBalance;

  if (payoutAmount <= 0) {
    return {
      success: false,
      message: 'Saldo komisi mitra Rp 0 atau tidak mencukupi untuk ditarik.',
      mitra: mitras[mitraIdx]
    };
  }

  mitras[mitraIdx].balance = Math.max(0, currentBalance - payoutAmount);
  mitras[mitraIdx].withdrawnCommission = (Number(mitras[mitraIdx].withdrawnCommission) || 0) + payoutAmount;
  mitras[mitraIdx].lastPayoutAt = new Date().toLocaleString('id-ID');

  if (!Array.isArray(mitras[mitraIdx].commissionHistory)) {
    mitras[mitraIdx].commissionHistory = [];
  }
  const historyItem = {
    amount: payoutAmount,
    type: 'debit',
    date: new Date().toISOString(),
    note
  };
  mitras[mitraIdx].commissionHistory.push(historyItem);

  await userService.saveMitraUsers(mitras);

  // Catat pencairan komisi ke PostgreSQL (tabel commissions & finances)
  try {
    const db = require('./db');
    if (db.isDbConnected()) {
      const payoutId = `PAYOUT-${Date.now()}`;
      await db.query(`
        INSERT INTO commissions (referral_code, order_id, commission_amount, status, raw_data, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [
        cleanRef,
        payoutId,
        payoutAmount,
        'Dicairkan',
        JSON.stringify({
          mitraId: mitras[mitraIdx].id,
          mitraName: mitras[mitraIdx].name,
          payoutAmount,
          note,
          type: 'debit',
          createdAt: new Date().toISOString()
        })
      ]);

      // Catat ke buku kas pengeluaran
      await db.query(`
        INSERT INTO finances (id, type, category, amount, description, date, source, recorded_by, raw_data, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      `, [
        payoutId,
        'expense',
        'Komisi Afiliasi Mitra',
        payoutAmount,
        `Pencairan komisi mitra ${mitras[mitraIdx].name} (${cleanRef}): ${note}`,
        new Date().toISOString().split('T')[0],
        'Kasir Workshop',
        'Admin Workshop',
        JSON.stringify({
          mitraId: mitras[mitraIdx].id,
          mitraName: mitras[mitraIdx].name,
          referralCode: cleanRef,
          amount: payoutAmount
        })
      ]);

      await db.logActivity('COMMISSION_PAYOUT', 'commissions', cleanRef, {
        referralCode: cleanRef,
        payoutAmount,
        mitraName: mitras[mitraIdx].name,
        note
      });
    }
  } catch (pgErr) {
    console.warn('[FinanceService] Error recording payout to database:', pgErr.message);
  }

  return {
    success: true,
    message: `Pencairan komisi sebesar Rp ${payoutAmount.toLocaleString('id-ID')} untuk mitra ${mitras[mitraIdx].name} berhasil dicatat.`,
    payoutAmount,
    mitra: mitras[mitraIdx]
  };
}

module.exports = {
  getConfig,
  saveConfig,
  getCredentialsInfo,
  readFinances,
  writeFinances,
  addFinancialRecord,
  readTransactions,
  writeTransactions,
  recordNewTransaction,
  readCustomers,
  readUsers,
  readOrders,
  getFinancialSummary,
  getWitMonthYearPeriod,
  getWitDisplayTime,
  generateMitraCode,
  recordMitraCommission,
  payoutMitraCommission,
  enrichTransactionWarranty,
  getAllTransactionsWithWarranty,
  updateTransactionWarranty
};
