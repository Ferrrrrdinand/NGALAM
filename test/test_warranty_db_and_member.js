/**
 * Test Suite: Tabel Garansi Database & Integrasi Akun Member
 * Menguji:
 * 1. Pembuatan dan ketersediaan tabel "warranties" di PostgreSQL & fallback data/warranties.json
 * 2. Pencatatan otomatis ke tabel garansi saat pesanan selesai / dibayar
 * 3. Keterkaitan garansi dengan akun member (berdasarkan customerId, WhatsApp, Email)
 * 4. Pengajuan klaim garansi oleh pelanggan dan pencatatan riwayat klaim di database
 * 5. Pembaruan status klaim oleh admin workshop lab (approved / in_repair / resolved)
 */

const assert = require('assert');
const warrantyService = require('../services/warrantyService');
const { registerNewCustomer, findCustomerByIdentifier } = require('../services/customerService');
const db = require('../services/db');

async function runTests() {
  console.log('================================================================');
  console.log('🧪 PENGUJIAN TABEL GARANSI DATABASE & AKUN MEMBER NGALAM FIX PRO');
  console.log('================================================================\n');

  // [TEST 1] Memastikan tabel dan cache garansi terinisialisasi
  console.log('[TEST 1] Menguji ketersediaan tabel garansi & sinkronisasi data...');
  const initRes = await warrantyService.getAllWarranties();
  assert(initRes && Array.isArray(initRes.warranties), 'Daftar garansi harus berupa array');
  console.log(`✅ Test 1 Berhasil: Tabel garansi aktif dengan total ${initRes.warranties.length} sertifikat garansi.`);

  // [TEST 2] Mendaftarkan member baru untuk pengujian
  console.log('\n[TEST 2] Mendaftarkan akun member pengujian...');
  const testWa = '081233445566';
  const testEmail = 'member_garansi@test.com';
  let testMember = findCustomerByIdentifier(testWa);
  if (!testMember) {
    testMember = await registerNewCustomer({
      name: 'Budi Test Garansi',
      whatsapp: testWa,
      email: testEmail,
      district: 'Sukun, Kota Malang',
      password: 'password123',
      registeredVia: 'Pengujian Sistem'
    });
  }
  assert(testMember && testMember.id, 'Member test harus terdaftar');
  console.log(`✅ Test 2 Berhasil: Akun member "${testMember.name}" (${testMember.id}) siap.`);

  // [TEST 3] Simulasi pesanan baterai selesai -> otomatis tercatat di tabel garansi (90 Hari)
  console.log('\n[TEST 3] Menguji pencatatan otomatis garansi baterai 90 hari saat pesanan selesai...');
  const testOrderId = `NGF-TEST-${Date.now().toString().slice(-4)}`;
  const orderData = {
    id: testOrderId,
    ticketId: testOrderId,
    customerId: testMember.id,
    customerName: testMember.name,
    customerPhone: testMember.whatsapp,
    customerEmail: testMember.email,
    deviceType: 'Apple iPhone',
    brandModel: 'iPhone 14 Pro Max',
    damageDescription: 'Ganti Baterai Original 100% Health',
    technicianNotes: 'Pemasangan presisi di lab meja 1',
    status: 'Selesai & Lunas Kasir',
    step: 5,
    paidAt: new Date().toISOString()
  };

  const createdWarranty = await warrantyService.createOrUpdateWarrantyForOrder(orderData);
  assert(createdWarranty, 'Garansi harus berhasil dibuat');
  assert.strictEqual(createdWarranty.duration_days, 90, 'Durasi garansi baterai harus 90 hari');
  assert(createdWarranty.warranty_code.includes('GAR-90D'), 'Kode garansi harus berformat GAR-90D-...');
  console.log(`✅ Test 3 Berhasil: Garansi 90 hari otomatis tercatat! Kode: ${createdWarranty.warranty_code}`);

  // [TEST 4] Menguji query garansi spesifik milik akun member
  console.log('\n[TEST 4] Menguji pencatatan garansi di akun member...');
  const memberWarranties = await warrantyService.getWarrantiesByCustomer(testMember.id, testMember.whatsapp, testMember.email);
  const foundForMember = memberWarranties.find(w => w.order_id === testOrderId || w.warranty_code === createdWarranty.warranty_code);
  assert(foundForMember, 'Garansi harus muncul di catatan akun member');
  console.log(`✅ Test 4 Berhasil: Ditemukan ${memberWarranties.length} garansi di akun member ${testMember.name}.`);

  // [TEST 5] Menguji pengajuan klaim garansi oleh pelanggan
  console.log('\n[TEST 5] Menguji pengajuan klaim garansi ke database...');
  const complaintMsg = 'Baterai mengalami restart mendadak setelah 3 hari pemakaian.';
  const claimRes = await warrantyService.submitWarrantyClaim(createdWarranty.warranty_code, {
    complaint: complaintMsg,
    claimMethod: 'Datang Langsung ke Workshop Meja 1',
    customerName: testMember.name,
    whatsapp: testMember.whatsapp
  });

  assert(claimRes.success, 'Pengajuan klaim harus sukses');
  assert(claimRes.claimId, 'Nomor tiket klaim harus terbit');
  assert.strictEqual(claimRes.warranty.claimStatus, 'pending', 'Status klaim harus pending');
  assert(claimRes.warranty.claimCount >= 1, 'Jumlah klaim harus bertambah');
  console.log(`✅ Test 5 Berhasil: Klaim diajukan dengan ID ${claimRes.claimId}, status: ${claimRes.warranty.claimStatus}`);

  // [TEST 6] Menguji update status klaim oleh admin workshop lab (disetujui & pengerjaan lab)
  console.log('\n[TEST 6] Menguji persetujuan klaim & pengerjaan lab oleh admin...');
  const approvedWarranty = await warrantyService.updateClaimStatus(createdWarranty.id, {
    claimStatus: 'approved',
    technicianNotes: 'Klaim disetujui. Unit silakan dibawa ke workshop Meja 1 untuk penggantian modul baterai baru.'
  });
  assert.strictEqual(approvedWarranty.claimStatus, 'approved', 'Status klaim harus approved');
  console.log(`✅ Test 6a Berhasil: Status klaim diubah menjadi "approved".`);

  const resolvedWarranty = await warrantyService.updateClaimStatus(createdWarranty.id, {
    claimStatus: 'resolved',
    technicianNotes: 'Modul baterai baru grade original telah dipasang dan lulus uji QC 100%.'
  });
  assert.strictEqual(resolvedWarranty.claimStatus, 'resolved', 'Status klaim harus resolved');
  console.log(`✅ Test 6b Berhasil: Status klaim diselesaikan menjadi "resolved".`);

  console.log('\n================================================================');
  console.log('🎉 SELURUH PENGUJIAN TABEL GARANSI & AKUN MEMBER SUKSES 100%!');
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('❌ Test Gagal:', err);
  process.exit(1);
});
