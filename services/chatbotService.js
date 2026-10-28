/**
 * NGALAM FIX PRO - Chatbot AI Service (Node.js Backend)
 * Handles intelligent query understanding, ticket lookups, and auto-reply generation.
 */

const { getAllOrders } = require('./googleSheets');

const PIC_CONTACT = {
  name: 'Liem Hingky Liman',
  phone: '+62 813-3030-4321',
  waUrl: 'https://wa.me/6281330304321',
};

const WORKSHOP_INFO = {
  address: 'Jl. Boulevard Digital No. 88, Tebet, Jakarta Selatan (Seberang Stasiun)',
  hours: 'Senin – Sabtu: 09.00 – 18.00 WIB (Minggu Janji Temu)',
  pickup: 'Tersedia layanan antar-jemput (Pickup) bergaransi & berasuransi di area kota',
};

/**
 * Process incoming chat query from client
 * @param {string} rawMessage
 * @returns {Promise<{reply: string, chips: string[]}>}
 */
async function processChatMessage(rawMessage = '') {
  const q = rawMessage.trim().toLowerCase();

  // 1. Direct Ticket Tracking Detection (e.g. NGF-20261023-0001)
  const ticketRegex = /ngf-[\w\d-]+/i;
  const ticketMatch = rawMessage.match(ticketRegex);
  if (ticketMatch) {
    const searchedTicket = ticketMatch[0].toUpperCase();
    try {
      const orders = await getAllOrders();
      const found = orders.find((o) => o.id && o.id.toUpperCase() === searchedTicket);
      if (found) {
        return {
          reply: `📋 <b>Data Tiket Ditemukan: ${found.id}</b><br/>` +
            `• Perangkat: <b>${found.phoneType}</b> (${found.customerName})<br/>` +
            `• Kendala: ${found.damageDescription}<br/>` +
            `• Teknisi: <b>${found.technician || 'Meja Pengerjaan'}</b><br/>` +
            `• Status: <span style="color:#38bdf8;font-weight:700;">${found.status || 'Diproses'} (Step ${found.step || 1} dari 5)</span><br/>` +
            `• Catatan Teknisi: <i>"${found.diagnoseNote || 'Unit dalam observasi'}"</i><br/><br/>` +
            `👉 <a href="login/index.html?track=${encodeURIComponent(found.id)}" style="color:#38bdf8;text-decoration:underline;font-weight:700;">Buka 5-Step Tracker Lengkap ↗</a>`,
          chips: ['Cek Status Tiket Lain', 'Hubungi Teknisi', 'Lokasi Workshop'],
        };
      } else {
        return {
          reply: `⚠️ Nomor tiket <b>${searchedTicket}</b> belum terdaftar di antrian sistem. Pastikan format nomor tiket benar (contoh: NGF-20261023-0001) atau masukkan nomor WhatsApp Anda di halaman <a href="login/index.html" style="color:#38bdf8;text-decoration:underline;"><b>Lacak Tiket</b></a>.`,
          chips: ['Lacak Tiket', 'Tanya PIC Mas Hingky', 'Biaya Servis'],
        };
      }
    } catch (err) {
      // Fallback
    }
  }

  // 2. Layar / LCD / OLED / Kaca OCA
  if (q.includes('lcd') || q.includes('layar') || q.includes('oled') || q.includes('kaca') || q.includes('touchscreen') || q.includes('retak') || q.includes('pecah')) {
    return {
      reply: `📱 <b>Estimasi Servis Layar & Kaca Smartphone:</b><br/>` +
        `• <b>Ganti Kaca Saja (Glass OCA Laminating):</b> Mulai <b>Rp 180.000</b> (Layar panel asli tetap dipertahankan, hemat hingga 50%).<br/>` +
        `• <b>Ganti Layar OLED / AMOLED Fullset:</b> Mulai <b>Rp 350.000</b> (Grade original, 120Hz smooth, TrueTone aktif & garansi 90 hari).<br/><br/>` +
        `⚡ <i>Pengerjaan express di meja terbuka transparan, bisa ditunggu 30–60 menit!</i>`,
      chips: ['Ganti Baterai', 'Lokasi Workshop', 'Booking Servis Layar', 'WhatsApp PIC'],
    };
  }

  // 3. Baterai / Battery / Drop / Health
  if (q.includes('baterai') || q.includes('battery') || q.includes('drop') || q.includes('health') || q.includes('batre') || q.includes('kembung')) {
    return {
      reply: `🔋 <b>Ganti Baterai Original Bergaransi:</b><br/>` +
        `• <b>Apple iPhone:</b> Mulai <b>Rp 250.000</b> (Health 100%, bebas pop-up unknown part, kalibrasi BMS IC).<br/>` +
        `• <b>Android (Samsung, Xiaomi, OPPO dll):</b> Mulai <b>Rp 180.000</b> (Sel baterai grade original, support fast charge).<br/><br/>` +
        `⚡ <i>Proses pengerjaan kilat hanya 30–45 menit bergaransi resmi tertulis s/d 90 hari!</i>`,
      chips: ['Biaya Ganti Layar', 'Booking Servis Baterai', 'Lokasi Workshop', 'Konsultasi WA'],
    };
  }

  // 4. Kamera / Camera / OIS Getar / Kaca Kamera
  if (q.includes('kamera') || q.includes('camera') || q.includes('getar') || q.includes('ois') || q.includes('buram') || q.includes('fokus')) {
    return {
      reply: `📷 <b>Servis Kamera & Lensa HP:</b><br/>` +
        `• <b>Kamera Getar (OIS Stabilizer Rusak):</b> Mulai <b>Rp 250.000</b> (Sering terjadi akibat getaran holder motor).<br/>` +
        `• <b>Ganti Kaca Lensa Luar:</b> Mulai <b>Rp 85.000</b>.<br/>` +
        `• <b>Sensor / Modul Kamera Utama:</b> Mulai <b>Rp 350.000</b>.<br/>` +
        `Pengerjaan presisi tanpa debu di lab clean-room kami!`,
      chips: ['Biaya Ganti Layar', 'Ganti Baterai', 'WhatsApp PIC'],
    };
  }

  // 5. Port Charger / Cas / Konektor / Fast Charging
  if (q.includes('cas') || q.includes('charge') || q.includes('charger') || q.includes('port') || q.includes('konektor') || q.includes('tipe c') || q.includes('lightning')) {
    return {
      reply: `⚡ <b>Perbaikan Port Cas & Konektor:</b><br/>` +
        `• <b>Pembersihan Jalur Pin & Kalibrasi:</b> Gratis jika hanya tersumbat debu/kotoran.<br/>` +
        `• <b>Ganti Flexible Port Cas Original:</b> Mulai <b>Rp 150.000</b>.<br/>` +
        `• <b>IC Charger / Hydra / Tristar:</b> Mulai <b>Rp 280.000</b>.<br/>` +
        `Support Fast Charging / SuperVOOC / PD normal kembali!`,
      chips: ['Ganti Baterai', 'Biaya Layar', 'Lokasi Workshop'],
    };
  }

  // 6. Mati Total / Konslet / Kena Air / Bootloop
  if (q.includes('mati') || q.includes('matot') || q.includes('air') || q.includes('cebur') || q.includes('konslet') || q.includes('short') || q.includes('bootloop') || q.includes('logo')) {
    return {
      reply: `🔬 <b>Reparasi Mesin Mati Total & Kena Air:</b><br/>` +
        `• <b>Ultrasonic Chemical Cleaning:</b> Pembersihan total korosi air tawar/laut.<br/>` +
        `• <b>Thermal Camera Leak Detection:</b> Deteksi titik panas konslet kapasitor mikro dalam hitungan detik.<br/>` +
        `• <b>CPU & IC Power Reballing:</b> Mulai <b>Rp 350.000</b>.<br/>` +
        `Garansi tidak ada biaya diagnosa/bongkar jika unit tidak berhasil diselamatkan!`,
      chips: ['Lokasi Workshop', 'Konsultasi Darurat WA', 'Form Booking Servis'],
    };
  }

  // 7. Lokasi Workshop, Alamat & Jam Operasional
  if (q.includes('lokasi') || q.includes('alamat') || q.includes('buka') || q.includes('tutup') || q.includes('jam') || q.includes('dimana') || q.includes('posisi')) {
    return {
      reply: `📍 <b>Lokasi Workshop Ngalam Fix Pro:</b><br/>` +
        `<b>${WORKSHOP_INFO.address}</b><br/><br/>` +
        `🕒 <b>Jam Operasional:</b><br/>` +
        `• ${WORKSHOP_INFO.hours}<br/><br/>` +
        `🛵 <i>${WORKSHOP_INFO.pickup}</i>`,
      chips: ['WhatsApp PIC Mas Hingky', 'Pesan Servis Sekarang', 'Biaya Servis'],
    };
  }

  // 8. Garansi & Klaim
  if (q.includes('garansi') || q.includes('klaim') || q.includes('syarat') || q.includes('rusak lagi')) {
    return {
      reply: `🛡️ <b>Kebijakan Garansi Resmi Ngalam Fix Pro:</b><br/>` +
        `• Setiap penggantian suku cadang mendapatkan <b>garansi tertulis resmi 30 s/d 90 hari</b>.<br/>` +
        `• Klaim sangat mudah: Cukup tunjukkan nomor tiket (NGF-...) atau nomor WhatsApp Anda.<br/>` +
        `• Jika terjadi kendala pada part yang sama, diperbaiki ulang <b>100% Bebas Biaya</b>.`,
      chips: ['Lacak Tiket', 'Lokasi Workshop', 'Tanya Mas Hingky'],
    };
  }

  // 9. Kontak PIC, Owner & WhatsApp
  if (q.includes('hingky') || q.includes('kontak') || q.includes('wa') || q.includes('nomor') || q.includes('telepon') || q.includes('owner') || q.includes('admin')) {
    return {
      reply: `👨‍💼 <b>Kontak Langsung PIC Ngalam Fix Pro:</b><br/>` +
        `• Nama PIC: <b>${PIC_CONTACT.name}</b><br/>` +
        `• WhatsApp: <a href="${PIC_CONTACT.waUrl}?text=Halo%20Ngalam%20Fix%20Pro,%20saya%20ingin%20konsultasi%20servis%20HP" target="_blank" style="color:#22c55e;font-weight:bold;text-decoration:underline;">${PIC_CONTACT.phone}</a><br/>` +
        `• Konsultasi teknis, cek ketersediaan stok komponen tipe HP Anda, dan diagnosa awal selalu gratis!`,
      chips: ['Chat WhatsApp Sekarang', 'Biaya Ganti Layar', 'Lokasi Workshop'],
    };
  }

  // 10. Status Tracking Progres Servis
  if (q.includes('status') || q.includes('lacak') || q.includes('tiket') || q.includes('progres') || q.includes('cek')) {
    return {
      reply: `🔍 <b>Lacak Progres Pengerjaan Real-Time:</b><br/>` +
        `Anda dapat memantau setiap langkah (Step 1 s/d 5) unit Anda secara langsung.<br/>` +
        `Silakan ketik nomor tiket Anda di sini (contoh: <code>NGF-20261023-0001</code>) atau buka halaman <a href="login/index.html" style="color:#38bdf8;text-decoration:underline;font-weight:700;">Lacak Tiket Servis ↗</a>.`,
      chips: ['Lokasi Workshop', 'Biaya Ganti Baterai', 'Tanya Mas Hingky'],
    };
  }

  // Default Fallback
  return {
    reply: `Halo! Saya <b>NgalamBot</b> dari Ngalam Fix Pro.<br/>` +
      `Ada kendala pada smartphone Android atau iPhone Anda?<br/>` +
      `Anda dapat menanyakan estimasi biaya LCD/baterai, lokasi workshop, atau langsung terhubung dengan PIC kami <b>${PIC_CONTACT.name}</b> di WhatsApp: <a href="${PIC_CONTACT.waUrl}?text=Halo%20Ngalam%20Fix%20Pro,%20saya%20ingin%20tanya%20servis%20HP" target="_blank" style="color:#22c55e;font-weight:700;">${PIC_CONTACT.phone}</a>.`,
    chips: ['📱 Biaya Layar', '🔋 Ganti Baterai', '📍 Lokasi Workshop', '🔍 Lacak Tiket', '👨‍🔧 Kontak PIC'],
  };
}

module.exports = {
  processChatMessage,
  PIC_CONTACT,
  WORKSHOP_INFO,
};
