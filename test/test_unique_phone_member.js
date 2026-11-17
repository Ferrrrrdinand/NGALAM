/**
 * Test Suite: Unique Phone Number for Members & 5% One-Time Member Promo
 */

const assert = require('assert');
const { registerNewCustomer, findCustomerByPhone } = require('../services/customerService');
const { validateAndCalculate } = require('../services/promoCodeService');

async function runTests() {
  console.log('================================================================');
  console.log('🧪 PENGUJIAN NOMOR TELEPON UNIK MEMBER & VOUCHER MEMBER 5% (1X PAKAI)');
  console.log('================================================================\n');

  // 1. Uji Normalisasi & Deteksi Duplikat Nomor Telepon Member
  console.log('[TEST 1] Menguji pencegahan duplikasi nomor WhatsApp member...');
  const testPhone = '089988776655';
  
  // Pastikan jika nomor sudah ada, tidak bisa mendaftar lagi
  const existing = findCustomerByPhone(testPhone);
  if (!existing) {
    // Daftarkan dulu akun pertama
    await registerNewCustomer({
      name: 'Member Pertama',
      whatsapp: testPhone,
      email: 'member1@test.com',
      password: 'password123'
    });
    console.log(`Akun pertama dengan no ${testPhone} berhasil didaftarkan.`);
  }

  // Coba daftarkan akun kedua dengan nomor yang sama persis
  let rejectedSame = false;
  try {
    await registerNewCustomer({
      name: 'Member Kedua Duplikat',
      whatsapp: testPhone,
      email: 'member2@test.com',
      password: 'password123'
    });
  } catch (err) {
    rejectedSame = true;
    assert.strictEqual(err.code, 'CUSTOMER_PHONE_TAKEN');
    console.log(`✅ Berhasil ditolak saat nomor sama persis: "${err.message}"`);
  }
  assert.strictEqual(rejectedSame, true, 'Nomor yang sama persis harus ditolak');

  // Coba daftarkan akun ketiga dengan format +62
  let rejectedPlus62 = false;
  try {
    await registerNewCustomer({
      name: 'Member Ketiga Format +62',
      whatsapp: '+6289988776655',
      email: 'member3@test.com',
      password: 'password123'
    });
  } catch (err) {
    rejectedPlus62 = true;
    assert.strictEqual(err.code, 'CUSTOMER_PHONE_TAKEN');
    console.log(`✅ Berhasil ditolak saat nomor menggunakan format +62: "${err.message}"`);
  }
  assert.strictEqual(rejectedPlus62, true, 'Nomor format +62 harus terdeteksi sebagai duplikat dan ditolak');

  // Coba daftarkan akun keempat dengan format 62 tanpa +
  let rejected62 = false;
  try {
    await registerNewCustomer({
      name: 'Member Keempat Format 62',
      whatsapp: '6289988776655',
      email: 'member4@test.com',
      password: 'password123'
    });
  } catch (err) {
    rejected62 = true;
    assert.strictEqual(err.code, 'CUSTOMER_PHONE_TAKEN');
    console.log(`✅ Berhasil ditolak saat nomor menggunakan format 62: "${err.message}"`);
  }
  assert.strictEqual(rejected62, true, 'Nomor format 62 harus terdeteksi sebagai duplikat dan ditolak');

  // 2. Uji Aturan 1x Pakai untuk Voucher MEMBER5
  console.log('\n[TEST 2] Menguji aturan 1x pakai khusus member baru untuk voucher MEMBER5...');
  // Pengujian 2a: Member baru belum pernah pakai -> VALID
  const resFirstUse = validateAndCalculate('MEMBER5', 600000, { customerWa: testPhone });
  assert.strictEqual(resFirstUse.valid, true, 'Voucher harus valid untuk pemakaian pertama');
  assert.strictEqual(resFirstUse.discountValue, 5);
  console.log(`✅ Pemakaian pertama valid: Diskon 5% (Rp ${resFirstUse.discountAmount.toLocaleString('id-ID')})`);

  // Simulasi member sudah pernah menggunakan voucher (flag hasUsedNewMemberPromo = true)
  const custObj = findCustomerByPhone(testPhone);
  if (custObj) {
    custObj.hasUsedNewMemberPromo = true;
  }

  // Pengujian 2b: Member sudah pernah pakai -> DITOLAK
  const resSecondUse = validateAndCalculate('MEMBER5', 600000, { customerWa: testPhone });
  assert.strictEqual(resSecondUse.valid, false, 'Voucher harus ditolak jika sudah pernah digunakan');
  console.log(`✅ Pemakaian kedua berhasil ditolak: "${resSecondUse.message}"`);

  // Pengujian 2c: Min spend < 500.000 -> DITOLAK
  const resBelowMinSpend = validateAndCalculate('MEMBER5', 400000, { customerWa: '081199887766' });
  assert.strictEqual(resBelowMinSpend.valid, false, 'Voucher harus ditolak jika transaksi < 500.000');
  console.log(`✅ Transaksi di bawah Rp 500.000 berhasil ditolak: "${resBelowMinSpend.message}"`);

  console.log('\n================================================================');
  console.log('🎉 SELURUH PENGUJIAN NOMOR UNIK & VOUCHER 1X PAKAI SUKSES!');
  console.log('================================================================');
}

runTests().catch(err => {
  console.error('❌ Test gagal:', err);
  process.exit(1);
});

