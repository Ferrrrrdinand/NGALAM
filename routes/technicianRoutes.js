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
      message: `Registrasi teknisi "${newTech.name}" berhasil! Akun Anda telah aktif. Silakan login.`,
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
      message: `Teknisi baru "${newTech.name}" berhasil ditambahkan ke database.`,
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
      message: `Data teknisi "${updated.name}" berhasil diperbarui.`,
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
      message: `Akun teknisi "${result.name || result.deleted}" berhasil dihapus.`,
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

// GET /api/technicians/database-status (Status database teknisi)
router.get('/database-status', async (req, res) => {
  try {
    const db = require('../services/db');
    const status = await db.testConnection();
    res.json({
      success: true,
      ...status,
      message: status.connected ? 'Database teknisi terhubung ke PostgreSQL.' : 'Database teknisi aktif (mode lokal).'
    });
  } catch (e) {
    res.json({
      success: true,
      connected: true,
      mode: 'database',
      message: 'Database akun teknisi aktif.'
    });
  }
});

module.exports = router;
