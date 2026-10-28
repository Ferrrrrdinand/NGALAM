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

// Helper: Ensure directory and file exists
function ensureFile() {
  const dir = path.dirname(PROMO_CODES_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(PROMO_CODES_FILE)) {
    fs.writeFileSync(PROMO_CODES_FILE, JSON.stringify(DEFAULT_PROMO_CODES, null, 2), 'utf8');
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
  ensureFile();
  try {
    const raw = fs.readFileSync(PROMO_CODES_FILE, 'utf8');
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];

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
      // "jika masa sudah selesai maka promo akan hilang"
      return enriched.filter((p) => p.status === 'ACTIVE');
    }

    return enriched;
  } catch (err) {
    console.error('[PromoService] Error reading promo_codes.json:', err.message);
    return [];
  }
}

// Save promo codes to file
function savePromoCodes(promos) {
  ensureFile();
  fs.writeFileSync(PROMO_CODES_FILE, JSON.stringify(promos, null, 2), 'utf8');
  return true;
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

// Add a new promo code (Admin)
function addPromoCode(data) {
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
  return {
    ...newPromo,
    status: computeStatus(newPromo)
  };
}

// Update existing promo code (Admin)
function updatePromoCode(id, updates) {
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
  return {
    ...all[idx],
    status: computeStatus(all[idx])
  };
}

// Increment usage count when order is placed
function incrementUsage(code) {
  if (!code) return;
  const cleanCode = code.trim().toUpperCase();
  const all = getAllPromoCodes(false);
  const promo = all.find((p) => p.code.toUpperCase() === cleanCode);
  if (promo) {
    promo.usedCount = (promo.usedCount || 0) + 1;
    savePromoCodes(all);
  }
}

// Delete promo code (Admin)
function deletePromoCode(id) {
  const all = getAllPromoCodes(false);
  const target = all.find((p) => p.id === id);
  if (!target) {
    throw new Error(`Promo dengan ID "${id}" tidak ditemukan.`);
  }

  const filtered = all.filter((p) => p.id !== id);
  savePromoCodes(filtered);
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
  isExpired
};
