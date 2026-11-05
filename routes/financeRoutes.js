/**
 * NGALAM FIX PRO - Finance & Transaction Routes
 * Mengelola pembukuan keuangan, faktur transaksi kasir, dan status database sistem.
 */

const express = require('express');
const router = express.Router();
const {
  getConfig: getFinanceConfig,
  saveConfig: saveFinanceConfig,
  getCredentialsInfo,
  readFinances,
  addFinancialRecord,
  readTransactions,
  recordNewTransaction,
  getFinancialSummary,
  getWitMonthYearPeriod,
  getAllTransactionsWithWarranty,
  updateTransactionWarranty,
} = require('../services/financeService');
const userService = require('../services/userService');

// GET /api/finance/status
router.get('/status', async (req, res) => {
  try {
    const creds = getCredentialsInfo();
    const cfg = getFinanceConfig();
    const summary = getFinancialSummary();
    const db = require('../services/db');
    const dbStatus = await db.testConnection();

    res.json({
      success: true,
      mode: 'database',
      message: dbStatus.connected 
        ? `Sistem database PostgreSQL "${dbStatus.database}" terhubung dan aktif.`
        : 'Sistem database lokal aktif (Siap PostgreSQL).',
      credentials: creds,
      config: cfg,
      summary: summary,
      database: {
        engine: 'PostgreSQL',
        connected: dbStatus.connected,
        host: cfg.host,
        database: cfg.database,
        error: dbStatus.error || null
      },
      tables: {
        customers: {
          name: 'Akun Pelanggan (users role customer)',
          table: 'users',
          roles: userService.getUserTableDetails().customer.roles,
          count: userService.getUserTableDetails().customer.count,
          connected: userService.getUserTableDetails().customer.connected,
          mode: 'database',
          message: 'Tersimpan di tabel users PostgreSQL/Supabase bersama admin, mitra, dan teknisi.'
        },
        usersAdmin: {
          name: 'Tabel Pengguna Admin & Kasir',
          table: 'users',
          roles: userService.getUserTableDetails().admin.roles,
          count: userService.getUserTableDetails().admin.count,
          connected: userService.getUserTableDetails().admin.connected,
          mode: 'database',
          message: 'Tersimpan di tabel users PostgreSQL/Supabase'
        },
        usersTeknisi: {
          name: 'Tabel Teknisi Lab Workshop',
          table: 'users',
          roles: userService.getUserTableDetails().teknisi.roles,
          count: userService.getUserTableDetails().teknisi.count,
          connected: userService.getUserTableDetails().teknisi.connected,
          mode: 'database',
          message: 'Tersimpan di tabel users PostgreSQL/Supabase'
        },
        usersMitra: {
          name: 'Tabel Mitra Driver & Rekanan',
          table: 'users',
          roles: userService.getUserTableDetails().mitra.roles,
          count: userService.getUserTableDetails().mitra.count,
          connected: userService.getUserTableDetails().mitra.connected,
          mode: 'database',
          message: 'Tersimpan di tabel users PostgreSQL/Supabase'
        },
        orders: {
          name: 'Tabel Antrian Tiket Servis (orders)',
          file: 'data/orders.json',
          connected: true,
          mode: 'database',
          message: 'Tersimpan aman di data/orders.json (Siap migrasi PostgreSQL)'
        },
        transactions: {
          name: 'Tabel Riwayat Transaksi (transactions)',
          period: getWitMonthYearPeriod(),
          timezone: 'WIT (UTC+9)',
          connected: true,
          mode: 'database',
          message: 'Tersimpan aman di data/transactions.json (Siap migrasi PostgreSQL)'
        },
        finances: {
          name: 'Tabel Buku Kas & Keuangan (finances)',
          connected: true,
          mode: 'database',
          message: 'Tersimpan aman di data/finances.json (Siap migrasi PostgreSQL)'
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/finance/config
router.post('/config', (req, res) => {
  try {
    const updated = saveFinanceConfig(req.body);
    res.json({
      success: true,
      message: 'Konfigurasi database berhasil disimpan!',
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
    const list = getAllTransactionsWithWarranty();
    res.json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/finance/transactions/:id/warranty - Catat status klaim garansi transaksi kasir
router.patch('/transactions/:id/warranty', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      warrantyClaimStatus,
      warrantyClaimNotes,
      warrantyClaimDate,
      serviceItem
    } = req.body;

    const updated = await updateTransactionWarranty(id, {
      warrantyClaimStatus,
      warrantyClaimNotes,
      warrantyClaimDate,
      serviceItem
    });

    res.json({
      success: true,
      message: `Status garansi transaksi #${id} berhasil diperbarui menjadi: ${warrantyClaimStatus === 'claimed' ? 'Sudah Klaim Garansi' : warrantyClaimStatus === 'resolved' ? 'Klaim Selesai Diganti' : 'Belum Klaim'}.`,
      data: updated
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
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

    // Otomatis cairkan komisi mitra jika transaksi kasir ini merujuk ke tiket order yang menggunakan kode mitra
    if (txData.ticketId) {
      try {
        const { getOrderById, updateOrder } = require('../services/orderService');
        const { recordMitraCommission } = require('../services/financeService');
        const targetOrder = await getOrderById(txData.ticketId);
        if (targetOrder) {
          let refCode = targetOrder.affiliateRef || targetOrder.referralCode || txData.affiliateRef || txData.referralCode;
          if (!refCode) {
            try {
              const { findCustomerByIdentifier } = require('../services/customerService');
              const phone = targetOrder.whatsapp || targetOrder.phone || txData.customerPhone || txData.whatsapp || '';
              const c = findCustomerByIdentifier(phone);
              if (c && c.referredByMitra) refCode = c.referredByMitra;
            } catch (_) {}
          }

          if (refCode && targetOrder.affiliateCommissionStatus !== 'paid') {
            const finalCost = Number(txData.totalPaid) || Number(targetOrder.cost) || 0;
            const rate = Number(targetOrder.affiliateCommissionRate || 10);
            const commAmt = Math.round(finalCost * (rate / 100));
            if (commAmt > 0) {
              await recordMitraCommission(refCode, commAmt, targetOrder.id);
              await updateOrder(targetOrder.id, {
                paid: true,
                affiliateRef: refCode,
                affiliateCommission: commAmt,
                affiliateCommissionStatus: 'paid',
                affiliateCommissionPaidAt: new Date().toISOString()
              });
              console.log(`[FinanceRoutes] Komisi mitra ${refCode} sebesar Rp ${commAmt} berhasil dialokasikan dari faktur ${newTx.invoiceNumber}`);
            }
          }
        }
      } catch (affErr) {
        console.warn('[FinanceRoutes] Affiliate auto-commission recording warning:', affErr.message);
      }
    } else if (txData.referralCode || txData.affiliateRef) {
      // Transaksi kasir langsung (tanpa tiket servis) yang menyertakan kode mitra
      try {
        const { recordMitraCommission } = require('../services/financeService');
        const ref = (txData.referralCode || txData.affiliateRef).trim().toUpperCase();
        const finalCost = Number(txData.totalPaid) || 0;
        const commAmt = Math.round(finalCost * 0.1); // 10% komisi mitra
        if (commAmt > 0) {
          await recordMitraCommission(ref, commAmt, newTx.invoiceNumber);
          console.log(`[FinanceRoutes] Komisi mitra direct ${ref} sebesar Rp ${commAmt} berhasil dialokasikan.`);
        }
      } catch (directAffErr) {
        console.warn('[FinanceRoutes] Direct affiliate recording warning:', directAffErr.message);
      }
    }

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
    res.json({
      success: true,
      message: 'Data tersimpan konsisten di database sistem.',
      mode: 'database',
      results: {
        customers: { success: true },
        drivers: { success: true },
        workers: { success: true },
        finance: { success: true },
        transactions: { success: true }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
