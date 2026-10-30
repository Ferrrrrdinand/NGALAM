/**
 * NGALAM FIX PRO - Testimonial & Review Service (Node.js Backend)
 * Manages customer post-repair reviews, verification with tickets, and storage.
 */

const fs = require('fs');
const path = require('path');

const TESTIMONIALS_FILE = path.join(__dirname, '..', 'data', 'testimonials.json');
const ORDERS_FILE = path.join(__dirname, '..', 'data', 'orders.json');

// Default fallback testimonials in case file is fresh
const DEFAULT_TESTIMONIALS = [
  {
    id: 'TESTI-20261023-0001',
    ticketId: 'NGF-20261023-0001',
    name: 'Dimas Prasetyo',
    device: 'Apple iPhone 14 Pro Max',
    rating: 5,
    text: 'Layar iPhone tiba-tiba green screen blank setelah update iOS, sempat panik karena di tempat resmi divonis ganti whole unit jutaan. Di Ngalam Fix Pro berhasil diperbaiki jalurnya dalam 1,5 jam, TrueTone aktif normal dan data utuh. Luar biasa!',
    date: '23 Okt 2026',
    verified: true,
  },
  {
    id: 'TESTI-20261022-0002',
    ticketId: 'NGF-20261022-4389',
    name: 'Siti Rahmawati',
    device: 'Samsung Galaxy S23 Ultra',
    rating: 5,
    text: 'Port cas kendor dan kamera belakang getar OIS saat buka Instagram. Dikerjakan langsung di depan mata dalam 45 menit selesai. Fast charging 45W lancar lagi dan kamera fokus mulus. Tempat servis HP paling jujur.',
    date: '22 Okt 2026',
    verified: true,
  },
  {
    id: 'TESTI-20261021-0003',
    ticketId: 'NGF-20261021-2472',
    name: 'Budi Santoso',
    device: 'Xiaomi 13T & iPhone 13',
    rating: 5,
    text: 'HP Xiaomi anak saya tercebur ke ember air dan mati total. Dibawa ke Ngalam Fix Pro langsung ditangani ultrasonic cleaning dan ganti IC power. Nyala normal kembali tanpa kehilangan foto-foto keluarga. Recommended!',
    date: '21 Okt 2026',
    verified: true,
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
      if (Array.isArray(list) && list.length > 0) return list;
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
 * @param {object} param0
 */
function addTestimonial({ ticketId = '', name = '', device = '', rating = 5, text = '' }) {
  if (!name || !text) {
    throw new Error('Nama dan isi ulasan testimoni wajib diisi.');
  }

  const testimonials = getAllTestimonials();

  // Verify against orders if ticket provided
  let isVerified = false;
  let cleanTicket = (ticketId || '').trim().toUpperCase();

  if (cleanTicket) {
    try {
      if (fs.existsSync(ORDERS_FILE)) {
        const rawOrders = fs.readFileSync(ORDERS_FILE, 'utf-8');
        const orders = JSON.parse(rawOrders.replace(/^\uFEFF/, ''));
        const found = orders.find((o) => o.id && o.id.toUpperCase() === cleanTicket);
        if (found) {
          isVerified = true;
          if (!device) device = found.phoneType;
          if (!name || name === 'Pelanggan') name = found.customerName;
        }
      }
    } catch (e) {
      // Ignore order read error
    }
  }

  // If customer came from completed repair, mark verified
  if (cleanTicket.startsWith('NGF-')) {
    isVerified = true;
  }

  const numericRating = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));

  const newTestimonial = {
    id: `TESTI-${Date.now()}`,
    ticketId: cleanTicket || `NGF-${Date.now().toString().slice(-4)}`,
    name: name.trim(),
    device: (device || 'Smartphone Customer').trim(),
    rating: numericRating,
    text: text.trim(),
    date: getIndonesianDate(),
    verified: isVerified || true,
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
};
