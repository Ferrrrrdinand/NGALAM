/**
 * NGALAM FIX PRO - Chatbot AI Service (Node.js Backend)
 * Handles intelligent query understanding, ticket lookups, and auto-reply generation.
 */

const { getAllOrders } = require('./orderService');

const PIC_CONTACT = {
  name: 'Liem Hingky Liman',
  phone: '+62 813-3030-4321',
  waUrl: 'https://wa.me/6281330304321',
};

const WORKSHOP_INFO = {
  address: 'Jl. Galunggung, Gadingkasri, Kec. Klojen, Kota Malang, Jawa Timur 65115 (Ngalam FixPro)',
  hours: 'Senin – Sabtu: 09.00 – 18.00 WIB (Minggu Janji Temu)',
  pickup: 'Tersedia layanan antar-jemput (Pickup) bergaransi & berasuransi di area Malang Raya',
  mapsUrl: 'https://maps.app.goo.gl/q7oQM5TJbKacRHKj7',
};

const SOCIAL_INFO = {
  instagram: 'https://www.instagram.com/ngalam_fixpro?utm_source=ig_web_button_share_sheet&srtk=ZDNlZDc0MzIxNw==',
  handle: '@ngalam_fixpro',
  tiktok: 'https://www.tiktok.com/@ngalam_fix_pro',
  youtube: 'https://www.youtube.com',
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
            `👉 <a href="lacak/index.html?track=${encodeURIComponent(found.id)}" style="color:#38bdf8;text-decoration:underline;font-weight:700;">Buka 5-Step Tracker Lengkap ↗</a>`,
          chips: ['Cek Status Tiket Lain', 'Hubungi Teknisi', 'Lokasi Workshop'],
        };
      } else {
        return {
          reply: `⚠️ Nomor tiket <b>${searchedTicket}</b> belum terdaftar di antrian sistem. Pastikan format nomor tiket benar (contoh: NGF-20261023-0001) atau masukkan nomor WhatsApp Anda di halaman <a href="lacak/index.html" style="color:#38bdf8;text-decoration:underline;"><b>Lacak Tiket</b></a>.`,
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
      reply: `📍 <b>Lokasi Workshop Ngalam FixPro:</b><br/>` +
        `<b>${WORKSHOP_INFO.address}</b><br/><br/>` +
        `👉 <a href="${WORKSHOP_INFO.mapsUrl}" target="_blank" style="color:#38bdf8;font-weight:700;text-decoration:underline;">Buka Petunjuk Arah di Google Maps ↗</a><br/><br/>` +
        `🕒 <b>Jam Operasional:</b><br/>` +
        `• ${WORKSHOP_INFO.hours}<br/><br/>` +
        `🛵 <i>${WORKSHOP_INFO.pickup}</i>`,
      chips: ['💬 Kontak WhatsApp', 'Pesan Servis Sekarang', 'Biaya Servis'],
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
      reply: `👨‍💼 <b>Layanan Pelanggan Ngalam Fix Pro:</b><br/>` +
        `• Konsultasi teknis kerusakan, cek ketersediaan suku cadang HP Anda, dan diagnosa awal selalu <b>100% Gratis</b>.<br/>` +
        `• Klik tombol di bawah untuk langsung terhubung dengan admin workshop kami:<br/>` +
        `<a href="${PIC_CONTACT.waUrl}?text=Halo%20Ngalam%20Fix%20Pro,%20saya%20ingin%20konsultasi%20servis%20HP" target="_blank" style="display:inline-flex;align-items:center;gap:6px;background:#22c55e;color:#ffffff;padding:7px 16px;border-radius:999px;font-weight:700;font-size:0.86rem;text-decoration:none;margin-top:8px;box-shadow:0 4px 12px rgba(34,197,94,0.3);">💬 Chat WhatsApp Workshop ↗</a>`,
      chips: ['Lokasi Workshop', 'Biaya Layar', 'Ganti Baterai'],
    };
  }

  // 10. Sosial Media & Instagram
  if (q.includes('instagram') || q.includes('ig') || q.includes('sosmed') || q.includes('sosial') || q.includes('media') || q.includes('tiktok') || q.includes('youtube')) {
    return {
      reply: `📸 <b>Kanal Resmi & Media Sosial Ngalam Fix Pro:</b><br/>` +
        `• <b>Instagram:</b> <a href="${SOCIAL_INFO.instagram}" target="_blank" style="color:#e11d48;font-weight:700;text-decoration:underline;">@ngalam_fixpro ↗</a> (Galeri hasil pengerjaan, story harian lab & testimoni)<br/>` +
        `• <b>TikTok:</b> <a href="${SOCIAL_INFO.tiktok}" target="_blank" style="color:#0f172a;font-weight:700;text-decoration:underline;">@ngalam_fix_pro ↗</a> (Video live reparasi & edukasi baterai)<br/>` +
        `• <b>Google Maps:</b> <a href="${WORKSHOP_INFO.mapsUrl}" target="_blank" style="color:#1d4ed8;font-weight:700;text-decoration:underline;">Ngalam FixPro (⭐ 5.0) ↗</a>`,
      chips: ['📍 Lokasi Workshop', '💬 Kontak WhatsApp', '📱 Biaya Servis'],
    };
  }

  // 11. Status Tracking Progres Servis
  if (q.includes('status') || q.includes('lacak') || q.includes('tiket') || q.includes('progres') || q.includes('cek')) {
    return {
      reply: `🔍 <b>Lacak Progres Pengerjaan Real-Time:</b><br/>` +
        `Anda dapat memantau setiap langkah (Step 1 s/d 5) unit Anda secara langsung.<br/>` +
        `Silakan ketik nomor tiket Anda di sini (contoh: <code>NGF-20261023-0001</code>) atau buka halaman <a href="login/index.html" style="color:#38bdf8;text-decoration:underline;font-weight:700;">Lacak Tiket Servis ↗</a>.`,
      chips: ['Lokasi Workshop', 'Biaya Ganti Baterai', 'Kontak WhatsApp'],
    };
  }

  // Default Fallback
  return {
    reply: `Halo! Saya <b>NgalamBot</b> dari Ngalam Fix Pro.<br/>` +
      `Ada kendala pada smartphone Android atau iPhone Anda?<br/>` +
      `Anda dapat menanyakan estimasi biaya LCD/baterai, lokasi workshop, atau langsung konsultasi via WhatsApp:<br/>` +
      `<a href="${PIC_CONTACT.waUrl}?text=Halo%20Ngalam%20Fix%20Pro,%20saya%20ingin%20tanya%20servis%20HP" target="_blank" style="display:inline-flex;align-items:center;gap:6px;background:#22c55e;color:#ffffff;padding:7px 16px;border-radius:999px;font-weight:700;font-size:0.86rem;text-decoration:none;margin-top:8px;box-shadow:0 4px 12px rgba(34,197,94,0.3);">💬 Chat WhatsApp Workshop ↗</a>`,
    chips: ['📱 Biaya Layar', '🔋 Ganti Baterai', '📍 Lokasi Workshop', '🔍 Lacak Tiket', '💬 Kontak WhatsApp'],
  };
}

module.exports = {
  processChatMessage,
  PIC_CONTACT,
  WORKSHOP_INFO,
};
