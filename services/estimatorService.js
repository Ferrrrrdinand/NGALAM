/**
 * NGALAM FIX PRO - Cost Estimator Service (Node.js Backend)
 * Centralizes smartphone models catalog, repair price calculation, and pre-formatted messages.
 * Covers all major smartphone brands and series circulating in Indonesia.
 */

const BRANDS = [
  { id: 'apple', name: 'Apple iPhone (iOS)', icon: '' },
  { id: 'samsung', name: 'Samsung Galaxy', icon: '🤖' },
  { id: 'xiaomi', name: 'Xiaomi & Redmi', icon: '⚡' },
  { id: 'poco', name: 'POCO Series', icon: '🏎️' },
  { id: 'oppo', name: 'OPPO', icon: '📱' },
  { id: 'vivo', name: 'Vivo', icon: '💎' },
  { id: 'realme', name: 'Realme', icon: '🟡' },
  { id: 'infinix', name: 'Infinix', icon: '🚀' },
  { id: 'iqoo', name: 'iQOO', icon: '⚡' },
  { id: 'tecno_itel', name: 'Tecno & itel', icon: '🛡️' },
  { id: 'asus', name: 'ASUS (ROG & Zenfone)', icon: '🎮' },
  { id: 'others', name: 'Huawei, Pixel & Lainnya', icon: '🌐' },
];

const MODELS_BY_BRAND = {
  apple: [
    { id: 'ip16pm', name: 'iPhone 16 Pro / 16 Pro Max' },
    { id: 'ip16', name: 'iPhone 16 / 16 Plus' },
    { id: 'ip15pm', name: 'iPhone 15 Pro / 15 Pro Max' },
    { id: 'ip15', name: 'iPhone 15 / 15 Plus' },
    { id: 'ip14pm', name: 'iPhone 14 Pro / 14 Pro Max' },
    { id: 'ip14', name: 'iPhone 14 / 14 Plus' },
    { id: 'ip13pm', name: 'iPhone 13 Pro / 13 Pro Max' },
    { id: 'ip13', name: 'iPhone 13 / 13 Mini' },
    { id: 'ip12pm', name: 'iPhone 12 Pro / 12 Pro Max' },
    { id: 'ip12', name: 'iPhone 12 / 12 Mini' },
    { id: 'ip11pm', name: 'iPhone 11 Pro / 11 Pro Max' },
    { id: 'ip11', name: 'iPhone 11' },
    { id: 'ipxs', name: 'iPhone XS / XS Max / XR' },
    { id: 'ipx', name: 'iPhone X' },
    { id: 'ipse', name: 'iPhone SE (2020 / 2022)' },
    { id: 'ip8', name: 'iPhone 8 / 8 Plus' },
    { id: 'ip7', name: 'iPhone 7 / 7 Plus' },
  ],
  samsung: [
    { id: 's24u', name: 'Samsung Galaxy S24 Ultra / S24+ / S24' },
    { id: 's23u', name: 'Samsung Galaxy S23 Ultra / S23+ / S23 / S23 FE' },
    { id: 's22u', name: 'Samsung Galaxy S22 Ultra / S22+ / S22' },
    { id: 's21u', name: 'Samsung Galaxy S21 Ultra / S21+ / S21 / S21 FE' },
    { id: 's20u', name: 'Samsung Galaxy S20 Ultra / S20+ / S20 / S20 FE' },
    { id: 'zfold', name: 'Samsung Galaxy Z Fold 6 / Fold 5 / Fold 4 / Fold 3' },
    { id: 'zflip', name: 'Samsung Galaxy Z Flip 6 / Flip 5 / Flip 4 / Flip 3' },
    { id: 'note20', name: 'Samsung Galaxy Note 20 Ultra / Note 20 / Note 10+' },
    { id: 'a55', name: 'Samsung Galaxy A55 5G / A54 5G / A53 5G' },
    { id: 'a35', name: 'Samsung Galaxy A35 5G / A34 5G / A33 5G' },
    { id: 'a25', name: 'Samsung Galaxy A25 5G / A24 / A23' },
    { id: 'a15', name: 'Samsung Galaxy A15 5G / A15 4G / A14 / A13' },
    { id: 'a05', name: 'Samsung Galaxy A05s / A05 / A04s / A03' },
    { id: 'm54', name: 'Samsung Galaxy M54 5G / M34 5G / M14 5G' },
  ],
  xiaomi: [
    { id: 'mi14', name: 'Xiaomi 14 / 14 Ultra / 14 Pro' },
    { id: 'mi13t', name: 'Xiaomi 13T / 13T Pro / 13 Pro' },
    { id: 'mi12', name: 'Xiaomi 12 Pro / 12 / 12 Lite / 12T' },
    { id: 'mi11', name: 'Xiaomi 11T Pro / 11T / Mi 11 Ultra' },
    { id: 'rn13p', name: 'Redmi Note 13 Pro+ 5G / 13 Pro / 13 5G' },
    { id: 'rn13', name: 'Redmi Note 13 4G' },
    { id: 'rn12p', name: 'Redmi Note 12 Pro+ / 12 Pro 5G / 12 4G' },
    { id: 'rn11', name: 'Redmi Note 11 Pro 5G / 11 Pro / 11' },
    { id: 'rn10', name: 'Redmi Note 10 Pro / 10 / 10S' },
    { id: 'red13', name: 'Redmi 13 / 13C / 12 / 12C' },
    { id: 'red10', name: 'Redmi 10 / 10C / 10A / 9 / 9A / 9C' },
    { id: 'reda3', name: 'Redmi A3 / A2 / A1' },
  ],
  poco: [
    { id: 'f6p', name: 'POCO F6 Pro / POCO F6' },
    { id: 'f5p', name: 'POCO F5 Pro / POCO F5' },
    { id: 'f4', name: 'POCO F4 GT / POCO F4 / POCO F3' },
    { id: 'x6p', name: 'POCO X6 Pro 5G / POCO X6 5G' },
    { id: 'x5p', name: 'POCO X5 Pro 5G / POCO X5 5G' },
    { id: 'x3', name: 'POCO X4 Pro / POCO X3 Pro / X3 NFC' },
    { id: 'm6p', name: 'POCO M6 Pro / POCO M5s / M5' },
    { id: 'c65', name: 'POCO C65 / POCO C55 / C40' },
  ],
  oppo: [
    { id: 'findn', name: 'OPPO Find N3 / Find N3 Flip / N2 Flip' },
    { id: 'findx', name: 'OPPO Find X6 Pro / Find X5 Pro / Find X3 Pro' },
    { id: 'ren12', name: 'OPPO Reno 12 Pro 5G / Reno 12 5G / Reno 12 F' },
    { id: 'ren11', name: 'OPPO Reno 11 Pro 5G / Reno 11 5G / Reno 11 F' },
    { id: 'ren10', name: 'OPPO Reno 10 Pro+ 5G / Reno 10 Pro / Reno 10' },
    { id: 'ren8', name: 'OPPO Reno 8 Pro / Reno 8 5G / Reno 8T / Reno 8' },
    { id: 'ren7', name: 'OPPO Reno 7 / Reno 6 / Reno 5 Series' },
    { id: 'a98', name: 'OPPO A98 5G / A79 5G / A78 5G / A78 4G' },
    { id: 'a58', name: 'OPPO A58 / A38 / A18 / A57 / A77s' },
    { id: 'a17', name: 'OPPO A17 / A17k / A16 / A15 / A54 / A53' },
  ],
  vivo: [
    { id: 'vx100', name: 'Vivo X100 Pro / Vivo X100 / X100s' },
    { id: 'vx90', name: 'Vivo X90 Pro / Vivo X90 / Vivo X80 Pro / X80' },
    { id: 'vv40', name: 'Vivo V40 5G / Vivo V40 Lite 5G / 4G' },
    { id: 'vv30', name: 'Vivo V30 Pro 5G / Vivo V30 5G / Vivo V30e' },
    { id: 'vv29', name: 'Vivo V29 5G / Vivo V29e / Vivo V27 5G / V27e' },
    { id: 'vv25', name: 'Vivo V25 Pro / Vivo V25 / Vivo V23 5G' },
    { id: 'vy100', name: 'Vivo Y100 5G / Vivo Y100 4G / Vivo Y28' },
    { id: 'vy27', name: 'Vivo Y27 5G / Vivo Y27 4G / Vivo Y36 5G / Y36' },
    { id: 'vy17s', name: 'Vivo Y17s / Vivo Y03 / Vivo Y02 / Y02t' },
    { id: 'vy22', name: 'Vivo Y22 / Vivo Y21 / Vivo Y20 / Vivo Y16' },
  ],
  realme: [
    { id: 'rgt6', name: 'Realme GT 6 / Realme GT 6T' },
    { id: 'rgt5', name: 'Realme GT 5 / GT Neo 5 / GT Neo 3 / 3T' },
    { id: 'rgt2', name: 'Realme GT 2 Pro / GT Master Edition' },
    { id: 'r13p', name: 'Realme 13 Pro+ 5G / 13+ 5G / 13 4G' },
    { id: 'r12p', name: 'Realme 12 Pro+ 5G / 12+ 5G / 12 5G / 12 Lite' },
    { id: 'r11p', name: 'Realme 11 Pro+ 5G / 11 Pro / 11' },
    { id: 'r10p', name: 'Realme 10 Pro+ / Realme 10 Pro / 10' },
    { id: 'r9p', name: 'Realme 9 Pro+ / 9 Pro / 9 / 8 Pro / 8' },
    { id: 'rc67', name: 'Realme C67 / Realme C65 / Realme C63' },
    { id: 'rc55', name: 'Realme C55 / Realme C53 / Realme C51' },
    { id: 'rc35', name: 'Realme C35 / Realme C33 / Realme C31 / C30' },
    { id: 'rnarzo', name: 'Realme Narzo 60 / 50 / 30 Series' },
  ],
  infinix: [
    { id: 'infz40', name: 'Infinix ZERO 40 5G / 40 4G / ZERO 30 5G' },
    { id: 'infzu', name: 'Infinix ZERO Ultra / ZERO 20' },
    { id: 'infgt', name: 'Infinix GT 20 Pro 5G / GT 10 Pro' },
    { id: 'infn40', name: 'Infinix NOTE 40 Pro+ 5G / NOTE 40 Pro / NOTE 40' },
    { id: 'infn30', name: 'Infinix NOTE 30 Pro / NOTE 30 / NOTE 12 / 11' },
    { id: 'infh40', name: 'Infinix HOT 40 Pro / HOT 40i / HOT 30 / 30i' },
    { id: 'infh20', name: 'Infinix HOT 20 / 20s / HOT 12 / 11' },
    { id: 'infs8', name: 'Infinix SMART 8 Pro / SMART 8 / SMART 7 / 6' },
  ],
  iqoo: [
    { id: 'iq12', name: 'iQOO 12 5G / iQOO 11 5G' },
    { id: 'iqneo', name: 'iQOO Neo 9 Pro / Neo 7 Pro' },
    { id: 'iqz9', name: 'iQOO Z9 5G / iQOO Z9x 5G' },
    { id: 'iqz7', name: 'iQOO Z7 5G / iQOO Z7x 5G' },
  ],
  tecno_itel: [
    { id: 'tcamon', name: 'Tecno Camon 30 Premier / 30 Pro / 30 / 20 Pro' },
    { id: 'tpova', name: 'Tecno Pova 6 Pro 5G / Pova 6 / Pova 5 Pro' },
    { id: 'tspark', name: 'Tecno Spark 20 Pro+ / Spark 20 Pro / Spark 20' },
    { id: 'its23', name: 'itel S23+ / itel S23 4G / itel RS4' },
    { id: 'itp55', name: 'itel P55 5G / P55 NFC / P40' },
    { id: 'ita70', name: 'itel A70 / itel A60s' },
  ],
  asus: [
    { id: 'rog8', name: 'ASUS ROG Phone 8 Pro / ROG Phone 8' },
    { id: 'rog7', name: 'ASUS ROG Phone 7 Ultimate / ROG Phone 7' },
    { id: 'rog6', name: 'ASUS ROG Phone 6 / 6D / 5 / 5s' },
    { id: 'zen11', name: 'ASUS Zenfone 11 Ultra / Zenfone 10 / 9 / 8' },
  ],
  others: [
    { id: 'hwpura', name: 'Huawei Pura 70 Ultra / Pura 70 Pro / P60 Pro' },
    { id: 'hwmate', name: 'Huawei Mate 60 Pro / Mate 50 Pro / Nova Series' },
    { id: 'pixel9', name: 'Google Pixel 9 Pro / 9 / Pixel 8 Pro / 8 / 8a' },
    { id: 'pixel7', name: 'Google Pixel 7 Pro / 7 / 7a / Pixel 6 Pro / 6' },
    { id: 'sony1', name: 'Sony Xperia 1 VI / 1 V / 1 IV / Xperia 5 Series' },
    { id: 'honor', name: 'Honor Magic 6 Pro / Honor 90 / 70' },
    { id: 'custom', name: 'Merek Lainnya (Tipe Khusus / Custom)' },
  ],
};

const REPAIR_PRICE_MATRIX = {
  lcd: {
    title: 'Ganti Layar / LCD / OLED Pecah',
    price: 'Rp 350.000 - Rp 1.850.000',
    time: '30 - 60 Menit',
    warranty: '90 Hari',
    detail: 'Panel Super Retina XDR / Dynamic AMOLED Grade Ori, 120Hz smooth, TrueTone aktif.',
  },
  baterai: {
    title: 'Ganti Baterai Original (Health Drop)',
    price: 'Rp 180.000 - Rp 550.000',
    time: '30 - 45 Menit',
    warranty: '60 Hari',
    detail: 'Kapasitas 100%, sel baterai stabil, bebas peringatan unknown part, support fast charging.',
  },
  kaca: {
    title: 'Ganti Kaca Saja (Glass OCA Laminating)',
    price: 'Rp 180.000 - Rp 750.000',
    time: '2 - 3 Jam',
    warranty: '30 Hari',
    detail: 'Panel LCD/OLED asli bawaan pabrik tetap dipertahankan dengan mesin vacuum autoclave OCA.',
  },
  charging: {
    title: 'Port Cas / Konektor Charger Rusak',
    price: 'Rp 120.000 - Rp 350.000',
    time: '30 - 45 Menit',
    warranty: '60 Hari',
    detail: 'Pembersihan jalur pin, penggantian flexible port type-C / lightning, IC Power Cas.',
  },
  kamera: {
    title: 'Kamera Getar (OIS) / Kaca Kamera Pecah',
    price: 'Rp 200.000 - Rp 850.000',
    time: '45 - 60 Menit',
    warranty: '60 Hari',
    detail: 'Kalibrasi stabilizer OIS, penggantian modul sensor asli, kaca lensa anti buram.',
  },
  mati_total: {
    title: 'Mesin Mati Total / Kena Air',
    price: 'Rp 250.000 - Rp 950.000',
    time: '1 - 2 Hari',
    warranty: '60 Hari',
    detail: 'Deteksi jalur konslet dengan thermal camera & chemical ultrasonic cleaning.',
  },
};

/**
 * Get all estimator configuration data
 */
function getEstimatorData() {
  return {
    brands: BRANDS,
    modelsByBrand: MODELS_BY_BRAND,
    repairMatrix: REPAIR_PRICE_MATRIX,
  };
}

/**
 * Calculate estimate based on brand, model, and damage
 * @param {object} param0
 */
function calculateEstimate({ brand = 'apple', model = '', damage = 'lcd' }) {
  const selectedBrand = BRANDS.find((b) => b.id === brand) || BRANDS[0];
  const matrix = REPAIR_PRICE_MATRIX[damage] || REPAIR_PRICE_MATRIX.lcd;

  // Format WhatsApp Message
  const waMessage = encodeURIComponent(
    `Halo Ngalam Fix Pro (Liem Hingky Liman),\n` +
    `Saya ingin servis HP:\n` +
    `• Merek: ${selectedBrand.name}\n` +
    `• Tipe/Model: ${model || 'Umum'}\n` +
    `• Kendala: ${matrix.title}\n` +
    `• Estimasi Web: ${matrix.price} (${matrix.time})\n\n` +
    `Apakah stok sparepart ready hari ini untuk dikerjakan langsung? Terima kasih.`
  );

  const isIphone = brand === 'apple';
  const typeParam = isIphone ? 'iphone' : 'android';
  const bookingUrl = `pesan-servis/index.html?type=${typeParam}&model=${encodeURIComponent(model)}&problem=${encodeURIComponent(damage)}`;

  return {
    success: true,
    brand: selectedBrand.id,
    brandName: selectedBrand.name,
    model: model,
    damage: damage,
    damageTitle: matrix.title,
    price: matrix.price,
    time: matrix.time,
    warranty: matrix.warranty,
    detail: matrix.detail,
    waUrl: `https://wa.me/6281330304321?text=${waMessage}`,
    bookingUrl: bookingUrl,
  };
}

module.exports = {
  getEstimatorData,
  calculateEstimate,
  BRANDS,
  MODELS_BY_BRAND,
  REPAIR_PRICE_MATRIX,
};
