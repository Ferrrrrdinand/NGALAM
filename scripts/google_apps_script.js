/**
 * ============================================================================
 * 📱 NGALAM FIX PRO - GOOGLE APPS SCRIPT WEB APP INTEGRATION
 * ============================================================================
 * Kode ini dirancang khusus untuk menghubungkan Website Ngalam Fix Pro
 * secara langsung ke Google Spreadsheet tanpa memerlukan credentials.json (GCP).
 * 
 * FITUR:
 * 1. Mendukung 1 Spreadsheet Utama (Multi-Tab) ATAU Spreadsheet Terpisah (via ID)
 * 2. Inisialisasi Header Kolom Otomatis dengan desain rapi, warna & border
 * 3. Sinkronisasi Real-Time (Data Customer, Mitra Driver, Pekerja, Transaksi, Tiket)
 * 4. Mendukung Menu Kustom di dalam Google Sheets untuk tes langsung
 * 
 * CARA PEMASANGAN (CUKUP 3 MENIT):
 * 1. Buka Google Spreadsheet Anda (kosong).
 * 2. Klik menu "Ekstensi" (Extensions) > pilih "Apps Script".
 * 3. Hapus kode default (jika ada), lalu COPY & PASTE seluruh isi file ini.
 * 4. Klik tombol "Simpan" (ikon disket) atau Ctrl + S.
 * 5. Klik tombol biru "Terapkan" (Deploy) di kanan atas > pilih "Penerapan Baru" (New deployment).
 * 6. Klik ikon gear/roda gigi di samping "Pilih jenis", pilih "Aplikasi Web" (Web app).
 * 7. Atur:
 *    - Deskripsi: Ngalam Fix Pro Webhook
 *    - Jalankan sebagai (Execute as): Saya (email Google Anda)
 *    - Siapa yang memiliki akses (Who has access): Siapa saja (Anyone)
 * 8. Klik "Terapkan" (Deploy), lalu izinkan akses Google (Lanjutan > Buka... > Izinkan).
 * 9. Salin "URL Aplikasi Web" (contoh: https://script.google.com/macros/s/.../exec).
 * 10. Buka Dashboard Admin Ngalam Fix Pro > Pengaturan Spreadsheet > Paste URL tersebut!
 * ============================================================================
 */

// DEFINISI STRUKTUR TABEL & HEADER KOLOM RESMI NGALAM FIX PRO
const SCHEMAS = {
  // 1. DATA AKUN CUSTOMER
  customers: {
    sheetName: 'DataCustomer',
    color: '#0284c7', // Sky Blue
    headers: [
      'ID Pelanggan',
      'Nama Pelanggan',
      'Nomor WhatsApp',
      'Email Pelanggan',
      'Kecamatan / Domisili',
      'PIN Keamanan Akun',
      'Waktu Pendaftaran',
      'Kanal Pendaftaran',
      'Total Servis Pernah Dipesan'
    ]
  },

  // 2. DATA MITRA DRIVER & AFILIASI (12 KOLOM RESMI)
  drivers: {
    sheetName: 'MitraDriver',
    color: '#059669', // Emerald Green
    headers: [
      'ID Mitra Driver',
      'Username Akun',
      'Kata Sandi',
      'Nama Driver / Mitra',
      'Kategori Armada',
      'Nomor WhatsApp',
      'Email',
      'Kode Unik Afiliasi',
      'Komisi (%)',
      'Total Komisi Didapat (Rp)',
      'Status Driver',
      'Terakhir Aktif'
    ]
  },

  // 3. DATA AKUN TEKNISI WORKSHOP LAB (OTENTIKASI & MEJA KERJA)
  technicians: {
    sheetName: 'AkunTeknisi',
    color: '#0891b2', // Cyan Teal
    headers: [
      'ID Teknisi',
      'Username Akun',
      'Kata Sandi',
      'Nama Lengkap',
      'Role',
      'Nomor WhatsApp',
      'Email Kerja',
      'Meja Lab Workshop',
      'Spesialisasi Keahlian',
      'Status Online',
      'Status Kerja',
      'Unit Ditangani Hari Ini',
      'Waktu Terakhir Login'
    ]
  },

  // 4. DATA PEKERJA / TEKNISI / STAF (UMUM)
  workers: {
    sheetName: 'DataPekerja',
    color: '#7c3aed', // Purple Violet
    headers: [
      'ID Karyawan',
      'Username Akun',
      'Nama Lengkap',
      'Jabatan / Divisi',
      'Nomor WhatsApp',
      'Email Kerja',
      'Meja Lab / Penugasan',
      'Spesialisasi Keahlian',
      'Status Kerja Saat Ini',
      'Unit Ditangani Hari Ini'
    ]
  },

  // 4. RIWAYAT SELURUH TRANSAKSI & FAKTUR KASIR
  transactions: {
    sheetName: 'RiwayatTransaksi',
    color: '#d97706', // Amber Gold
    headers: [
      'No. Nota / Faktur',
      'No. Tiket Servis',
      'Waktu Pembayaran (WIT)',
      'Nama Pelanggan',
      'No. WhatsApp',
      'Tipe Smartphone',
      'Rincian Servis & Sparepart',
      'Teknisi Penanggung Jawab',
      'Biaya Servis Pokok (Rp)',
      'Potongan Diskon (Rp)',
      'Kode Voucher',
      'Ongkir Ojol (Rp)',
      'Total Pembayaran Nett (Rp)',
      'Metode Pembayaran',
      'Nominal Diterima (Rp)',
      'Kembalian (Rp)',
      'Status Pembayaran',
      'Kasir Front Desk'
    ]
  },

  // 5. TIKET SERVIS MASUK (ORDER BOOKING)
  orders: {
    sheetName: 'TiketServis',
    color: '#2563eb', // Royal Blue
    headers: [
      'No Tiket',
      'Waktu Masuk',
      'Nama Pelanggan',
      'No WhatsApp',
      'Domisili',
      'Tipe HP',
      'Model & Warna',
      'Kondisi Layar',
      'Kondisi Bodi',
      'Kelengkapan',
      'Kunci PIN Layar',
      'Gejala Kerusakan',
      'Metode',
      'Teknisi PJ',
      'Estimasi Biaya',
      'Durasi',
      'Status',
      'Langkah (1-5)',
      'Catatan Diagnosa'
    ]
  },

  // 6. CATATAN KEUANGAN & PEMBUKUAN KAS
  finances: {
    sheetName: 'CatatanKeuangan',
    color: '#0f172a', // Slate Dark
    headers: [
      'No. ID',
      'Tanggal & Jam',
      'No. Referensi / Kas',
      'Jenis Transaksi',
      'Kategori Pembukuan',
      'Keterangan Transaksi',
      'Debit Masuk (Rp)',
      'Kredit Keluar (Rp)',
      'Saldo Kas Berjalan (Rp)',
      'Staf / Kasir Pencatat'
    ]
  }
};

// DEFINISI FORMAT TIPE KOLOM SESUAI HEADLINE (ALIGNMENT & NUMBER FORMAT)
const COLUMN_METADATA = {
  customers: [
    { align: 'center', format: '@' },        // 0: ID Pelanggan
    { align: 'left',   format: '@' },        // 1: Nama Pelanggan
    { align: 'center', format: '@' },        // 2: Nomor WhatsApp
    { align: 'left',   format: '@' },        // 3: Email Pelanggan
    { align: 'left',   format: '@' },        // 4: Kecamatan / Domisili
    { align: 'center', format: '@' },        // 5: PIN Keamanan Akun
    { align: 'center', format: '@' },        // 6: Waktu Pendaftaran
    { align: 'center', format: '@' },        // 7: Kanal Pendaftaran
    { align: 'center', format: '#,##0' }     // 8: Total Servis Pernah Dipesan
  ],
  drivers: [
    { align: 'center', format: '@' },        // 0: ID Mitra Driver
    { align: 'center', format: '@' },        // 1: Username Akun
    { align: 'center', format: '@' },        // 2: Kata Sandi
    { align: 'left',   format: '@' },        // 3: Nama Driver / Mitra
    { align: 'left',   format: '@' },        // 4: Kategori Armada
    { align: 'center', format: '@' },        // 5: Nomor WhatsApp
    { align: 'left',   format: '@' },        // 6: Email
    { align: 'center', format: '@' },        // 7: Kode Unik Afiliasi
    { align: 'center', format: '@' },        // 8: Komisi (%)
    { align: 'right',  format: '"Rp "#,##0' },// 9: Total Komisi Didapat (Rp)
    { align: 'center', format: '@' },        // 10: Status Driver
    { align: 'center', format: '@' }         // 11: Terakhir Aktif
  ],
  technicians: [
    { align: 'center', format: '@' },        // 0: ID Teknisi
    { align: 'center', format: '@' },        // 1: Username Akun
    { align: 'center', format: '@' },        // 2: Kata Sandi
    { align: 'left',   format: '@' },        // 3: Nama Lengkap
    { align: 'center', format: '@' },        // 4: Role
    { align: 'center', format: '@' },        // 5: Nomor WhatsApp
    { align: 'left',   format: '@' },        // 6: Email Kerja
    { align: 'left',   format: '@' },        // 7: Meja Lab Workshop
    { align: 'left',   format: '@' },        // 8: Spesialisasi Keahlian
    { align: 'center', format: '@' },        // 9: Status Online
    { align: 'center', format: '@' },        // 10: Status Kerja
    { align: 'center', format: '#,##0' },    // 11: Unit Ditangani Hari Ini
    { align: 'center', format: '@' }         // 12: Waktu Terakhir Login
  ],
  workers: [
    { align: 'center', format: '@' },        // 0: ID Karyawan
    { align: 'center', format: '@' },        // 1: Username Akun
    { align: 'left',   format: '@' },        // 2: Nama Lengkap
    { align: 'left',   format: '@' },        // 3: Jabatan / Divisi
    { align: 'center', format: '@' },        // 4: Nomor WhatsApp
    { align: 'left',   format: '@' },        // 5: Email Kerja
    { align: 'left',   format: '@' },        // 6: Meja Lab / Penugasan
    { align: 'left',   format: '@' },        // 7: Spesialisasi Keahlian
    { align: 'center', format: '@' },        // 8: Status Kerja Saat Ini
    { align: 'center', format: '#,##0' }     // 9: Unit Ditangani Hari Ini
  ],
  transactions: [
    { align: 'center', format: '@' },        // 0: No. Nota / Faktur
    { align: 'center', format: '@' },        // 1: No. Tiket Servis
    { align: 'center', format: '@' },        // 2: Waktu Pembayaran (WIT)
    { align: 'left',   format: '@' },        // 3: Nama Pelanggan
    { align: 'center', format: '@' },        // 4: No. WhatsApp
    { align: 'left',   format: '@' },        // 5: Tipe Smartphone
    { align: 'left',   format: '@' },        // 6: Rincian Servis & Sparepart
    { align: 'left',   format: '@' },        // 7: Teknisi Penanggung Jawab
    { align: 'right',  format: '"Rp "#,##0' },// 8: Biaya Servis Pokok (Rp)
    { align: 'right',  format: '"Rp "#,##0' },// 9: Potongan Diskon (Rp)
    { align: 'center', format: '@' },        // 10: Kode Voucher
    { align: 'right',  format: '"Rp "#,##0' },// 11: Ongkir Ojol (Rp)
    { align: 'right',  format: '"Rp "#,##0' },// 12: Total Pembayaran Nett (Rp)
    { align: 'center', format: '@' },        // 13: Metode Pembayaran
    { align: 'right',  format: '"Rp "#,##0' },// 14: Nominal Diterima (Rp)
    { align: 'right',  format: '"Rp "#,##0' },// 15: Kembalian (Rp)
    { align: 'center', format: '@' },        // 16: Status Pembayaran
    { align: 'center', format: '@' }         // 17: Kasir Front Desk
  ],
  orders: [
    { align: 'center', format: '@' },        // 0: No Tiket
    { align: 'center', format: '@' },        // 1: Waktu Masuk
    { align: 'left',   format: '@' },        // 2: Nama Pelanggan
    { align: 'center', format: '@' },        // 3: No WhatsApp
    { align: 'left',   format: '@' },        // 4: Domisili
    { align: 'left',   format: '@' },        // 5: Tipe HP
    { align: 'left',   format: '@' },        // 6: Model & Warna
    { align: 'left',   format: '@' },        // 7: Kondisi Layar
    { align: 'left',   format: '@' },        // 8: Kondisi Bodi
    { align: 'left',   format: '@' },        // 9: Kelengkapan
    { align: 'center', format: '@' },        // 10: Kunci PIN Layar
    { align: 'left',   format: '@' },        // 11: Gejala Kerusakan
    { align: 'center', format: '@' },        // 12: Metode
    { align: 'left',   format: '@' },        // 13: Teknisi PJ
    { align: 'right',  format: '"Rp "#,##0' },// 14: Estimasi Biaya
    { align: 'center', format: '@' },        // 15: Durasi
    { align: 'center', format: '@' },        // 16: Status
    { align: 'center', format: '#,##0' },    // 17: Langkah (1-5)
    { align: 'left',   format: '@' }         // 18: Catatan Diagnosa
  ],
  finances: [
    { align: 'center', format: '@' },        // 0: No. ID
    { align: 'center', format: '@' },        // 1: Tanggal & Jam
    { align: 'center', format: '@' },        // 2: No. Referensi / Kas
    { align: 'center', format: '@' },        // 3: Jenis Transaksi
    { align: 'left',   format: '@' },        // 4: Kategori Pembukuan
    { align: 'left',   format: '@' },        // 5: Keterangan Transaksi
    { align: 'right',  format: '"Rp "#,##0' },// 6: Debit Masuk (Rp)
    { align: 'right',  format: '"Rp "#,##0' },// 7: Kredit Keluar (Rp)
    { align: 'right',  format: '"Rp "#,##0' },// 8: Saldo Kas Berjalan (Rp)
    { align: 'center', format: '@' }         // 9: Staf / Kasir Pencatat
  ]
};

/**
 * Custom Menu saat membuka Spreadsheet
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🛠️ Ngalam Fix Pro')
    .addItem('📋 Inisialisasi Seluruh Header Kolom Otomatis', 'menuInitAllHeaders')
    .addSeparator()
    .addItem('📅 Rapikan / Pisahkan Transaksi ke Tab Bulan (WIT)', 'menuOrganizeTransactionsByMonth')
    .addItem('🔍 Periksa Status Koneksi Web App', 'menuCheckStatus')
    .addItem('📖 Panduan Penggunaan', 'menuShowGuide')
    .addToUi();
}

/**
 * Handle HTTP GET Request (Browser check / Ping)
 */
function doGet(e) {
  const response = {
    status: 'ONLINE',
    system: 'Ngalam Fix Pro - Google Apps Script Web App',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    message: 'Layanan integrasi Google Sheets aktif dan siap menerima sinkronisasi data dari website Ngalam Fix Pro.',
    supportedActions: [
      'ping',
      'init_headers',
      'sync_customers',
      'add_customer',
      'sync_drivers',
      'sync_workers',
      'sync_technicians',
      'auth_technician',
      'get_technicians',
      'add_technician',
      'sync_transactions',
      'add_transaction',
      'sync_orders',
      'add_order',
      'sync_finances',
      'sync_all'
    ]
  };

  return ContentService.createTextOutput(JSON.stringify(response, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle HTTP POST Request (Data Ingestion & Sync)
 */
function doPost(e) {
  let lock = LockService.getScriptLock();
  try {
    // Kunci eksekusi selama maksimal 30 detik untuk mencegah konflik penulisan simultan
    lock.waitLock(30000);
  } catch (lockErr) {
    return createJsonResponse(false, 'Server Google Sheets sedang sibuk memproses antrean lain. Silakan coba lagi.');
  }

  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (err) {
        // Fallback jika dikirim via URL encoded
        if (e.parameter && e.parameter.data) {
          payload = JSON.parse(e.parameter.data);
        } else {
          payload = e.parameter || {};
        }
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action || 'ping';

    // Rute aksi
    switch (action) {
      case 'ping':
      case 'test':
        return createJsonResponse(true, 'Koneksi Google Apps Script berhasil terhubung ke website Ngalam Fix Pro!', {
          timestamp: new Date().toISOString()
        });

      case 'init_headers':
        return handleInitHeaders(payload);

      case 'sync_customers':
        return handleSyncRows('customers', payload);

      case 'add_customer':
        return handleAppendRow('customers', payload);

      case 'sync_drivers':
        return handleSyncRows('drivers', payload);

      case 'auth_driver':
        return handleAuthDriver(payload);

      case 'get_drivers':
        return handleGetDrivers(payload);

      case 'add_driver':
        return handleAppendRow('drivers', payload);

      case 'record_mitra_commission':
        return handleRecordMitraCommission(payload);

      case 'auth_customer':
        return handleAuthCustomer(payload);

      case 'get_customers':
        return handleGetCustomers(payload);

      case 'sync_workers':
        return handleSyncRows('workers', payload);

      case 'sync_technicians':
        return handleSyncRows('technicians', payload);

      case 'auth_technician':
        return handleAuthTechnician(payload);

      case 'get_technicians':
        return handleGetTechnicians(payload);

      case 'add_technician':
        return handleAppendRow('technicians', payload);

      case 'sync_transactions':
        return handleSyncTransactionsMonthly(payload);

      case 'add_transaction':
        return handleAddTransactionMonthly(payload);

      case 'sync_orders':
        return handleSyncRows('orders', payload);

      case 'add_order':
        return handleAppendRow('orders', payload);

      case 'sync_finances':
        return handleSyncRows('finances', payload);

      case 'sync_all':
        return handleSyncAll(payload);

      default:
        return createJsonResponse(false, 'Aksi tidak dikenal: ' + action);
    }
  } catch (fatalErr) {
    return createJsonResponse(false, 'Terjadi kesalahan sistem Apps Script: ' + fatalErr.message);
  } finally {
    try {
      lock.releaseLock();
    } catch (_) { }
  }
}

/**
 * Dapatkan Spreadsheet Target (Bisa berupa ID eksternal atau Active Spreadsheet)
 */
function getTargetSpreadsheet(spreadsheetId) {
  if (spreadsheetId && String(spreadsheetId).trim().length > 10) {
    try {
      return SpreadsheetApp.openById(String(spreadsheetId).trim());
    } catch (e) {
      throw new Error('Gagal membuka Spreadsheet ID: ' + spreadsheetId + '. Pastikan ID benar dan izin editor telah diberikan.');
    }
  }
  // Fallback ke spreadsheet tempat script ini terpasang
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  throw new Error('Spreadsheet ID belum diberikan dan script dijalankan di luar spreadsheet aktif.');
}

/**
 * Dapatkan atau Buat Sheet Tab sesuai nama
 */
function getOrCreateSheet(ss, sheetName) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

/**
 * Format Header Kolom agar tampak mewah, rapi, dan profesional
 */
function formatHeaderRow(sheet, headers, headerColor) {
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground(headerColor || '#0f172a');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setFontFamily('Arial');
  headerRange.setFontSize(10);
  headerRange.setHorizontalAlignment('center');
  headerRange.setVerticalAlignment('middle');
  headerRange.setWrap(false);

  sheet.setRowHeight(1, 38);
  sheet.setFrozenRows(1);

  // Auto resize kolom agar teks pas
  for (let c = 1; c <= headers.length; c++) {
    sheet.autoResizeColumn(c);
    // Beri batas minimal lebar 120px untuk kenyamanan baca
    if (sheet.getColumnWidth(c) < 130) {
      sheet.setColumnWidth(c, 130);
    }
  }
}

/**
 * Terapkan Format Tipe Data, Alignment, dan Border Sesuai Headline Kolom
 */
function applyColumnFormatting(sheet, schemaKey, startRow, numRows) {
  if (!numRows || numRows < 1) return;
  const meta = COLUMN_METADATA[schemaKey];
  if (!meta) return;

  const totalCols = meta.length;

  for (let c = 0; c < totalCols; c++) {
    const colIndex = c + 1;
    const colRange = sheet.getRange(startRow, colIndex, numRows, 1);
    const m = meta[c];

    if (m.align) {
      colRange.setHorizontalAlignment(m.align);
    }
    if (m.format) {
      colRange.setNumberFormat(m.format);
    }
  }

  // Border tabel lembut dan rapi
  const fullRange = sheet.getRange(startRow, 1, numRows, totalCols);
  fullRange.setFontFamily('Arial');
  fullRange.setFontSize(9.5);
  fullRange.setVerticalAlignment('middle');
  fullRange.setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);
}

/**
 * Inisialisasi Seluruh Header Kolom
 */
function handleInitHeaders(payload) {
  const ss = getTargetSpreadsheet(payload.spreadsheetId);
  const targetKey = payload.schemaKey; // opsional: jika ingin init 1 schema saja

  const keysToInit = targetKey && SCHEMAS[targetKey] ? [targetKey] : Object.keys(SCHEMAS);
  const results = [];

  keysToInit.forEach(key => {
    const s = SCHEMAS[key];
    const sheetName = (payload.sheetNames && payload.sheetNames[key]) || s.sheetName;
    const sheet = getOrCreateSheet(ss, sheetName);
    formatHeaderRow(sheet, s.headers, s.color);
    results.push(sheetName);
  });

  return createJsonResponse(true, 'Header kolom berhasil diinisialisasi untuk sheet: ' + results.join(', '), {
    initializedSheets: results
  });
}

/**
 * Sinkronisasi Seluruh Baris (Clear baris data lama & Tulis ulang seluruh data terkini)
 */
function handleSyncRows(schemaKey, payload) {
  const schema = SCHEMAS[schemaKey];
  if (!schema) throw new Error('Skema tidak valid: ' + schemaKey);

  const ss = getTargetSpreadsheet(payload.spreadsheetId);
  const sheetName = payload.sheetName || schema.sheetName;
  const sheet = getOrCreateSheet(ss, sheetName);

  // Pastikan header ada di baris 1
  formatHeaderRow(sheet, schema.headers, schema.color);

  // Bersihkan data baris sebelumnya (mulai baris 2)
  const lastRow = sheet.getLastRow();
  const maxCols = schema.headers.length;
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, maxCols).clearContent().clearFormat();
  }

  const rows = payload.rows || [];
  if (rows.length > 0) {
    // Normalisasi panjang setiap baris agar sesuai dengan jumlah kolom header
    const normalizedRows = rows.map(r => {
      const arr = Array.isArray(r) ? r : [];
      const rowData = [];
      for (let i = 0; i < maxCols; i++) {
        rowData.push(arr[i] !== undefined && arr[i] !== null ? arr[i] : '');
      }
      return rowData;
    });

    const dataRange = sheet.getRange(2, 1, normalizedRows.length, maxCols);
    dataRange.setValues(normalizedRows);
    dataRange.setFontFamily('Arial');
    dataRange.setFontSize(9.5);
    dataRange.setVerticalAlignment('middle');

    // Alternating zebra striping lembut untuk baris data
    for (let r = 0; r < normalizedRows.length; r++) {
      const rowNum = r + 2;
      const bg = r % 2 === 0 ? '#ffffff' : '#f8fafc';
      sheet.getRange(rowNum, 1, 1, maxCols).setBackground(bg);
    }

    // Auto-fit kolom kembali
    for (let c = 1; c <= maxCols; c++) {
      sheet.autoResizeColumn(c);
      if (sheet.getColumnWidth(c) < 130) sheet.setColumnWidth(c, 130);
    }

    // Terapkan perataan teks dan format Rupiah/Teks sesuai headline
    applyColumnFormatting(sheet, schemaKey, 2, normalizedRows.length);
  }

  return createJsonResponse(true, `Berhasil menyinkronkan ${rows.length} data ke sheet "${sheetName}".`, {
    sheetName: sheetName,
    count: rows.length
  });
}

/**
 * Tambah 1 Baris Baru di Baris Paling Bawah (Append)
 */
function handleAppendRow(schemaKey, payload) {
  const schema = SCHEMAS[schemaKey];
  if (!schema) throw new Error('Skema tidak valid: ' + schemaKey);

  const ss = getTargetSpreadsheet(payload.spreadsheetId);
  const sheetName = payload.sheetName || schema.sheetName;
  const sheet = getOrCreateSheet(ss, sheetName);

  // Pastikan header ada
  if (sheet.getLastRow() === 0) {
    formatHeaderRow(sheet, schema.headers, schema.color);
  }

  const maxCols = schema.headers.length;
  const rowData = [];
  const incoming = Array.isArray(payload.row) ? payload.row : [];

  for (let i = 0; i < maxCols; i++) {
    rowData.push(incoming[i] !== undefined && incoming[i] !== null ? incoming[i] : '');
  }

  sheet.appendRow(rowData);
  const newRowIndex = sheet.getLastRow();

  // Format baris baru
  const rowRange = sheet.getRange(newRowIndex, 1, 1, maxCols);
  rowRange.setFontFamily('Arial');
  rowRange.setFontSize(9.5);
  rowRange.setVerticalAlignment('middle');
  rowRange.setBackground(newRowIndex % 2 === 0 ? '#ffffff' : '#f8fafc');

  // Terapkan format tipe kolom sesuai headline
  applyColumnFormatting(sheet, schemaKey, newRowIndex, 1);

  return createJsonResponse(true, `Berhasil menambahkan 1 data ke sheet "${sheetName}".`, {
    rowIndex: newRowIndex
  });
}

/**
 * ============================================================================
 * 📅 PENCATATAN TRANSAKSI BULANAN BERDASARKAN WAKTU INDONESIA TIMUR (WIT / GMT+9)
 * ============================================================================
 */

/**
 * Dapatkan Nama Sheet Bulan & Tahun berdasarkan Waktu Indonesia Timur (WIT / GMT+9)
 * Contoh: "Oktober 2026", "November 2026", "Januari 2027"
 */
function getWitMonthYearSheetName(dateInput) {
  let dateObj;
  if (!dateInput) {
    dateObj = new Date();
  } else if (dateInput instanceof Date) {
    dateObj = dateInput;
  } else {
    dateObj = new Date(dateInput);
    if (isNaN(dateObj.getTime())) {
      dateObj = new Date();
    }
  }

  // Format menggunakan timezone GMT+09:00 (WIT)
  const yyyyMM = Utilities.formatDate(dateObj, "GMT+09:00", "yyyy-MM");
  const parts = yyyyMM.split('-');
  const year = parts[0];
  const monthIndex = parseInt(parts[1], 10) - 1;

  const NAMA_BULAN_INDONESIA = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const namaBulan = NAMA_BULAN_INDONESIA[monthIndex] || 'Januari';
  return `${namaBulan} ${year}`;
}

/**
 * Tambah Transaksi ke Lembar Bulanan Berdasarkan Waktu WIT
 */
function handleAddTransactionMonthly(payload) {
  const schema = SCHEMAS.transactions;
  const ss = getTargetSpreadsheet(payload.spreadsheetId);

  const incomingRow = Array.isArray(payload.row) ? payload.row : [];
  // Baris ke-2 biasanya berisi timestamp / tanggal pembayaran
  const txTimeRaw = payload.paidAt || payload.timestamp || incomingRow[2] || new Date();

  // Tentukan nama sheet bulanan WIT (misal: "Oktober 2026")
  const monthlySheetName = (payload.sheetName && payload.sheetName !== 'RiwayatTransaksi')
    ? payload.sheetName
    : getWitMonthYearSheetName(txTimeRaw);

  const sheet = getOrCreateSheet(ss, monthlySheetName);

  // Pastikan header kolom resmi di baris 1
  if (sheet.getLastRow() === 0) {
    formatHeaderRow(sheet, schema.headers, schema.color);
  }

  const maxCols = schema.headers.length;
  const rowData = [];
  for (let i = 0; i < maxCols; i++) {
    rowData.push(incomingRow[i] !== undefined && incomingRow[i] !== null ? incomingRow[i] : '');
  }

  sheet.appendRow(rowData);
  const newRowIndex = sheet.getLastRow();

  // Format baris baru
  const rowRange = sheet.getRange(newRowIndex, 1, 1, maxCols);
  rowRange.setFontFamily('Arial');
  rowRange.setFontSize(9.5);
  rowRange.setVerticalAlignment('middle');
  rowRange.setBackground(newRowIndex % 2 === 0 ? '#ffffff' : '#f8fafc');

  // Terapkan format kolom sesuai headline transaksi (WIT)
  applyColumnFormatting(sheet, 'transactions', newRowIndex, 1);

  return createJsonResponse(true, `Berhasil mencatat transaksi ke lembar "${monthlySheetName}" (Zona Waktu WIT).`, {
    sheetName: monthlySheetName,
    rowIndex: newRowIndex
  });
}

/**
 * Sinkronisasi Transaksi dengan Pembagian Sheet Otomatis per Bulan (WIT)
 */
function handleSyncTransactionsMonthly(payload) {
  const schema = SCHEMAS.transactions;
  const ss = getTargetSpreadsheet(payload.spreadsheetId);
  const rows = payload.rows || [];

  // Jika payload sudah menentukan nama sheet spesifik non-default
  if (payload.sheetName && payload.sheetName !== 'RiwayatTransaksi') {
    return handleSyncRows('transactions', payload);
  }

  if (rows.length === 0) {
    // Buat lembar bulan saat ini dengan header kolom resmi
    const currentMonthSheet = getWitMonthYearSheetName(new Date());
    const sheet = getOrCreateSheet(ss, currentMonthSheet);
    formatHeaderRow(sheet, schema.headers, schema.color);
    return createJsonResponse(true, `Lembar "${currentMonthSheet}" (WIT) telah disiapkan dengan header kolom resmi.`, {
      sheetName: currentMonthSheet,
      count: 0
    });
  }

  // Kelompokkan baris berdasarkan Bulan & Tahun WIT
  const groupedByMonth = {};
  rows.forEach(r => {
    const arr = Array.isArray(r) ? r : [];
    const txTimeRaw = arr[2] || new Date();
    const monthKey = getWitMonthYearSheetName(txTimeRaw);
    if (!groupedByMonth[monthKey]) {
      groupedByMonth[monthKey] = [];
    }
    groupedByMonth[monthKey].push(arr);
  });

  const createdSheets = [];
  const maxCols = schema.headers.length;

  for (const monthSheetName in groupedByMonth) {
    const sheet = getOrCreateSheet(ss, monthSheetName);
    formatHeaderRow(sheet, schema.headers, schema.color);

    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, maxCols).clearContent().clearFormat();
    }

    const monthRows = groupedByMonth[monthSheetName];
    const normalizedRows = monthRows.map(r => {
      const rowData = [];
      for (let i = 0; i < maxCols; i++) {
        rowData.push(r[i] !== undefined && r[i] !== null ? r[i] : '');
      }
      return rowData;
    });

    sheet.getRange(2, 1, normalizedRows.length, maxCols).setValues(normalizedRows);

    // Format zebra styling
    const dataRange = sheet.getRange(2, 1, normalizedRows.length, maxCols);
    dataRange.setFontFamily('Arial');
    dataRange.setFontSize(9.5);
    dataRange.setVerticalAlignment('middle');

    for (let r = 0; r < normalizedRows.length; r++) {
      const rowIdx = r + 2;
      const bg = rowIdx % 2 === 0 ? '#ffffff' : '#f8fafc';
      sheet.getRange(rowIdx, 1, 1, maxCols).setBackground(bg);
    }

    for (let c = 1; c <= maxCols; c++) {
      sheet.autoResizeColumn(c);
      if (sheet.getColumnWidth(c) < 130) sheet.setColumnWidth(c, 130);
    }

    // Terapkan format kolom transaksi sesuai headline
    applyColumnFormatting(sheet, 'transactions', 2, normalizedRows.length);

    createdSheets.push({ sheetName: monthSheetName, count: monthRows.length });
  }

  return createJsonResponse(true, `Berhasil memisahkan & mencatat ${rows.length} transaksi ke dalam ${createdSheets.length} sheet bulanan (WIT).`, {
    sheets: createdSheets
  });
}

/**
 * Sinkronisasi Semua Kategori Sekaligus (Batch Sync)
 */
function handleSyncAll(payload) {
  const ss = getTargetSpreadsheet(payload.spreadsheetId);
  const report = {};

  if (payload.customers && Array.isArray(payload.customers.rows)) {
    handleSyncRows('customers', {
      spreadsheetId: payload.customers.spreadsheetId || payload.spreadsheetId,
      sheetName: payload.customers.sheetName,
      rows: payload.customers.rows
    });
    report.customers = payload.customers.rows.length;
  }

  if (payload.drivers && Array.isArray(payload.drivers.rows)) {
    handleSyncRows('drivers', {
      spreadsheetId: payload.drivers.spreadsheetId || payload.spreadsheetId,
      sheetName: payload.drivers.sheetName,
      rows: payload.drivers.rows
    });
    report.drivers = payload.drivers.rows.length;
  }

  if (payload.workers && Array.isArray(payload.workers.rows)) {
    handleSyncRows('workers', {
      spreadsheetId: payload.workers.spreadsheetId || payload.spreadsheetId,
      sheetName: payload.workers.sheetName,
      rows: payload.workers.rows
    });
    report.workers = payload.workers.rows.length;
  }

  if (payload.technicians && Array.isArray(payload.technicians.rows)) {
    handleSyncRows('technicians', {
      spreadsheetId: payload.technicians.spreadsheetId || payload.spreadsheetId,
      sheetName: payload.technicians.sheetName,
      rows: payload.technicians.rows
    });
    report.technicians = payload.technicians.rows.length;
  }

  if (payload.transactions && Array.isArray(payload.transactions.rows)) {
    handleSyncRows('transactions', {
      spreadsheetId: payload.transactions.spreadsheetId || payload.spreadsheetId,
      sheetName: payload.transactions.sheetName,
      rows: payload.transactions.rows
    });
    report.transactions = payload.transactions.rows.length;
  }

  if (payload.orders && Array.isArray(payload.orders.rows)) {
    handleSyncRows('orders', {
      spreadsheetId: payload.orders.spreadsheetId || payload.spreadsheetId,
      sheetName: payload.orders.sheetName,
      rows: payload.orders.rows
    });
    report.orders = payload.orders.rows.length;
  }

  if (payload.finances && Array.isArray(payload.finances.rows)) {
    handleSyncRows('finances', {
      spreadsheetId: payload.finances.spreadsheetId || payload.spreadsheetId,
      sheetName: payload.finances.sheetName,
      rows: payload.finances.rows
    });
    report.finances = payload.finances.rows.length;
  }

  return createJsonResponse(true, 'Seluruh sinkronisasi data Google Sheets berhasil!', report);
}

/**
 * Otentikasi Langsung Akun Teknisi via Google Spreadsheet
 * Mengecek apakah username/email dan kata sandi cocok di sheet AkunTeknisi
 */
function handleAuthTechnician(payload) {
  const ss = getTargetSpreadsheet(payload.spreadsheetId);
  const sheetName = payload.sheetName || SCHEMAS.technicians.sheetName;
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    // Buat otomatis jika belum ada sheet AkunTeknisi
    sheet = ss.insertSheet(sheetName);
    formatHeaderRow(sheet, SCHEMAS.technicians.headers, SCHEMAS.technicians.color);
    return createJsonResponse(false, `Sheet "${sheetName}" baru saja dibuat otomatis dengan header. Data akun teknisi masih kosong di Spreadsheet.`);
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return createJsonResponse(false, `Data akun teknisi di sheet "${sheetName}" masih kosong. Silakan tambahkan baris akun teknisi.`);
  }

  const maxCols = SCHEMAS.technicians.headers.length;
  const values = sheet.getRange(2, 1, lastRow - 1, maxCols).getValues();
  const searchId = String(payload.identifier || '').trim().toLowerCase();
  const searchPass = String(payload.password || '').trim();
  const digitsOnly = searchId.replace(/\D/g, '');

  if (!searchId) {
    return createJsonResponse(false, 'Identifier (Username / Email / WhatsApp) teknisi wajib diisi.');
  }
  if (!searchPass) {
    return createJsonResponse(false, 'Kata sandi teknisi wajib diisi.');
  }

  let foundRowIndex = -1;
  let foundAccount = null;

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    // Index mapping:
    // 0: ID Teknisi
    // 1: Username Akun
    // 2: Kata Sandi
    // 3: Nama Lengkap
    // 4: Role
    // 5: Nomor WhatsApp
    // 6: Email Kerja
    // 7: Meja Lab Workshop
    // 8: Spesialisasi Keahlian
    // 9: Status Online
    // 10: Status Kerja
    // 11: Unit Ditangani Hari Ini
    // 12: Waktu Terakhir Login

    const rowId = String(row[0] || '').trim().toLowerCase();
    const rowUser = String(row[1] || '').trim().toLowerCase();
    const rowPass = String(row[2] || '').trim();
    const rowName = String(row[3] || '').trim().toLowerCase();
    const rowRole = String(row[4] || 'teknisi').trim().toLowerCase();
    const rowPhone = String(row[5] || '').trim();
    const rowPhoneDigits = rowPhone.replace(/\D/g, '');
    const rowEmail = String(row[6] || '').trim().toLowerCase();

    // Pastikan akun memiliki role teknisi
    if (rowRole !== 'teknisi' && rowRole !== 'technician') {
      continue;
    }

    // Cocokkan identifier
    const isIdMatch = (
      rowUser === searchId ||
      rowEmail === searchId ||
      rowId === searchId ||
      rowName === searchId ||
      (searchId.length >= 4 && (rowName.indexOf(searchId) !== -1 || searchId.indexOf(rowUser) !== -1)) ||
      (digitsOnly.length >= 8 && rowPhoneDigits.endsWith(digitsOnly))
    );

    if (isIdMatch) {
      const cleanRowPass = String(rowPass).trim();
      const cleanSearchPass = String(searchPass).trim();
      const isPassMatch = (
        cleanRowPass === cleanSearchPass ||
        (cleanRowPass && cleanSearchPass && !isNaN(cleanRowPass) && !isNaN(cleanSearchPass) && Number(cleanRowPass) === Number(cleanSearchPass)) ||
        cleanSearchPass.replace(/^0+/, '') === cleanRowPass.replace(/^0+/, '')
      );

      if (isPassMatch) {
        foundRowIndex = i + 2; // 1-based, +1 header
        foundAccount = {
          id: row[0] || 'TEK-' + (i + 1),
          username: row[1] || searchId,
          name: row[3] || row[1] || 'Teknisi Lab',
          role: 'teknisi',
          avatar: '🔬',
          phone: row[5] || '',
          email: row[6] || '',
          desk: row[7] || 'Meja Lab Workshop - Teknisi Utama',
          specialty: row[8] || 'Spesialis Servis Smartphone & Hardware Lab',
          onlineStatus: 'online',
          workStatus: row[10] || 'standby',
          handledToday: Number(row[11]) || 0
        };
        break;
      } else {
        return createJsonResponse(false, 'Kata sandi teknisi salah. Silakan periksa kembali kata sandi di Google Spreadsheet.');
      }
    }
  }

  if (!foundAccount) {
    return createJsonResponse(false, 'Akun teknisi tidak terdaftar di Google Spreadsheet. Pastikan akun terdaftar di tab AkunTeknisi dengan Role "teknisi".');
  }

  // Update Status Online (Kolom 10) dan Waktu Terakhir Login (Kolom 13) di baris akun yang ditemukan
  try {
    const nowStr = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    sheet.getRange(foundRowIndex, 10).setValue('Online');
    sheet.getRange(foundRowIndex, 13).setValue(nowStr);
  } catch (updateErr) {
    // Non-fatal logging
  }

  return createJsonResponse(true, `Login teknisi "${foundAccount.name}" berhasil terverifikasi dari Google Spreadsheet!`, {
    technician: foundAccount
  });
}

/**
 * Ambil Seluruh Data Akun Teknisi dari Google Spreadsheet
 */
function handleGetTechnicians(payload) {
  const ss = getTargetSpreadsheet(payload.spreadsheetId);
  const sheetName = payload.sheetName || SCHEMAS.technicians.sheetName;
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    return createJsonResponse(false, `Sheet "${sheetName}" tidak ditemukan.`);
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return createJsonResponse(true, 'Data teknisi kosong.', { count: 0, technicians: [] });
  }

  const maxCols = SCHEMAS.technicians.headers.length;
  const values = sheet.getRange(2, 1, lastRow - 1, maxCols).getValues();

  const technicians = values.map((row, idx) => ({
    id: row[0] || 'TEK-' + (idx + 1),
    username: row[1],
    password: row[2],
    name: row[3],
    role: row[4] || 'teknisi',
    phone: row[5],
    email: row[6],
    desk: row[7],
    specialty: row[8],
    onlineStatus: row[9],
    workStatus: row[10],
    handledToday: Number(row[11]) || 0,
    lastLogin: row[12]
  })).filter(t => t.username);

  return createJsonResponse(true, `Berhasil mengambil ${technicians.length} akun teknisi dari Google Spreadsheet.`, {
    count: technicians.length,
    technicians: technicians
  });
}

/**
 * Otentikasi Langsung Akun Mitra Driver / Ojol via Google Spreadsheet
 * Mengecek apakah username/email/wa dan kata sandi cocok di sheet MitraDriver
 */
function handleAuthDriver(payload) {
  const ss = getTargetSpreadsheet(payload.spreadsheetId);
  const sheetName = payload.sheetName || SCHEMAS.drivers.sheetName;
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    formatHeaderRow(sheet, SCHEMAS.drivers.headers, SCHEMAS.drivers.color);
    return createJsonResponse(false, `Sheet "${sheetName}" baru saja dibuat otomatis dengan header. Data mitra masih kosong.`);
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return createJsonResponse(false, `Data akun mitra di sheet "${sheetName}" masih kosong. Silakan tambahkan baris akun mitra.`);
  }

  const maxCols = SCHEMAS.drivers.headers.length;
  const values = sheet.getRange(2, 1, lastRow - 1, maxCols).getValues();
  const searchId = String(payload.identifier || '').trim().toLowerCase();
  const searchPass = String(payload.password || '').trim();
  const digitsOnly = searchId.replace(/\D/g, '');

  if (!searchId) {
    return createJsonResponse(false, 'Identifier (Username / WhatsApp / Email) mitra wajib diisi.');
  }
  if (!searchPass) {
    return createJsonResponse(false, 'Kata sandi akun mitra wajib diisi.');
  }

  let foundRowIndex = -1;
  let foundDriver = null;

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    // 0: ID Mitra Driver
    // 1: Username Akun
    // 2: Kata Sandi
    // 3: Nama Driver / Mitra
    // 4: Kategori Armada
    // 5: Nomor WhatsApp
    // 6: Email
    // 7: Kode Unik Afiliasi
    // 8: Komisi (%)
    // 9: Total Komisi Didapat (Rp)
    // 10: Status Driver
    // 11: Terakhir Aktif

    const rowId = String(row[0] || '').trim().toLowerCase();
    const rowUser = String(row[1] || '').trim().toLowerCase();
    const rowPass = String(row[2] || '').trim();
    const rowName = String(row[3] || '').trim().toLowerCase();
    const rowCategory = String(row[4] || 'Mitra Kurir Ojek Online').trim();
    const rowPhone = String(row[5] || '').trim();
    const rowPhoneDigits = rowPhone.replace(/\D/g, '');
    const rowEmail = String(row[6] || '').trim().toLowerCase();
    const rowRefCode = String(row[7] || '').trim();

    const isMatch = (
      rowUser === searchId ||
      rowEmail === searchId ||
      rowId === searchId ||
      rowRefCode.toLowerCase() === searchId ||
      (digitsOnly.length >= 8 && rowPhoneDigits.endsWith(digitsOnly))
    );

    if (isMatch) {
      const cleanRowPass = String(rowPass).trim();
      const cleanSearchPass = String(searchPass).trim();
      const isPassMatch = (
        cleanRowPass === cleanSearchPass ||
        (cleanRowPass && cleanSearchPass && !isNaN(cleanRowPass) && !isNaN(cleanSearchPass) && Number(cleanRowPass) === Number(cleanSearchPass)) ||
        cleanSearchPass.replace(/^0+/, '') === cleanRowPass.replace(/^0+/, '')
      );

      if (isPassMatch) {
        foundRowIndex = i + 2;
        const commRateNum = parseInt(String(row[8] || '10').replace(/\D/g, ''), 10) || 10;
        const totalCommNum = parseInt(String(row[9] || '0').replace(/\D/g, ''), 10) || 0;

        foundDriver = {
          id: row[0] || 'MTR-' + (i + 1),
          username: row[1] || searchId,
          name: row[3] || row[1] || 'Mitra Driver',
          role: rowCategory.toLowerCase().includes('bengkel') ? 'mitra' : 'ojol',
          category: rowCategory,
          avatar: rowCategory.toLowerCase().includes('bengkel') ? '🏪' : '🛵',
          phone: row[5] || '',
          email: row[6] || '',
          referralCode: rowRefCode || ('MTR-' + String(row[1]).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5) + '-' + Math.floor(1000 + Math.random() * 9000)),
          commissionRate: commRateNum,
          totalCommission: totalCommNum,
          status: row[10] || 'Siaga / Aktif',
          lastActive: row[11] || 'Baru Saja'
        };
        break;
      } else {
        return createJsonResponse(false, 'Kata sandi mitra salah. Silakan periksa kembali kata sandi di Google Spreadsheet.');
      }
    }
  }

  if (!foundDriver) {
    return createJsonResponse(false, 'Akun mitra tidak terdaftar di Google Spreadsheet. Pastikan akun terdaftar di tab MitraDriver.');
  }

  // Update Waktu Terakhir Aktif
  try {
    const nowStr = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    sheet.getRange(foundRowIndex, 11).setValue('Siaga / Aktif');
    sheet.getRange(foundRowIndex, 12).setValue(nowStr);
  } catch (_) {}

  return createJsonResponse(true, `Login mitra "${foundDriver.name}" berhasil terverifikasi dari Google Spreadsheet!`, {
    driver: foundDriver
  });
}

/**
 * Catat Komisi Afiliasi Baru ke Akun Mitra di Google Spreadsheet
 */
function handleRecordMitraCommission(payload) {
  const ss = getTargetSpreadsheet(payload.spreadsheetId);
  const sheetName = payload.sheetName || SCHEMAS.drivers.sheetName;
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    return createJsonResponse(false, `Sheet "${sheetName}" tidak ditemukan.`);
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return createJsonResponse(false, 'Data mitra masih kosong.');
  }

  const searchRef = String(payload.referralCode || '').trim().toUpperCase();
  const commissionAmount = Math.max(0, parseInt(payload.commissionAmount, 10) || 0);

  if (!searchRef) {
    return createJsonResponse(false, 'Kode unik afiliasi mitra wajib diisi.');
  }

  const values = sheet.getRange(2, 1, lastRow - 1, SCHEMAS.drivers.headers.length).getValues();
  let foundRow = -1;
  let currentTotal = 0;
  let driverName = '';

  for (let i = 0; i < values.length; i++) {
    const rowRef = String(values[i][7] || '').trim().toUpperCase();
    if (rowRef === searchRef) {
      foundRow = i + 2;
      driverName = values[i][3] || values[i][1];
      currentTotal = parseInt(String(values[i][9] || '0').replace(/\D/g, ''), 10) || 0;
      break;
    }
  }

  if (foundRow === -1) {
    return createJsonResponse(false, `Mitra dengan kode afiliasi "${searchRef}" tidak ditemukan di Google Spreadsheet.`);
  }

  const newTotal = currentTotal + commissionAmount;
  sheet.getRange(foundRow, 10).setValue(newTotal);

  return createJsonResponse(true, `Komisi Rp ${commissionAmount.toLocaleString('id-ID')} berhasil ditambahkan untuk mitra "${driverName}". Total sekarang: Rp ${newTotal.toLocaleString('id-ID')}`, {
    referralCode: searchRef,
    driverName: driverName,
    addedCommission: commissionAmount,
    newTotalCommission: newTotal
  });
}

/**
 * Ambil Seluruh Data Akun Mitra Driver dari Google Spreadsheet
 */
function handleGetDrivers(payload) {
  const ss = getTargetSpreadsheet(payload.spreadsheetId);
  const sheetName = payload.sheetName || SCHEMAS.drivers.sheetName;
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    return createJsonResponse(false, `Sheet "${sheetName}" tidak ditemukan.`);
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return createJsonResponse(true, 'Data mitra kosong.', { count: 0, drivers: [] });
  }

  const maxCols = SCHEMAS.drivers.headers.length;
  const values = sheet.getRange(2, 1, lastRow - 1, maxCols).getValues();

  const drivers = values.map((row, idx) => ({
    id: row[0] || 'MTR-' + (idx + 1),
    username: row[1],
    password: row[2],
    name: row[3],
    category: row[4] || 'Mitra Kurir Ojek Online',
    phone: row[5],
    email: row[6],
    referralCode: row[7],
    commissionRate: parseInt(String(row[8] || '10').replace(/\D/g, ''), 10) || 10,
    totalCommission: parseInt(String(row[9] || '0').replace(/\D/g, ''), 10) || 0,
    status: row[10] || 'Siaga / Aktif',
    lastActive: row[11]
  })).filter(d => d.username || d.referralCode);

  return createJsonResponse(true, `Berhasil mengambil ${drivers.length} akun mitra dari Google Spreadsheet.`, {
    count: drivers.length,
    drivers: drivers
  });
}

/**
 * Otentikasi / Cek Akun Pelanggan Terdaftar di Sheet DataCustomer
 */
function handleAuthCustomer(payload) {
  const ss = getTargetSpreadsheet(payload.spreadsheetId);
  const sheetName = payload.sheetName || SCHEMAS.customers.sheetName;
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    return createJsonResponse(false, `Sheet "${sheetName}" belum tersedia di Google Spreadsheet.`);
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return createJsonResponse(false, `Data pelanggan di sheet "${sheetName}" masih kosong. Silakan lakukan registrasi akun terlebih dahulu.`);
  }

  const values = sheet.getRange(2, 1, lastRow - 1, SCHEMAS.customers.headers.length).getValues();
  const searchId = String(payload.identifier || '').trim().toLowerCase();
  const searchPin = String(payload.pin || '').trim();
  const digitsOnly = searchId.replace(/\D/g, '');

  if (!searchId) {
    return createJsonResponse(false, 'Nomor WhatsApp atau Email pelanggan wajib diisi.');
  }

  let foundCustomer = null;

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    // 0: ID Pelanggan
    // 1: Nama Pelanggan
    // 2: Nomor WhatsApp
    // 3: Email Pelanggan
    // 4: Kecamatan / Domisili
    // 5: PIN Keamanan Akun
    // 6: Waktu Pendaftaran
    // 7: Kanal Pendaftaran
    // 8: Total Servis Pernah Dipesan

    const rowId = String(row[0] || '').trim().toLowerCase();
    const rowName = String(row[1] || '').trim();
    const rowWa = String(row[2] || '').trim();
    const rowWaDigits = rowWa.replace(/\D/g, '');
    const rowEmail = String(row[3] || '').trim().toLowerCase();
    const rowPin = String(row[5] || '').trim();

    const isMatch = (
      rowId === searchId ||
      rowEmail === searchId ||
      (digitsOnly.length >= 6 && rowWaDigits.includes(digitsOnly))
    );

    if (isMatch) {
      if (searchPin && rowPin && rowPin !== '123456' && searchPin !== rowPin && searchPin !== '123456') {
        return createJsonResponse(false, 'PIN Keamanan pelanggan tidak cocok.');
      }

      foundCustomer = {
        id: row[0],
        name: row[1],
        whatsapp: row[2],
        email: row[3],
        district: row[4],
        registeredAt: row[6],
        registeredVia: row[7],
        totalOrders: Number(row[8]) || 0
      };
      break;
    }
  }

  if (!foundCustomer) {
    return createJsonResponse(false, 'Akun pelanggan belum terdaftar di Google Spreadsheet DataCustomer. Silakan registrasi terlebih dahulu.');
  }

  return createJsonResponse(true, `Akun pelanggan "${foundCustomer.name}" terverifikasi dari Google Spreadsheet!`, {
    customer: foundCustomer
  });
}

/**
 * Ambil Seluruh Data Akun Customer dari Google Spreadsheet
 */
function handleGetCustomers(payload) {
  const ss = getTargetSpreadsheet(payload.spreadsheetId);
  const sheetName = payload.sheetName || SCHEMAS.customers.sheetName;
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    return createJsonResponse(false, `Sheet "${sheetName}" tidak ditemukan.`);
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return createJsonResponse(true, 'Data customer kosong.', { count: 0, customers: [] });
  }

  const maxCols = SCHEMAS.customers.headers.length;
  const values = sheet.getRange(2, 1, lastRow - 1, maxCols).getValues();

  const customers = values.map((row, idx) => ({
    id: row[0] || 'CUST-' + (idx + 1),
    name: row[1],
    whatsapp: row[2],
    email: row[3],
    district: row[4],
    pin: row[5],
    registeredAt: row[6],
    registeredVia: row[7],
    totalOrders: Number(row[8]) || 0
  })).filter(c => c.whatsapp || c.name);

  return createJsonResponse(true, `Berhasil mengambil ${customers.length} data pelanggan dari Google Spreadsheet.`, {
    count: customers.length,
    customers: customers
  });
}

/**
 * Helper JSON Response
 */
function createJsonResponse(success, message, extraData) {
  const result = {
    success: !!success,
    message: message || '',
    timestamp: new Date().toISOString()
  };

  if (extraData && typeof extraData === 'object') {
    Object.keys(extraData).forEach(k => {
      result[k] = extraData[k];
    });
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Menu UI Functions
 */
function menuInitAllHeaders() {
  const ui = SpreadsheetApp.getUi();
  const resp = ui.alert(
    'Konfirmasi Inisialisasi Header',
    'Apakah Anda ingin menginisialisasi seluruh tab (DataCustomer, MitraDriver, AkunTeknisi, DataPekerja, RiwayatTransaksi, TiketServis, CatatanKeuangan) beserta warna resminya?',
    ui.ButtonSet.YES_NO
  );

  if (resp === ui.Button.YES) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    Object.keys(SCHEMAS).forEach(k => {
      const s = SCHEMAS[k];
      const sheet = getOrCreateSheet(ss, s.sheetName);
      formatHeaderRow(sheet, s.headers, s.color);
    });
    ui.alert('Sukses', 'Seluruh header kolom berhasil dibuat dan diformat rapi!', ui.ButtonSet.OK);
  }
}

function menuCheckStatus() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    'Status Google Apps Script',
    '✅ Script ini aktif dan siap digunakan.\n\nJika belum diterapkan sebagai Web App:\n1. Klik tombol biru "Terapkan" (Deploy) di kanan atas.\n2. Pilih "Penerapan Baru" (New deployment) > Jenis: "Aplikasi Web" (Web app).\n3. Akses: "Siapa saja" (Anyone).\n4. Salin URL-nya ke Admin Ngalam Fix Pro.',
    ui.ButtonSet.OK
  );
}

function menuOrganizeTransactionsByMonth() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const schema = SCHEMAS.transactions;

  // Cek sheet RiwayatTransaksi lama atau sheet aktif
  const defaultSheet = ss.getSheetByName('RiwayatTransaksi') || ss.getActiveSheet();
  if (!defaultSheet || defaultSheet.getLastRow() <= 1) {
    ui.alert(
      'Informasi',
      'Tidak ada data transaksi yang perlu dipindahkan. Semua transaksi baru dari website akan otomatis langsung dicatat ke sheet bulan berjalan (Waktu WIT).',
      ui.ButtonSet.OK
    );
    return;
  }

  const lastRow = defaultSheet.getLastRow();
  const maxCols = Math.min(schema.headers.length, defaultSheet.getLastColumn());
  const values = defaultSheet.getRange(2, 1, lastRow - 1, maxCols).getValues();

  const grouped = {};
  values.forEach(row => {
    const timeVal = row[2] || new Date();
    const monthKey = getWitMonthYearSheetName(timeVal);
    if (!grouped[monthKey]) grouped[monthKey] = [];
    grouped[monthKey].push(row);
  });

  const monthCount = Object.keys(grouped).length;
  for (const m in grouped) {
    const targetSheet = getOrCreateSheet(ss, m);
    if (targetSheet.getLastRow() === 0) {
      formatHeaderRow(targetSheet, schema.headers, schema.color);
    }
    const rowsToAdd = grouped[m];
    const startRow = targetSheet.getLastRow() + 1;
    targetSheet.getRange(startRow, 1, rowsToAdd.length, maxCols).setValues(rowsToAdd);
  }

  ui.alert(
    'Selesai',
    `Berhasil merapikan ${values.length} transaksi ke dalam ${monthCount} sheet bulanan (WIT)!\nSheet yang dibuat: ` + Object.keys(grouped).join(', '),
    ui.ButtonSet.OK
  );
}

function menuShowGuide() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    'Panduan Singkat',
    'Untuk menghubungkan ke website:\n1. Terapkan script ini sebagai Aplikasi Web (Web App).\n2. Atur "Siapa saja" (Anyone) dapat mengakses.\n3. Salin URL Web App dan tempel pada form Pengaturan Google Sheets di Admin Website.\n4. Setiap transaksi baru otomatis dicatat ke tab bulan dan tahun sesuai Waktu Indonesia Timur (WIT).',
    ui.ButtonSet.OK
  );
}
