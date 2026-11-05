/**
 * NGALAM FIX PRO - Advertisement System Test
 * Verifies that ads can be created, updated, toggled, tracked, and synchronized with database.
 */

const assert = require('assert');
const adService = require('../services/adService');

async function runAdsTest() {
  console.log('\n======================================================');
  console.log('🧪 MEMULAI TEST SISTEM IKLAN DATABASE (AD SERVICE)');
  console.log('======================================================\n');

  // 1. Get initial ads
  console.log('[TEST 1] Mengambil daftar iklan aktif...');
  const initialAds = adService.getAllAds({ onlyActive: true });
  console.log(`Ditemukan ${initialAds.length} iklan aktif.`);
  assert(initialAds.length > 0, 'Harus ada setidaknya 1 iklan bawaan aktif');
  console.log('✅ Test 1 Berhasil: Iklan aktif berhasil dimuat.');

  // 2. Create new Ad
  console.log('\n[TEST 2] Membuat iklan baru di database...');
  const newAd = await adService.createAd({
    title: 'Iklan Uji Coba Diskon',
    headline: 'Diskon Akhir Tahun Servis HP Malang — Kuota Terbatas!',
    description: 'Dapatkan potongan harga khusus perbaikan IC dan pergantian kaca OCA dengan teknisi bersertifikat.',
    badge: '⚡ FLASH SALE AKHIR TAHUN',
    imageUrl: 'images/promo-banner-1.jpg',
    targetUrl: '/pesan-servis',
    ctaText: 'Klaim Sekarang ↗',
    theme: 'emerald',
    active: true
  });
  console.log(`Iklan berhasil dibuat dengan ID: ${newAd.id}`);
  assert(newAd.id, 'Iklan baru harus memiliki ID unik');
  assert.strictEqual(newAd.title, 'Iklan Uji Coba Diskon');
  console.log('✅ Test 2 Berhasil: Iklan baru berhasil dibuat.');

  // 3. Update Ad
  console.log('\n[TEST 3] Memperbarui data iklan...');
  const updatedAd = await adService.updateAd(newAd.id, {
    headline: 'Updated Headline: Diskon 50% Khusus Hari Ini!',
    theme: 'gold'
  });
  assert.strictEqual(updatedAd.headline, 'Updated Headline: Diskon 50% Khusus Hari Ini!');
  assert.strictEqual(updatedAd.theme, 'gold');
  console.log('✅ Test 3 Berhasil: Data iklan berhasil diperbarui secara realtime.');

  // 4. Track click
  console.log('\n[TEST 4] Mencatat klik pengunjung pada iklan...');
  const clickedAd = await adService.recordAdClick(newAd.id);
  assert.strictEqual(clickedAd.clicksCount, 1, 'Clicks count harus bertambah jadi 1');
  console.log(`Jumlah klik saat ini: ${clickedAd.clicksCount}`);
  console.log('✅ Test 4 Berhasil: Pencatatan klik iklan bekerja dengan benar.');

  // 5. Toggle status
  console.log('\n[TEST 5] Mengubah status aktif/nonaktif iklan...');
  const toggled = await adService.toggleAd(newAd.id);
  assert.strictEqual(toggled.active, false, 'Status iklan harus menjadi nonaktif');
  console.log(`Status iklan setelah toggle: ${toggled.active ? 'Aktif' : 'Nonaktif'}`);
  console.log('✅ Test 5 Berhasil: Status toggle iklan berhasil diubah.');

  // 6. Delete Ad
  console.log('\n[TEST 6] Menghapus iklan pengujian...');
  const deleted = await adService.deleteAd(newAd.id);
  assert(deleted.success, 'Iklan harus berhasil dihapus');
  const checkDeleted = adService.getAdById(newAd.id);
  assert.strictEqual(checkDeleted, null, 'Iklan tidak boleh ditemukan setelah dihapus');
  console.log('✅ Test 6 Berhasil: Iklan pengujian berhasil dihapus dari sistem.');

  console.log('\n======================================================');
  console.log('🎉 SELURUH 6 TEST SISTEM IKLAN DATABASE LOLOS 100%!');
  console.log('======================================================\n');
}

runAdsTest().catch((err) => {
  console.error('❌ Test Ads Gagal:', err);
  process.exit(1);
});
