/**
 * NGALAM FIX PRO - Comprehensive Multi-Portal Login & Authentication Test Suite
 * Tests 100% of login flows across all 4 account categories:
 * 1. Pelanggan (Customer Member)
 * 2. Kasir & Admin Super User (Owner)
 * 3. Teknisi Lab Workshop
 * 4. Mitra Driver Ojol & Toko Rekanan
 */

const assert = require('assert');

async function runComprehensiveTests() {
  console.log('================================================================');
  console.log('🧪 PENGUJIAN KOMPREHENSIF SELURUH SISTEM LOGIN NGALAM FIX PRO');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  async function testCase(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
      throw err;
    }
  }

  // =========================================================================
  // 1. PORTAL PELANGGAN (CUSTOMER MEMBER AUTH)
  // =========================================================================
  console.log('--- 1. PORTAL PELANGGAN (CUSTOMER MEMBER) ---');

  await testCase('Login Pelanggan via Nomor WhatsApp Standar (082335493176)', async () => {
    const res = await fetch('http://localhost:3000/api/customer/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '082335493176', pin: '123456' })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.customer.name, 'Ferdinand');
  });

  await testCase('Login Pelanggan via Awalan Internasional (+62 823-3549-3176)', async () => {
    const res = await fetch('http://localhost:3000/api/customer/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '+62 823-3549-3176', pin: '123456' })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.customer.name, 'Ferdinand');
  });

  await testCase('Login Pelanggan via Nomor Tiket Servis (NGF-20261028-2993)', async () => {
    const res = await fetch('http://localhost:3000/api/customer/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'NGF-20261028-2993', pin: '123456' })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert(data.orders && data.orders.length > 0);
  });

  await testCase('Login Pelanggan via Email Terdaftar', async () => {
    const res = await fetch('http://localhost:3000/api/customer/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'ferdinandleandro12@gmail.com', pin: '123456' })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
  });

  // =========================================================================
  // 2. PORTAL ADMIN & KASIR MEJA 1
  // =========================================================================
  console.log('\n--- 2. PORTAL ADMIN & KASIR MEJA 1 ---');

  await testCase('Login Kasir Meja 1 (username: kasir, pass: password123)', async () => {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'kasir', password: 'password123', role: 'kasir' })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.role, 'kasir');
    assert.strictEqual(data.redirectUrl, '/admin');
  });

  await testCase('Login Admin Super User (username: admin, pass: fixprongalam2026)', async () => {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin', password: 'fixprongalam2026', role: 'admin' })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.role, 'admin');
    assert.strictEqual(data.user.isSuperAdmin, true);
  });

  // =========================================================================
  // 3. PORTAL TEKNISI LAB WORKSHOP
  // =========================================================================
  console.log('\n--- 3. PORTAL TEKNISI LAB WORKSHOP ---');

  await testCase('Login Teknisi Mas Rian (username: rian, pass: password123)', async () => {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'rian', password: 'password123', role: 'teknisi' })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.role, 'teknisi');
    assert.strictEqual(data.redirectUrl, '/teknisi');
  });

  await testCase('Login Teknisi Mas Rian via No HP (+62 812-3456-7801)', async () => {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '+62 812-3456-7801', password: 'password123', role: 'teknisi' })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.role, 'teknisi');
  });

  // =========================================================================
  // 4. PORTAL MITRA DRIVER & TOKO REKANAN
  // =========================================================================
  console.log('\n--- 4. PORTAL MITRA DRIVER & TOKO REKANAN ---');

  await testCase('Login Mitra Driver Ojol (username: mitra_demo, pass: password123)', async () => {
    const res = await fetch('http://localhost:3000/api/mitra/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'mitra_demo', password: 'password123' })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.driver.referralCode, 'MTR-DEMO-001');
    assert(data.driver.affiliateUrl);
  });

  await testCase('Login Mitra Toko Rekanan (username: toko_jaya, pass: password123)', async () => {
    const res = await fetch('http://localhost:3000/api/mitra/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'toko_jaya', password: 'password123' })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.driver.referralCode, 'MTR-JAYA-888');
  });

  // =========================================================================
  // 5. SESSION VERIFICATION (/api/auth/me)
  // =========================================================================
  console.log('\n--- 5. VERIFIKASI SESI TOKEN (/api/auth/me) ---');

  await testCase('Verifikasi Token Sesi Staff', async () => {
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'kasir', password: 'password123', role: 'kasir' })
    });
    const loginData = await loginRes.json();
    const token = loginData.user.token;

    const meRes = await fetch('http://localhost:3000/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.strictEqual(meRes.status, 200);
    const meData = await meRes.json();
    assert.strictEqual(meData.success, true);
    assert.strictEqual(meData.user.username, 'kasir');
  });

  // =========================================================================
  // 6. KEAMANAN & PENOLAKAN KREDENSIAL SALAH (SECURITY CHECK)
  // =========================================================================
  console.log('\n--- 6. KEAMANAN & PENOLAKAN KREDENSIAL SALAH ---');

  await testCase('Tolak Login Kasir dengan Password Salah (Harus 401)', async () => {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'kasir', password: 'passwordsalah123', role: 'kasir' })
    });
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data.success, false);
  });

  await testCase('Tolak Akun Admin Selain admin (Harus 403)', async () => {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'owner', password: 'passwordsalah123', role: 'admin' })
    });
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.strictEqual(data.code, 'ADMIN_ACCOUNT_ONLY');
  });

  await testCase('Tolak User Tidak Terdaftar (Harus 404)', async () => {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'usernametidakada999', password: 'password123', role: 'kasir' })
    });
    assert.strictEqual(res.status, 404);
    const data = await res.json();
    assert.strictEqual(data.success, false);
  });

  await testCase('Tolak Token Palsu pada /api/auth/me (Harus 401)', async () => {
    const res = await fetch('http://localhost:3000/api/auth/me', {
      headers: { 'Authorization': 'Bearer TOKEN-PALSU-12345' }
    });
    assert.strictEqual(res.status, 401);
  });

  await testCase('Tolak Pelanggan dengan PIN Salah (Harus 401)', async () => {
    const res = await fetch('http://localhost:3000/api/customer/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '082335493176', pin: '999999' })
    });
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data.success, false);
  });

  console.log('\n================================================================');
  console.log(`🎉 SELURUH PENGUJIAN LOGIN BERHASIL! (${passed}/${total} Lolos 100%)`);
  console.log('================================================================');
}

runComprehensiveTests().catch(err => {
  console.error('\n❌ Ada pengujian yang gagal:', err);
  process.exit(1);
});
