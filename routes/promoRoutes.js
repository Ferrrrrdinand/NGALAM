/**
 * NGALAM FIX PRO - Promo Banners & Promo Codes Routes
 * Dedicated routes for promotional sliders and discount vouchers.
 */

const express = require('express');
const router = express.Router();
const {
  getAllPromos,
  addPromo,
  updatePromo,
  togglePromoStatus,
  deletePromo,
  resetPromos,
  getThemeStyles,
} = require('../services/promoService');
const {
  getAllPromoCodes,
  validateAndCalculate,
  addPromoCode,
  updatePromoCode,
  deletePromoCode,
} = require('../services/promoCodeService');

// ==========================================
// PROMO BANNERS ENDPOINTS
// ==========================================

// GET /api/promos
router.get('/promos', (req, res) => {
  try {
    const onlyActive = req.query.active !== 'false' && req.query.all !== 'true';
    const list = getAllPromos(onlyActive);
    res.json({
      success: true,
      count: list.length,
      data: list,
      themes: getThemeStyles()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/promos
router.post('/promos', (req, res) => {
  try {
    const newPromo = addPromo(req.body);
    res.status(201).json({
      success: true,
      message: `Banner promo "${newPromo.title}" berhasil ditambahkan.`,
      data: newPromo
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PUT /api/promos/:id
router.put('/promos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await updatePromo(id, req.body);
    res.json({
      success: true,
      message: `Banner promo "${updated.title}" berhasil diperbarui.`,
      data: updated
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PATCH /api/promos/:id/image
// Dedicated endpoint for instant banner photo replacement (UPDATE banners SET image_url = ...)
router.patch('/promos/:id/image', async (req, res) => {
  try {
    const { id } = req.params;
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, error: 'Data gambar banner (image) wajib dikirimkan.' });
    }
    const updated = await updatePromo(id, { image });
    res.json({
      success: true,
      message: `Foto banner #${id} berhasil diperbarui dan disinkronkan ke tabel banners PostgreSQL!`,
      data: updated
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PATCH /api/promos/:id/toggle
router.patch('/promos/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await togglePromoStatus(id);
    res.json({
      success: true,
      message: `Status banner promo "${updated.title}" diubah menjadi: ${updated.active ? 'Aktif' : 'Nonaktif'}.`,
      data: updated
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/promos/:id
router.delete('/promos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deletePromo(id);
    res.json({
      success: true,
      message: `Banner promo berhasil dihapus.`,
      data: result
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/promos/reset
router.post('/promos/reset', async (req, res) => {
  try {
    const list = await resetPromos();
    res.json({
      success: true,
      message: 'Semua banner promo telah direset ke template default.',
      data: list
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// PROMO CODES & DISCOUNT ENDPOINTS
// ==========================================

// GET /api/promo-codes
router.get('/promo-codes', (req, res) => {
  try {
    const list = getAllPromoCodes(true);
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/promo-codes/admin
router.get('/promo-codes/admin', (req, res) => {
  try {
    const list = getAllPromoCodes(false);
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/promo-codes/validate
router.post('/promo-codes/validate', (req, res) => {
  try {
    const code = (req.body.promoCode || req.body.code || '').trim();
    const price = req.body.basePrice !== undefined ? req.body.basePrice : req.body.price;
    if (!code) {
      return res.status(400).json({ valid: false, message: 'Masukkan kode promo terlebih dahulu.' });
    }
    const result = validateAndCalculate(code, price);
    res.json(result);
  } catch (err) {
    res.status(500).json({ valid: false, message: err.message });
  }
});

// POST /api/promo-codes
router.post('/promo-codes', (req, res) => {
  try {
    const newPromo = addPromoCode(req.body);
    res.status(201).json({
      success: true,
      message: `Kode promo "${newPromo.code}" berhasil dibuat dan diaktifkan.`,
      data: newPromo
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PATCH /api/promo-codes/:id
router.patch('/promo-codes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updated = updatePromoCode(id, req.body);
    res.json({
      success: true,
      message: `Kode promo "${updated.code}" berhasil diperbarui.`,
      data: updated
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/promo-codes/:id
router.delete('/promo-codes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = deletePromoCode(id);
    res.json({
      success: true,
      message: `Kode promo berhasil dihapus dari sistem.`,
      data: result
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
