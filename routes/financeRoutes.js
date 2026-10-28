/**
 * NGALAM FIX PRO - Finance & Spreadsheet Sync Routes
 * Dedicated routes for financial ledgers, customer transaction invoices, and Google Sheets synchronization.
 */

const express = require('express');
const router = express.Router();
const {
  getConfig: getFinanceConfig,
  saveConfig: saveFinanceConfig,
  getCredentialsInfo,
  testAppsScriptConnection,
  initAppsScriptHeaders,
  readFinances,
  addFinancialRecord,
  readTransactions,
  recordNewTransaction,
  syncCustomersToGoogleSheets,
  syncDriversToGoogleSheets,
  syncWorkersToGoogleSheets,
  syncFinancesToGoogleSheets,
  syncTransactionsToGoogleSheets,
  syncAllSpreadsheets,
  getFinancialSummary,
  getWitMonthYearSheetName,
} = require('../services/financeService');

// GET /api/finance/status
router.get('/status', (req, res) => {
  try {
    const creds = getCredentialsInfo();
    const cfg = getFinanceConfig();
    const summary = getFinancialSummary();

    const isGasActive = !!(cfg.appsScriptUrl && cfg.appsScriptUrl.trim().length > 10);
    const customersConnected = isGasActive || (creds.exists && !!cfg.customersSpreadsheetId);
    const driversConnected = isGasActive || (creds.exists && !!cfg.driversSpreadsheetId);
    const workersConnected = isGasActive || (creds.exists && !!cfg.workersSpreadsheetId);
    const transactionsConnected = isGasActive || (creds.exists && !!cfg.transactionsSpreadsheetId);
    const financeConnected = isGasActive || (creds.exists && !!cfg.financeSpreadsheetId);

    const activeMode = isGasActive ? 'google_apps_script' : (creds.exists ? 'google_sheets' : 'local_fallback');

    res.json({
      success: true,
      credentials: creds,
      config: cfg,
      summary: summary,
      appsScript: {
        active: isGasActive,
        url: cfg.appsScriptUrl || '',
        message: isGasActive
          ? 'Google Apps Script Web App Terhubung & Siap Sinkronisasi'
          : 'Google Apps Script belum dikonfigurasi'
      },
      spreadsheetCustomers: {
        name: 'Data Akun Customer',
        sheetName: cfg.customersSheetName || 'DataCustomer',
        id: cfg.customersSpreadsheetId,
        connected: customersConnected,
        mode: customersConnected ? activeMode : 'local_fallback',
        message: customersConnected ? (isGasActive ? 'Terhubung via Google Apps Script' : 'Terhubung langsung ke Google Sheets API') : 'Menggunakan data lokal (data/customers.json)'
      },
      spreadsheetDrivers: {
        name: 'Data Mitra Driver',
        sheetName: cfg.driversSheetName || 'MitraDriver',
        id: cfg.driversSpreadsheetId,
        connected: driversConnected,
        mode: driversConnected ? activeMode : 'local_fallback',
        message: driversConnected ? (isGasActive ? 'Terhubung via Google Apps Script' : 'Terhubung langsung ke Google Sheets API') : 'Menggunakan data lokal (data/users.json)'
      },
      spreadsheetWorkers: {
        name: 'Data Pekerja / Teknisi / Staf',
        sheetName: cfg.workersSheetName || 'DataPekerja',
        id: cfg.workersSpreadsheetId,
        connected: workersConnected,
        mode: workersConnected ? activeMode : 'local_fallback',
        message: workersConnected ? (isGasActive ? 'Terhubung via Google Apps Script' : 'Terhubung langsung ke Google Sheets API') : 'Menggunakan data lokal (data/users.json)'
      },
      spreadsheetTechnicians: {
        name: 'Otentikasi & Akun Teknisi Lab Workshop',
        sheetName: cfg.techniciansSheetName || 'AkunTeknisi',
        id: cfg.techniciansSpreadsheetId || cfg.workersSpreadsheetId || '',
        connected: isGasActive || (creds.exists && !!(cfg.techniciansSpreadsheetId || cfg.workersSpreadsheetId)),
        mode: isGasActive ? 'google_apps_script' : (creds.exists ? 'google_sheets' : 'local_fallback'),
        message: isGasActive ? 'Terhubung & Terverifikasi via Google Apps Script (AkunTeknisi)' : 'Menggunakan penyimpanan data akun lokal (data/users.json)'
      },
      spreadsheetTransactions: {
        name: 'Riwayat Transaksi Bulanan (Zona Waktu WIT)',
        sheetName: getWitMonthYearSheetName(),
        currentMonthSheet: getWitMonthYearSheetName(),
        timezone: 'WIT (UTC+9)',
        id: cfg.transactionsSpreadsheetId,
        connected: transactionsConnected,
        mode: transactionsConnected ? activeMode : 'local_fallback',
        message: transactionsConnected
          ? (isGasActive ? `Terhubung via Google Apps Script (Otomatis per Lembar Bulan "${getWitMonthYearSheetName()}" WIT)` : `Terhubung langsung ke Google Sheets API v4 (Otomatis per Lembar Bulan "${getWitMonthYearSheetName()}" WIT)`)
          : `Tersimpan lokal & otomatis dipartisi per lembar bulan WIT ("${getWitMonthYearSheetName()}").`
      },
      spreadsheetFinance: {
        name: 'Catatan Keuangan & Pembukuan Kas',
        sheetName: cfg.financeSheetName || 'CatatanKeuangan',
        id: cfg.financeSpreadsheetId,
        connected: financeConnected,
        mode: financeConnected ? activeMode : 'local_fallback',
        message: financeConnected
          ? (isGasActive ? 'Terhubung via Google Apps Script' : 'Terhubung langsung ke Google Sheets API v4')
          : 'Menggunakan penyimpanan data lokal (data/finances.json).'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/finance/test-apps-script
router.post('/test-apps-script', async (req, res) => {
  try {
    const { url } = req.body;
    const testResult = await testAppsScriptConnection(url);
    res.json({
      success: true,
      message: testResult.message || 'Koneksi Google Apps Script Berhasil!',
      details: testResult
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: `Gagal menghubungi Google Apps Script: ${err.message}`
    });
  }
});

// POST /api/finance/init-headers
router.post('/init-headers', async (req, res) => {
  try {
    const { spreadsheetId } = req.body;
    const result = await initAppsScriptHeaders(spreadsheetId);
    res.json({
      success: true,
      message: 'Header kolom Google Sheets berhasil diinisialisasi!',
      details: result
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: `Gagal menginisialisasi header: ${err.message}`
    });
  }
});

// GET /api/finance/apps-script-code
router.get('/apps-script-code', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    let scriptPath = path.join(__dirname, '..', 'scripts', 'google_apps_script.js');
    if (!fs.existsSync(scriptPath)) {
      scriptPath = path.join(__dirname, '..', 'google_apps_script.js');
    }
    if (fs.existsSync(scriptPath)) {
      const code = fs.readFileSync(scriptPath, 'utf8');
      res.json({ success: true, code });
    } else {
      res.status(404).json({ success: false, message: 'File google_apps_script.js tidak ditemukan.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/finance/config
router.post('/config', (req, res) => {
  try {
    const {
      appsScriptUrl,
      customersSpreadsheetId,
      customersSheetName,
      driversSpreadsheetId,
      driversSheetName,
      workersSpreadsheetId,
      workersSheetName,
      techniciansSpreadsheetId,
      techniciansSheetName,
      transactionsSpreadsheetId,
      transactionsSheetName,
      financeSpreadsheetId,
      financeSheetName,
      autoSync
    } = req.body;

    const updated = saveFinanceConfig({
      ...(appsScriptUrl !== undefined && { appsScriptUrl: appsScriptUrl.trim() }),
      ...(customersSpreadsheetId !== undefined && { customersSpreadsheetId: customersSpreadsheetId.trim() }),
      ...(customersSheetName !== undefined && { customersSheetName: customersSheetName.trim() }),
      ...(driversSpreadsheetId !== undefined && { driversSpreadsheetId: driversSpreadsheetId.trim() }),
      ...(driversSheetName !== undefined && { driversSheetName: driversSheetName.trim() }),
      ...(workersSpreadsheetId !== undefined && { workersSpreadsheetId: workersSpreadsheetId.trim() }),
      ...(workersSheetName !== undefined && { workersSheetName: workersSheetName.trim() }),
      ...(techniciansSpreadsheetId !== undefined && { techniciansSpreadsheetId: techniciansSpreadsheetId.trim() }),
      ...(techniciansSheetName !== undefined && { techniciansSheetName: techniciansSheetName.trim() }),
      ...(transactionsSpreadsheetId !== undefined && { transactionsSpreadsheetId: transactionsSpreadsheetId.trim() }),
      ...(transactionsSheetName !== undefined && { transactionsSheetName: transactionsSheetName.trim() }),
      ...(financeSpreadsheetId !== undefined && { financeSpreadsheetId: financeSpreadsheetId.trim() }),
      ...(financeSheetName !== undefined && { financeSheetName: financeSheetName.trim() }),
      ...(autoSync !== undefined && { autoSync: !!autoSync })
    });

    res.json({
      success: true,
      message: 'Konfigurasi Google Spreadsheets berhasil disimpan!',
      config: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/finance/records
router.get('/records', (req, res) => {
  try {
    const list = readFinances();
    const summary = getFinancialSummary();
    res.json({
      success: true,
      count: list.length,
      data: list,
      summary
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/finance/records
router.post('/records', async (req, res) => {
  try {
    const { type, category, description, amount, ref, cashier } = req.body;
    const numAmount = parseInt(amount, 10) || 0;
    if (numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Nominal transaksi harus lebih dari 0.' });
    }

    const newRecord = await addFinancialRecord({
      type: type === 'pengeluaran' ? 'pengeluaran' : 'pemasukan',
      category: category || (type === 'pengeluaran' ? 'Operasional' : 'Pendapatan Lain'),
      description: description || 'Transaksi kasir',
      debit: type === 'pengeluaran' ? 0 : numAmount,
      credit: type === 'pengeluaran' ? numAmount : 0,
      ref: ref || '',
      cashier: cashier || 'Ibu Sarah (Meja 1)'
    });

    res.status(201).json({
      success: true,
      message: `Catatan ${newRecord.type} sebesar Rp ${numAmount.toLocaleString('id-ID')} berhasil dicatat!`,
      data: newRecord
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/finance/transactions
router.get('/transactions', (req, res) => {
  try {
    const list = readTransactions();
    res.json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/finance/transactions
router.post('/transactions', async (req, res) => {
  try {
    const txData = { ...req.body };
    txData.totalPaid = txData.totalPaid || txData.total || txData.amount || 0;
    if (!txData.customerName || !txData.totalPaid) {
      return res.status(400).json({ success: false, message: 'Nama pelanggan dan total pembayaran wajib diisi.' });
    }
    const newTx = await recordNewTransaction(txData);
    newTx.invoiceNo = newTx.invoiceNumber;
    res.status(201).json({
      success: true,
      message: `Faktur transaksi ${newTx.invoiceNumber} berhasil dicatat & disimpan!`,
      data: newTx
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/finance/sync
router.post('/sync', async (req, res) => {
  try {
    const target = req.body.target || 'both';
    let results = {};

    if (target === 'all') {
      results = await syncAllSpreadsheets();
    } else {
      if (target === 'customers') {
        try {
          results.customers = await syncCustomersToGoogleSheets();
        } catch (cErr) {
          results.customers = { success: false, error: cErr.message };
        }
      }
      if (target === 'drivers') {
        try {
          results.drivers = await syncDriversToGoogleSheets();
        } catch (dErr) {
          results.drivers = { success: false, error: dErr.message };
        }
      }
      if (target === 'workers') {
        try {
          results.workers = await syncWorkersToGoogleSheets();
        } catch (wErr) {
          results.workers = { success: false, error: wErr.message };
        }
      }
      if (target === 'finance' || target === 'finances' || target === 'both') {
        try {
          results.finance = await syncFinancesToGoogleSheets();
        } catch (fErr) {
          results.finance = { success: false, error: fErr.message };
        }
      }
      if (target === 'transactions' || target === 'both') {
        try {
          results.transactions = await syncTransactionsToGoogleSheets();
        } catch (tErr) {
          results.transactions = { success: false, error: tErr.message };
        }
      }
    }

    res.json({
      success: true,
      message: 'Proses sinkronisasi Google Sheets selesai.',
      results
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
