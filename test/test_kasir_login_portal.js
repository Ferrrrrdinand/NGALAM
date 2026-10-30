const assert = require('assert');

async function runKasirPortalTests() {
  console.log('====================================================');
  console.log('TEST SUITE: SISTEM LOGIN & PORTAL MANDIRI KASIR MEJA 1');
  console.log('====================================================\n');

  const BASE_URL = 'http://localhost:3000';

  // 1. Uji Ketersediaan Halaman HTML Kasir
  console.log('1. Menguji Akses HTTP Halaman Kasir...');
  const loginHtmlRes = await fetch(`${BASE_URL}/public/kasir/login.html`);
  assert.strictEqual(loginHtmlRes.status, 200, 'Halaman public/kasir/login.html harus dapat diakses');
  const loginHtmlText = await loginHtmlRes.text();
  assert(loginHtmlText.includes('Otentikasi Kasir Meja 1'), 'Halaman login kasir harus memiliki judul otentikasi kasir');
  assert(loginHtmlText.includes('kasirLoginForm'), 'Harus terdapat formulir kasirLoginForm');
  console.log('   ✅ public/kasir/login.html berhasil diakses (200 OK)');

  const indexHtmlRes = await fetch(`${BASE_URL}/public/kasir/index.html`);
  assert.strictEqual(indexHtmlRes.status, 200, 'Halaman public/kasir/index.html harus dapat diakses');
  const indexHtmlText = await indexHtmlRes.text();
  assert(indexHtmlText.includes('Dashboard Kasir & Front Desk Meja 1'), 'Halaman dashboard kasir harus sesuai');
  assert(indexHtmlText.includes('kasir_guard.js'), 'Halaman dashboard kasir harus dilindungi kasir_guard.js');
  console.log('   ✅ public/kasir/index.html berhasil diakses (200 OK)');

  // 2. Uji Login Akun Kasir Utama (kasir)
  console.log('\n2. Menguji Login Akun Kasir Utama (kasir / password123)...');
  const kasir1Res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'kasir',
      password: 'password123',
      role: 'kasir'
    })
  });
  assert.strictEqual(kasir1Res.status, 200);
  const kasir1Data = await kasir1Res.json();
  assert(kasir1Data.success, 'Login kasir harus berhasil');
  assert.strictEqual(kasir1Data.user.role, 'kasir', 'Role harus berupa kasir');
  assert(kasir1Data.user.token, 'Token otentikasi harus ada');
  console.log('   ✅ Berhasil Login Kasir:', kasir1Data.user.name, `(Token: ${kasir1Data.user.token.slice(0, 16)}...)`);

  // 3. Uji Login Akun Kasir 1 (kasir1)
  console.log('\n3. Menguji Login Akun Kasir 1 (kasir1 / password123)...');
  const kasir2Res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'kasir1',
      password: 'password123',
      role: 'kasir'
    })
  });
  assert.strictEqual(kasir2Res.status, 200);
  const kasir2Data = await kasir2Res.json();
  assert(kasir2Data.success);
  assert.strictEqual(kasir2Data.user.role, 'kasir');
  console.log('   ✅ Berhasil Login Kasir 1:', kasir2Data.user.name);

  // 4. Uji Penolakan: Akun Kasir mencoba login di Portal Admin
  console.log('\n4. Menguji Isolasi Keamanan: Akun Kasir login di Portal Admin...');
  const adminAttemptRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'kasir',
      password: 'password123',
      role: 'admin',
      referralCode: 'NGALAM-SUPER-2026'
    })
  });
  assert(adminAttemptRes.status === 401 || adminAttemptRes.status === 400, 'Harus ditolak jika akun kasir mencoba masuk sebagai admin');
  const adminAttemptData = await adminAttemptRes.json();
  assert.strictEqual(adminAttemptData.success, false);
  assert(adminAttemptData.error.includes('KASIR'), 'Pesan error harus memberi tahu bahwa ini adalah akun Kasir');
  console.log('   ✅ Proteksi Berhasil: Kasir ditolak di portal Admin dengan pesan:', adminAttemptData.error);

  // 5. Uji Login Super Admin (admin / password123)
  console.log('\n5. Menguji Login Admin Super User tetap berfungsi...');
  const adminRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'admin',
      password: 'password123',
      role: 'admin',
      referralCode: 'NGALAM-SUPER-2026'
    })
  });
  assert.strictEqual(adminRes.status, 200);
  const adminData = await adminRes.json();
  assert(adminData.success);
  assert.strictEqual(adminData.user.role, 'admin');
  console.log('   ✅ Admin Super User Berhasil Login:', adminData.user.name);

  // 6. Uji Link Cross-Portal di Halaman Admin Login
  console.log('\n6. Menguji Tautan Kasir di public/admin/login.html...');
  const adminLoginHtmlRes = await fetch(`${BASE_URL}/public/admin/login.html`);
  const adminLoginHtml = await adminLoginHtmlRes.text();
  assert(adminLoginHtml.includes('../kasir/login.html'), 'Halaman admin login harus memiliki link ke login kasir');
  console.log('   ✅ Link ke ../kasir/login.html terverifikasi di admin login');

  // 7. Uji Link Cross-Portal di Halaman Navigasi Publik
  console.log('\n7. Menguji Tautan Kasir di Navigasi public/index.html & public/login/index.html...');
  const homeRes = await fetch(`${BASE_URL}/public/index.html`);
  const homeHtml = await homeRes.text();
  assert(homeHtml.includes('kasir/login.html'), 'Navbar index.html harus memiliki link ke kasir/login.html');
  console.log('   ✅ Tautan kasir/login.html terverifikasi di beranda index.html');

  console.log('\n====================================================');
  console.log('🎉 SEMUA 7 PENGUJIAN SISTEM LOGIN KASIR BERHASIL 100%');
  console.log('====================================================\n');
}

runKasirPortalTests().catch(err => {
  console.error('❌ PENGUJIAN GAGAL:', err);
  process.exit(1);
});
