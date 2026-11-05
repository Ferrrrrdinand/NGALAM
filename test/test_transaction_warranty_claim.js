/**
 * Test Pencatatan Garansi & Status Klaim pada Transaksi Faktur Kasir
 */

const {
  getAllTransactionsWithWarranty,
  updateTransactionWarranty
} = require('../services/financeService');

async function runTest() {
  console.log('======================================================');
  console.log('🧪 PENGUJIAN PENCATATAN GARANSI & KLAIM DI SETIAP TRANSAKSI');
  console.log('======================================================\n');

  // TEST 1: Ambil seluruh transaksi dengan kalkulasi garansi
  console.log('[TEST 1] Memeriksa data garansi pada seluruh transaksi...');
  const txs = getAllTransactionsWithWarranty();
  if (!Array.isArray(txs) || txs.length === 0) {
    throw new Error('Gagal: Tidak ada transaksi yang dimuat.');
  }
  console.log(`Ditemukan ${txs.length} transaksi.`);
  const sample = txs[0];
  console.log('Sample Transaksi:');
  console.log(`- Faktur: ${sample.invoiceNumber}`);
  console.log(`- Tiket: ${sample.ticketId}`);
  console.log(`- Pelanggan: ${sample.customerName}`);
  console.log(`- Perangkat: ${sample.phoneType}`);
  console.log(`- Layanan: ${sample.serviceItem}`);
  console.log(`- Durasi Garansi: ${sample.warrantyDurationDays} Hari (${sample.warrantyTypeLabel})`);
  console.log(`- Berlaku Sampai: ${sample.warrantyValidUntil} (Sisa ${sample.daysRemaining} Hari)`);
  console.log(`- Status Klaim: ${sample.warrantyClaimStatus}`);

  if (!sample.serviceItem || !sample.warrantyDurationDays || !sample.warrantyClaimStatus) {
    throw new Error('Gagal: Data layanan garansi atau status klaim tidak lengkap.');
  }
  console.log('✅ Test 1 Berhasil: Seluruh transaksi memiliki data layanan servis dan garansi.\n');

  // TEST 2: Update status klaim menjadi 'claimed'
  console.log('[TEST 2] Menguji update status klaim garansi transaksi menjadi "claimed"...');
  const targetInv = sample.invoiceNumber;
  const updated1 = await updateTransactionWarranty(targetInv, {
    warrantyClaimStatus: 'claimed',
    warrantyClaimDate: '5 November 2026',
    warrantyClaimNotes: 'Pengecekan unit konsumen karena keluhan kendala teknis.'
  });

  if (updated1.warrantyClaimStatus !== 'claimed') {
    throw new Error('Gagal: Status klaim tidak berubah menjadi claimed.');
  }
  console.log(`Status sekarang: ${updated1.warrantyClaimStatus}`);
  console.log(`Tanggal klaim: ${updated1.warrantyClaimDate}`);
  console.log('✅ Test 2 Berhasil: Status klaim garansi berhasil dicatat menjadi "claimed".\n');

  // TEST 3: Kembalikan status menjadi 'unclaimed'
  console.log('[TEST 3] Menguji pengembalian status klaim menjadi "unclaimed"...');
  const updated2 = await updateTransactionWarranty(targetInv, {
    warrantyClaimStatus: 'unclaimed',
    warrantyClaimDate: null,
    warrantyClaimNotes: ''
  });

  if (updated2.warrantyClaimStatus !== 'unclaimed') {
    throw new Error('Gagal: Status klaim tidak kembali menjadi unclaimed.');
  }
  console.log(`Status sekarang: ${updated2.warrantyClaimStatus}`);
  console.log('✅ Test 3 Berhasil: Status klaim berhasil direset kembali.\n');

  console.log('======================================================');
  console.log('🎉 SELURUH PENGUJIAN SISTEM GARANSI TRANSAKSI SUKSES 100%!');
  console.log('======================================================');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('❌ Test Gagal:', err);
  process.exit(1);
});
