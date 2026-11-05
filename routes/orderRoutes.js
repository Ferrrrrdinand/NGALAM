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
        const userService = require('../services/userService');
        await userService.refreshUsersFromDb();
        const users = userService.getAllUsers();
        const mitra = users.find(u => (u.referralCode || u.referral_code || '').toUpperCase() === affiliateCode);

        // Validasi: Pelanggan hanya bisa menggunakan kode referral mitra 1 kali
        const allExistingOrders = await getAllOrders();
        const cleanCustPhone = String(orderData.whatsapp || orderData.phone || orderData.customerPhone || '').replace(/\D/g, '');
        const hasUsedReferral = cleanCustPhone && cleanCustPhone.length >= 8 && allExistingOrders.some(o => {
          const oPhone = String(o.whatsapp || o.customerPhone || o.phone || '').replace(/\D/g, '');
          if (!oPhone || oPhone.length < 8) return false;
          const matches = oPhone === cleanCustPhone || oPhone.endsWith(cleanCustPhone.slice(-8)) || cleanCustPhone.endsWith(oPhone.slice(-8));
          return matches && (o.affiliateRef || o.referralCode);
        });

        if (mitra && !hasUsedReferral) {
          const rate = mitra.commissionRate !== undefined ? Number(mitra.commissionRate) : 10;

          orderData.isPartner = true;
          orderData.partnerName = mitra.name;
          orderData.affiliateRef = mitra.referralCode || mitra.referral_code;
          orderData.affiliateMitraName = mitra.name;
          orderData.affiliateCommissionRate = rate;
          orderData.affiliateCommission = 0; // Belum dibayar, menunggu konfirmasi kasir/admin
          orderData.affiliateCommissionStatus = 'pending'; // Status awal: pending
        } else if (hasUsedReferral) {
          console.log(`[OrderRoutes] Nomor WA ${cleanCustPhone} sudah pernah menggunakan referral mitra. Kode diabaikan.`);
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

// Helper Handler untuk Update Order (PUT & PATCH)
async function handleUpdateOrder(req, res) {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    const { getOrderById } = require('../services/orderService');
    const existing = await getOrderById(id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Tiket tidak ditemukan untuk diperbarui.' });
    }

    // Jika pembayaran lunas dikonfirmasi kasir/admin:
    // Cek apakah order memiliki mitra referral berstatus pending untuk dicairkan komisinya
    const isPayingNow = updates.paid === true;
    const affiliateRef = existing.affiliateRef || updates.affiliateRef;
    const isAffiliatePending = (existing.affiliateCommissionStatus === 'pending' || !existing.affiliateCommissionStatus) && affiliateRef;

    if (isPayingNow && isAffiliatePending) {
      try {
        const { recordMitraCommission } = require('../services/financeService');
        let finalCost = 0;
        if (typeof updates.cost === 'number') {
          finalCost = updates.cost;
        } else if (typeof updates.cost === 'string' && updates.cost.trim()) {
          const match = updates.cost.match(/(\d[\d\.,]*)/);
          if (match) finalCost = Number(match[1].replace(/\./g, '').replace(/,/g, '')) || 0;
        } else if (typeof existing.cost === 'number') {
          finalCost = existing.cost;
        } else if (typeof existing.cost === 'string' && existing.cost.trim()) {
          const match = existing.cost.match(/(\d[\d\.,]*)/);
          if (match) finalCost = Number(match[1].replace(/\./g, '').replace(/,/g, '')) || 0;
        }
        const rate = existing.affiliateCommissionRate || updates.affiliateCommissionRate || 10;
        const commissionAmt = Math.round(finalCost * (rate / 100));

        if (commissionAmt > 0) {
          await recordMitraCommission(affiliateRef, commissionAmt, id);
          updates.affiliateCommission = commissionAmt;
          updates.affiliateCommissionStatus = 'paid';
          updates.affiliateCommissionPaidAt = new Date().toISOString();
          console.log(`[OrderRoutes] Komisi mitra ${affiliateRef} sebesar Rp ${commissionAmt} berhasil dicatat dari order ${id}`);
        }
      } catch (commErr) {
        console.warn('[OrderRoutes] Gagal memproses komisi kasir mitra:', commErr.message);
      }
    }

    const updated = await updateOrder(id, updates);

    if (updates.step !== undefined || updates.currentStep !== undefined) {
      try {
        await handleOrderStepChange(updated, updates.step || updates.currentStep);
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
}

// PUT /api/orders/:id
router.put('/:id', handleUpdateOrder);

// PATCH /api/orders/:id
router.patch('/:id', handleUpdateOrder);

// POST /api/orders/clear - Dilindungi Autentikasi Admin Super User
router.post('/clear', async (req, res) => {
  try {
    const { verifySession, getAdminReferralCode } = require('../services/authService');
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '') || req.query.token;
    const session = verifySession(token);
    const code = req.body.adminCode || req.headers['x-admin-code'] || '';
    const masterCode = getAdminReferralCode();

    const isAuthorized = (session && (session.role === 'admin' || session.role === 'owner')) || 
                         (code && code.toUpperCase() === masterCode.toUpperCase());

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak: Pengosongan data antrean memerlukan otorisasi Admin Super User.'
      });
    }

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
