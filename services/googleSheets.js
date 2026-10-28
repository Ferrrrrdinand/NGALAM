const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Path konfigurasi
const CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '..', 'credentials.json');
const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '';
const SHEET_NAME = process.env.SHEET_NAME || 'TiketServis';

// File fallback lokal jika credentials.json belum diisi pengguna
const LOCAL_DATA_FILE = path.join(__dirname, '..', 'data', 'orders.json');

// Pastikan folder data lokal ada
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(LOCAL_DATA_FILE)) {
  fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify([], null, 2));
}

// Inisialisasi Google Auth Client
let sheetsClient = null;
let isGoogleSheetsReady = false;
let credentialsWarned = false;

async function getSheetsClient() {
  if (sheetsClient) return sheetsClient;

  if (!fs.existsSync(CREDENTIALS_PATH)) {
    if (!credentialsWarned) {
      console.warn(`[Google Sheets] File credentials tidak ditemukan di: ${CREDENTIALS_PATH}`);
      console.warn(`[Google Sheets] Sistem menggunakan penyimpanan lokal sementara: ${LOCAL_DATA_FILE}`);
      credentialsWarned = true;
    }
    return null;
  }

  if (!SPREADSHEET_ID) {
    console.warn('[Google Sheets] SPREADSHEET_ID belum diatur di file .env');
    return null;
  }

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: CREDENTIALS_PATH,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    sheetsClient = google.sheets({ version: 'v4', auth });
    isGoogleSheetsReady = true;
    console.log('✅ [Google Sheets API] Berhasil terhubung ke Google Spreadsheet ID:', SPREADSHEET_ID);
    return sheetsClient;
  } catch (err) {
    console.error('❌ [Google Sheets API] Gagal menginisialisasi Google Auth:', err.message);
    return null;
  }
}

// Inisialisasi Header Kolom pada Sheet jika masih kosong
async function initSheetHeaders() {
  const sheets = await getSheetsClient();
  if (!sheets || !SPREADSHEET_ID) return;

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:S1`,
    });

    if (!res.data.values || res.data.values.length === 0) {
      const headers = [
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
        'Catatan Diagnosa',
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1:S1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [headers] },
      });
      console.log(`✅ [Google Sheets] Header kolom berhasil diinisialisasi pada sheet "${SHEET_NAME}"`);
    }
  } catch (err) {
    console.warn('[Google Sheets] Cek header sheet:', err.message);
  }
}

// Ambil semua data pesanan (dari Google Sheets atau fallback lokal)
async function getAllOrders() {
  const sheets = await getSheetsClient();

  if (sheets && SPREADSHEET_ID) {
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A2:S`,
      });

      const rows = res.data.values || [];
      const orders = rows.map((row) => {
        const id = row[0] || '';
        const createdAt = row[1] || '';
        const customerName = row[2] || '';
        const customerPhone = row[3] || '';
        const address = row[4] || '';
        const deviceType = row[5] || 'Smartphone';
        const brandModel = row[6] || '';
        const screenCondition = row[7] || '';
        const bodyCondition = row[8] || '';
        const accessories = row[9] || '';
        const screenLock = row[10] || '';
        const damageDescription = row[11] || '';
        const method = row[12] || 'walkin';
        const techName = row[13] || 'Teknisi Lab Meja 1';
        const cost = row[14] || 0;
        const duration = row[15] || '';
        const status = row[16] || 'Registrasi & Masuk';
        const step = parseInt(row[17], 10) || 1;
        const notes = row[18] || '';

        return {
          id,
          ticketId: id,
          createdAt,
          waktuMasuk: createdAt,
          customerName,
          name: customerName,
          customerPhone,
          whatsapp: customerPhone,
          phone: customerPhone,
          address,
          district: address,
          domisili: address,
          deviceType,
          phoneType: brandModel ? `${deviceType} - ${brandModel}` : deviceType,
          brandModel,
          modelColor: brandModel,
          screenCondition,
          bodyCondition,
          accessories,
          screenLock,
          screenPin: screenLock,
          problemTags: damageDescription ? damageDescription.split(', ') : [],
          damageDescription,
          method,
          assignedTechnician: { name: techName },
          technician: techName,
          estimatedCost: cost,
          cost,
          estimatedTime: duration,
          duration,
          status,
          currentStep: step,
          step,
          technicianNotes: notes,
          diagnoseNote: notes,
        };
      });

      // Update backup lokal
      fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(orders, null, 2));
      return orders;
    } catch (err) {
      console.error('❌ [Google Sheets] Gagal membaca data dari spreadsheet:', err.message);
    }
  }

  // Fallback: baca dari penyimpanan lokal
  try {
    const raw = fs.readFileSync(LOCAL_DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

// Tambah order baru ke Google Sheets (dan backup lokal)
async function appendOrder(order) {
  if (!order.id) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    order.id = `NGF-${dateStr}-${rand}`;
  }
  if (!order.createdAt) {
    const now = new Date();
    order.createdAt = now.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  }

  // 1. Ekstraksi & Normalisasi Data agar Sesuai 100% dengan Headline Kolom Spreadsheet
  const customerPhone = order.customerPhone || order.whatsapp || order.phone || order.buyerPhone || '-';
  const customerAddress = order.address || order.district || order.domisili || 'Malang';
  const deviceType = order.deviceType || order.brand || (order.phoneType ? order.phoneType.split(' - ')[0] : 'Smartphone');
  const brandModel = order.brandModel || order.modelColor || order.model || order.phoneType || '-';
  const screenCondition = order.screenCondition || order.kondisiLayar || 'Normal / Perlu diperiksa';
  const bodyCondition = order.bodyCondition || order.kondisiBodi || 'Mulus';
  const accessories = order.accessories || order.kelengkapan || 'Unit Handphone';
  const screenLock = order.screenLock || order.screenPin || order.pin || 'Tanpa Sandi / Privasi Aman';

  let problemText = 'Diagnosa & Pengecekan Menyeluruh';
  if (Array.isArray(order.problemTags) && order.problemTags.length > 0) {
    problemText = order.problemTags.join(', ');
  } else if (order.damageDescription) {
    problemText = order.damageDescription;
  } else if (order.damage) {
    problemText = order.damage;
  }

  const method = order.method || 'Walk-in Counter Meja 1';
  let techName = 'Teknisi Lab Meja 1';
  if (order.assignedTechnician && order.assignedTechnician.name) {
    techName = order.assignedTechnician.name;
  } else if (order.technician) {
    techName = order.technician;
  }

  const costVal = order.cost || order.estimatedCost || 0;
  const durationVal = order.duration || order.estimatedTime || '30 - 60 Menit';
  const statusVal = order.status || 'Registrasi & Masuk';
  const stepVal = parseInt(order.currentStep || order.step || 1, 10);
  const notesVal = order.diagnoseNote || order.technicianNotes || order.notes || 'Unit baru masuk dalam antrian registrasi.';

  // Terapkan kembali ke objek order agar sinkron di semua endpoint
  order.customerPhone = customerPhone;
  order.whatsapp = customerPhone;
  order.phone = customerPhone;
  order.address = customerAddress;
  order.district = customerAddress;
  order.deviceType = deviceType;
  order.phoneType = order.phoneType || `${deviceType} - ${brandModel}`;
  order.brandModel = brandModel;
  order.modelColor = brandModel;
  order.screenCondition = screenCondition;
  order.bodyCondition = bodyCondition;
  order.accessories = accessories;
  order.screenLock = screenLock;
  order.screenPin = screenLock;
  order.problemTags = Array.isArray(order.problemTags) && order.problemTags.length > 0 ? order.problemTags : [problemText];
  order.damageDescription = problemText;
  order.method = method;
  order.assignedTechnician = { name: techName };
  order.technician = techName;
  order.estimatedCost = costVal;
  order.cost = costVal;
  order.estimatedTime = durationVal;
  order.duration = durationVal;
  order.status = statusVal;
  order.currentStep = stepVal;
  order.step = stepVal;
  order.technicianNotes = notesVal;
  order.diagnoseNote = notesVal;

  // Simpan ke lokal dulu
  const localOrders = await getAllOrders();
  const updatedLocal = [order, ...localOrders.filter((o) => o.id && o.id !== order.id)];
  fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(updatedLocal, null, 2));

  // Pastikan akun pelanggan otomatis terdaftar & disinkronkan ke Google Spreadsheet (Sheet: DataCustomer)
  try {
    const { ensureCustomerAccount } = require('./customerService');
    if (customerPhone && customerPhone !== '-') {
      ensureCustomerAccount({
        name: order.customerName,
        whatsapp: customerPhone,
        email: order.email || '',
        district: customerAddress,
        registeredVia: 'Pemesanan Servis Smartphone'
      });
    }
  } catch (custSyncErr) {
    console.warn('[Google Sheets] Auto customer account check warning:', custSyncErr.message);
  }

  // Baris Nilai yang 100% Cocok dengan 19 Kolom Headline TiketServis (A1:S1)
  const rowValues = [
    order.id,            // Kolom A: No Tiket
    order.createdAt,     // Kolom B: Waktu Masuk
    order.customerName,  // Kolom C: Nama Pelanggan
    customerPhone,       // Kolom D: No WhatsApp
    customerAddress,     // Kolom E: Domisili
    deviceType,          // Kolom F: Tipe HP
    brandModel,          // Kolom G: Model & Warna
    screenCondition,     // Kolom H: Kondisi Layar
    bodyCondition,       // Kolom I: Kondisi Bodi
    accessories,         // Kolom J: Kelengkapan
    screenLock,          // Kolom K: Kunci PIN Layar
    problemText,         // Kolom L: Gejala Kerusakan
    method,              // Kolom M: Metode
    techName,            // Kolom N: Teknisi PJ
    costVal,             // Kolom O: Estimasi Biaya
    durationVal,         // Kolom P: Durasi
    statusVal,           // Kolom Q: Status
    stepVal,             // Kolom R: Langkah (1-5)
    notesVal,            // Kolom S: Catatan Diagnosa
  ];

  // Coba kirim via Google Apps Script jika URL terkonfigurasi
  try {
    const { getConfig, sendToAppsScript } = require('./financeService');
    const cfg = getConfig();
    if (cfg && cfg.appsScriptUrl) {
      await sendToAppsScript('add_order', {
        spreadsheetId: SPREADSHEET_ID || '',
        sheetName: SHEET_NAME || 'TiketServis',
        row: rowValues
      });
      console.log(`✅ [Apps Script] Tiket ${order.id} berhasil dikirim ke Google Sheets!`);
      return order;
    }
  } catch (gasErr) {
    console.warn('[Apps Script] Error appending order to sheet:', gasErr.message);
  }

  const sheets = await getSheetsClient();
  if (!sheets || !SPREADSHEET_ID) {
    return order;
  }

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:S`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [rowValues] },
    });

    console.log(`✅ [Google Sheets] Tiket ${order.id} berhasil ditambahkan ke Spreadsheet!`);
    return order;
  } catch (err) {
    console.error('❌ [Google Sheets] Gagal menambahkan baris ke Spreadsheet:', err.message);
    return order;
  }
}

// Update status tiket di Google Sheets (dan lokal)
async function updateOrder(ticketId, updates) {
  const localOrders = await getAllOrders();
  const index = localOrders.findIndex((o) => o.id.toUpperCase() === ticketId.trim().toUpperCase());
  if (index === -1) return null;

  const current = localOrders[index];
  const updatedOrder = { ...current, ...updates };
  localOrders[index] = updatedOrder;
  fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(localOrders, null, 2));

  const sheets = await getSheetsClient();
  if (sheets && SPREADSHEET_ID) {
    try {
      // Cari nomor baris tiket di spreadsheet
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A2:A`,
      });

      const rows = res.data.values || [];
      const rowIndex = rows.findIndex((r) => r[0] && r[0].trim().toUpperCase() === ticketId.trim().toUpperCase());

      if (rowIndex !== -1) {
        const sheetRowNumber = rowIndex + 2; // karena data mulai A2
        // Update kolom Status (Q), Langkah (R), Catatan (S), Biaya (O)
        if (updates.status !== undefined) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!Q${sheetRowNumber}:S${sheetRowNumber}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values: [[
                updatedOrder.status,
                updatedOrder.currentStep,
                updatedOrder.technicianNotes,
              ]],
            },
          });
        }
        console.log(`✅ [Google Sheets] Baris ${sheetRowNumber} tiket ${ticketId} berhasil diupdate!`);
      }
    } catch (err) {
      console.error('❌ [Google Sheets] Gagal update baris di Google Sheets:', err.message);
    }
  }

  return updatedOrder;
}

// Kosongkan semua data
async function clearAllOrders() {
  fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify([], null, 2));

  const sheets = await getSheetsClient();
  if (sheets && SPREADSHEET_ID) {
    try {
      await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A2:S`,
      });
      console.log(`✅ [Google Sheets] Baris data pada sheet "${SHEET_NAME}" berhasil dibersihkan!`);
    } catch (err) {
      console.error('❌ [Google Sheets] Gagal membersihkan sheet:', err.message);
    }
  }
  return [];
}

module.exports = {
  getSheetsClient,
  initSheetHeaders,
  getAllOrders,
  appendOrder,
  updateOrder,
  clearAllOrders,
  isReady: () => isGoogleSheetsReady,
};
