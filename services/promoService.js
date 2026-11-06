/**
 * NGALAM FIX PRO - Promo Banner Management Service (Node.js Backend)
 * Handles uploading, updating, toggling, and persisting homepage hero banners.
 */

const fs = require('fs');
const path = require('path');
const db = require('./db');

const PROMOS_FILE = path.join(__dirname, '..', 'data', 'promos.json');
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'images', 'uploads');

// Ensure uploads directory exists
try { if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true }); } catch (_) {}

// Initial default banners in case file is absent
const DEFAULT_PROMOS = [
  {
    id: 'PROMO-001',
    title: 'Diskon Servis Hingga 30% Ganti Layar OLED & Baterai Original',
    description: 'Dapatkan gratis pembersihan mesin sinar UV, cek diagnosa awal di meja transparan, dan jaminan garansi resmi (khusus baterai 90 hari, servis lain 7–30 hari).',
    badgeTag: '🔥 PROMO SPESIAL BULAN INI',
    badgePill: '🏷️ DISKON S/D 30%',
    theme: 'red',
    promoCode: 'NGALAMPROMO30',
    buttonText: 'Klaim Promo Servis ↗',
    buttonLink: '/pesan-servis?promo=NGALAMPROMO30',
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
    promoCode: '🛡️ GARANSI RESMI TERJAMIN',
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
    buttonLink: '/pesan-servis?promo=FREEGLASS9H',
    image: 'images/promo-banner-1.jpg',
    active: true,
    createdAt: '2026-10-23T08:10:00.000Z'
  }
];

// In-memory cache for fast read/writes & serverless resilience
let bannerCache = null;
let bannerHydratedAt = 0;

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
 * Hydrate banner list from PostgreSQL database
 */
async function hydrateBannersFromPostgres() {
  // Hindari SELECT ulang banner (termasuk gambar base64) di setiap request.
  if (bannerCache && Array.isArray(bannerCache) && bannerCache.length > 0 && Date.now() - bannerHydratedAt < 15000) {
    return;
  }
  try {
    const db = require('./db');
    if (!db || typeof db.isDbConnected !== 'function' || !db.isDbConnected()) return;
    const res = await db.query('SELECT * FROM banners ORDER BY updated_at DESC');
    if (res && res.rows && res.rows.length > 0) {
      bannerCache = res.rows.map((row) => ({
        id: row.id,
        title: row.title || 'Promo Spesial',
        description: row.description || '',
        badgeTag: row.badge_tag || '🔥 PROMO SPESIAL',
        badgePill: row.badge_pill || '✨ FLASH DEAL',
        theme: row.theme || 'purple',
        promoCode: row.promo_code || '',
        buttonText: row.button_text || 'Klaim Sekarang ↗',
        buttonLink: row.button_link || '#',
        image: row.image_url || 'images/promo-banner-1.jpg',
        active: row.active !== false,
        createdAt: row.created_at || new Date().toISOString(),
        updatedAt: row.updated_at || new Date().toISOString()
      }));
      bannerHydratedAt = Date.now();
    }
  } catch (err) {
    console.warn('[Promos] hydrateBannersFromPostgres warning:', err.message);
  }
}

/**
 * Read all promo items
 * @param {boolean} onlyActive 
 */
function getAllPromos(onlyActive = false) {
  let list = [];

  if (bannerCache && Array.isArray(bannerCache) && bannerCache.length > 0) {
    list = bannerCache;
  } else {
    try {
      if (fs.existsSync(PROMOS_FILE)) {
        const raw = fs.readFileSync(PROMOS_FILE, 'utf-8');
        list = JSON.parse(raw);
      }
    } catch (_) {
      try {
        const tmpFile = path.join('/tmp', 'promos.json');
        if (fs.existsSync(tmpFile)) {
          const raw = fs.readFileSync(tmpFile, 'utf-8');
          list = JSON.parse(raw);
        }
      } catch (_) {}
    }

    if (!Array.isArray(list) || list.length === 0) {
      list = [...DEFAULT_PROMOS];
    }
    bannerCache = list;
  }

  return onlyActive ? list.filter((p) => p.active !== false) : list;
}

/**
 * Save promo list to file & cache (Safe for Vercel Serverless EROFS)
 * @param {Array} promos 
 */
function savePromos(promos) {
  bannerCache = [...promos];
  bannerHydratedAt = Date.now();

  if (!process.env.VERCEL) {
    try {
      const dir = path.dirname(PROMOS_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(PROMOS_FILE, JSON.stringify(promos, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[Promos] Local disk write skipped:', err.message);
    }
  }

  try {
    const tmpFile = path.join('/tmp', 'promos.json');
    fs.writeFileSync(tmpFile, JSON.stringify(promos, null, 2), 'utf-8');
  } catch (_) {}

  return true;
}

/**
 * Helper to process image input:
 * If base64 string, write to public/images/uploads/ and return relative path.
 * If running on read-only serverless, fall back to returning data URI directly.
 */
function processImageInput(imageData) {
  if (!imageData || typeof imageData !== 'string') {
    return 'images/promo-banner-1.jpg'; // fallback
  }

  // Check if base64 data URI
  const match = imageData.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
  if (match) {
    try {
      const ext = match[1] === 'jpeg' ? 'jpg' : match[1].replace('+xml', '');
      const base64Content = match[2];
      const fileName = `banner_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
      const filePath = path.join(UPLOADS_DIR, fileName);

      fs.writeFileSync(filePath, Buffer.from(base64Content, 'base64'));
      return `images/uploads/${fileName}`;
    } catch (err) {
      console.warn('[Promos] Could not write image to disk (read-only filesystem), keeping data URI directly:', err.message);
      return imageData; // fallback to base64 data URI directly
    }
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

  try {
    db.logActivity('BANNER_CREATED', 'banners', newPromo.id, {
      id: newPromo.id,
      title: newPromo.title,
      promoCode: newPromo.promoCode,
      theme: newPromo.theme,
      active: newPromo.active
    });
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

  try {
    const logPayload = {
      id,
      title: promos[idx].title,
      active: promos[idx].active
    };
    
    if (updates.title) logPayload.updatedTitle = updates.title;
    if (updates.buttonText) logPayload.buttonText = updates.buttonText;
    if (updates.buttonLink) logPayload.buttonLink = updates.buttonLink;
    if (updates.active !== undefined) logPayload.activeChanged = updates.active;
    if (updates.image) {
      logPayload.imageChanged = updates.image.startsWith('data:image/') ? 'base64_image_updated' : 'image_path_updated';
    }
    
    db.logActivity('BANNER_UPDATED', 'banners', id, logPayload);
  } catch (_) {}

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

  try {
    db.logActivity('BANNER_TOGGLED', 'banners', id, {
      id,
      title: promo.title,
      active: promo.active
    });
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

  try {
    db.logActivity('BANNER_DELETED', 'banners', id, {
      id,
      title: target.title
    });
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
  hydrateBannersFromPostgres,
};

