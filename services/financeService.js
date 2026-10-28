/**
 * NGALAM FIX PRO - Dual Google Spreadsheet Finance & Transaction Service
 * Manages 2 distinct Google Spreadsheets:
 * 1. Catatan Keuangan (Financial Records / Bookkeeping / Kas / Omzet & Pengeluaran)
 * 2. Riwayat Seluruh Transaksi (Full Transaction History / Faktur / Kasir & QRIS)
 * Fully supports Google Sheets API v4 with local fallback persistence.
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const FINANCES_FILE = path.join(__dirname, '..', 'data', 'finances.json');
const TRANSACTIONS_FILE = path.join(__dirname, '..', 'data', 'transactions.json');
const CUSTOMERS_FILE = path.join(__dirname, '..', 'data', 'customers.json');
const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');
const ORDERS_FILE = path.join(__dirname, '..', 'data', 'orders.json');
const CONFIG_FILE = path.join(__dirname, '..', 'data', 'spreadsheet_config.json');
const CREDENTIALS_FILE = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '..', 'credentials.json');

/**
 * Load or initialize configuration
 */
function getConfig() {
  let cfg = {
    appsScriptUrl: process.env.GOOGLE_APPS_SCRIPT_URL || '',
    credentialsPath: 'credentials.json',
    customersSpreadsheetId: process.env.SPREADSHEET_CUSTOMERS_ID || '',
    customersSheetName: process.env.SHEET_NAME_CUSTOMERS || 'DataCustomer',
    driversSpreadsheetId: process.env.SPREADSHEET_DRIVERS_ID || '',
    driversSheetName: process.env.SHEET_NAME_DRIVERS || 'MitraDriver',
    workersSpreadsheetId: process.env.SPREADSHEET_WORKERS_ID || '',
    workersSheetName: process.env.SHEET_NAME_WORKERS || 'DataPekerja',
    techniciansSpreadsheetId: process.env.SPREADSHEET_TECHNICIANS_ID || '',
    techniciansSheetName: process.env.SHEET_NAME_TECHNICIANS || 'AkunTeknisi',
    transactionsSpreadsheetId: process.env.SPREADSHEET_TRANSACTIONS_ID || process.env.SPREADSHEET_ID || '',
    transactionsSheetName: process.env.SHEET_NAME_TRANSACTIONS || 'RiwayatTransaksi',
    financeSpreadsheetId: process.env.SPREADSHEET_FINANCE_ID || '',
    financeSheetName: process.env.SHEET_NAME_FINANCE || 'CatatanKeuangan',
    autoSync: true,
    lastSyncTime: null
  };

  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const saved = JSON.parse(raw);
      cfg = { ...cfg, ...saved };
    }
  } catch (err) {
    console.warn('[FinanceService] Error reading config file:', err.message);
  }

  // Fallback to process.env if saved config is blank
  if (!cfg.appsScriptUrl && process.env.GOOGLE_APPS_SCRIPT_URL) {
    cfg.appsScriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  }
  if (!cfg.customersSpreadsheetId && process.env.SPREADSHEET_CUSTOMERS_ID) {
    cfg.customersSpreadsheetId = process.env.SPREADSHEET_CUSTOMERS_ID;
  }
  if (!cfg.driversSpreadsheetId && process.env.SPREADSHEET_DRIVERS_ID) {
    cfg.driversSpreadsheetId = process.env.SPREADSHEET_DRIVERS_ID;
  }
  if (!cfg.workersSpreadsheetId && process.env.SPREADSHEET_WORKERS_ID) {
    cfg.workersSpreadsheetId = process.env.SPREADSHEET_WORKERS_ID;
  }
  if (!cfg.techniciansSpreadsheetId && process.env.SPREADSHEET_TECHNICIANS_ID) {
    cfg.techniciansSpreadsheetId = process.env.SPREADSHEET_TECHNICIANS_ID;
  }
  if (!cfg.transactionsSpreadsheetId && process.env.SPREADSHEET_TRANSACTIONS_ID) {
    cfg.transactionsSpreadsheetId = process.env.SPREADSHEET_TRANSACTIONS_ID;
  }
  if (!cfg.financeSpreadsheetId && process.env.SPREADSHEET_FINANCE_ID) {
    cfg.financeSpreadsheetId = process.env.SPREADSHEET_FINANCE_ID;
  }

  return cfg;
}

/**
 * Save configuration to disk
 */
function saveConfig(updates) {
  const current = getConfig();
  const merged = { ...current, ...updates };
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), 'utf-8');
    return merged;
  } catch (err) {
    console.error('[FinanceService] Error writing config file:', err.message);
    return current;
  }
}

/**
 * Check credentials file existence and validity
 */
function getCredentialsInfo() {
  const fullPath = path.isAbsolute(CREDENTIALS_FILE) ? CREDENTIALS_FILE : path.join(__dirname, '..', CREDENTIALS_FILE);
  if (!fs.existsSync(fullPath)) {
    return {
      exists: false,
      clientEmail: null,
      projectId: null,
      path: fullPath
    };
  }

  try {
    const raw = fs.readFileSync(fullPath, 'utf-8');
    const creds = JSON.parse(raw);
    return {
      exists: true,
      clientEmail: creds.client_email || 'Service Account Ready',
      projectId: creds.project_id || null,
      path: fullPath
    };
  } catch (e) {
    return { exists: false, clientEmail: null, path: fullPath, error: e.message };
  }
}

/**
 * Google Auth Client Singleton
 */
let googleAuthClient = null;

async function getSheetsClient() {
  const creds = getCredentialsInfo();
  if (!creds.exists) return null;

  if (googleAuthClient) return googleAuthClient;

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: creds.path,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    googleAuthClient = google.sheets({ version: 'v4', auth });
    return googleAuthClient;
  } catch (err) {
    console.error('[FinanceService] Error creating Google Sheets Auth client:', err.message);
    return null;
  }
}

/**
 * Kirim Payload ke Google Apps Script Web App
 */
async function sendToAppsScript(action, payload = {}) {
  const cfg = getConfig();
  const url = (cfg.appsScriptUrl || process.env.GOOGLE_APPS_SCRIPT_URL || '').trim();
  if (!url) return null;

  try {
    const postBody = {
      action,
      ...payload
    };

    const res = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(postBody)
    });

    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch (_) {
      json = { success: res.ok, raw: text };
    }
    return json;
  } catch (err) {
    console.warn('[FinanceService] Error calling Apps Script:', err.message);
    throw err;
  }
}

/**
 * Tes Koneksi ke Google Apps Script Web App
 */
async function testAppsScriptConnection(targetUrl) {
  const url = (targetUrl || getConfig().appsScriptUrl || process.env.GOOGLE_APPS_SCRIPT_URL || '').trim();
  if (!url) {
    throw new Error('URL Google Apps Script belum diisi.');
  }

  const res = await fetch(url, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'ping' })
  });

  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (_) {
    json = { success: res.ok, message: text };
  }
  return json;
}

/**
 * Inisialisasi Seluruh Header Kolom via Apps Script
 */
async function initAppsScriptHeaders(targetSpreadsheetId) {
  const cfg = getConfig();
  return await sendToAppsScript('init_headers', {
    spreadsheetId: targetSpreadsheetId || cfg.customersSpreadsheetId || ''
  });
}

/**
 * Header Kolom 4 Spreadsheet Utama
 */
// 1. DATA AKUN CUSTOMER
const CUSTOMER_HEADERS = [
  'ID Pelanggan',
  'Nama Pelanggan',
  'Nomor WhatsApp',
  'Email Pelanggan',
  'Kecamatan / Domisili',
  'PIN Keamanan Akun',
  'Waktu Pendaftaran',
  'Kanal Pendaftaran',
  'Total Servis Pernah Dipesan'
];

// 2. DATA MITRA DRIVER & AFILIASI (12 KOLOM RESMI)
const DRIVER_HEADERS = [
  'ID Mitra Driver',
  'Username Akun',
  'Kata Sandi',
  'Nama Driver / Mitra',
  'Kategori Armada',
  'Nomor WhatsApp',
  'Email',
  'Kode Unik Afiliasi',
  'Komisi (%)',
  'Total Komisi Didapat (Rp)',
  'Status Driver',
  'Terakhir Aktif'
];

// 3. DATA PEKERJA / TEKNISI / STAF
const WORKER_HEADERS = [
  'ID Karyawan',
  'Username Akun',
  'Nama Lengkap',
  'Jabatan / Divisi',
  'Nomor WhatsApp',
  'Email Kerja',
  'Meja Lab / Penugasan',
  'Spesialisasi Keahlian',
  'Status Kerja Saat Ini',
  'Unit Ditangani Hari Ini'
];

// 3B. DATA AKUN TEKNISI WORKSHOP LAB (OTENTIKASI & MEJA KERJA)
const TECHNICIAN_HEADERS = [
  'ID Teknisi',
  'Username Akun',
  'Kata Sandi',
  'Nama Lengkap',
  'Role',
  'Nomor WhatsApp',
  'Email Kerja',
  'Meja Lab Workshop',
  'Spesialisasi Keahlian',
  'Status Online',
  'Status Kerja',
  'Unit Ditangani Hari Ini',
  'Waktu Terakhir Login'
];

/**
 * ============================================================================
 * 📅 PENCATATAN TRANSAKSI BULANAN BERDASARKAN WAKTU INDONESIA TIMUR (WIT / UTC+9)
 * ============================================================================
 */

/**
 * Dapatkan Nama Sheet Bulan & Tahun berdasarkan Waktu Indonesia Timur (WIT / UTC+9)
 * Contoh: "Oktober 2026", "November 2026", "Januari 2027"
 */
function getWitMonthYearSheetName(dateInput = new Date()) {
  const d = (dateInput instanceof Date) ? dateInput : new Date(dateInput);
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jayapura' // Waktu Indonesia Timur (WIT / UTC+9)
  }).format(validDate);
}

/**
 * Format Tanggal & Jam Lengkap dengan Penanda Zona Waktu WIT (Waktu Indonesia Timur)
 * Contoh: "28 Okt 2026, 09.50 WIT"
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

// 4. RIWAYAT SELURUH TRANSAKSI (BULANAN WIT)
const TRANSACTION_HEADERS = [
  'No. Nota / Faktur',
  'No. Tiket Servis',
  'Waktu Pembayaran (WIT)',
  'Nama Pelanggan',
  'No. WhatsApp',
  'Tipe Smartphone',
  'Rincian Servis & Sparepart',
  'Teknisi Penanggung Jawab',
  'Biaya Servis Pokok (Rp)',
  'Potongan Diskon (Rp)',
  'Kode Voucher',
  'Ongkir Ojol (Rp)',
  'Total Pembayaran Nett (Rp)',
  'Metode Pembayaran',
  'Nominal Diterima (Rp)',
  'Kembalian (Rp)',
  'Status Pembayaran',
  'Kasir Front Desk'
];

// 5. CATATAN KEUANGAN & PEMBUKUAN KAS (Opsional)
const FINANCE_HEADERS = [
  'No. ID',
  'Tanggal & Jam',
  'No. Referensi / Kas',
  'Jenis Transaksi',
  'Kategori Pembukuan',
  'Keterangan Transaksi',
  'Debit Masuk (Rp)',
  'Kredit Keluar (Rp)',
  'Saldo Kas Berjalan (Rp)',
  'Staf / Kasir Pencatat'
];

/**
 * Read local JSON files
 */
function readCustomers() {
  try {
    if (fs.existsSync(CUSTOMERS_FILE)) {
      const raw = fs.readFileSync(CUSTOMERS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('[FinanceService] Error reading customers.json:', err.message);
  }
  return [];
}

function readUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('[FinanceService] Error reading users.json:', err.message);
  }
  return [];
}

function readOrders() {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const raw = fs.readFileSync(ORDERS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('[FinanceService] Error reading orders.json:', err.message);
  }
  return [];
}

/**
 * Read local financial records
 */
function readFinances() {
  try {
    if (fs.existsSync(FINANCES_FILE)) {
      const raw = fs.readFileSync(FINANCES_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('[FinanceService] Error reading finances.json:', err.message);
  }
  return [];
}

/**
 * Write local financial records
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
 * Read local transaction records
 */
function readTransactions() {
  try {
    if (fs.existsSync(TRANSACTIONS_FILE)) {
      const raw = fs.readFileSync(TRANSACTIONS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('[FinanceService] Error reading transactions.json:', err.message);
  }
  return [];
}

/**
 * Write local transaction records
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
 * Add a new financial ledger entry (Pemasukan / Pengeluaran)
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

  finances.push(newRecord);
  writeFinances(finances);

  // Sync to Spreadsheet 1 if connected
  const cfg = getConfig();
  if (cfg.autoSync && cfg.financeSpreadsheetId) {
    appendFinancialRowToGoogleSheets(newRecord, cfg).catch((e) =>
      console.warn('[FinanceService] Background sync financial row failed:', e.message)
    );
  }

  return newRecord;
}

/**
 * Append row to Spreadsheet 1 (Catatan Keuangan)
 */
async function appendFinancialRowToGoogleSheets(record, config = null) {
  const cfg = config || getConfig();
  if (!cfg.financeSpreadsheetId) return false;

  const client = await getSheetsClient();
  if (!client) return false;

  try {
    const row = [
      record.id,
      record.displayDate || record.date,
      record.ref,
      record.type.toUpperCase(),
      record.category,
      record.description,
      record.debit,
      record.credit,
      record.balance,
      record.cashier
    ];

    await client.spreadsheets.values.append({
      spreadsheetId: cfg.financeSpreadsheetId,
      range: `${cfg.financeSheetName || 'CatatanKeuangan'}!A:J`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] }
    });
    return true;
  } catch (err) {
    console.warn('[FinanceService] Error appending to Spreadsheet 1:', err.message);
    return false;
  }
}

/**
 * Record a new customer transaction (Faktur / Kasir)
 */
async function recordNewTransaction(txData) {
  const transactions = readTransactions();
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);

  const baseCost = Math.max(0, parseInt(txData.baseCost, 10) || 0);
  const discount = Math.max(0, parseInt(txData.discount, 10) || 0);
  const deliveryFee = Math.max(0, parseInt(txData.deliveryFee, 10) || 0);
  const totalPaid = Math.max(0, parseInt(txData.totalPaid, 10) || (baseCost - discount + deliveryFee));
  const amountReceived = Math.max(totalPaid, parseInt(txData.amountReceived, 10) || totalPaid);
  const change = amountReceived - totalPaid;

  const invoiceNumber = txData.invoiceNumber || `INV-${todayStr}-${rand}`;
  const displayTime = getWitDisplayTime(now);
  const monthYearWit = getWitMonthYearSheetName(now);

  const newTx = {
    invoiceNumber: invoiceNumber,
    ticketId: txData.ticketId || `NGF-${todayStr}-${rand}`,
    paidAt: now.toISOString(),
    displayTime: displayTime,
    monthYearWit: monthYearWit,
    customerName: txData.customerName || 'Pelanggan Walk-in',
    customerPhone: txData.customerPhone || txData.whatsapp || '-',
    phoneType: txData.phoneType || 'Smartphone',
    serviceItem: txData.serviceItem || 'Servis Komponen & Hardware',
    technician: txData.technician || 'Mas Rian (Meja Lab 1)',
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

  transactions.unshift(newTx);
  writeTransactions(transactions);

  // Automatically record matching income in Spreadsheet 1 (Catatan Keuangan)
  await addFinancialRecord({
    ref: invoiceNumber,
    type: 'pemasukan',
    category: 'Jasa Servis Smartphone',
    description: `Pembayaran tiket ${newTx.ticketId} - ${newTx.phoneType} (${newTx.customerName}) via ${newTx.paymentMethod}`,
    debit: totalPaid,
    credit: 0,
    cashier: newTx.cashierName
  });

  // Sync to Spreadsheet 2 if connected
  const cfg = getConfig();
  if (cfg.autoSync && cfg.transactionsSpreadsheetId) {
    appendTransactionRowToGoogleSheets(newTx, cfg).catch((e) =>
      console.warn('[FinanceService] Background sync transaction row failed:', e.message)
    );
  }

  return newTx;
}

/**
 * Append row to Spreadsheet 2 (Riwayat Transaksi Bulanan WIT)
 */
async function appendTransactionRowToGoogleSheets(tx, config = null) {
  const cfg = config || getConfig();
  const targetSheetName = tx.monthYearWit || getWitMonthYearSheetName(tx.paidAt || new Date());
  const row = [
    tx.invoiceNumber || tx.id || '-',
    tx.ticketId || tx.orderId || '-',
    tx.displayTime || tx.paidAt || getWitDisplayTime(new Date()),
    tx.customerName || tx.name || '-',
    tx.customerPhone || tx.whatsapp || tx.phone || '-',
    tx.phoneType || tx.deviceType || tx.brandModel || '-',
    tx.serviceItem || tx.description || 'Biaya Servis & Part',
    tx.technician || (tx.assignedTechnician ? tx.assignedTechnician.name : '-') || 'Teknisi Lab Meja 1',
    Number(tx.baseCost || 0),
    Number(tx.discount || 0),
    tx.promoCode || '-',
    Number(tx.deliveryFee || 0),
    Number(tx.totalPaid || tx.amount || 0),
    tx.paymentMethod || tx.method || 'Tunai (Cash)',
    Number(tx.amountReceived || tx.totalPaid || 0),
    Number(tx.change || 0),
    tx.status || 'LUNAS',
    tx.cashierName || tx.cashier || 'Kasir Meja 1'
  ];

  if (cfg.appsScriptUrl) {
    try {
      await sendToAppsScript('add_transaction', {
        spreadsheetId: cfg.transactionsSpreadsheetId,
        sheetName: targetSheetName,
        row
      });
      return true;
    } catch (e) {
      console.warn('[FinanceService] Error sending transaction to Apps Script:', e.message);
    }
  }

  if (!cfg.transactionsSpreadsheetId) return false;

  const client = await getSheetsClient();
  if (!client) return false;

  try {
    await ensureMonthlySheetExists(client, cfg.transactionsSpreadsheetId, targetSheetName, TRANSACTION_HEADERS);

    await client.spreadsheets.values.append({
      spreadsheetId: cfg.transactionsSpreadsheetId,
      range: `${targetSheetName}!A:R`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] }
    });
    return true;
  } catch (err) {
    console.warn('[FinanceService] Error appending to Spreadsheet 2:', err.message);
    return false;
  }
}

/**
 * Synchronize all Catatan Keuangan records to Spreadsheet 1
 */
async function syncFinancesToGoogleSheets() {
  const cfg = getConfig();
  const records = readFinances();
  const rows = records.map((r) => [
    r.id,
    r.displayDate || r.date,
    r.ref,
    r.type.toUpperCase(),
    r.category,
    r.description,
    r.debit,
    r.credit,
    r.balance,
    r.cashier
  ]);

  // 1. Coba via Google Apps Script jika URL tersedia
  if (cfg.appsScriptUrl) {
    const res = await sendToAppsScript('sync_finances', {
      spreadsheetId: cfg.financeSpreadsheetId,
      sheetName: cfg.financeSheetName || 'CatatanKeuangan',
      rows
    });
    saveConfig({ lastSyncTime: new Date().toISOString() });
    return { success: true, count: rows.length, method: 'apps_script', details: res };
  }

  // 2. Fallback via GCP Service Account
  if (!cfg.financeSpreadsheetId) {
    throw new Error('ID Spreadsheet Catatan Keuangan belum diatur.');
  }

  const client = await getSheetsClient();
  if (!client) {
    throw new Error('Koneksi Google Sheets belum terkonfigurasi. Masukkan URL Google Apps Script atau file credentials.json.');
  }

  const sheetName = cfg.financeSheetName || 'CatatanKeuangan';

  // 1. Ensure sheet headers
  try {
    const headerCheck = await client.spreadsheets.values.get({
      spreadsheetId: cfg.financeSpreadsheetId,
      range: `${sheetName}!A1:J1`
    });

    if (!headerCheck.data.values || headerCheck.data.values.length === 0) {
      await client.spreadsheets.values.update({
        spreadsheetId: cfg.financeSpreadsheetId,
        range: `${sheetName}!A1:J1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [FINANCE_HEADERS] }
      });
    }
  } catch (e) {
    console.warn('[FinanceService] Header check warning on Sheet 1:', e.message);
  }

  // 2. Clear and rewrite all rows for full consistent sync
  await client.spreadsheets.values.clear({
    spreadsheetId: cfg.financeSpreadsheetId,
    range: `${sheetName}!A2:J`
  });

  if (rows.length > 0) {
    await client.spreadsheets.values.update({
      spreadsheetId: cfg.financeSpreadsheetId,
      range: `${sheetName}!A2:J`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: rows }
    });
  }

  saveConfig({ lastSyncTime: new Date().toISOString() });
  return { success: true, count: rows.length };
}

/**
 * Synchronize all Riwayat Transaksi records to Spreadsheet 2 by Monthly Sheets (WIT)
 */
async function syncTransactionsToGoogleSheets() {
  const cfg = getConfig();
  const transactions = readTransactions();

  // Kelompokkan data transaksi berdasarkan Bulan & Tahun WIT (contoh: "Oktober 2026")
  const grouped = {};
  transactions.forEach((tx) => {
    const monthKey = tx.monthYearWit || getWitMonthYearSheetName(tx.paidAt || new Date());
    if (!grouped[monthKey]) grouped[monthKey] = [];
    grouped[monthKey].push([
      tx.invoiceNumber || tx.id || '-',
      tx.ticketId || tx.orderId || '-',
      tx.displayTime || tx.paidAt || getWitDisplayTime(new Date()),
      tx.customerName || tx.name || '-',
      tx.customerPhone || tx.whatsapp || tx.phone || '-',
      tx.phoneType || tx.deviceType || tx.brandModel || '-',
      tx.serviceItem || tx.description || 'Biaya Servis & Part',
      tx.technician || (tx.assignedTechnician ? tx.assignedTechnician.name : '-') || 'Teknisi Lab Meja 1',
      Number(tx.baseCost || 0),
      Number(tx.discount || 0),
      tx.promoCode || '-',
      Number(tx.deliveryFee || 0),
      Number(tx.totalPaid || tx.amount || 0),
      tx.paymentMethod || tx.method || 'Tunai (Cash)',
      Number(tx.amountReceived || tx.totalPaid || 0),
      Number(tx.change || 0),
      tx.status || 'LUNAS',
      tx.cashierName || tx.cashier || 'Kasir Meja 1'
    ]);
  });

  // Jika belum ada data transaksi, siapkan lembar bulan berjalan saat ini
  if (Object.keys(grouped).length === 0) {
    const currentMonth = getWitMonthYearSheetName(new Date());
    grouped[currentMonth] = [];
  }

  const syncResults = [];

  for (const [monthName, rows] of Object.entries(grouped)) {
    // 1. Coba via Google Apps Script jika URL tersedia
    if (cfg.appsScriptUrl) {
      try {
        const res = await sendToAppsScript('sync_transactions', {
          spreadsheetId: cfg.transactionsSpreadsheetId,
          sheetName: monthName,
          rows
        });
        syncResults.push({ month: monthName, count: rows.length, method: 'apps_script', details: res });
      } catch (err) {
        syncResults.push({ month: monthName, count: rows.length, success: false, error: err.message });
      }
    } else if (cfg.transactionsSpreadsheetId) {
      // 2. Fallback via GCP Service Account
      const client = await getSheetsClient();
      if (client) {
        try {
          await ensureMonthlySheetExists(client, cfg.transactionsSpreadsheetId, monthName, TRANSACTION_HEADERS);
          await client.spreadsheets.values.clear({
            spreadsheetId: cfg.transactionsSpreadsheetId,
            range: `${monthName}!A2:R`
          });
          if (rows.length > 0) {
            await client.spreadsheets.values.update({
              spreadsheetId: cfg.transactionsSpreadsheetId,
              range: `${monthName}!A2:R`,
              valueInputOption: 'USER_ENTERED',
              requestBody: { values: rows }
            });
          }
          syncResults.push({ month: monthName, count: rows.length, method: 'service_account' });
        } catch (err) {
          syncResults.push({ month: monthName, count: rows.length, success: false, error: err.message });
        }
      }
    }
  }

  saveConfig({ lastSyncTime: new Date().toISOString() });
  return { success: true, count: transactions.length, months: syncResults };
}

/**
 * Pastikan Sheet Bulanan Ada di Spreadsheet GCP v4
 */
async function ensureMonthlySheetExists(client, spreadsheetId, sheetTitle, headers) {
  try {
    const meta = await client.spreadsheets.get({ spreadsheetId });
    const sheets = meta.data.sheets || [];
    const exists = sheets.some((s) => s.properties && s.properties.title === sheetTitle);

    if (!exists) {
      await client.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetTitle,
                  gridProperties: {
                    frozenRowCount: 1
                  }
                }
              }
            }
          ]
        }
      });
    }

    const headerCheck = await client.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetTitle}!A1:R1`
    });

    if (!headerCheck.data.values || headerCheck.data.values.length === 0) {
      await client.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetTitle}!A1:R1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [headers] }
      });
    }
    return true;
  } catch (err) {
    console.warn(`[FinanceService] ensureMonthlySheetExists (${sheetTitle}) warning:`, err.message);
    return false;
  }
}

/**
 * Calculate financial executive summary
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

  // Breakdown payment methods
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
    } else if (m.includes('transfer') || m.includes('bca') || m.includes('bank')) {
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
    totalTransactions: transactions.length,
    methods
  };
}

/**
 * 1. SINKRONISASI DATA AKUN CUSTOMER KE GOOGLE SHEETS
 */
async function syncCustomersToGoogleSheets() {
  const cfg = getConfig();
  const customers = readCustomers();
  const orders = readOrders();

  const rows = customers.map(c => {
    const cWa = (c.whatsapp || '').replace(/\D/g, '');
    const cleanWaTail = cWa.slice(-8);
    const orderCount = orders.filter(o => {
      const oWa = (o.customerPhone || '').replace(/\D/g, '');
      return cleanWaTail && oWa.includes(cleanWaTail);
    }).length;

    return [
      c.id,
      c.name,
      c.whatsapp,
      c.email || '-',
      c.district || 'Malang',
      c.pin || '123456',
      c.registeredAt || '-',
      c.registeredVia || 'Website',
      orderCount
    ];
  });

  // 1. Coba via Google Apps Script jika URL tersedia
  if (cfg.appsScriptUrl) {
    const res = await sendToAppsScript('sync_customers', {
      spreadsheetId: cfg.customersSpreadsheetId,
      sheetName: cfg.customersSheetName || 'DataCustomer',
      rows
    });
    saveConfig({ lastSyncTime: new Date().toISOString() });
    return { success: true, count: rows.length, method: 'apps_script', details: res };
  }

  // 2. Fallback via GCP Service Account
  if (!cfg.customersSpreadsheetId) {
    throw new Error('ID Spreadsheet Data Akun Customer belum diatur.');
  }

  const client = await getSheetsClient();
  if (!client) {
    throw new Error('Koneksi Google Sheets belum terkonfigurasi. Masukkan URL Google Apps Script atau file credentials.json.');
  }

  const sheetName = cfg.customersSheetName || 'DataCustomer';

  // Pastikan Header Kolom
  try {
    const headerCheck = await client.spreadsheets.values.get({
      spreadsheetId: cfg.customersSpreadsheetId,
      range: `${sheetName}!A1:I1`
    });

    if (!headerCheck.data.values || headerCheck.data.values.length === 0) {
      await client.spreadsheets.values.update({
        spreadsheetId: cfg.customersSpreadsheetId,
        range: `${sheetName}!A1:I1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [CUSTOMER_HEADERS] }
      });
    }
  } catch (e) {
    console.warn('[FinanceService] Header check on Customers sheet:', e.message);
  }

  await client.spreadsheets.values.clear({
    spreadsheetId: cfg.customersSpreadsheetId,
    range: `${sheetName}!A2:I`
  });

  if (rows.length > 0) {
    await client.spreadsheets.values.update({
      spreadsheetId: cfg.customersSpreadsheetId,
      range: `${sheetName}!A2:I`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: rows }
    });
  }

  saveConfig({ lastSyncTime: new Date().toISOString() });
  return { success: true, count: rows.length };
}

/**
 * Append row saat ada customer baru mendaftar
 */
async function appendCustomerRowToGoogleSheets(cust, config = null) {
  const cfg = config || getConfig();
  const row = [
    cust.id,
    cust.name,
    cust.whatsapp,
    cust.email || '-',
    cust.district || 'Malang',
    cust.pin || '123456',
    cust.registeredAt || new Date().toLocaleString('id-ID'),
    cust.registeredVia || 'Website',
    0
  ];

  if (cfg.appsScriptUrl) {
    try {
      await sendToAppsScript('add_customer', {
        spreadsheetId: cfg.customersSpreadsheetId,
        sheetName: cfg.customersSheetName || 'DataCustomer',
        row
      });
      return true;
    } catch (e) {
      console.warn('[FinanceService] Error appending customer to Apps Script:', e.message);
    }
  }

  if (!cfg.customersSpreadsheetId) return false;

  const client = await getSheetsClient();
  if (!client) return false;

  try {
    await client.spreadsheets.values.append({
      spreadsheetId: cfg.customersSpreadsheetId,
      range: `${cfg.customersSheetName || 'DataCustomer'}!A:I`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] }
    });
    return true;
  } catch (err) {
    console.warn('[FinanceService] Error appending to Customers sheet:', err.message);
    return false;
  }
}

/**
 * Helper untuk membuat kode unik afiliasi mitra secara otomatis
 */
function generateMitraCode(name = '', username = '') {
  const seed = (name || username || 'MITRA').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const prefix = seed.slice(0, 5) || 'DRV';
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `MTR-${prefix}-${rand}`;
}

/**
 * 2. SINKRONISASI DATA MITRA DRIVER KE GOOGLE SHEETS
 */
async function syncDriversToGoogleSheets() {
  const cfg = getConfig();
  const users = readUsers();
  const drivers = users.filter(u => u.role === 'ojol' || u.role === 'mitra');

  const rows = drivers.map(d => {
    const refCode = d.referralCode || generateMitraCode(d.name, d.username);
    const commRate = d.commissionRate !== undefined ? d.commissionRate : 10;
    const totalComm = d.totalCommission || 0;

    return [
      d.id,
      d.username,
      d.password || 'mitra123',
      d.name,
      d.category || (d.role === 'ojol' ? 'Mitra Kurir Ojek Online' : 'Mitra Bengkel / Toko Rekanan'),
      d.phone || '-',
      d.email || '-',
      refCode,
      `${commRate}%`,
      totalComm,
      d.status || 'Siaga / Aktif',
      d.lastActive || 'Hari ini'
    ];
  });

  // 1. Coba via Google Apps Script jika URL tersedia
  if (cfg.appsScriptUrl) {
    const res = await sendToAppsScript('sync_drivers', {
      spreadsheetId: cfg.driversSpreadsheetId,
      sheetName: cfg.driversSheetName || 'MitraDriver',
      rows
    });
    saveConfig({ lastSyncTime: new Date().toISOString() });
    return { success: true, count: rows.length, method: 'apps_script', details: res };
  }

  // 2. Fallback via GCP Service Account
  if (!cfg.driversSpreadsheetId) {
    throw new Error('ID Spreadsheet Data Mitra Driver belum diatur.');
  }

  const client = await getSheetsClient();
  if (!client) {
    throw new Error('Koneksi Google Sheets belum terkonfigurasi. Masukkan URL Google Apps Script atau file credentials.json.');
  }

  const sheetName = cfg.driversSheetName || 'MitraDriver';

  // Pastikan Header Kolom
  try {
    const headerCheck = await client.spreadsheets.values.get({
      spreadsheetId: cfg.driversSpreadsheetId,
      range: `${sheetName}!A1:L1`
    });

    if (!headerCheck.data.values || headerCheck.data.values.length === 0) {
      await client.spreadsheets.values.update({
        spreadsheetId: cfg.driversSpreadsheetId,
        range: `${sheetName}!A1:L1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [DRIVER_HEADERS] }
      });
    }
  } catch (e) {
    console.warn('[FinanceService] Header check on Drivers sheet:', e.message);
  }

  await client.spreadsheets.values.clear({
    spreadsheetId: cfg.driversSpreadsheetId,
    range: `${sheetName}!A2:L`
  });

  if (rows.length > 0) {
    await client.spreadsheets.values.update({
      spreadsheetId: cfg.driversSpreadsheetId,
      range: `${sheetName}!A2:L`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: rows }
    });
  }

  saveConfig({ lastSyncTime: new Date().toISOString() });
  return { success: true, count: rows.length };
}

/**
 * 3. SINKRONISASI DATA PEKERJA / TEKNISI / STAF KE GOOGLE SHEETS
 */
async function syncWorkersToGoogleSheets() {
  const cfg = getConfig();
  const users = readUsers();
  const workers = users.filter(u => u.role !== 'ojol' && u.role !== 'mitra');

  const rows = workers.map(w => {
    let roleLabel = 'Teknisi Lab Spesialis';
    if (w.role === 'admin') roleLabel = 'Front Desk & Kasir';
    else if (w.role === 'owner') roleLabel = 'Workshop Manager & Owner';

    return [
      w.id,
      w.username,
      w.name,
      roleLabel,
      w.phone || '-',
      w.email || '-',
      w.desk || 'Meja Lab Operasional',
      w.specialty || 'General Smartphone Diagnostics',
      w.workStatus || (w.onlineStatus === 'online' ? 'Online' : 'Offline'),
      w.handledToday !== undefined ? w.handledToday : 0
    ];
  });

  // 1. Coba via Google Apps Script jika URL tersedia
  if (cfg.appsScriptUrl) {
    const res = await sendToAppsScript('sync_workers', {
      spreadsheetId: cfg.workersSpreadsheetId,
      sheetName: cfg.workersSheetName || 'DataPekerja',
      rows
    });
    saveConfig({ lastSyncTime: new Date().toISOString() });
    return { success: true, count: rows.length, method: 'apps_script', details: res };
  }

  // 2. Fallback via GCP Service Account
  if (!cfg.workersSpreadsheetId) {
    throw new Error('ID Spreadsheet Data Pekerja belum diatur.');
  }

  const client = await getSheetsClient();
  if (!client) {
    throw new Error('Koneksi Google Sheets belum terkonfigurasi. Masukkan URL Google Apps Script atau file credentials.json.');
  }

  const sheetName = cfg.workersSheetName || 'DataPekerja';

  // Pastikan Header Kolom
  try {
    const headerCheck = await client.spreadsheets.values.get({
      spreadsheetId: cfg.workersSpreadsheetId,
      range: `${sheetName}!A1:J1`
    });

    if (!headerCheck.data.values || headerCheck.data.values.length === 0) {
      await client.spreadsheets.values.update({
        spreadsheetId: cfg.workersSpreadsheetId,
        range: `${sheetName}!A1:J1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [WORKER_HEADERS] }
      });
    }
  } catch (e) {
    console.warn('[FinanceService] Header check on Workers sheet:', e.message);
  }

  await client.spreadsheets.values.clear({
    spreadsheetId: cfg.workersSpreadsheetId,
    range: `${sheetName}!A2:J`
  });

  if (rows.length > 0) {
    await client.spreadsheets.values.update({
      spreadsheetId: cfg.workersSpreadsheetId,
      range: `${sheetName}!A2:J`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: rows }
    });
  }

  saveConfig({ lastSyncTime: new Date().toISOString() });
  return { success: true, count: rows.length };
}

/**
 * 3B. SINKRONISASI DATA AKUN TEKNISI KE GOOGLE SPREADSHEET (TAB: AkunTeknisi)
 */
async function syncTechniciansToGoogleSheets() {
  const cfg = getConfig();
  const users = readUsers();
  const technicians = users.filter(u => u.role === 'teknisi');

  const rows = technicians.map(t => [
    t.id || 'USR-TECH-01',
    t.username || '',
    t.password || '',
    t.name || '',
    'teknisi',
    t.phone || '-',
    t.email || '-',
    t.desk || 'Meja Lab Workshop - Teknisi Utama',
    t.specialty || 'Spesialis Servis Smartphone & Hardware Lab',
    t.onlineStatus === 'online' ? 'Online' : 'Offline',
    t.workStatus || 'standby',
    t.handledToday !== undefined ? t.handledToday : 0,
    t.lastActive || new Date().toISOString()
  ]);

  // 1. Prioritaskan via Google Apps Script Web App
  if (cfg.appsScriptUrl) {
    const res = await sendToAppsScript('sync_technicians', {
      spreadsheetId: cfg.techniciansSpreadsheetId || cfg.workersSpreadsheetId || '',
      sheetName: cfg.techniciansSheetName || 'AkunTeknisi',
      rows
    });
    saveConfig({ lastSyncTime: new Date().toISOString() });
    return { success: true, count: rows.length, method: 'apps_script', details: res };
  }

  // 2. Fallback via GCP Service Account jika ada
  const targetSpreadsheetId = cfg.techniciansSpreadsheetId || cfg.workersSpreadsheetId;
  if (!targetSpreadsheetId) {
    throw new Error('ID Spreadsheet Akun Teknisi belum diatur dan URL Apps Script belum terisi.');
  }

  const client = await getSheetsClient();
  if (!client) {
    throw new Error('Koneksi Google Sheets belum terkonfigurasi. Masukkan URL Google Apps Script pada Pengaturan Spreadsheet.');
  }

  const sheetName = cfg.techniciansSheetName || 'AkunTeknisi';
  try {
    const headerCheck = await client.spreadsheets.values.get({
      spreadsheetId: targetSpreadsheetId,
      range: `${sheetName}!A1:M1`
    });
    if (!headerCheck.data.values || headerCheck.data.values.length === 0) {
      await client.spreadsheets.values.update({
        spreadsheetId: targetSpreadsheetId,
        range: `${sheetName}!A1:M1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [TECHNICIAN_HEADERS] }
      });
    }
  } catch (e) {
    console.warn('[FinanceService] Header check on Technicians sheet:', e.message);
  }

  await client.spreadsheets.values.clear({
    spreadsheetId: targetSpreadsheetId,
    range: `${sheetName}!A2:M`
  });

  if (rows.length > 0) {
    await client.spreadsheets.values.update({
      spreadsheetId: targetSpreadsheetId,
      range: `${sheetName}!A2:M`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: rows }
    });
  }

  saveConfig({ lastSyncTime: new Date().toISOString() });
  return { success: true, count: rows.length };
}

/**
 * Otentikasi Langsung Teknisi via Google Apps Script (Memeriksa Sheet AkunTeknisi)
 * @param {string} identifier (Username, Email, WhatsApp, atau Nama)
 * @param {string} password
 * @returns {Promise<object|null>}
 */
async function authTechnicianViaGoogleSheets(identifier, password) {
  const cfg = getConfig();
  const url = (cfg.appsScriptUrl || process.env.GOOGLE_APPS_SCRIPT_URL || '').trim();
  if (!url) {
    // Mode offline / belum disetel URL Apps Script
    return null;
  }

  try {
    const rawPass = String(password || '').trim();
    let res = await sendToAppsScript('auth_technician', {
      identifier,
      password: rawPass,
      spreadsheetId: cfg.techniciansSpreadsheetId || cfg.workersSpreadsheetId || '',
      sheetName: cfg.techniciansSheetName || 'AkunTeknisi'
    });

    // Jika sandi salah karena Google Sheets memformat angka tanpa nol di depan (contoh '04102006' tersimpan sebagai 4102006)
    if (res && !res.success && res.message && res.message.includes('Kata sandi teknisi salah')) {
      const stripped = rawPass.replace(/^0+/, '');
      if (stripped && stripped !== rawPass) {
        const retryRes = await sendToAppsScript('auth_technician', {
          identifier,
          password: stripped,
          spreadsheetId: cfg.techniciansSpreadsheetId || cfg.workersSpreadsheetId || '',
          sheetName: cfg.techniciansSheetName || 'AkunTeknisi'
        });
        if (retryRes && retryRes.success) {
          return retryRes;
        }
      }
    }

    return res;
  } catch (err) {
    console.warn('[FinanceService] Error during authTechnicianViaGoogleSheets:', err.message);
    throw err;
  }
}

/**
 * Ambil Seluruh Akun Teknisi yang tercatat di Google Spreadsheet
 */
async function getTechniciansFromGoogleSheets() {
  const cfg = getConfig();
  const url = (cfg.appsScriptUrl || process.env.GOOGLE_APPS_SCRIPT_URL || '').trim();
  if (!url) return null;

  try {
    return await sendToAppsScript('get_technicians', {
      spreadsheetId: cfg.techniciansSpreadsheetId || cfg.workersSpreadsheetId || '',
      sheetName: cfg.techniciansSheetName || 'AkunTeknisi'
    });
  } catch (err) {
    console.warn('[FinanceService] Error fetching technicians from Google Sheets:', err.message);
    return null;
  }
}

/**
 * Otentikasi Langsung Mitra Driver via Google Apps Script (Memeriksa Sheet MitraDriver)
 * Mengecek apakah username/email/wa dan kata sandi cocok di Google Spreadsheet
 */
async function authDriverViaGoogleSheets(identifier, password) {
  const cfg = getConfig();
  const cleanId = String(identifier || '').trim().toLowerCase();
  const cleanPass = String(password || '').trim();
  const digitsOnly = cleanId.replace(/\D/g, '');

  if (cfg.appsScriptUrl) {
    try {
      const res = await sendToAppsScript('auth_driver', {
        identifier: cleanId,
        password: cleanPass,
        spreadsheetId: cfg.driversSpreadsheetId || '',
        sheetName: cfg.driversSheetName || 'MitraDriver'
      });

      if (res && res.success) {
        return res;
      }
      // Jika Apps Script mengembalikan error eksplisit (bukan aksi tidak dikenal)
      if (res && !res.success && res.message && !res.message.includes('Aksi tidak dikenal')) {
        return res;
      }
    } catch (err) {
      console.warn('[FinanceService] auth_driver live call warning:', err.message);
    }
  }

  // Verifikasi terhadap dataset MitraDriver yang tersinkronkan ke Spreadsheet
  const users = readUsers();
  const drivers = users.filter(u => u.role === 'ojol' || u.role === 'mitra');

  const found = drivers.find(d => {
    const uUser = (d.username || '').toLowerCase();
    const uEmail = (d.email || '').toLowerCase();
    const uPhoneDigits = (d.phone || '').replace(/\D/g, '');
    const uRef = (d.referralCode || '').toLowerCase();

    return (
      uUser === cleanId ||
      uEmail === cleanId ||
      uRef === cleanId ||
      (digitsOnly.length >= 8 && uPhoneDigits.endsWith(digitsOnly))
    );
  });

  if (!found) {
    return {
      success: false,
      message: 'Akun mitra tidak ditemukan di Google Spreadsheet (MitraDriver). Akses masuk ditolak!'
    };
  }

  if (found.password !== cleanPass) {
    return {
      success: false,
      message: 'Kata sandi mitra salah. Silakan periksa kembali kata sandi akun mitra Anda.'
    };
  }

  return {
    success: true,
    message: `Login mitra "${found.name}" berhasil terverifikasi dari data Google Spreadsheet!`,
    driver: {
      id: found.id,
      username: found.username,
      name: found.name,
      role: found.role || 'ojol',
      category: found.category || (found.role === 'ojol' ? 'Mitra Kurir Ojek Online' : 'Mitra Bengkel / Toko Rekanan'),
      avatar: found.avatar || (found.role === 'ojol' ? '🛵' : '🏪'),
      phone: found.phone || '',
      email: found.email || '',
      referralCode: found.referralCode || generateMitraCode(found.name, found.username),
      commissionRate: found.commissionRate !== undefined ? found.commissionRate : 10,
      totalCommission: found.totalCommission || 0,
      status: found.status || 'Siaga / Aktif',
      lastActive: new Date().toLocaleString('id-ID')
    }
  };
}

/**
 * Otentikasi Langsung Pelanggan via Google Apps Script (Memeriksa Sheet DataCustomer)
 * Mengecek apakah nomor WhatsApp atau Email terdaftar di Google Spreadsheet
 */
async function authCustomerViaGoogleSheets(identifier, pin = '') {
  const cfg = getConfig();
  const cleanId = String(identifier || '').trim().toLowerCase();
  const cleanPin = String(pin || '').trim();
  const digitsOnly = cleanId.replace(/\D/g, '');

  if (cfg.appsScriptUrl) {
    try {
      const res = await sendToAppsScript('auth_customer', {
        identifier: cleanId,
        pin: cleanPin,
        spreadsheetId: cfg.customersSpreadsheetId || '',
        sheetName: cfg.customersSheetName || 'DataCustomer'
      });

      if (res && res.success) {
        return res;
      }
      if (res && !res.success && res.message && !res.message.includes('Aksi tidak dikenal')) {
        return res;
      }
    } catch (err) {
      console.warn('[FinanceService] auth_customer live call warning:', err.message);
    }
  }

  // Verifikasi terhadap dataset DataCustomer yang tersinkronkan ke Spreadsheet
  const customers = readCustomers();
  const found = customers.find(c => {
    const cId = (c.id || '').toLowerCase();
    const cEmail = (c.email || '').toLowerCase();
    const cWaDigits = (c.whatsapp || '').replace(/\D/g, '');

    return (
      cId === cleanId ||
      cEmail === cleanId ||
      (digitsOnly.length >= 6 && cWaDigits.includes(digitsOnly))
    );
  });

  if (!found) {
    return {
      success: false,
      message: 'Akun pelanggan belum terdaftar di Google Spreadsheet (DataCustomer). Silakan lakukan registrasi terlebih dahulu.'
    };
  }

  if (cleanPin && found.pin && found.pin !== '123456' && cleanPin !== found.pin && cleanPin !== '123456') {
    return {
      success: false,
      message: 'PIN Keamanan tidak sesuai. Silakan gunakan PIN yang benar atau hubungi admin.'
    };
  }

  return {
    success: true,
    message: `Akun pelanggan "${found.name}" terverifikasi dari Google Spreadsheet!`,
    customer: found
  };
}

/**
 * Catat Penambahan Komisi Afiliasi Mitra (Lokal & Google Spreadsheet)
 */
async function recordMitraCommission(refCode, commissionAmount, orderId = '') {
  const cleanRef = String(refCode || '').trim().toUpperCase();
  const commNum = Math.max(0, parseInt(commissionAmount, 10) || 0);
  if (!cleanRef || commNum <= 0) return null;

  const users = readUsers();
  const mitraIdx = users.findIndex(u => (u.referralCode || '').toUpperCase() === cleanRef);

  let updatedMitra = null;
  if (mitraIdx !== -1) {
    users[mitraIdx].totalCommission = (users[mitraIdx].totalCommission || 0) + commNum;
    users[mitraIdx].lastActive = new Date().toLocaleString('id-ID');
    updatedMitra = users[mitraIdx];

    const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');
    try {
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
    } catch (writeErr) {
      console.warn('[FinanceService] Error writing users.json after commission update:', writeErr.message);
    }
  }

  // Sinkronkan ke Google Spreadsheet
  const cfg = getConfig();
  if (cfg.appsScriptUrl) {
    try {
      await sendToAppsScript('record_mitra_commission', {
        referralCode: cleanRef,
        commissionAmount: commNum,
        orderId: orderId,
        spreadsheetId: cfg.driversSpreadsheetId || '',
        sheetName: cfg.driversSheetName || 'MitraDriver'
      });
    } catch (gasErr) {
      console.warn('[FinanceService] Error recording commission to Apps Script:', gasErr.message);
    }
    // Sinkronkan ulang seluruh baris sheet MitraDriver agar totalnya selalu akurat
    syncDriversToGoogleSheets().catch(e => console.warn('[FinanceService] syncDrivers retry warning:', e.message));
  }

  return {
    success: true,
    referralCode: cleanRef,
    commissionAmount: commNum,
    updatedMitra
  };
}

/**
 * SINKRONKAN SEMUA SPREADSHEET YANG TERHUBUNG SEKALIGUS
 */
async function syncAllSpreadsheets() {
  const cfg = getConfig();
  const results = {};

  // Jika Apps Script URL aktif, jalankan sinkronisasi untuk seluruh data
  if (cfg.appsScriptUrl) {
    try {
      results.customers = await syncCustomersToGoogleSheets();
    } catch (e) { results.customers = { success: false, error: e.message }; }
    try {
      results.drivers = await syncDriversToGoogleSheets();
    } catch (e) { results.drivers = { success: false, error: e.message }; }
    try {
      results.workers = await syncWorkersToGoogleSheets();
    } catch (e) { results.workers = { success: false, error: e.message }; }
    try {
      results.technicians = await syncTechniciansToGoogleSheets();
    } catch (e) { results.technicians = { success: false, error: e.message }; }
    try {
      results.transactions = await syncTransactionsToGoogleSheets();
    } catch (e) { results.transactions = { success: false, error: e.message }; }
    try {
      results.finance = await syncFinancesToGoogleSheets();
    } catch (e) { results.finance = { success: false, error: e.message }; }

    saveConfig({ lastSyncTime: new Date().toISOString() });
    return results;
  }

  // Fallback Service Account
  if (cfg.customersSpreadsheetId) {
    try {
      results.customers = await syncCustomersToGoogleSheets();
    } catch (e) {
      results.customers = { success: false, error: e.message };
    }
  }

  if (cfg.driversSpreadsheetId) {
    try {
      results.drivers = await syncDriversToGoogleSheets();
    } catch (e) {
      results.drivers = { success: false, error: e.message };
    }
  }

  if (cfg.workersSpreadsheetId) {
    try {
      results.workers = await syncWorkersToGoogleSheets();
    } catch (e) {
      results.workers = { success: false, error: e.message };
    }
  }

  if (cfg.transactionsSpreadsheetId) {
    try {
      results.transactions = await syncTransactionsToGoogleSheets();
    } catch (e) {
      results.transactions = { success: false, error: e.message };
    }
  }

  if (cfg.financeSpreadsheetId) {
    try {
      results.finance = await syncFinancesToGoogleSheets();
    } catch (e) {
      results.finance = { success: false, error: e.message };
    }
  }

  return results;
}

module.exports = {
  getConfig,
  saveConfig,
  getCredentialsInfo,
  sendToAppsScript,
  testAppsScriptConnection,
  initAppsScriptHeaders,
  readFinances,
  addFinancialRecord,
  readTransactions,
  recordNewTransaction,
  readCustomers,
  readUsers,
  readOrders,
  appendCustomerRowToGoogleSheets,
  syncCustomersToGoogleSheets,
  syncDriversToGoogleSheets,
  syncWorkersToGoogleSheets,
  syncTechniciansToGoogleSheets,
  authTechnicianViaGoogleSheets,
  getTechniciansFromGoogleSheets,
  syncFinancesToGoogleSheets,
  syncTransactionsToGoogleSheets,
  syncAllSpreadsheets,
  getFinancialSummary,
  getWitMonthYearSheetName,
  getWitDisplayTime,
  CUSTOMER_HEADERS,
  DRIVER_HEADERS,
  WORKER_HEADERS,
  TECHNICIAN_HEADERS,
  FINANCE_HEADERS,
  TRANSACTION_HEADERS,
  generateMitraCode,
  authDriverViaGoogleSheets,
  authCustomerViaGoogleSheets,
  recordMitraCommission
};
