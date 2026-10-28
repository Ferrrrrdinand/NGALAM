/**
 * NGALAM FIX PRO - Technician & Roster Management Routes
 * Dedicated routes for technician roster, live bench presence, and activity audit logs.
 */

const express = require('express');
const router = express.Router();
const {
  getAllTechnicians,
  findTechnician,
  setTechnicianOnline,
  setTechnicianOffline,
  setTechnicianHandledPhone,
  setTechnicianStandby,
  getActivityLogs,
  createTechnician,
  updateTechnician,
  deleteTechnician,
  WORKSHOP_REGISTRATION_CODE
} = require('../services/technicianService');

// GET /api/technicians
router.get('/', (req, res) => {
  try {
    const list = getAllTechnicians(false);
    const logs = getActivityLogs();
    res.json({
      success: true,
      count: list.length,
      data: list,
      logs: logs
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/technicians/register - Registrasi Mandiri Teknisi dengan Kode Workshop Rahasia
router.post('/register', async (req, res) => {
  try {
    const newTech = await createTechnician(req.body, { isAdmin: false });
    res.json({
      success: true,
      message: `Registrasi teknisi "${newTech.name}" berhasil! Akun Anda telah aktif dan disinkronkan ke Google Spreadsheet. Silakan login.`,
      data: newTech
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message, message: err.message });
  }
});

// POST /api/technicians - Tambah Teknisi Baru oleh Admin
router.post('/', async (req, res) => {
  try {
    const newTech = await createTechnician(req.body, { isAdmin: true });
    res.json({
      success: true,
      message: `Teknisi baru "${newTech.name}" berhasil ditambahkan dan disinkronkan ke Google Spreadsheet.`,
      data: newTech
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message, message: err.message });
  }
});

// PUT /api/technicians/:id - Edit Data Teknisi oleh Admin
router.put('/:id', async (req, res) => {
  try {
    const updated = await updateTechnician(req.params.id, req.body);
    res.json({
      success: true,
      message: `Data teknisi "${updated.name}" berhasil diperbarui dan disinkronkan ke Google Spreadsheet.`,
      data: updated
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message, message: err.message });
  }
});

// DELETE /api/technicians/:id - Hapus Akun Teknisi oleh Admin
router.delete('/:id', async (req, res) => {
  try {
    const result = await deleteTechnician(req.params.id);
    res.json({
      success: true,
      message: `Akun teknisi "${result.name || result.deleted}" berhasil dihapus dan disinkronkan ke Google Spreadsheet.`,
      data: result
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message, message: err.message });
  }
});

// POST /api/technicians/status
router.post('/status', (req, res) => {
  try {
    const { username, action, orderId, orderDetails } = req.body;
    if (!username) {
      return res.status(400).json({ success: false, message: 'Username teknisi wajib diisi.' });
    }

    let updated = null;
    const cleanAction = (action || req.body.workStatus || '').toLowerCase().trim();

    if (cleanAction === 'online') {
      updated = setTechnicianOnline(username);
    } else if (cleanAction === 'offline') {
      updated = setTechnicianOffline(username);
    } else if (cleanAction === 'handled phone' || cleanAction === 'handled') {
      updated = setTechnicianHandledPhone(username, {
        orderId: orderId || (orderDetails && orderDetails.id),
        phoneType: (orderDetails && orderDetails.phoneType) || 'Smartphone',
        customerName: (orderDetails && orderDetails.customerName) || 'Pelanggan',
        step: (orderDetails && orderDetails.step) || 3
      });
    } else if (cleanAction === 'standby') {
      updated = setTechnicianStandby(username, { orderId });
    } else {
      return res.status(400).json({ success: false, message: `Action status "${action}" tidak valid.` });
    }

    res.json({
      success: true,
      message: `Status teknisi ${username} berhasil diubah menjadi ${action}.`,
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/technicians/logs
router.get('/logs', (req, res) => {
  try {
    const logs = getActivityLogs();
    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/technicians/sync-spreadsheet
// Sinkronkan seluruh akun teknisi (lokal) ke tab AkunTeknisi Google Spreadsheet
router.post('/sync-spreadsheet', async (req, res) => {
  try {
    const { syncTechniciansToGoogleSheets, getConfig } = require('../services/financeService');
    const result = await syncTechniciansToGoogleSheets();
    res.json({
      success: true,
      message: `Berhasil menyinkronkan data akun teknisi ke Google Spreadsheet (Sheet: ${getConfig().techniciansSheetName || 'AkunTeknisi'}).`,
      data: result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, message: err.message });
  }
});

// GET /api/technicians/spreadsheet-status
// Periksa status koneksi Google Spreadsheet khusus akun teknisi
router.get('/spreadsheet-status', (req, res) => {
  try {
    const { getConfig } = require('../services/financeService');
    const cfg = getConfig();
    const isConnected = !!(cfg.appsScriptUrl && cfg.appsScriptUrl.trim().length > 10);
    res.json({
      success: true,
      connected: isConnected,
      sheetName: cfg.techniciansSheetName || 'AkunTeknisi',
      spreadsheetId: cfg.techniciansSpreadsheetId || cfg.workersSpreadsheetId || '',
      hasAppsScriptUrl: isConnected,
      message: isConnected
        ? 'Akun teknisi terhubung secara real-time dengan Google Spreadsheet.'
        : 'Google Apps Script URL belum diisi. Sistem menggunakan database akun lokal.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
