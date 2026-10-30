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
    cashierName: txData.cashierName || 'Ibu Sarah (Meja 1)'
  };

  // Simpan ke PostgreSQL jika terhubung
  if (db.isDbConnected()) {
    db.query(`
      INSERT INTO transactions (id, order_id, invoice_number, customer_name, total_amount, payment_method, cashier, raw_data)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO NOTHING
    `, [
      newTx.id,
      newTx.ticketId,
      newTx.invoiceNumber,
      newTx.customerName,
      newTx.totalPaid,
      newTx.paymentMethod,
      newTx.cashierName,
      JSON.stringify(newTx)
    ]).catch(err => {
      console.warn('[FinanceService] PostgreSQL insert transactions error:', err.message);
    });
  }

  transactions.unshift(newTx);
  writeTransactions(transactions);

  // Otomatis catat ke buku kas keuangan
  await addFinancialRecord({
    ref: invoiceNumber,
    type: 'pemasukan',
    category: 'Jasa Servis Smartphone',
    description: `Pembayaran tiket ${newTx.ticketId} - ${newTx.phoneType} (${newTx.customerName}) via ${newTx.paymentMethod}`,
    debit: totalPaid,
    credit: 0,
    cashier: newTx.cashierName
  });

  return newTx;
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

  const mitras = userService.getMitraUsers();
  const mitraIdx = mitras.findIndex(u => (u.referralCode || '').toUpperCase() === cleanRef);

  let updatedMitra = null;
  if (mitraIdx !== -1) {
    mitras[mitraIdx].totalCommission = (mitras[mitraIdx].totalCommission || 0) + commNum;
    mitras[mitraIdx].lastActive = new Date().toLocaleString('id-ID');
    updatedMitra = mitras[mitraIdx];

    userService.saveMitraUsers(mitras);
  }

  return {
    success: true,
    referralCode: cleanRef,
    commissionAmount: commNum,
    updatedMitra
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
  recordMitraCommission
};
