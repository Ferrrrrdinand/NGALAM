/**
 * NGALAM FIX PRO - Promo Banner Management Service (Node.js Backend)
 * Handles uploading, updating, toggling, and persisting homepage hero banners.
 */

const fs = require('fs');
const path = require('path');

const PROMOS_FILE = path.join(__dirname, '..', 'data', 'promos.json');
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'images', 'uploads');

// Ensure uploads directory exists
try { if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true }); } catch (_) {}

// Initial default banners in case file is absent
const DEFAULT_PROMOS = [
  {
    id: 'PROMO-001',
    title: 'Diskon Servis Hingga 30% Ganti Layar OLED & Baterai Original',
    description: 'Dapatkan gratis pembersihan mesin sinar UV, cek diagnosa awal di meja transparan, dan jaminan garansi resmi hingga 90 hari.',
    badgeTag: '🔥 PROMO SPESIAL BULAN INI',
    badgePill: '🏷️ DISKON S/D 30%',
    theme: 'red',
    promoCode: 'NGALAMPROMO30',
    buttonText: 'Klaim Promo Servis ↗',
    buttonLink: 'pesan-servis/index.html?promo=NGALAMPROMO30',
    image: 'images/promo-banner-1.jpg',
    active: true,
    createdAt: '2026-10-23T08:00:00.000Z'
  },
  {
    id: 'PROMO-002',
    title: 'Peralatan Presisi Micro-Soldering, Thermal Camera & Mesin OCA',
    description: 'Pengerjaan profesional smartphone Android & iPhone bisa ditonton langsung di depan meja teknisi tanpa ditinggal.',
    badgeTag: '🟢 WORKSHOP MEJA TERBUKA & TRANSPARAN',
    badgePill: '⚡ BISA DITUNGGU (30–60 MENIT)',
    theme: 'green',
    promoCode: '🛡️ GARANSI S/D 90 HARI',
    buttonText: 'Konsultasi Teknisi Langsung ↗',
    buttonLink: 'https://wa.me/6281330304321?text=Halo%20Ngalam%20Fix%20Pro,%20saya%20ingin%20tanya%20servis%20di%20workshop%20bisa%20ditunggu',
    image: 'images/spesialis-hp-banner.jpg',
    active: true,
    createdAt: '2026-10-23T08:05:00.000Z'
  },
  {
    id: 'PROMO-003',
    title: 'Paket Komplit Ganti LCD: Gratis Pasang Tempered Glass 9H Presisi',
    description: 'Khusus reparasi layar Super Retina XDR iPhone, Dynamic AMOLED Samsung, serta panel seri Xiaomi, Vivo, OPPO & Realme.',
    badgeTag: '🎁 BONUS TEMPERED GLASS 9H',
    badgePill: '✨ FLASH DEAL BULAN INI',
    theme: 'purple',
    promoCode: 'FREEGLASS9H',
    buttonText: 'Pesan Ganti Layar ↗',
    buttonLink: 'pesan-servis/index.html?promo=FREEGLASS9H',
    image: 'images/promo-banner-1.jpg',
    active: true,
    createdAt: '2026-10-23T08:10:00.000Z'
  }
];

/**
 * Get theme color styles based on selected preset theme
 */
function getThemeStyles(theme = 'blue') {
  switch (theme) {
    case 'red':
      return {
        pillGradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
        codeColor: '#f87171',
        codeBorder: '#ef4444',
        btnGradient: 'linear-gradient(135deg, #ef4444, #b91c1c)'
      };
    case 'green':
      return {
        pillGradient: 'linear-gradient(135deg, #10b981, #059669)',
        codeColor: '#34d399',
        codeBorder: '#10b981',
        btnGradient: 'linear-gradient(135deg, #059669, #10b981)'
      };
    case 'purple':
      return {
        pillGradient: 'linear-gradient(135deg, #7c3aed, #6366f1)',
        codeColor: '#c084fc',
        codeBorder: '#a855f7',
        btnGradient: 'linear-gradient(135deg, #7c3aed, #4f46e5)'
      };
    case 'amber':
    case 'gold':
      return {
        pillGradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
        codeColor: '#fbbf24',
        codeBorder: '#f59e0b',
        btnGradient: 'linear-gradient(135deg, #d97706, #b45309)'
      };
    case 'cyan':
      return {
        pillGradient: 'linear-gradient(135deg, #06b6d4, #0284c7)',
        codeColor: '#38bdf8',
        codeBorder: '#0284c7',
        btnGradient: 'linear-gradient(135deg, #0284c7, #2563eb)'
      };
    case 'blue':
    default:
      return {
        pillGradient: 'linear-gradient(135deg, #2563eb, #3b82f6)',
        codeColor: '#60a5fa',
        codeBorder: '#2563eb',
        btnGradient: 'linear-gradient(135deg, #2563eb, #1d4ed8)'
      };
  }
}

/**
 * Read all promo items
 * @param {boolean} onlyActive 
 */
function getAllPromos(onlyActive = false) {
  try {
    if (fs.existsSync(PROMOS_FILE)) {
      const raw = fs.readFileSync(PROMOS_FILE, 'utf-8');
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        return onlyActive ? list.filter((p) => p.active !== false) : list;
      }
    }
  } catch (err) {
    console.warn('[Promos] Error reading promos.json, using defaults:', err.message);
  }
  return onlyActive ? DEFAULT_PROMOS.filter((p) => p.active !== false) : DEFAULT_PROMOS;
}

/**
 * Save promo list to file
 * @param {Array} promos 
 */
function savePromos(promos) {
  try {
    const dir = path.dirname(PROMOS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(PROMOS_FILE, JSON.stringify(promos, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[Promos] Error saving promos.json:', err);
    throw err;
  }
}

/**
 * Helper to process image input:
 * If base64 string, write to public/images/uploads/ and return relative path
 */
function processImageInput(imageData) {
  if (!imageData || typeof imageData !== 'string') {
    return 'images/promo-banner-1.jpg'; // fallback
  }

  // Check if base64 data URI
  const match = imageData.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
  if (match) {
    const ext = match[1] === 'jpeg' ? 'jpg' : match[1].replace('+xml', '');
    const base64Content = match[2];
    const fileName = `banner_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, fileName);

    fs.writeFileSync(filePath, Buffer.from(base64Content, 'base64'));
    return `images/uploads/${fileName}`;
  }

  // Already a URL or relative path
  return imageData.trim();
}

/**
 * Add a new promo banner
 */
function addPromo({
  title,
  description = '',
  badgeTag = '🔥 PROMO SPESIAL',
  badgePill = '✨ DEAL TERBAIK',
  theme = 'purple',
  promoCode = '',
  buttonText = 'Klaim Sekarang ↗',
  buttonLink = '#',
  image = '',
  active = true,
}) {
  if (!title || !title.trim()) {
    throw new Error('Judul banner promo wajib diisi.');
  }

  const promos = getAllPromos(false);
  const now = new Date();
  const id = `PROMO-${Date.now().toString().slice(-6)}`;

  const finalImage = processImageInput(image);

  const newPromo = {
    id,
    title: title.trim(),
    description: (description || '').trim(),
    badgeTag: (badgeTag || '🔥 PROMO SPESIAL').trim(),
    badgePill: (badgePill || '✨ DEAL TERBAIK').trim(),
    theme: theme || 'purple',
    promoCode: (promoCode || '').trim(),
    buttonText: (buttonText || 'Klaim Sekarang ↗').trim(),
    buttonLink: (buttonLink || '#').trim(),
    image: finalImage,
    active: active !== false,
    createdAt: now.toISOString(),
  };

  promos.push(newPromo);
  savePromos(promos);

  // Sinkronkan banner baru ke PostgreSQL banners
  try {
    const { syncBannerToPostgres } = require('./bannerPgSync');
    syncBannerToPostgres(newPromo.id, newPromo).catch(() => {});
  } catch (_) {}

  return newPromo;
}

/**
 * Update an existing promo banner
 * Saat foto banner diubah, otomatis mengeksekusi UPDATE banners SET image_url = ... di PostgreSQL.
 */
async function updatePromo(id, updates = {}) {
  const promos = getAllPromos(false);
  const idx = promos.findIndex((p) => p.id === id);
  if (idx === -1) {
    throw new Error(`Promo dengan ID ${id} tidak ditemukan.`);
  }

  if (updates.image && updates.image.startsWith('data:image/')) {
    updates.image = processImageInput(updates.image);
  }

  promos[idx] = {
    ...promos[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  savePromos(promos);

  // Eksekusi UPDATE banners SET image_url = ... secara otomatis di PostgreSQL
  try {
    const { syncBannerToPostgres } = require('./bannerPgSync');
    await syncBannerToPostgres(id, updates);
  } catch (err) {
    console.warn('[PromoService] PostgreSQL update error:', err.message);
  }

  return promos[idx];
}

/**
 * Toggle active status of a promo banner
 */
async function togglePromoStatus(id) {
  const promos = getAllPromos(false);
  const promo = promos.find((p) => p.id === id);
  if (!promo) {
    throw new Error(`Promo dengan ID ${id} tidak ditemukan.`);
  }
  promo.active = !promo.active;
  promo.updatedAt = new Date().toISOString();
  savePromos(promos);

  try {
    const { syncBannerToPostgres } = require('./bannerPgSync');
    await syncBannerToPostgres(id, { active: promo.active });
  } catch (_) {}

  return promo;
}

/**
 * Delete a promo banner
 */
async function deletePromo(id) {
  let promos = getAllPromos(false);
  const target = promos.find((p) => p.id === id);
  if (!target) {
    throw new Error(`Promo dengan ID ${id} tidak ditemukan.`);
  }

  // If banner had an uploaded file, remove it cleanly
  if (target.image && target.image.startsWith('images/uploads/')) {
    try {
      const localFilePath = path.join(__dirname, '..', 'public', target.image);
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    } catch (e) {
      console.warn('[Promos] Could not delete image file:', e.message);
    }
  }

  promos = promos.filter((p) => p.id !== id);
  savePromos(promos);

  try {
    const { deleteBannerFromPostgres } = require('./bannerPgSync');
    await deleteBannerFromPostgres(id);
  } catch (_) {}

  return { success: true, deletedId: id };
}

/**
 * Reset back to initial default promos
 */
async function resetPromos() {
  savePromos(DEFAULT_PROMOS);
  try {
    const { syncAllBannersToPostgres } = require('./bannerPgSync');
    await syncAllBannersToPostgres();
  } catch (_) {}
  return DEFAULT_PROMOS;
}

module.exports = {
  getAllPromos,
  addPromo,
  updatePromo,
  togglePromoStatus,
  deletePromo,
  resetPromos,
  getThemeStyles,
};

