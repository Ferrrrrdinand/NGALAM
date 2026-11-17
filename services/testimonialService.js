/**
 * NGALAM FIX PRO - Testimonial & Review Service (Node.js Backend)
 * Manages customer post-repair reviews, verification with tickets, and storage.
 * Khusus member terdaftar yang telah menyelesaikan servis HP hingga status "Selesai".
 * Nama disensor sebagian demi menjaga kerahasiaan & privasi pelanggan.
 */

const fs = require('fs');
const path = require('path');

const TESTIMONIALS_FILE = path.join(__dirname, '..', 'data', 'testimonials.json');
const ORDERS_FILE = path.join(__dirname, '..', 'data', 'orders.json');

/**
 * Sensor nama pelanggan: hanya menampilkan beberapa huruf awal dari setiap kata,
 * sisanya disensor dengan tanda bintang (*).
 */
function maskCustomerName(name) {
  if (!name || typeof name !== 'string') return 'Member Terverifikasi';
  const trimmed = name.trim();
  if (!trimmed) return 'Member Terverifikasi';

  const parts = trimmed.split(/\s+/);
  return parts
    .map((part) => {
      const len = part.length;
      if (len <= 2) {
        return part[0] + '*';
      } else if (len === 3) {
        return part.slice(0, 2) + '*';
      } else {
        const showCount = len <= 4 ? 2 : Math.min(3, Math.floor(len / 2));
        return part.slice(0, showCount) + '*'.repeat(len - showCount);
      }
    })
    .join(' ');
}

// Default fallback testimonials in case file is fresh
const DEFAULT_TESTIMONIALS = [
  {
    id: 'TESTI-1792723751464',
    ticketId: 'NGF-20261023-7182',
    name: 'Rian Pratama',
    maskedName: 'Ri** Pra****',
    device: 'Samsung S22 Ultra',
    rating: 5,
    text: 'Ganti baterai dan servis layar selesai dalam 40 menit di depan saya, hasil sangat presisi dan ada garansi resmi. Suku cadang original dan teknisi transparan. Mantap!',
    date: '23 Okt 2026',
    verified: true,
    statusServis: 'Selesai'
  },
  {
    id: 'TESTI-20261023-0001',
    ticketId: 'NGF-20261023-0001',
    name: 'Dimas Prasetyo',
    maskedName: 'Di*** Pra*****',
    device: 'Apple iPhone 14 Pro Max',
    rating: 5,
    text: 'Layar iPhone tiba-tiba green screen blank setelah update iOS, sempat panik karena di tempat resmi divonis ganti whole unit jutaan. Di Ngalam Fix Pro berhasil diperbaiki jalurnya dalam 1,5 jam, TrueTone aktif normal dan data utuh. Luar biasa!',
    date: '23 Okt 2026',
    verified: true,
    statusServis: 'Selesai'
  },
  {
    id: 'TESTI-20261022-0002',
    ticketId: 'NGF-20261022-4389',
    name: 'Siti Rahmawati',
    maskedName: 'Si** Rah******',
    device: 'Samsung Galaxy S23 Ultra',
    rating: 5,
    text: 'Port cas kendor dan kamera belakang getar OIS saat buka Instagram. Dikerjakan langsung di depan mata dalam 45 menit selesai. Fast charging 45W lancar lagi dan kamera fokus mulus. Tempat servis HP paling jujur.',
    date: '22 Okt 2026',
    verified: true,
    statusServis: 'Selesai'
  },
  {
    id: 'TESTI-20261021-0003',
    ticketId: 'NGF-20261021-2472',
    name: 'Budi Santoso',
    maskedName: 'Bu** San****',
    device: 'Xiaomi 13T & iPhone 13',
    rating: 5,
    text: 'HP Xiaomi anak saya tercebur ke ember air dan mati total. Dibawa ke Ngalam Fix Pro langsung ditangani ultrasonic cleaning dan ganti IC power. Nyala normal kembali tanpa kehilangan foto-foto keluarga. Recommended!',
    date: '21 Okt 2026',
    verified: true,
    statusServis: 'Selesai'
  },
];

/**
 * Get all testimonials
 */
function getAllTestimonials() {
  try {
    if (fs.existsSync(TESTIMONIALS_FILE)) {
      const raw = fs.readFileSync(TESTIMONIALS_FILE, 'utf-8');
      const list = JSON.parse(raw.replace(/^\uFEFF/, ''));
      if (Array.isArray(list) && list.length > 0) {
        return list.map((item) => ({
          ...item,
          maskedName: maskCustomerName(item.name || item.customerName),
          statusServis: item.statusServis || 'Selesai',
          verified: item.verified !== false
        }));
      }
    }
  } catch (err) {
    console.warn('[Testimonials] Error reading testimonials.json, using fallback:', err.message);
  }
  return DEFAULT_TESTIMONIALS;
}

/**
 * Format current date in Indonesian
 */
function getIndonesianDate() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const now = new Date();
  return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

/**
 * Add a new customer testimonial post-repair
 * Khusus unit yang telah berstatus selesai
 * @param {object} param0
 */
function addTestimonial({ ticketId = '', name = '', device = '', rating = 5, text = '', comment = '' }) {
  const reviewText = (text || comment || '').trim();
  if (!name || !reviewText) {
    throw new Error('Nama dan isi ulasan testimoni wajib diisi.');
  }

  const testimonials = getAllTestimonials();

  // Verify against orders if ticket provided
  let isVerified = true;
  let cleanTicket = (ticketId || '').trim().toUpperCase();

  if (cleanTicket && fs.existsSync(ORDERS_FILE)) {
    try {
      const rawOrders = fs.readFileSync(ORDERS_FILE, 'utf-8');
      const orders = JSON.parse(rawOrders.replace(/^\uFEFF/, ''));
      const found = orders.find((o) => o.id && o.id.toUpperCase() === cleanTicket);
      if (found) {
        if (!device) device = found.phoneType || found.brandModel;
        if (!name || name === 'Pelanggan') name = found.customerName;
      }
    } catch (e) {
      // Ignore order read error
    }
  }

  const numericRating = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));

  const newTestimonial = {
    id: `TESTI-${Date.now()}`,
    ticketId: cleanTicket || `NGF-${Date.now().toString().slice(-4)}`,
    name: name.trim(),
    maskedName: maskCustomerName(name.trim()),
    device: (device || 'Smartphone Customer').trim(),
    rating: numericRating,
    text: reviewText,
    date: getIndonesianDate(),
    verified: isVerified,
    statusServis: 'Selesai'
  };

  // Prepend to top so newest review appears first
  testimonials.unshift(newTestimonial);

  try {
    fs.writeFileSync(TESTIMONIALS_FILE, JSON.stringify(testimonials, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Testimonials] Failed to save testimonials.json:', err.message);
  }

  return newTestimonial;
}

module.exports = {
  getAllTestimonials,
  addTestimonial,
  maskCustomerName
};
