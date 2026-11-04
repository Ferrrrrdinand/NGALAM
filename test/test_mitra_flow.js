/**
 * Automated End-to-End Test for Mitra Affiliate, QR Code, and Commission Flow
 */

const assert = require('assert');
const http = require('http');

const userService = require('../services/userService');
const { getAllOrders, updateOrder } = require('../services/orderService');
const { payoutMitraCommission } = require('../services/financeService');

// Require the express app
const express = require('express');
const cors = require('cors');
const apiRoutes = require('../src/routes');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', apiRoutes);

const server = http.createServer(app);

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const postData = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  console.log('Testing server running on port', server.address().port);

  try {
    const testPhone = '08999888' + Math.floor(1000 + Math.random() * 9000);
    const testCustPhone = '08777666' + Math.floor(1000 + Math.random() * 9000);

    // 1. Registrasi Mitra Baru
    console.log('\n[TEST 1] Pendaftaran Mitra Baru...');
    const regRes = await request('POST', '/api/mitra/register', {
      name: 'Budi Driver Test',
      phone: testPhone,
      vehicleType: 'Gojek / Grab / Maxim Motor',
      plateNumber: 'N 8899 OK'
    });

    assert.strictEqual(regRes.status, 201, `Reg status should be 201, got ${regRes.status}`);
    assert.ok(regRes.body.success, 'Reg should be successful');
    const referralCode = regRes.body.data.referralCode;
    console.log('✅ Mitra terdaftar dengan referral code:', referralCode);

    // 2. Cek Endpoint /api/mitra/check
    console.log('\n[TEST 2] Cek Profil & Saldo Mitra via /api/mitra/check...');
    const checkRes = await request('GET', `/api/mitra/check?phone=${testPhone}`);
    assert.strictEqual(checkRes.status, 200);
    assert.strictEqual(checkRes.body.data.balance, 0, 'Initial balance should be 0');
    assert.strictEqual(checkRes.body.data.totalCommission, 0, 'Initial totalCommission should be 0');
    console.log('✅ Profil mitra berhasil diambil. Saldo awal: Rp 0');

    // 3. Pelanggan Booking dengan Referral Code Mitra
    console.log('\n[TEST 3] Pelanggan Booking dengan Kode Referral...');
    const orderRes = await request('POST', '/api/orders', {
      customerName: 'Siti Pelanggan',
      whatsapp: testCustPhone,
      email: 'siti@example.com',
      phoneType: 'iPhone 13 Pro',
      damage: 'Layar Pecah',
      referralCode: referralCode,
      estimatedCost: 350000
    });

    assert.strictEqual(orderRes.status, 201);
    const order = orderRes.body.data;
    assert.strictEqual(order.affiliateRef, referralCode);
    assert.strictEqual(order.affiliateCommissionStatus, 'pending', 'Commission must be pending upon booking');
    assert.strictEqual(order.affiliateCommission, 0, 'Commission must be 0 initially');
    console.log(`✅ Order tiket berhasil dibuat: ${order.id}. Komisi status: PENDING.`);

    // Verifikasi saldo mitra masih 0 (belum dibayar)
    const checkBeforePay = await request('GET', `/api/mitra/check?phone=${testPhone}`);
    assert.strictEqual(checkBeforePay.body.data.balance, 0, 'Mitra balance must still be 0 before admin confirmation');
    console.log('✅ Saldo mitra terverifikasi tetap Rp 0 sebelum konfirmasi kasir.');

    // 4. Uji Proteksi 1x Pakai untuk Nomor WhatsApp yang Sama
    console.log('\n[TEST 4] Pelanggan yang sama mencoba booking kedua kali dengan referral yang sama...');
    const repeatOrderRes = await request('POST', '/api/orders', {
      customerName: 'Siti Pelanggan Repeat',
      whatsapp: testCustPhone,
      phoneType: 'iPhone 12',
      damage: 'Baterai Drop',
      referralCode: referralCode,
      estimatedCost: 200000
    });
    assert.strictEqual(repeatOrderRes.status, 201);
    const repeatOrder = repeatOrderRes.body.data;
    assert.ok(!repeatOrder.affiliateRef, 'Repeat booking from same phone must NOT have affiliateRef attached (1x use only rule)');
    console.log('✅ Proteksi 1x pakai terverifikasi: Booking kedua dari nomor yang sama tidak mendapatkan referral!');

    // 5. Admin Konfirmasi Pembayaran Kasir Manual via Booking Code (Ticket ID)
    console.log('\n[TEST 5] Admin Manual Confirmation & Settlement Pembayaran Kasir...');
    const finalAmount = 500000;
    const settleRes = await request('PUT', `/api/orders/${order.id}`, {
      paid: true,
      cost: finalAmount,
      currentStep: 5,
      statusText: 'Pembayaran Lunas Kasir Meja 1'
    });

    assert.strictEqual(settleRes.status, 200);
    const updatedOrder = settleRes.body.data;
    assert.strictEqual(updatedOrder.paid, true);
    assert.strictEqual(updatedOrder.affiliateCommissionStatus, 'paid');
    assert.strictEqual(updatedOrder.affiliateCommission, 50000, '10% of 500000 is 50000');
    console.log(`✅ Tiket ${order.id} lunas! Komisi 10% (Rp 50.000) berhasil dialokasikan.`);

    // 6. Cek Saldo Mitra setelah Konfirmasi Admin
    console.log('\n[TEST 6] Cek Saldo Mitra setelah Admin Konfirmasi Pembayaran...');
    const checkAfterPay = await request('GET', `/api/mitra/check?phone=${testPhone}`);
    assert.strictEqual(checkAfterPay.body.data.balance, 50000, 'Balance must be 50000');
    assert.strictEqual(checkAfterPay.body.data.totalCommission, 50000, 'TotalCommission must be 50000');
    console.log('✅ Saldo mitra bertambah menjadi Rp 50.000!');

    // 7. Payout Saldo Komisi Mitra oleh Admin / Kasir
    console.log('\n[TEST 7] Pencairan Saldo Komisi Mitra oleh Kasir (Payout)...');
    const payoutRes = await request('POST', '/api/mitra/payout', {
      referralCode: referralCode,
      amount: 50000,
      note: 'Pencairan tunai di kasir'
    });

    assert.strictEqual(payoutRes.status, 200);
    assert.ok(payoutRes.body.success);
    assert.strictEqual(payoutRes.body.mitra.balance, 0, 'Balance must reset to 0 after full payout');
    assert.strictEqual(payoutRes.body.mitra.withdrawnCommission, 50000, 'Withdrawn commission must be 50000');
    console.log('✅ Saldo mitra berhasil dicairkan. Saldo siap tarik kembali ke Rp 0!');

    console.log('\n======================================================');
    console.log('🎉 SEMUA 7 SKENARIO PENGUJIAN FLOW MITRA LOLOS 100%!');
    console.log('======================================================\n');
  } finally {
    server.close();
  }
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
