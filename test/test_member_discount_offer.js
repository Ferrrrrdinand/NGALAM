/**
 * Test Suite: Member Registration Offer & 10% Member Discount Verification
 */

const assert = require('assert');
const { getAllPromoCodes, validateAndCalculate } = require('../services/promoCodeService');
const { getAllAds } = require('../services/adService');

async function runTests() {
  console.log('======================================================');
  console.log('🧪 PENGUJIAN TAWARAN MEMBER & DISKON 10% MEMBER BARU');
  console.log('======================================================\n');

  // 1. Verifikasi Kode Promo MEMBER10
  console.log('[TEST 1] Memeriksa ketersediaan kode promo MEMBER10...');
  const allPromos = getAllPromoCodes(false);
  const memberPromo = allPromos.find(p => p.code.toUpperCase() === 'MEMBER10');
  assert(memberPromo, 'Kode promo MEMBER10 harus terdaftar di sistem');
  assert.strictEqual(memberPromo.discountType, 'percentage', 'Tipe diskon harus percentage');
  assert.strictEqual(memberPromo.discountValue, 10, 'Nilai diskon harus 10%');
  assert.strictEqual(memberPromo.active, true, 'Kode promo MEMBER10 harus aktif');
  console.log(`✅ Test 1 Berhasil: Kode "${memberPromo.code}" aktif dengan potongan ${memberPromo.discountValue}% (${memberPromo.name})`);

  // 2. Verifikasi Kalkulasi Diskon 10%
  console.log('\n[TEST 2] Menguji perhitungan diskon 10% dengan estimasi biaya Rp 350.000...');
  const calcResult = validateAndCalculate('MEMBER10', 350000);
  assert.strictEqual(calcResult.valid, true, 'Voucher harus valid');
  assert.strictEqual(calcResult.discountAmount, 35000, 'Diskon 10% dari 350.000 harus 35.000');
  assert.strictEqual(calcResult.finalPrice, 315000, 'Harga akhir harus 315.000');
  console.log(`✅ Test 2 Berhasil: Diskon Rp ${calcResult.discountAmount.toLocaleString('id-ID')} berhasil dipotong. Harga akhir: Rp ${calcResult.finalPrice.toLocaleString('id-ID')}`);

  // 3. Verifikasi Iklan Tawaran Member VIP di AdService
  console.log('\n[TEST 3] Memeriksa iklan tawaran member di sistem periklanan...');
  const allAds = getAllAds(false);
  const memberAd = allAds.find(a => a.id === 'ad-member-vip-10');
  assert(memberAd, 'Iklan ad-member-vip-10 harus terdaftar di adService');
  assert(memberAd.headline.includes('10%'), 'Headline iklan harus menyebutkan diskon 10%');
  assert(memberAd.targetUrl.includes('MEMBER10'), 'Target URL harus menyertakan voucher MEMBER10');
  console.log(`✅ Test 3 Berhasil: Iklan "${memberAd.title}" terdaftar dengan badge "${memberAd.badge}"`);

  console.log('\n======================================================');
  console.log('🎉 SELURUH PENGUJIAN TAWARAN MEMBER & DISKON 10% SUKSES!');
  console.log('======================================================');
}

runTests().catch(err => {
  console.error('❌ Test gagal:', err);
  process.exit(1);
});

