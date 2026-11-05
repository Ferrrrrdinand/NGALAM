/**
 * NGALAM FIX PRO - Interactive Ads & Promotion Service
 * Connected with PostgreSQL 'ads' table for dynamic marketing banners and sponsored ads.
 * Fully resilient for Vercel Serverless (in-memory cache + /tmp fallback).
 */

const fs = require('fs');
const path = require('path');

const ADS_FILE = path.join(__dirname, '..', 'data', 'ads.json');

// Default initial high-converting advertisements
const DEFAULT_ADS = [
  {
    id: 'ad-baterai-90hari',
    title: 'Garansi Baterai 90 Hari',
    headline: 'Ganti Baterai Original iPhone & Android — Garansi Resmi 90 Hari Penuh!',
    description: 'Baterai cepat drop atau kembung? Ganti di tempat dengan sel baterai Grade Original 100% Health, pengerjaan express 30–45 menit di meja transparan, dan jaminan perlindungan 90 hari tertulis resmi.',
    badge: '⚡ GARANSI SPESIAL 90 HARI',
    ctaText: 'Klaim Servis Baterai ↗',
    targetUrl: '/pesan-servis?problem=baterai',
    imageUrl: 'images/promo-banner-1.jpg',
    theme: 'gold',
    active: true,
    location: 'home_under_steps',
    viewsCount: 1420,
    clicksCount: 285,
    createdAt: '2026-11-05T08:00:00.000Z'
  },
  {
    id: 'ad-lcd-tempered',
    title: 'Paket Komplit Layar OLED + Bonus 9H',
    headline: 'Ganti Layar Super Retina / OLED — Gratis Pasang Tempered Glass 9H Presisi!',
    description: 'Layar retak, blank hitam, atau touch error? Dapatkan diskon suku cadang hingga 30%, warna tajam 120Hz smooth, sensor responsif, plus bonus tempered glass 9H gratis langsung terpasang rapi.',
    badge: '🔥 DISKON S/D 30% + BONUS 9H',
    ctaText: 'Lihat Estimasi LCD ↗',
    targetUrl: '/pesan-servis?problem=lcd&promo=FREEGLASS9H',
    imageUrl: 'images/promo-banner-tempered-glass.jpg',
    theme: 'emerald',
    active: true,
    location: 'home_under_steps',
    viewsCount: 1190,
    clicksCount: 312,
    createdAt: '2026-11-05T08:15:00.000Z'
  },
  {
    id: 'ad-antar-jemput',
    title: 'Layanan Antar-Jemput Malang',
    headline: 'Sibuk Kerja? Manfaatkan Pickup & Delivery Servis HP Seluruh Area Malang Raya',
    description: 'Unit HP Anda dijemput kurir profesional langsung ke kantor atau rumah. Pengecekan transparan di Meja 1 dan update pengerjaan dilaporkan langsung ke WhatsApp Anda.',
    badge: '🛵 PICKUP & DELIVERY MALANG',
    ctaText: 'Pesan Antar Jemput WA ↗',
    targetUrl: 'https://wa.me/6281330304321?text=Halo%20Ngalam%20Fix%20Pro,%20saya%20mau%20layanan%20antar%20jemput%20servis%20HP',
    imageUrl: 'images/spesialis-hp-banner.jpg',
    theme: 'dark',
    active: true,
    location: 'home_under_steps',
    viewsCount: 890,
    clicksCount: 164,
    createdAt: '2026-11-05T08:30:00.000Z'
  }
];

let adsCache = null;

// Safe save helper handling Vercel serverless read-only filesystem
function saveAdsToDisk(adsList) {
  adsCache = [...adsList];

  if (!process.env.VERCEL) {
    try {
      const dir = path.dirname(ADS_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(ADS_FILE, JSON.stringify(adsList, null, 2), 'utf8');
    } catch (err) {
      console.warn('[AdService] Disk write skipped for local file:', err.message);
    }
  }

  try {
    const tmpFile = path.join('/tmp', 'ads.json');
    fs.writeFileSync(tmpFile, JSON.stringify(adsList, null, 2), 'utf8');
  } catch (_) {}

  return true;
}

// Hydrate ads from PostgreSQL database
async function hydrateAdsFromPostgres() {
  try {
    const db = require('./db');
    if (!db || !db.isDbConnected()) return;

    const res = await db.query(`
      SELECT * FROM ads 
      ORDER BY created_at DESC
    `);

    if (res && res.rows && res.rows.length > 0) {
      adsCache = res.rows.map((row) => {
        let raw = {};
        if (row.raw_data) {
          if (typeof row.raw_data === 'object') raw = row.raw_data;
          else if (typeof row.raw_data === 'string') {
            try { raw = JSON.parse(row.raw_data); } catch (_) {}
          }
        }

        return {
          ...raw,
          id: row.id,
          title: row.title || raw.title || '',
          headline: row.headline || raw.headline || row.title || '',
          description: row.description || raw.description || '',
          badge: row.badge || raw.badge || 'PROMO SPESIAL',
          imageUrl: row.image_url || raw.imageUrl || 'images/promo-banner-1.jpg',
          targetUrl: row.target_url || raw.targetUrl || '/pesan-servis',
          ctaText: row.cta_text || raw.ctaText || 'Lihat Promo ↗',
          location: row.location || raw.location || 'home_under_steps',
          theme: row.theme || raw.theme || 'gold',
          active: row.active !== false,
          viewsCount: Number(row.views_count || raw.viewsCount || 0),
          clicksCount: Number(row.clicks_count || raw.clicksCount || 0),
          createdAt: row.created_at || raw.createdAt
        };
      });
    } else {
      // Seed default ads to database if table is currently empty
      for (const ad of DEFAULT_ADS) {
        await syncAdToPostgres(ad);
      }
      adsCache = [...DEFAULT_ADS];
    }
  } catch (err) {
    console.warn('[AdService] Hydrate from PostgreSQL error:', err.message);
  }
}

// Sync single ad to PostgreSQL
async function syncAdToPostgres(ad, isDelete = false) {
  try {
    const db = require('./db');
    if (!db || !db.isDbConnected()) return;

    if (isDelete) {
      await db.query('DELETE FROM ads WHERE id = $1', [ad.id]);
      await db.logActivity('AD_DELETE', 'ads', ad.id, { id: ad.id, title: ad.title });
      return;
    }

    await db.query(`
      INSERT INTO ads (
        id, title, headline, description, badge, image_url, target_url, cta_text,
        location, theme, active, views_count, clicks_count, raw_data, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        headline = EXCLUDED.headline,
        description = EXCLUDED.description,
        badge = EXCLUDED.badge,
        image_url = EXCLUDED.image_url,
        target_url = EXCLUDED.target_url,
        cta_text = EXCLUDED.cta_text,
        location = EXCLUDED.location,
        theme = EXCLUDED.theme,
        active = EXCLUDED.active,
        views_count = EXCLUDED.views_count,
        clicks_count = EXCLUDED.clicks_count,
        raw_data = EXCLUDED.raw_data,
        updated_at = CURRENT_TIMESTAMP
    `, [
      ad.id,
      ad.title || '',
      ad.headline || ad.title || '',
      ad.description || '',
      ad.badge || 'PROMO SPESIAL',
      ad.imageUrl || 'images/promo-banner-1.jpg',
      ad.targetUrl || '/pesan-servis',
      ad.ctaText || 'Lihat Penawaran ↗',
      ad.location || 'home_under_steps',
      ad.theme || 'gold',
      ad.active !== false,
      Number(ad.viewsCount || 0),
      Number(ad.clicksCount || 0),
      JSON.stringify(ad)
    ]);

    await db.logActivity(ad.updatedAt ? 'AD_UPDATE' : 'AD_CREATE', 'ads', ad.id, {
      title: ad.title,
      badge: ad.badge,
      active: ad.active
    });
  } catch (err) {
    console.warn('[AdService] PostgreSQL sync error:', err.message);
  }
}

// Get all ads (optionally filter by active and location)
function getAllAds(options = {}) {
  const { onlyActive = true, location = 'home_under_steps' } = options;

  let list = [];
  if (adsCache && Array.isArray(adsCache) && adsCache.length > 0) {
    list = adsCache;
  } else {
    try {
      if (fs.existsSync(ADS_FILE)) {
        list = JSON.parse(fs.readFileSync(ADS_FILE, 'utf8'));
      }
    } catch (_) {}

    if (!Array.isArray(list) || list.length === 0) {
      list = [...DEFAULT_ADS];
    }
    adsCache = list;
  }

  let filtered = list;
  if (onlyActive) {
    filtered = filtered.filter((ad) => ad.active !== false);
  }
  if (location && location !== 'all') {
    filtered = filtered.filter((ad) => !ad.location || ad.location === location || ad.location === 'global');
  }

  return filtered;
}

// Get ad by ID
function getAdById(id) {
  const list = getAllAds({ onlyActive: false, location: 'all' });
  return list.find((ad) => ad.id === id) || null;
}

// Create new Ad
async function createAd(data) {
  if (!data.title && !data.headline) {
    throw new Error('Judul atau headline iklan wajib diisi.');
  }

  const list = getAllAds({ onlyActive: false, location: 'all' });
  const now = new Date();
  const id = `ad-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

  const newAd = {
    id,
    title: (data.title || data.headline || '').trim(),
    headline: (data.headline || data.title || '').trim(),
    description: (data.description || '').trim(),
    badge: (data.badge || '🔥 PROMO SPESIAL').trim(),
    imageUrl: (data.imageUrl || data.image || 'images/promo-banner-1.jpg').trim(),
    targetUrl: (data.targetUrl || data.url || '/pesan-servis').trim(),
    ctaText: (data.ctaText || 'Lihat Promo ↗').trim(),
    location: data.location || 'home_under_steps',
    theme: data.theme || 'gold',
    active: data.active !== false,
    viewsCount: 0,
    clicksCount: 0,
    createdAt: now.toISOString()
  };

  list.unshift(newAd);
  saveAdsToDisk(list);
  await syncAdToPostgres(newAd);

  return newAd;
}

// Update existing Ad
async function updateAd(id, updates) {
  const list = getAllAds({ onlyActive: false, location: 'all' });
  const idx = list.findIndex((a) => a.id === id);
  if (idx === -1) {
    throw new Error(`Iklan dengan ID "${id}" tidak ditemukan.`);
  }

  list[idx] = {
    ...list[idx],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  saveAdsToDisk(list);
  await syncAdToPostgres(list[idx]);

  return list[idx];
}

// Toggle ad active status
async function toggleAd(id) {
  const list = getAllAds({ onlyActive: false, location: 'all' });
  const target = list.find((a) => a.id === id);
  if (!target) {
    throw new Error(`Iklan dengan ID "${id}" tidak ditemukan.`);
  }

  target.active = !target.active;
  target.updatedAt = new Date().toISOString();

  saveAdsToDisk(list);
  await syncAdToPostgres(target);

  return target;
}

// Record click
async function recordAdClick(id) {
  const list = getAllAds({ onlyActive: false, location: 'all' });
  const target = list.find((a) => a.id === id);
  if (target) {
    target.clicksCount = (Number(target.clicksCount) || 0) + 1;
    saveAdsToDisk(list);
    try {
      const db = require('./db');
      if (db && db.isDbConnected()) {
        await db.query('UPDATE ads SET clicks_count = clicks_count + 1 WHERE id = $1', [id]);
      }
    } catch (_) {}
  }
  return target;
}

// Delete ad
async function deleteAd(id) {
  const list = getAllAds({ onlyActive: false, location: 'all' });
  const target = list.find((a) => a.id === id);
  if (!target) {
    throw new Error(`Iklan dengan ID "${id}" tidak ditemukan.`);
  }

  const filtered = list.filter((a) => a.id !== id);
  saveAdsToDisk(filtered);
  await syncAdToPostgres(target, true);

  return { success: true, deletedId: id, title: target.title };
}

module.exports = {
  getAllAds,
  getAdById,
  createAd,
  updateAd,
  toggleAd,
  deleteAd,
  recordAdClick,
  hydrateAdsFromPostgres
};
