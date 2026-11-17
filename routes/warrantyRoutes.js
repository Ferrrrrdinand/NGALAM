/**
 * NGALAM FIX PRO - Warranty API Routes
 * Endpoints for warranty certificates, member warranty tracking, and warranty claim management.
 */

const express = require('express');
const router = express.Router();
const warrantyService = require('../services/warrantyService');

// GET /api/warranties - List all warranties with filters and stats
router.get('/', async (req, res) => {
  try {
    const { status = 'all', claimStatus = 'all', search = '' } = req.query;
    const result = await warrantyService.getAllWarranties({ status, claimStatus, search });
    res.json({
      success: true,
      data: result.warranties,
      stats: result.stats
    });
  } catch (err) {
    console.error('[Warranty API Error]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/warranties/member - List warranties for a specific customer/member
router.get('/member', async (req, res) => {
  try {
    const { customerId = '', phone = '', email = '' } = req.query;
    if (!customerId && !phone && !email) {
      return res.status(400).json({ success: false, message: 'Harap sertakan customerId, nomor WhatsApp, atau email member.' });
    }
    const memberWarranties = await warrantyService.getWarrantiesByCustomer(customerId, phone, email);
    res.json({
      success: true,
      count: memberWarranties.length,
      data: memberWarranties
    });
  } catch (err) {
    console.error('[Warranty Member API Error]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/warranties/:id - Detail of a single warranty
router.get('/:id', async (req, res) => {
  try {
    const w = await warrantyService.findWarranty(req.params.id);
    if (!w) {
      return res.status(404).json({ success: false, message: 'Sertifikat garansi tidak ditemukan.' });
    }
    res.json({ success: true, data: w });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/warranties/claim - Ajukan Klaim Garansi Resmi
router.post('/claim', async (req, res) => {
  try {
    const {
      warrantyCode,
      ticketId,
      complaint,
      claimMethod,
      customerName,
      whatsapp,
      notes
    } = req.body;

    const targetKey = warrantyCode || ticketId;
    if (!targetKey) {
      return res.status(400).json({ success: false, message: 'Kode sertifikat garansi atau nomor tiket servis wajib disertakan.' });
    }
    if (!complaint || !String(complaint).trim()) {
      return res.status(400).json({ success: false, message: 'Harap jelaskan keluhan kerusakan pada unit.' });
    }

    const result = await warrantyService.submitWarrantyClaim(targetKey, {
      complaint,
      claimMethod,
      customerName,
      whatsapp,
      notes
    });

    res.json(result);
  } catch (err) {
    console.error('[Warranty Claim Error]', err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/warranties/:id/claim-status - Update status klaim oleh Admin / Workshop
router.put('/:id/claim-status', async (req, res) => {
  try {
    const { claimStatus, technicianNotes, resolutionNotes, adminName } = req.body;
    if (!claimStatus) {
      return res.status(400).json({ success: false, message: 'Status klaim baru wajib dipilih.' });
    }

    const updated = await warrantyService.updateClaimStatus(req.params.id, {
      claimStatus,
      technicianNotes,
      resolutionNotes,
      adminName
    });

    res.json({
      success: true,
      message: `Status klaim garansi berhasil diubah menjadi: ${claimStatus}`,
      data: updated
    });
  } catch (err) {
    console.error('[Warranty Claim Update Error]', err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/warranties - Terbitkan Sertifikat Garansi Manual oleh Admin
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    if (!data.customerName) {
      return res.status(400).json({ success: false, message: 'Nama pelanggan wajib diisi.' });
    }

    const created = await warrantyService.createOrUpdateWarrantyForOrder(data);
    res.status(201).json({
      success: true,
      message: `Sertifikat garansi ${created.warranty_code} berhasil diterbitkan!`,
      data: created
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
