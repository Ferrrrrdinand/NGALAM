/**
 * NGALAM FIX PRO - Transaction & Finance Export Service
 * Modul khusus untuk pemrosesan filter rentang tanggal dan pembuatan file Excel (.xlsx).
 * Khusus diperuntukkan bagi Role Admin (Super User / Owner).
 */

const ExcelJS = require('exceljs');
const { readTransactions } = require('./financeService');

/**
 * Normalisasi dan parse tanggal secara aman ke objek Date
 */
function parseDateSafe(dateInput, isEndOfDay = false) {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;

  if (isEndOfDay) {
    d.setHours(23, 59, 59, 999);
  } else {
    d.setHours(0, 0, 0, 0);
  }
  return d;
}

/**
 * Filter riwayat transaksi berdasarkan rentang tanggal
 * @param {string|Date} startDate - Tanggal mulai (YYYY-MM-DD atau ISO)
 * @param {string|Date} endDate - Tanggal akhir (YYYY-MM-DD atau ISO)
 * @returns {Array} Daftar transaksi yang cocok dengan filter
 */
function filterTransactions(startDate, endDate) {
  const allTransactions = readTransactions() || [];

  const start = startDate ? parseDateSafe(startDate, false) : null;
  const end = endDate ? parseDateSafe(endDate, true) : null;

  if (!start && !end) {
    return allTransactions;
  }

  return allTransactions.filter((tx) => {
    if (!tx.date) return false;
    const txDate = new Date(tx.date);
    if (isNaN(txDate.getTime())) return false;

    if (start && txDate < start) return false;
    if (end && txDate > end) return false;

    return true;
  });
}

/**
 * Format mata uang Rupiah untuk tampilan teks
 */
function formatRp(num) {
  const val = parseInt(num, 10) || 0;
  return 'Rp ' + val.toLocaleString('id-ID');
}

/**
 * Format tanggal Indonesia ramah baca
 */
function formatIndoDate(dateInput) {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Buat Buffer Dokumen Excel (.xlsx) Riwayat Transaksi dengan styling profesional
 * @param {Object} options - { startDate, endDate, adminName, transactions }
 * @returns {Promise<Buffer>} Buffer biner file Excel .xlsx
 */
async function generateTransactionsExcel({ startDate, endDate, adminName = 'Admin Super User', transactions = null }) {
  const txList = transactions || filterTransactions(startDate, endDate);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Ngalam Fix Pro Workshop System';
  workbook.lastModifiedBy = adminName;
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet('Riwayat Transaksi', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    views: [{ showGridLines: true }]
  });

  // 1. HEADER SECTION (Branding & Metadata Laporan)
  worksheet.mergeCells('A1:R1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'NGALAM FIX PRO - SISTEM OPERASIONAL WORKSHOP SERVIS SMARTPHONE';
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }; // Dark Navy #0f172a
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 30;

  worksheet.mergeCells('A2:R2');
  const subTitleCell = worksheet.getCell('A2');
  subTitleCell.value = 'LAPORAN REKAP RIWAYAT TRANSAKSI KASIR & FAKTUR NOTA';
  subTitleCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFB45309' } }; // Amber/Gold #b45309
  subTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFBEB' } }; // Soft Gold #fffbeb
  subTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 24;

  const periodeStr = (startDate && endDate)
    ? `${formatIndoDate(startDate)} s/d ${formatIndoDate(endDate)}`
    : 'Semua Periode (Keseluruhan Transaksi)';

  worksheet.mergeCells('A3:R3');
  const metaCell1 = worksheet.getCell('A3');
  metaCell1.value = `Periode Transaksi: ${periodeStr}   |   Diekspor oleh: ${adminName}   |   Waktu Cetak: ${new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}`;
  metaCell1.font = { name: 'Arial', size: 9.5, italic: true, color: { argb: 'FF334155' } };
  metaCell1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
  metaCell1.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(3).height = 20;

  worksheet.addRow([]); // Blank spacer row 4
  worksheet.getRow(4).height = 10;

  // 2. DEFINE TABLE COLUMNS (Row 5)
  const headers = [
    { header: 'No.', key: 'no', width: 6 },
    { header: 'No. Faktur (Invoice)', key: 'invoiceNumber', width: 22 },
    { header: 'No. Tiket Servis', key: 'ticketId', width: 20 },
    { header: 'Tanggal & Jam', key: 'displayDate', width: 22 },
    { header: 'Nama Pelanggan', key: 'customerName', width: 24 },
    { header: 'No. WhatsApp / HP', key: 'customerPhone', width: 18 },
    { header: 'Perangkat Smartphone', key: 'phoneType', width: 24 },
    { header: 'Teknisi Penanggung Jawab', key: 'technicianName', width: 26 },
    { header: 'Biaya Dasar (Rp)', key: 'baseCost', width: 17 },
    { header: 'Diskon (Rp)', key: 'discount', width: 15 },
    { header: 'Kode Promo', key: 'promoCode', width: 15 },
    { header: 'Biaya Antar (Rp)', key: 'deliveryFee', width: 16 },
    { header: 'Total Nett / Omset (Rp)', key: 'totalPaid', width: 22 },
    { header: 'Metode Pembayaran', key: 'paymentMethod', width: 20 },
    { header: 'Uang Diterima (Rp)', key: 'amountReceived', width: 18 },
    { header: 'Kembalian (Rp)', key: 'change', width: 16 },
    { header: 'Status Pembayaran', key: 'status', width: 18 },
    { header: 'Kasir Front Desk', key: 'cashierName', width: 22 }
  ];

  const headerRow = worksheet.addRow(headers.map((h) => h.header));
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; // Dark Slate #1e293b
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF475569' } },
      left: { style: 'thin', color: { argb: 'FF475569' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      right: { style: 'thin', color: { argb: 'FF475569' } }
    };
  });

  // 3. POPULATE DATA ROWS
  let totalBaseCost = 0;
  let totalDiscount = 0;
  let totalDelivery = 0;
  let totalNettOmset = 0;

  txList.forEach((tx, idx) => {
    const baseCost = parseInt(tx.baseCost, 10) || 0;
    const discount = parseInt(tx.discount, 10) || 0;
    const delivery = parseInt(tx.deliveryFee, 10) || 0;
    const totalPaid = parseInt(tx.totalPaid, 10) || (baseCost - discount + delivery);
    const amountReceived = parseInt(tx.amountReceived, 10) || totalPaid;
    const change = parseInt(tx.change, 10) || (amountReceived - totalPaid);

    totalBaseCost += baseCost;
    totalDiscount += discount;
    totalDelivery += delivery;
    totalNettOmset += totalPaid;

    const rowData = [
      idx + 1,
      tx.invoiceNumber || tx.id || '-',
      tx.ticketId || '-',
      tx.displayDate || (tx.date ? new Date(tx.date).toLocaleString('id-ID') : '-'),
      tx.customerName || 'Pelanggan Walk-in',
      tx.customerPhone || tx.whatsapp || '-',
      tx.phoneType || tx.deviceType || 'Smartphone',
      tx.technicianName || 'Teknisi Lab Meja 1',
      baseCost,
      discount,
      tx.promoCode || '-',
      delivery,
      totalPaid,
      tx.paymentMethod || 'Tunai (Cash)',
      amountReceived,
      change,
      tx.status || 'Lunas',
      tx.cashierName || 'Ibu Sarah (Meja 1)'
    ];

    const row = worksheet.addRow(rowData);
    row.height = 22;

    const isEven = (idx % 2 === 0);
    const rowBg = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Arial', size: 9.5, color: { argb: 'FF0F172A' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      // Alignment and number formatting
      if (colNumber === 1) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if ([2, 3, 4, 11, 14, 17].includes(colNumber)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if ([9, 10, 12, 13, 15, 16].includes(colNumber)) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '#,##0';
        if (colNumber === 13) {
          cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF047857' } }; // Emerald green
        }
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }

      if (colNumber === 17) {
        cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF047857' } };
      }
    });
  });

  // 4. SUMMARY / GRAND TOTAL ROW
  const totalRowIndex = worksheet.lastRow ? worksheet.lastRow.number + 1 : 6;
  worksheet.mergeCells(`A${totalRowIndex}:H${totalRowIndex}`);

  const summaryLabel = worksheet.getCell(`A${totalRowIndex}`);
  summaryLabel.value = `TOTAL KESELURUHAN (${txList.length} FAKTUR TRANSAKSI)`;
  summaryLabel.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF92400E' } };
  summaryLabel.alignment = { horizontal: 'center', vertical: 'middle' };

  const sumBaseCell = worksheet.getCell(`I${totalRowIndex}`);
  sumBaseCell.value = totalBaseCost;
  sumBaseCell.numFmt = '#,##0';

  const sumDiscCell = worksheet.getCell(`J${totalRowIndex}`);
  sumDiscCell.value = totalDiscount;
  sumDiscCell.numFmt = '#,##0';

  const blankK = worksheet.getCell(`K${totalRowIndex}`);
  blankK.value = '-';
  blankK.alignment = { horizontal: 'center', vertical: 'middle' };

  const sumDelivCell = worksheet.getCell(`L${totalRowIndex}`);
  sumDelivCell.value = totalDelivery;
  sumDelivCell.numFmt = '#,##0';

  const sumNettCell = worksheet.getCell(`M${totalRowIndex}`);
  sumNettCell.value = totalNettOmset;
  sumNettCell.numFmt = '#,##0';

  worksheet.mergeCells(`N${totalRowIndex}:R${totalRowIndex}`);
  const statusSummaryCell = worksheet.getCell(`N${totalRowIndex}`);
  statusSummaryCell.value = `Total Omset Bersih: ${formatRp(totalNettOmset)}`;
  statusSummaryCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF047857' } };
  statusSummaryCell.alignment = { horizontal: 'center', vertical: 'middle' };

  const summaryRow = worksheet.getRow(totalRowIndex);
  summaryRow.height = 26;
  summaryRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }; // Warm Amber/Gold #fef3c7
    cell.border = {
      top: { style: 'medium', color: { argb: 'FFB45309' } },
      left: { style: 'thin', color: { argb: 'FFB45309' } },
      bottom: { style: 'double', color: { argb: 'FFB45309' } },
      right: { style: 'thin', color: { argb: 'FFB45309' } }
    };
  });

  // 5. AUTO-ADJUST COLUMN WIDTHS
  headers.forEach((colDef, idx) => {
    const column = worksheet.getColumn(idx + 1);
    column.width = Math.max(colDef.width, 10);
  });

  // 6. GENERATE BINARY BUFFER
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

module.exports = {
  filterTransactions,
  generateTransactionsExcel,
  formatIndoDate,
  formatRp
};
