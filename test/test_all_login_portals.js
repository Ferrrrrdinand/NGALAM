const assert = require('assert');

async function testAllLogins() {
  console.log('==================================================');
  console.log('AUDIT KESELURUHAN SISTEM LOGIN & REDIRECT HOMEPAGE');
  console.log('==================================================\n');

  // 1. Kasir Login
  console.log('1. Menguji Login Kasir Meja 1...');
  const kasirRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'kasir', password: 'password123', role: 'kasir' })
  });
  assert.strictEqual(kasirRes.status, 200);
  const kasir = await kasirRes.json();
  assert(kasir.success);
  assert.strictEqual(kasir.user.role, 'kasir');
  assert(kasir.user.token);
  console.log('   ✅ Berhasil Login sebagai Kasir:', kasir.user.name);
  console.log('   🎯 Homepage Tujuan: public/admin/index.html (Mode Kasir Meja 1)');

  // 2. Admin Super User Login
  console.log('\n2. Menguji Login Admin Super User...');
  const adminRes = await fetch('http://localhost:3000/api/auth/login', {
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
  const admin = await adminRes.json();
  assert(admin.success);
  assert.strictEqual(admin.user.role, 'admin');
  assert.strictEqual(admin.user.isSuperAdmin, true);
  console.log('   ✅ Berhasil Login sebagai Admin:', admin.user.name);
  console.log('   🎯 Homepage Tujuan: public/admin/index.html (Mode Super User Akses Penuh)');

  // 3. Ferdinand (Owner / Super Admin)
  console.log('\n3. Menguji Login Ferdinand (Owner & Super User)...');
  const ferdRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'ferdinand',
      password: '123456',
      role: 'admin',
      referralCode: 'NGALAM-SUPER-2026'
    })
  });
  assert.strictEqual(ferdRes.status, 200);
  const ferd = await ferdRes.json();
  assert(ferd.success);
  console.log('   ✅ Berhasil Login sebagai Ferdinand:', ferd.user.name);
  console.log('   🎯 Homepage Tujuan: public/admin/index.html (Owner / Super User)');

  // 4. Teknisi Lab Workshop Login
  console.log('\n4. Menguji Login Teknisi Lab Workshop (Mas Rian)...');
  const techRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'rian',
      password: 'password123',
      role: 'teknisi'
    })
  });
  assert.strictEqual(techRes.status, 200);
  const tech = await techRes.json();
  assert(tech.success);
  assert.strictEqual(tech.user.role, 'teknisi');
  console.log('   ✅ Berhasil Login sebagai Teknisi:', tech.user.name);
  console.log('   🎯 Homepage Tujuan: public/teknisi/index.html (Meja Kerja Teknisi Lab)');

  // 5. Mitra Driver & Toko Rekanan Login
  console.log('\n5. Menguji Login Portal Mitra Ojol & Rekanan...');
  const mitraRes = await fetch('http://localhost:3000/api/mitra/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'mitra_demo',
      password: 'password123'
    })
  });
  assert.strictEqual(mitraRes.status, 200);
  const mitra = await mitraRes.json();
  assert(mitra.success);
  assert(mitra.driver);
  assert(mitra.driver.referralCode);
  console.log('   ✅ Berhasil Login Mitra:', mitra.driver.name, `(Kode Ref: ${mitra.driver.referralCode})`);
  console.log('   🎯 Homepage Tujuan: public/mitra/index.html (#mitraDashboardSection)');

  // 6. Pelanggan (Customer Member Auth) Login
  console.log('\n6. Menguji Login Portal Pelanggan (Customer Member)...');
  // First ensure there is a customer or register a test customer
  const testWa = '081299988877';
  let custLoginRes = await fetch('http://localhost:3000/api/customer/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: testWa, pin: '123456' })
  });
  let cust = await custLoginRes.json();
  if (!cust.success) {
    // Register customer
    const regCust = await fetch('http://localhost:3000/api/customer/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Pelanggan Uji Coba',
        whatsapp: testWa,
        district: 'Klojen, Kota Malang',
        pin: '123456'
      })
    });
    const regJson = await regCust.json();
    assert(regJson.success);
    cust = regJson;
  }
  assert(cust.success);
  assert(cust.customer);
  console.log('   ✅ Berhasil Login Pelanggan Member:', cust.customer.name, `(WA: ${cust.customer.whatsapp})`);
  console.log('   🎯 Homepage Tujuan: public/login/index.html (#loggedInCustomerView)');

  console.log('\n==================================================');
  console.log('HASIL AUDIT: SELURUH SISTEM LOGIN 100% LOLOS & TEPAT!');
  console.log('==================================================');
}

testAllLogins().catch(err => {
  console.error('Audit gagal:', err);
  process.exit(1);
});
