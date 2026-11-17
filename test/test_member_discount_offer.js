/**
 * Test Suite: Member Registration Offer & 5% Member Discount (1x Use, Min 500k) Verification
 */

const assert = require('assert');
const { getAllPromoCodes, validateAndCalculate } = require('../services/promoCodeService');
const { getAllAds } = require('../services/adService');

async function runTests() {
  console.log('======================================================');
  console.log('🧪 PENGUJIAN TAWARAN MEMBER & DISKON 5% MEMBER BARU');
  console.log('======================================================\n');

  // 1. Verifikasi Kode Promo MEMBER5
  console.log('[TEST 1] Memeriksa ketersediaan kode promo MEMBER5...');
  const allPromos = getAllPromoCodes(false);
  const memberPromo = allPromos.find(p => p.code.toUpperCase() === 'MEMBER5');
  assert(memberPromo, 'Kode promo MEMBER5 harus terdaftar di sistem');
  assert.strictEqual(memberPromo.discountType, 'percentage', 'Tipe diskon harus percentage');
  assert.strictEqual(memberPromo.discountValue, 5, 'Nilai diskon harus 5%');
  assert.strictEqual(memberPromo.minSpend, 500000, 'Minimal belanja harus Rp 500.000');
  assert.strictEqual(memberPromo.oneTimePerMember, true, 'Harus 1x pakai per member');
  assert.strictEqual(memberPromo.active, true, 'Kode promo MEMBER5 harus aktif');
  console.log(`✅ Test 1 Berhasil: Kode "${memberPromo.code}" aktif dengan potongan ${memberPromo.discountValue}% (Min. Transaksi Rp ${memberPromo.minSpend.toLocaleString('id-ID')})`);

  // 2. Verifikasi Kalkulasi Diskon 5% untuk Transaksi >= 500.000
  console.log('\n[TEST 2] Menguji perhitungan diskon 5% dengan biaya Rp 600.000...');
  const calcResult = validateAndCalculate('MEMBER5', 600000);
  assert.strictEqual(calcResult.valid, true, 'Voucher harus valid untuk transaksi >= 500.000');
  assert.strictEqual(calcResult.discountAmount, 30000, 'Diskon 5% dari 600.000 harus 30.000');
  assert.strictEqual(calcResult.finalPrice, 570000, 'Harga akhir harus 570.000');
  console.log(`✅ Test 2 Berhasil: Diskon Rp ${calcResult.discountAmount.toLocaleString('id-ID')} berhasil dipotong. Harga akhir: Rp ${calcResult.finalPrice.toLocaleString('id-ID')}`);

  // 3. Verifikasi Penolakan jika Transaksi di Bawah Rp 500.000
  console.log('\n[TEST 3] Menguji penolakan voucher jika transaksi di bawah Rp 500.000 (Cth: Rp 350.000)...');
  const rejectResult = validateAndCalculate('MEMBER5', 350000);
  assert.strictEqual(rejectResult.valid, false, 'Voucher harus ditolak jika di bawah Rp 500.000');
  assert(rejectResult.message.includes('500.000'), 'Pesan error harus menyebutkan minimal transaksi Rp 500.000');
  console.log(`✅ Test 3 Berhasil: Ditolak dengan pesan: "${rejectResult.message}"`);

  // 4. Verifikasi Iklan Tawaran Member VIP di AdService
  console.log('\n[TEST 4] Memeriksa iklan tawaran member di sistem periklanan...');
  const allAds = getAllAds(false);
  const memberAd = allAds.find(a => a.id === 'ad-member-vip-5' || a.id === 'ad-member-vip-10');
  assert(memberAd, 'Iklan member baru harus terdaftar di adService');
  assert(memberAd.targetUrl.includes('MEMBER5') || memberAd.targetUrl.includes('MEMBER'), 'Target URL harus menyertakan voucher MEMBER');
  console.log(`✅ Test 4 Berhasil: Iklan "${memberAd.title}" terdaftar dengan badge "${memberAd.badge}"`);

  console.log('\n======================================================');
  console.log('🎉 SELURUH PENGUJIAN TAWARAN MEMBER & DISKON 5% SUKSES!');
  console.log('======================================================');
}

runTests().catch(err => {
  console.error('❌ Test gagal:', err);
  process.exit(1);
});

