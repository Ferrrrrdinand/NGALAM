const http = require('http');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const app = require('../src/routes/../..//server'); // or require express app

const express = require('express');
const cors = require('cors');
const apiRoutes = require('../src/routes');

const testApp = express();
testApp.use(cors());
testApp.use(express.json());
testApp.use('/api', apiRoutes);

const server = http.createServer(testApp);

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

server.listen(0, async () => {
  const port = server.address().port;
  console.log(`[Security Test] Server started on port ${port}`);

  try {
    // 1. Password hash verification in JSON stores
    console.log('\n[1] Verifikasi Hashing Password di File Penyimpanan Data...');
    const adminData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/users_admin.json'), 'utf8'));
    const custData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/customers.json'), 'utf8'));
    const mitraData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/users_mitra.json'), 'utf8'));

    assert(adminData.every(u => u.password.startsWith('$2')), 'Semua password admin wajib ter-hash bcrypt');
    assert(custData.every(c => c.pin.startsWith('$2')), 'Semua PIN customer wajib ter-hash bcrypt');
    assert(mitraData.every(m => m.password.startsWith('$2')), 'Semua password mitra wajib ter-hash bcrypt');
    console.log('✅ Semua password & PIN di users_admin, customers, dan users_mitra ter-hash dengan Bcrypt!');

    // 2. Test Admin Login (admin / admin123)
    console.log('\n[2] Uji Login Akun Admin: admin / admin123...');
    const resAdminOk = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { identifier: 'admin', password: 'admin123', role: 'admin' });

    assert.strictEqual(resAdminOk.status, 200, 'Admin login berhasil');
    assert.strictEqual(resAdminOk.body.user.role, 'admin');
    const adminToken = resAdminOk.body.user.token;
    console.log('✅ Akun Admin berhasil login dengan kredensial baru (admin / admin123)!');

    // 3. Test Admin Login with wrong password
    console.log('\n[3] Uji Login Akun Admin dengan Password Salah...');
    const resAdminWrong = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { identifier: 'admin', password: 'wrongpassword', role: 'admin' });

    assert.strictEqual(resAdminWrong.status, 401, 'Admin login salah harus ditolak');
    console.log('✅ Login admin dengan password salah ditolak (401)!');

    // 4. Test Customer Dummy Login (081234567890 / 123456)
    console.log('\n[4] Uji Login Akun Dummy Pelanggan (081234567890 / PIN 123456)...');
    const resCustOk = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/customer/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { identifier: '081234567890', pin: '123456' });

    assert.strictEqual(resCustOk.status, 200, 'Customer login berhasil');
    assert.strictEqual(resCustOk.body.customer.name, 'Pelanggan Dummy');
    console.log('✅ Akun Pelanggan Dummy berhasil login (081234567890 / PIN 123456)!');

    // 5. Test Customer Login with wrong PIN or empty PIN
    console.log('\n[5] Uji Login Akun Dummy Pelanggan dengan PIN Salah & PIN Kosong...');
    const resCustWrongPin = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/customer/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { identifier: '081234567890', pin: '999999' });

    assert.strictEqual(resCustWrongPin.status, 401, 'Customer PIN salah harus ditolak');

    const resCustEmptyPin = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/customer/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { identifier: '081234567890', pin: '' });

    assert.strictEqual(resCustEmptyPin.status, 400, 'Customer PIN kosong harus ditolak (tidak boleh bypass)');
    console.log('✅ Celah bypass autentikasi PIN pelanggan terbukti tertutup rapat!');

    // 6. Test Mitra Dummy Login (mitra_dummy / mitra123)
    console.log('\n[6] Uji Login Akun Dummy Mitra (mitra_dummy / mitra123)...');
    const resMitraOk = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/mitra/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { identifier: 'mitra_dummy', password: 'mitra123' });

    assert.strictEqual(resMitraOk.status, 200, 'Mitra login berhasil');
    assert.strictEqual(resMitraOk.body.driver.username, 'mitra_dummy');
    assert.strictEqual(resMitraOk.body.driver.password, undefined, 'Password mitra tidak boleh bocor di response');
    console.log('✅ Akun Mitra Dummy berhasil login (mitra_dummy / mitra123)! Password tidak bocor di API response.');

    // 7. Test Protection of /api/orders/clear
    console.log('\n[7] Uji Proteksi Endpoint Berbahaya /api/orders/clear...');
    const resClearUnauth = await request({
      hostname: '127.0.0.1',
      port,
      path: '/api/orders/clear',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    assert.strictEqual(resClearUnauth.status, 403, 'Akses unauthenticated ke /api/orders/clear harus ditolak');
    console.log('✅ Endpoint berbahaya /api/orders/clear berhasil diproteksi otorisasi admin (403 Forbidden)!');

    console.log('\n======================================================');
    console.log('🎉 SELURUH AUDIT KEAMANAN & PENGUJIAN AKUN SUKSES 100%!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Uji keamanan gagal:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    process.exit(process.exitCode || 0);
  }
});
