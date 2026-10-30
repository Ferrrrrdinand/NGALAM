/**
 * NGALAM FIX PRO - Export Routes (Dedicated Domain)
 * Rute endpoint ekspor riwayat transaksi kasir ke format Microsoft Excel (.xlsx).
 * DILINDUNGI KHUSUS: Hanya dapat diakses oleh Role Admin (Super User / Owner).
 */

const express = require('express');
const router = express.Router();
const { verifySession } = require('../services/authService');
const { filterTransactions, generateTransactionsExcel, formatRp } = require('../services/exportService');

/**
 * Middleware Otorisasi Khusus Role Admin / Super User
 */
function requireAdminRole(req, res, next) {
  let token = null;

  // 1. Cek dari Authorization Header (Bearer token)
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  // 2. Cek dari Query Parameter (?token=...)
  if (!token && req.query.token) {
    token = req.query.token;
  }

  // 3. Cek dari Cookie Browser (ngalam_token)
  if (!token && req.headers.cookie) {
    const cookies = req.headers.cookie.split(';');
    for (const c of cookies) {
      const [k, v] = c.trim().split('=');
      if (k === 'ngalam_token') {
        token = decodeURIComponent(v);
        break;
      }
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak: Token autentikasi tidak ditemukan. Silakan login sebagai Admin Super User.'
    });
  }

  const session = verifySession(token);
  if (!session) {
    return res.status(401).json({
      success: false,
      message: 'Sesi login Anda telah berakhir. Silakan login kembali sebagai Admin Super User.'
    });
  }

  // STRICT ROLE ENFORCEMENT: Hanya admin atau owner
  const role = (session.role || '').toLowerCase();
  const isSuperAdmin = (role === 'admin' || role === 'owner');

  if (!isSuperAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Akses Terbatas: Fitur ekspor riwayat transaksi hanya diperuntukkan bagi Role Admin Super User (Kasir Meja 1 tidak memiliki hak akses ini).'
    });
  }

  req.adminUser = session;
  next();
}

/**
 * GET /api/export/transactions/preview
 * Menampilkan ringkasan data transaksi yang tercakup sebelum diunduh
 */
router.get('/transactions/preview', requireAdminRole, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const txList = filterTransactions(startDate, endDate);

    let totalOmset = 0;
    let totalDiscount = 0;
    let totalBaseCost = 0;

    txList.forEach((tx) => {
      totalBaseCost += parseInt(tx.baseCost, 10) || 0;
      totalDiscount += parseInt(tx.discount, 10) || 0;
      totalOmset += parseInt(tx.totalPaid, 10) || 0;
    });

    res.json({
      success: true,
      count: txList.length,
      totalOmset,
      totalOmsetFormatted: formatRp(totalOmset),
      totalDiscount,
      totalDiscountFormatted: formatRp(totalDiscount),
      totalBaseCost,
      totalBaseCostFormatted: formatRp(totalBaseCost),
      startDate: startDate || null,
      endDate: endDate || null,
      transactions: txList,
      message: `Ditemukan ${txList.length} faktur transaksi pada rentang tanggal yang dipilih.`
    });
  } catch (err) {
    console.error('[ExportRoutes] Error previewing transactions:', err.message);
    res.status(500).json({ success: false, message: 'Gagal memuat pratinjau transaksi: ' + err.message });
  }
});

/**
 * GET & POST /api/export/transactions/excel
 * Menghasilkan dan mengunduh file Excel (.xlsx) sesuai rentang tanggal
 */
async function handleExcelExport(req, res) {
  try {
    const startDate = req.query.startDate || req.body?.startDate || null;
    const endDate = req.query.endDate || req.body?.endDate || null;
    const adminName = req.adminUser?.name || req.adminUser?.username || 'Admin Super User';

    const txList = filterTransactions(startDate, endDate);

    const buffer = await generateTransactionsExcel({
      startDate,
      endDate,
      adminName,
      transactions: txList
    });

    const startLabel = startDate ? startDate.replace(/-/g, '') : 'Semua';
    const endLabel = endDate ? endDate.replace(/-/g, '') : 'Kini';
    const filename = `Riwayat_Transaksi_NgalamFixPro_${startLabel}_sd_${endLabel}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    return res.send(buffer);
  } catch (err) {
    console.error('[ExportRoutes] Error generating Excel file:', err);
    res.status(500).json({ success: false, message: 'Gagal membuat file Excel: ' + err.message });
  }
}

router.get('/transactions/excel', requireAdminRole, handleExcelExport);
router.post('/transactions/excel', requireAdminRole, handleExcelExport);

module.exports = router;
