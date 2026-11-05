/**
 * NGALAM FIX PRO - Promo Code & Real-Time Discount Service
 * Handles promo creation, validation, auto-expiration, and discount calculation.
 */

const fs = require('fs');
const path = require('path');

const PROMO_CODES_FILE = path.join(__dirname, '..', 'data', 'promo_codes.json');

// Initial default promo codes
const DEFAULT_PROMO_CODES = [
  {
    id: 'PC-MEMBER10-VIP',
    code: 'MEMBER10',
    name: 'Diskon 10% Spesial Member Baru',
    description: 'Potongan harga langsung 10% untuk seluruh perbaikan smartphone khusus pelanggan terdaftar member Ngalam Fix Pro.',
    discountType: 'percentage', // 'percentage' | 'fixed'
    discountValue: 10, // 10%
    minSpend: 0,
    maxDiscount: 150000,
    validFrom: '2026-10-01',
    validUntil: '2026-12-31',
    usageLimit: 500,
    usedCount: 12,
    active: true,
    createdAt: '2026-11-05T08:00:00.000Z'
  },
  {
    id: 'PC-20261023-01',
    code: 'NGALAMPROMO30',
    name: 'Diskon Spesial 30% Servis HP Malang',
    description: 'Potongan harga 30% untuk penggantian layar OLED, baterai original, dan perbaikan IC.',
    discountType: 'percentage', // 'percentage' | 'fixed'
    discountValue: 30, // 30%
    minSpend: 150000,
    maxDiscount: 150000,
    validFrom: '2026-10-01',
    validUntil: '2026-12-31', // Masih aktif
    usageLimit: 100,
    usedCount: 18,
    active: true,
    createdAt: '2026-10-23T08:00:00.000Z'
  },
  {
    id: 'PC-20261023-02',
    code: 'HEMAT50',
    name: 'Potongan Langsung Rp 50.000',
    description: 'Voucher potongan langsung Rp 50.000 untuk minimal servis Rp 150.000.',
    discountType: 'fixed',
    discountValue: 50000, // Rp 50.000
    minSpend: 150000,
    maxDiscount: 50000,
    validFrom: '2026-10-01',
    validUntil: '2026-12-31', // Masih aktif
    usageLimit: 50,
    usedCount: 9,
    active: true,
    createdAt: '2026-10-23T08:05:00.000Z'
  },
  {
    id: 'PC-20261023-03',
    code: 'FREEGLASS9H',
    name: 'Paket Komplit Bonus Tempered Glass 9H',
    description: 'Potongan senilai tempered glass 9H presisi senilai Rp 35.000 untuk ganti LCD.',
    discountType: 'fixed',
    discountValue: 35000,
    minSpend: 200000,
    maxDiscount: 35000,
    validFrom: '2026-10-01',
    validUntil: '2026-12-31',
    usageLimit: 200,
    usedCount: 42,
    active: true,
    createdAt: '2026-10-23T08:10:00.000Z'
  },
  {
    id: 'PC-20261023-04',
    code: 'FLASHEXPIRED',
    name: 'Flash Sale Weekend (Contoh Masa Sudah Selesai)',
    description: 'Promo kilat akhir pekan yang masa berlakunya sudah berakhir.',
    discountType: 'percentage',
    discountValue: 50,
    minSpend: 100000,
    maxDiscount: 200000,
    validFrom: '2026-10-10',
    validUntil: '2026-10-20', // Sudah lewat! Auto-expired
    usageLimit: 30,
    usedCount: 30,
    active: true,
    createdAt: '2026-10-10T08:00:00.000Z'
  }
];

// In-memory cache for fast read/writes and serverless resilience
let promoCache = null;

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

// Helper: Ensure directory and file exists safely (never throws on read-only filesystems)
function ensureFile() {
  if (isReadOnlyEnv()) return;
  try {
    const dir = path.dirname(PROMO_CODES_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(PROMO_CODES_FILE)) {
      fs.writeFileSync(PROMO_CODES_FILE, JSON.stringify(DEFAULT_PROMO_CODES, null, 2), 'utf8');
    }
  } catch (err) {
    console.warn('[PromoCodeService] Read-only filesystem detected, disk initialization skipped:', err.message);
  }
}

// Helper: Check if promo is expired by date
function isExpired(promo) {
  if (!promo.validUntil) return false;
  // Use end of day for expiration date (23:59:59)
  const expDate = new Date(promo.validUntil + 'T23:59:59.999Z');
  return new Date() > expDate;
}

// Helper: Determine exact status string
function computeStatus(promo) {
  if (promo.active === false) return 'INACTIVE';
  if (isExpired(promo)) return 'EXPIRED';
  if (promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit) return 'QUOTA_FULL';
  return 'ACTIVE';
}

// Read all promo codes with computed status
function getAllPromoCodes(onlyUsable = false) {
  let list = [];

  if (promoCache && Array.isArray(promoCache) && promoCache.length > 0) {
    list = promoCache;
  } else {
    try {
      if (fs.existsSync(PROMO_CODES_FILE)) {
        const raw = fs.readFileSync(PROMO_CODES_FILE, 'utf8');
        list = JSON.parse(raw);
      }
    } catch (_) {
      try {
        const tmpFile = path.join('/tmp', 'promo_codes.json');
        if (fs.existsSync(tmpFile)) {
          const raw = fs.readFileSync(tmpFile, 'utf8');
          list = JSON.parse(raw);
        }
      } catch (_) {}
    }

    if (!Array.isArray(list) || list.length === 0) {
      list = [...DEFAULT_PROMO_CODES];
    } else {
      // Ensure missing default promo codes (like MEMBER10) are always present
      for (const def of DEFAULT_PROMO_CODES) {
        if (!list.some(p => p.code && p.code.toUpperCase() === def.code.toUpperCase())) {
          list.unshift(def);
        }
      }
    }
    promoCache = list;
  }

  const enriched = list.map((p) => {
    const status = computeStatus(p);
    const expired = isExpired(p);
    return {
      ...p,
      status,
      isExpired: expired,
    };
  });

  if (onlyUsable) {
    return enriched.filter((p) => p.status === 'ACTIVE');
  }

  return enriched;
}

// Save promo codes to cache & file (Safe for Vercel Serverless EROFS)
function savePromoCodes(promos) {
  promoCache = [...promos];

  if (!isReadOnlyEnv()) {
    // 1. Coba tulis ke PROMO_CODES_FILE jika local environment (non-serverless)
    try {
      ensureFile();
      fs.writeFileSync(PROMO_CODES_FILE, JSON.stringify(promos, null, 2), 'utf8');
    } catch (err) {
      console.warn('[PromoCodeService] Local disk write skipped:', err.message);
    }
  }

  // 2. Cadangkan ke /tmp jika di environment unix/serverless
  try {
    const tmpFile = path.join('/tmp', 'promo_codes.json');
    fs.writeFileSync(tmpFile, JSON.stringify(promos, null, 2), 'utf8');
  } catch (_) {}

  return true;
}

// Hydrate promo codes from PostgreSQL database
async function hydrateFromPostgres() {
  try {
    const db = require('./db');
    if (!db || !db.isDbConnected()) return;
    const res = await db.query('SELECT * FROM promo_codes ORDER BY created_at DESC');
    if (res && res.rows && res.rows.length > 0) {
      promoCache = res.rows.map(row => {
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
          code: row.code,
          name: row.name || raw.name || row.code,
          description: row.description || raw.description || '',
          discountType: row.discount_type || raw.discountType || 'percentage',
          discountValue: Number(row.discount_value !== undefined && row.discount_value !== null ? row.discount_value : (raw.discountValue || 0)),
          minSpend: Number(row.min_spend !== undefined && row.min_spend !== null ? row.min_spend : (raw.minSpend || 0)),
          maxDiscount: Number(row.max_discount !== undefined && row.max_discount !== null ? row.max_discount : (raw.maxDiscount || 0)),
          validFrom: row.valid_from || raw.validFrom || '',
          validUntil: row.valid_until || raw.validUntil || '',
          usageLimit: Number(row.usage_limit !== undefined && row.usage_limit !== null ? row.usage_limit : (raw.usageLimit || 0)),
          usedCount: Number(row.used_count !== undefined && row.used_count !== null ? row.used_count : (raw.usedCount || 0)),
          active: row.active !== false
        };
      });

      // Ensure MEMBER10 is always available in PostgreSQL
      const hasMemberCode = promoCache.some(p => p.code.toUpperCase() === 'MEMBER10');
      if (!hasMemberCode) {
        const memberPromo = DEFAULT_PROMO_CODES.find(p => p.code === 'MEMBER10');
        if (memberPromo) {
          await syncPromoCodeToPostgres(memberPromo);
          promoCache.unshift(memberPromo);
        }
      }
    } else {
      // If table is completely empty, seed default promo codes including MEMBER10
      for (const p of DEFAULT_PROMO_CODES) {
        await syncPromoCodeToPostgres(p);
      }
      promoCache = [...DEFAULT_PROMO_CODES];
    }
  } catch (err) {
    // Table may not yet be initialized or query error
  }
}

// Find promo code by string
function findPromoByCode(code) {
  if (!code) return null;
  const list = getAllPromoCodes(false);
  const cleanCode = code.trim().toUpperCase();
  return list.find((p) => p.code.toUpperCase() === cleanCode) || null;
}

// Validate promo and calculate discount
function validateAndCalculate(code, rawPrice = 350000) {
  const basePrice = Math.max(0, parseInt(rawPrice, 10) || 350000);
  const promo = findPromoByCode(code);

  if (!promo) {
    return {
      valid: false,
      code,
      message: `Kode promo "${code}" tidak ditemukan. Pastikan penulisan kode sudah benar.`
    };
  }

  const status = computeStatus(promo);

  if (status === 'INACTIVE') {
    return {
      valid: false,
      code: promo.code,
      message: `Kode promo "${promo.code}" saat ini sedang dinonaktifkan.`
    };
  }

  if (status === 'EXPIRED') {
    return {
      valid: false,
      code: promo.code,
      isExpired: true,
      message: `Masa berlaku kode promo "${promo.code}" sudah berakhir pada ${promo.validUntil}. Promo tidak dapat digunakan lagi.`
    };
  }

  if (status === 'QUOTA_FULL') {
    return {
      valid: false,
      code: promo.code,
      message: `Mohon maaf, kuota penggunaan kode promo "${promo.code}" telah habis.`
    };
  }

  // Check minimum spend
  if (promo.minSpend && basePrice < promo.minSpend) {
    return {
      valid: false,
      code: promo.code,
      message: `Minimal estimasi biaya untuk promo "${promo.code}" adalah Rp ${promo.minSpend.toLocaleString('id-ID')}. Estimasi saat ini Rp ${basePrice.toLocaleString('id-ID')}.`
    };
  }

  // Calculate discount
  let discountAmount = 0;
  if (promo.discountType === 'percentage') {
    discountAmount = Math.round((basePrice * promo.discountValue) / 100);
    if (promo.maxDiscount && promo.maxDiscount > 0) {
      discountAmount = Math.min(discountAmount, promo.maxDiscount);
    }
  } else {
    // Fixed amount
    discountAmount = Math.min(promo.discountValue, basePrice);
  }

  const finalPrice = Math.max(0, basePrice - discountAmount);

  return {
    valid: true,
    promoId: promo.id,
    code: promo.code,
    name: promo.name,
    description: promo.description,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    discountAmount,
    discountFormatted: `Rp ${discountAmount.toLocaleString('id-ID')}`,
    originalPrice: basePrice,
    originalPriceFormatted: `Rp ${basePrice.toLocaleString('id-ID')}`,
    finalPrice,
    finalPriceFormatted: `Rp ${finalPrice.toLocaleString('id-ID')}`,
    validUntil: promo.validUntil,
    message: `✅ Kode "${promo.code}" berhasil dipasang! Anda hemat Rp ${discountAmount.toLocaleString('id-ID')}.`
  };
}

// Helper: Sync single promo code to PostgreSQL
async function syncPromoCodeToPostgres(promo, isDelete = false) {
  try {
    const db = require('./db');
    if (!db || !db.isDbConnected()) return;

    if (isDelete) {
      await db.query('DELETE FROM promo_codes WHERE id = $1', [promo.id]);
      await db.logActivity('PROMO_CODE_DELETE', 'promo_codes', promo.id, { id: promo.id, code: promo.code });
      return;
    }

    await db.query(`
      INSERT INTO promo_codes (
        id, code, name, description, discount_type, discount_value, min_spend, max_discount, valid_from, valid_until, usage_limit, used_count, active, raw_data, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        code = EXCLUDED.code,
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        discount_type = EXCLUDED.discount_type,
        discount_value = EXCLUDED.discount_value,
        min_spend = EXCLUDED.min_spend,
        max_discount = EXCLUDED.max_discount,
        valid_from = EXCLUDED.valid_from,
        valid_until = EXCLUDED.valid_until,
        usage_limit = EXCLUDED.usage_limit,
        used_count = EXCLUDED.used_count,
        active = EXCLUDED.active,
        raw_data = EXCLUDED.raw_data,
        updated_at = CURRENT_TIMESTAMP
    `, [
      promo.id,
      promo.code,
      promo.name || promo.code,
      promo.description || '',
      promo.discountType || 'percentage',
      promo.discountValue || 0,
      promo.minSpend || 0,
      promo.maxDiscount || 0,
      promo.validFrom || '',
      promo.validUntil || '',
      promo.usageLimit || 0,
      promo.usedCount || 0,
      promo.active !== false,
      JSON.stringify(promo)
    ]);

    await db.logActivity(promo.updatedAt ? 'PROMO_CODE_UPDATE' : 'PROMO_CODE_CREATE', 'promo_codes', promo.id, {
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      active: promo.active
    });
  } catch (err) {
    console.warn('[PromoCodeService] PostgreSQL sync error:', err.message);
  }
}

// Add a new promo code (Admin)
async function addPromoCode(data) {
  if (!data.code || !data.code.trim()) {
    throw new Error('Kode promo wajib diisi.');
  }

  const cleanCode = data.code.trim().toUpperCase().replace(/\s+/g, '');
  const existing = findPromoByCode(cleanCode);
  if (existing) {
    throw new Error(`Kode promo "${cleanCode}" sudah ada di sistem. Gunakan kode lain.`);
  }

  const discountVal = parseInt(data.discountValue, 10);
  if (isNaN(discountVal) || discountVal <= 0) {
    throw new Error('Nilai diskon harus berupa angka lebih dari 0.');
  }

  if (!data.validUntil) {
    throw new Error('Tanggal masa berlaku (expired date) wajib ditentukan.');
  }

  const all = getAllPromoCodes(false);
  const now = new Date();
  const id = `PC-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

  const newPromo = {
    id,
    code: cleanCode,
    name: (data.name || cleanCode).trim(),
    description: (data.description || '').trim(),
    discountType: data.discountType === 'fixed' ? 'fixed' : 'percentage',
    discountValue: discountVal,
    minSpend: parseInt(data.minSpend, 10) || 0,
    maxDiscount: parseInt(data.maxDiscount, 10) || 0,
    validFrom: data.validFrom || now.toISOString().slice(0, 10),
    validUntil: data.validUntil,
    usageLimit: parseInt(data.usageLimit, 10) || 0,
    usedCount: 0,
    active: data.active !== false,
    createdAt: now.toISOString()
  };

  all.unshift(newPromo);
  savePromoCodes(all);

  // Sync ke database PostgreSQL
  await syncPromoCodeToPostgres(newPromo);

  return {
    ...newPromo,
    status: computeStatus(newPromo)
  };
}

// Update existing promo code (Admin)
async function updatePromoCode(id, updates) {
  const all = getAllPromoCodes(false);
  const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) {
    throw new Error(`Promo dengan ID "${id}" tidak ditemukan.`);
  }

  if (updates.code) {
    updates.code = updates.code.trim().toUpperCase().replace(/\s+/g, '');
  }

  all[idx] = {
    ...all[idx],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  savePromoCodes(all);

  // Sync ke database PostgreSQL
  await syncPromoCodeToPostgres(all[idx]);

  return {
    ...all[idx],
    status: computeStatus(all[idx])
  };
}

// Increment usage count when order is placed
async function incrementUsage(code) {
  if (!code) return;
  const cleanCode = code.trim().toUpperCase();
  const all = getAllPromoCodes(false);
  const promo = all.find((p) => p.code.toUpperCase() === cleanCode);
  if (promo) {
    promo.usedCount = (promo.usedCount || 0) + 1;
    savePromoCodes(all);
    await syncPromoCodeToPostgres(promo);
  }
}

// Delete promo code (Admin)
async function deletePromoCode(id) {
  const all = getAllPromoCodes(false);
  const target = all.find((p) => p.id === id);
  if (!target) {
    throw new Error(`Promo dengan ID "${id}" tidak ditemukan.`);
  }

  const filtered = all.filter((p) => p.id !== id);
  savePromoCodes(filtered);

  // Hapus dari PostgreSQL
  await syncPromoCodeToPostgres(target, true);

  return { success: true, deletedId: id, code: target.code };
}

// Reset promo codes to defaults
function resetPromoCodes() {
  savePromoCodes(DEFAULT_PROMO_CODES);
  return DEFAULT_PROMO_CODES;
}

module.exports = {
  getAllPromoCodes,
  findPromoByCode,
  validateAndCalculate,
  addPromoCode,
  updatePromoCode,
  incrementUsage,
  deletePromoCode,
  resetPromoCodes,
  isExpired,
  hydrateFromPostgres
};
