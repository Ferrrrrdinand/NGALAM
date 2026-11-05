/**
 * NGALAM FIX PRO - Advertisement & Marketing Ad Routes
 * Handles public ad delivery and admin ad management with PostgreSQL synchronization.
 */

const express = require('express');
const router = express.Router();
const {
  getAllAds,
  createAd,
  updateAd,
  toggleAd,
  deleteAd,
  recordAdClick,
  hydrateAdsFromPostgres
} = require('../services/adService');

// GET /api/ads - Public endpoint for displaying active advertisements
router.get('/ads', async (req, res) => {
  try {
    await hydrateAdsFromPostgres();
    const location = req.query.location || 'home_under_steps';
    const list = getAllAds({ onlyActive: true, location });
    res.json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/ads/admin - Admin endpoint for all ads including statistics
router.get('/ads/admin', async (req, res) => {
  try {
    await hydrateAdsFromPostgres();
    const list = getAllAds({ onlyActive: false, location: 'all' });
    res.json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/ads - Create new advertisement (Admin)
router.post('/ads', async (req, res) => {
  try {
    const newAd = await createAd(req.body);
    res.status(201).json({
      success: true,
      message: `Iklan "${newAd.title}" berhasil dibuat dan ditambahkan ke database!`,
      data: newAd
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PATCH /api/ads/:id - Update existing advertisement (Admin)
router.patch('/ads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await updateAd(id, req.body);
    res.json({
      success: true,
      message: `Iklan "${updated.title}" berhasil diperbarui di database!`,
      data: updated
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PUT /api/ads/:id - Full update alias
router.put('/ads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await updateAd(id, req.body);
    res.json({
      success: true,
      message: `Iklan "${updated.title}" berhasil diperbarui!`,
      data: updated
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PATCH /api/ads/:id/toggle - Toggle ad active status (Admin)
router.patch('/ads/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await toggleAd(id);
    res.json({
      success: true,
      message: `Status iklan diubah menjadi: ${updated.active ? 'Aktif' : 'Nonaktif'}.`,
      data: updated
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/ads/:id/click - Track ad click
router.post('/ads/:id/click', async (req, res) => {
  try {
    const { id } = req.params;
    const ad = await recordAdClick(id);
    res.json({ success: true, clicksCount: ad ? ad.clicksCount : 0 });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/ads/:id - Delete advertisement (Admin)
router.delete('/ads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteAd(id);
    res.json({
      success: true,
      message: `Iklan berhasil dihapus dari database.`,
      data: result
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;

