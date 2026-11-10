/**
 * NGALAM FIX PRO - Interactive Ads & Promotion Service
 * Connected with PostgreSQL 'ads' table for dynamic marketing banners and sponsored ads.
 * Fully resilient for Vercel Serverless (in-memory cache + /tmp fallback).
 */

const fs = require('fs');
const path = require('path');

const ADS_FILE = path.join(__dirname, '..', 'data', 'ads.json');

// Default initial high-converting advertisements (Unified Banners & Ads - Ringkas & Padat)
const DEFAULT_ADS = [
  {
    id: 'ad-mitra-afiliasi-10',
    title: 'Mitra Afiliasi Komisi 10%',
    headline: 'Peluang Cuan Tanpa Modal: Jadi Mitra & Dapatkan Komisi 10% Tiap Rekomendasi Servis!',
    description: 'Punya teman, saudara, atau grup WA yang butuh servis HP? Cukup bagikan QR Code atau link referral Anda. Komisi 10% tunai otomatis cair ke rekening Anda setiap kali servis selesai!',
    badge: '💰 CUAN 10% TANPA MODAL • MITRA RESMI',
    ctaText: 'Daftar Mitra Sekarang ↗',
    targetUrl: '/mitra',
    imageUrl: '',
    theme: 'emerald',
    active: true,
    location: 'home_under_steps',
    viewsCount: 3820,
    clicksCount: 1120,
    createdAt: '2026-11-10T09:00:00.000Z'
  },
  {
    id: 'ad-member-vip-10',
    title: 'Member VIP Diskon 10%',
    headline: 'Gabung Member VIP Gratis: Nikmati Diskon 10% Semua Servis + Garansi Prioritas!',
    description: 'Daftar gratis hanya 10 detik! Dapatkan voucher hemat 10% untuk pergantian LCD, baterai, kamera & IC mesin, plus gratis cek kerusakan dan pantau status servis online.',
    badge: '👑 PRIVILEGE VIP MEMBER DISKON 10%',
    ctaText: 'Daftar & Ambil Diskon 10% ↗',
    targetUrl: '/login?tab=register&promo=MEMBER10',
    imageUrl: '',
    theme: 'gold',
    active: true,
    location: 'home_under_steps',
    viewsCount: 3540,
    clicksCount: 980,
    createdAt: '2026-11-05T09:00:00.000Z'
  },
  {
    id: 'ad-baterai-90hari',
    title: 'Garansi Baterai 90 Hari',
    headline: 'Baterai HP Cepat Drop atau Kembung? Ganti Baterai Original Bergaransi 90 Hari Penuh!',
    description: 'Sel baterai Grade Original 100% Health, aman fast-charging, pengerjaan kilat 30–45 menit di depan mata Anda.',
    badge: '⚡ GARANSI RESMI 90 HARI',
    ctaText: 'Klaim Servis Baterai ↗',
    targetUrl: '/pesan-servis?problem=baterai',
    imageUrl: '',
    theme: 'gold',
    active: true,
    location: 'home_under_steps',
    viewsCount: 1820,
    clicksCount: 385,
    createdAt: '2026-11-05T08:00:00.000Z'
  },
  {
    id: 'ad-lcd-tempered',
    title: 'Paket Komplit Layar OLED',
    headline: 'Layar Retak atau Blank Sentuh? Ganti Panel OLED — Bonus Tempered Glass 9H Presisi!',
    description: 'Warna tajam, refresh rate 120Hz smooth, sensor sidik jari tetap aktif, plus garansi resmi tanpa khawatir.',
    badge: '🔥 DISKON S/D 30% + BONUS 9H',
    ctaText: 'Lihat Estimasi Biaya LCD ↗',
    targetUrl: '/pesan-servis?problem=lcd&promo=FREEGLASS9H',
    imageUrl: '',
    theme: 'emerald',
    active: true,
    location: 'home_under_steps',
    viewsCount: 1690,
    clicksCount: 412,
    createdAt: '2026-11-05T08:15:00.000Z'
  },
  {
    id: 'ad-antar-jemput',
    title: 'Layanan Antar-Jemput Malang',
    headline: 'Layanan Servis HP Antar-Jemput Seluruh Area Malang Raya',
    description: 'Sibuk kuliah atau kerja? Kurir kami jemput HP rusak Anda dan antar kembali setelah selesai diperbaiki.',
    badge: '🛵 PICKUP & DELIVERY MALANG',
    ctaText: 'Pesan Antar Jemput WA ↗',
    targetUrl: 'https://wa.me/6281131858858?text=Halo%20Ngalam%20Fix%20Pro,%20saya%20mau%20layanan%20antar%20jemput%20servis%20HP',
    imageUrl: '',
    theme: 'dark',
    active: true,
    location: 'home_under_steps',
    viewsCount: 1190,
    clicksCount: 264,
    createdAt: '2026-11-05T08:30:00.000Z'
  },
  {
    id: 'ad-workshop-presisi',
    title: 'Workshop Meja Terbuka',
    headline: 'Servis HP Transparan Bisa Ditunggu — Nonton Langsung Pengerjaan Teknisi!',
    description: 'Ruang lab ber-AC, free Wi-Fi, tanpa komponen tertukar karena teknisi membongkar unit langsung di meja Anda.',
    badge: '⏱️ BISA DITUNGGU (30–60 MENIT)',
    ctaText: 'Konsultasi Teknisi ↗',
    targetUrl: 'https://wa.me/6281131858858?text=Halo%20Ngalam%20Fix%20Pro,%20saya%20ingin%20tanya%20servis%20di%20workshop%20bisa%20ditunggu',
    imageUrl: '',
    theme: 'gold',
    active: true,
    location: 'home_under_steps',
    viewsCount: 2450,
    clicksCount: 520,
    createdAt: '2026-11-05T07:45:00.000Z'
  }
];

let adsCache = null;

// Safe detector for Vercel Serverless / AWS Lambda read-only filesystem (/var/task)
function isReadOnlyEnv() {
  return Boolean(
    process.env.VERCEL ||
    process.env.VERCEL_ENV ||
    process.env.NOW_REGION ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT ||
    (typeof __dirname === 'string' && __dirname.startsWith('/var/task'))
  );
}

// Safe save helper handling Vercel serverless read-only filesystem
function saveAdsToDisk(adsList) {
  adsCache = [...adsList];

  if (!isReadOnlyEnv()) {
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

      // Ensure ad-member-vip-10 is seeded to database if not present
      const hasMemberAd = adsCache.some(a => a.id === 'ad-member-vip-10');
      if (!hasMemberAd) {
        const memberAd = DEFAULT_ADS.find(a => a.id === 'ad-member-vip-10');
        if (memberAd) {
          await syncAdToPostgres(memberAd);
          adsCache.unshift(memberAd);
        }
      }
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
    } else {
      // Ensure missing default ads (like ad-member-vip-10) are included
      for (const def of DEFAULT_ADS) {
        if (!list.some((a) => a.id === def.id)) {
          list.unshift(def);
        }
      }
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
    imageUrl: '', // Pure text-only ads to preserve database memory
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

  const sanitizedUpdates = { ...updates };
  // Ensure no heavy image bloats database memory
  sanitizedUpdates.imageUrl = '';

  list[idx] = {
    ...list[idx],
    ...sanitizedUpdates,
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

  try {
    const db = require('./db');
    await db.logActivity('AD_TOGGLED', 'ads', id, {
      id,
      title: target.title,
      active: target.active
    });
  } catch (_) {}

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
      await db.logActivity('AD_CLICKED', 'ads', id, {
        id,
        title: target.title,
        clicksCount: target.clicksCount
      });
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

