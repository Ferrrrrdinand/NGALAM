/**
 * NGALAM FIX PRO - Orders & Service Tickets Routes
 * Dedicated routes for repair orders, tickets, and tracking lookup.
 */

const express = require('express');
const router = express.Router();
const {
  getAllOrders,
  appendOrder,
  updateOrder,
  clearAllOrders,
} = require('../services/orderService');
const { handleOrderStepChange } = require('../services/technicianService');
const { incrementUsage } = require('../services/promoCodeService');
const { formatCustomerOrder } = require('./customerRoutes');

// GET /api/orders
router.get('/', async (req, res) => {
  try {
    const orders = await getAllOrders();
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const orders = await getAllOrders();
    const query = id.trim().toUpperCase();
    const cleanDigits = id.replace(/\D/g, '');
    const found = orders.find(
      (o) => (o.id && o.id.toUpperCase() === query) ||
        (o.whatsapp && o.whatsapp.includes(query)) ||
        (cleanDigits && cleanDigits.length >= 6 && (o.whatsapp || o.customerWa || o.phone || o.customerPhone || '').replace(/\D/g, '').includes(cleanDigits)) ||
        (o.email && o.email.toUpperCase() === query)
    );
    if (!found) {
      return res.status(404).json({ success: false, message: 'Nomor tiket, WhatsApp, atau Email tidak ditemukan.' });
    }
    res.json({ success: true, data: formatCustomerOrder(found) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/orders
router.post('/', async (req, res) => {
  try {
    const orderData = { ...req.body };
    if (!orderData.customerName && (orderData.buyerName || orderData.name)) {
      orderData.customerName = orderData.buyerName || orderData.name;
    }
    if (!orderData.whatsapp && (orderData.buyerPhone || orderData.phone || orderData.customerPhone)) {
      orderData.whatsapp = orderData.buyerPhone || orderData.phone || orderData.customerPhone;
    }
    if (!orderData.phoneType) {
      orderData.phoneType = orderData.phoneType || orderData.deviceType || orderData.model || 'Smartphone';
    }

    if (!orderData.customerName || !orderData.phoneType) {
      return res.status(400).json({
        success: false,
        message: 'Nama pelanggan dan tipe HP wajib diisi.',
      });
    }

    if (orderData.promoCode) {
      incrementUsage(orderData.promoCode);
    }

    // Pemrosesan Afiliasi Mitra (QR Code Scan & Referral Link)
    const affiliateCode = (orderData.affiliateRef || orderData.referralCode || req.query.ref || '').trim().toUpperCase();
    if (affiliateCode) {
      try {
        const { readUsers, recordMitraCommission } = require('../services/financeService');
        const users = readUsers();
        const mitra = users.find(u => (u.referralCode || '').toUpperCase() === affiliateCode);
        if (mitra) {
          const rate = mitra.commissionRate !== undefined ? mitra.commissionRate : 10;
          const numericCost = parseInt(String(orderData.cost || orderData.estimatedCost || '250000').replace(/\D/g, ''), 10) || 250000;
          const commissionAmt = Math.round(numericCost * (rate / 100));

          orderData.isPartner = true;
          orderData.partnerName = mitra.name;
          orderData.affiliateRef = mitra.referralCode;
          orderData.affiliateMitraName = mitra.name;
          orderData.affiliateCommissionRate = rate;
          orderData.affiliateCommission = commissionAmt;

          // Catat komisi afiliasi untuk mitra ke sistem & database
          recordMitraCommission(mitra.referralCode, commissionAmt).catch(e =>
            console.warn('[OrderRoutes] Error awarding affiliate commission:', e.message)
          );
        }
      } catch (affErr) {
        console.warn('[OrderRoutes] Affiliate processing warning:', affErr.message);
      }
    }

    const newOrder = await appendOrder(orderData);
    res.status(201).json({
      success: true,
      message: 'Tiket servis berhasil didaftarkan dan disimpan ke database!',
      data: newOrder,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/orders/:id
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = await updateOrder(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Tiket tidak ditemukan untuk diperbarui.' });
    }

    if (updates.step !== undefined) {
      try {
        handleOrderStepChange(updated, updates.step);
      } catch (syncErr) {
        console.warn('[OrderRoutes] Error syncing technician presence on step change:', syncErr.message);
      }
    }

    res.json({
      success: true,
      message: `Tiket ${id} berhasil diperbarui.`,
      data: updated,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/orders/clear
router.post('/clear', async (req, res) => {
  try {
    const success = await clearAllOrders();
    res.json({
      success,
      message: 'Semua data antrian tiket servis telah dikosongkan.',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
