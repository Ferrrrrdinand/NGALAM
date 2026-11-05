/**
 * NGALAM FIX PRO - Comprehensive HTTP Test: Commission for ALL Customers Using Mitra Code
 * Verifies that Mitra affiliate commission is awarded for:
 * 1. Guest/unregistered customer (never logged in) using referral code
 * 2. Repeat orders from the same customer (even if they forget to re-enter code)
 * 3. Walk-in intake orders
 * 4. Cashier transactions
 */

const assert = require('assert');
const http = require('http');
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
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runAllCommissionTests() {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  console.log('\n================================================================');
  console.log('🧪 PENGUJIAN KOMISI MITRA UNTUK SELURUH PELANGGAN (TAMU & MEMBER)');
  console.log('================================================================\n');

  try {
    const testMitraPhone = '08129999' + Math.floor(1000 + Math.random() * 9000);
    const guestPhone = '08778888' + Math.floor(1000 + Math.random() * 9000);

    // 1. Register Mitra
    console.log('[STEP 1] Mendaftarkan Mitra Driver baru...');
    const regRes = await request('POST', '/api/mitra/register', {
      name: 'Rudi Grab Driver',
      phone: testMitraPhone,
      vehicleType: 'Grab / Gojek Motor',
      plateNumber: 'N 1234 XY'
    });
    assert.strictEqual(regRes.status, 201);
    const refCode = regRes.body.data.referralCode;
    console.log(`✅ Mitra terdaftar: Rudi Grab Driver | Kode Referral: ${refCode}`);

    // 2. Guest Customer (Tamu Belum Login) Booking dengan Kode Mitra
    console.log('\n[STEP 2] Pelanggan TAMU (Belum Login) booking servis via web dengan kode mitra...');
    const order1Res = await request('POST', '/api/orders', {
      customerName: 'Bu Dewi Pelanggan Tamu',
      whatsapp: guestPhone,
      phoneType: 'iPhone 15 Pro Max',
      damage: 'Ganti Layar OLED Super Retina',
      cost: 1500000,
      referralCode: refCode,
      affiliateRef: refCode
    });
    assert.strictEqual(order1Res.status, 201);
    const order1 = order1Res.body.data;
    console.log(`✅ Tiket tamu dibuat: ${order1.id} | Affiliate: ${order1.affiliateRef}`);
    assert.strictEqual(order1.affiliateRef, refCode, 'Order tamu harus memiliki affiliateRef mitra');

    // 3. Pelunasan Order 1 di Kasir
    console.log('\n[STEP 3] Kasir memproses pelunasan Order 1 (Rp 1.500.000)...');
    const pay1Res = await request('POST', '/api/finance/transactions', {
      ticketId: order1.id,
      customerName: 'Bu Dewi Pelanggan Tamu',
      customerPhone: guestPhone,
      serviceItem: 'Ganti Layar OLED Super Retina',
      phoneType: 'iPhone 15 Pro Max',
      totalPaid: 1500000,
      paymentMethod: 'QRIS'
    });
    assert.strictEqual(pay1Res.status, 201);

    // Cek saldo mitra bertambah 10% dari 1.500.000 = 150.000
    const check1 = await request('GET', `/api/mitra/check?phone=${testMitraPhone}`);
    console.log(`✅ Saldo mitra setelah order tamu lunas: Rp ${check1.body.data.balance}`);
    assert.strictEqual(check1.body.data.balance, 150000, 'Komisi mitra harus Rp 150.000');

    // 4. Repeat Order oleh Pelanggan Tamu yang sama TANPA mengetik kode referral lagi
    console.log('\n[STEP 4] Pelanggan tamu yang sama order kedua kalinya TANPA mengetik kode referral...');
    const order2Res = await request('POST', '/api/orders', {
      customerName: 'Bu Dewi Pelanggan Tamu',
      whatsapp: guestPhone,
      phoneType: 'iPhone 15 Pro Max',
      damage: 'Ganti Baterai Original 90 Hari',
      cost: 450000
      // Tidak menyertakan referralCode secara manual!
    });
    assert.strictEqual(order2Res.status, 201);
    const order2 = order2Res.body.data;
    console.log(`✅ Tiket order kedua: ${order2.id} | Affiliate otomatis: ${order2.affiliateRef}`);
    assert.strictEqual(order2.affiliateRef, refCode, 'Order kedua dari pelanggan tamu harus otomatis terhubung dengan mitra!');

    // 5. Pelunasan Order 2 di Kasir
    console.log('\n[STEP 5] Kasir melunasi Order 2 (Rp 450.000)...');
    const pay2Res = await request('POST', '/api/finance/transactions', {
      ticketId: order2.id,
      customerName: 'Bu Dewi Pelanggan Tamu',
      customerPhone: guestPhone,
      serviceItem: 'Ganti Baterai Original 90 Hari',
      phoneType: 'iPhone 15 Pro Max',
      totalPaid: 450000,
      paymentMethod: 'Tunai (Cash)'
    });
    assert.strictEqual(pay2Res.status, 201);

    // Cek saldo mitra bertambah lagi 10% dari 450.000 = 45.000 (Total 195.000)
    const check2 = await request('GET', `/api/mitra/check?phone=${testMitraPhone}`);
    console.log(`✅ Saldo mitra setelah order kedua: Rp ${check2.body.data.balance}`);
    assert.strictEqual(check2.body.data.balance, 195000, 'Total saldo mitra harus Rp 195.000');

    // 6. Walk-in Customer di Counter Meja 1 dengan Kode Referral
    console.log('\n[STEP 6] Pelanggan Walk-in di Meja 1 membawa kode rujukan mitra...');
    const order3Res = await request('POST', '/api/orders', {
      customerName: 'Pak Hendra Walk-in',
      whatsapp: '081377889900',
      phoneType: 'Samsung S24 Ultra',
      damage: 'Port Cas / Konektor Charger',
      cost: 200000,
      referralCode: refCode,
      serviceMethod: 'walk_in_meja1'
    });
    assert.strictEqual(order3Res.status, 201);
    const order3 = order3Res.body.data;
    console.log(`✅ Tiket Walk-in terdaftar: ${order3.id} | Affiliate: ${order3.affiliateRef}`);

    // Kasir melunasi Order 3
    await request('POST', '/api/finance/transactions', {
      ticketId: order3.id,
      customerName: 'Pak Hendra Walk-in',
      customerPhone: '081377889900',
      serviceItem: 'Port Cas / Konektor Charger',
      phoneType: 'Samsung S24 Ultra',
      totalPaid: 200000,
      paymentMethod: 'QRIS'
    });

    const check3 = await request('GET', `/api/mitra/check?phone=${testMitraPhone}`);
    console.log(`✅ Saldo mitra setelah order walk-in: Rp ${check3.body.data.balance}`);
    assert.strictEqual(check3.body.data.balance, 215000, 'Total saldo mitra harus Rp 215.000 (195.000 + 20.000)');

    console.log('\n================================================================');
    console.log('🎉 SEMUA PENGUJIAN KOMISI MITRA UNTUK SELURUH PELANGGAN SUKSES 100%!');
    console.log('================================================================\n');

  } finally {
    server.close();
  }
}

runAllCommissionTests().catch((err) => {
  console.error('❌ Test Gagal:', err);
  process.exit(1);
});
