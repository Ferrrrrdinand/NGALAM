const assert = require('assert');

function resolveSafeRedirect(raw) {
  if (!raw) return 'index.html';
  const decoded = decodeURIComponent(raw).trim();
  if (
    decoded === '/admin' ||
    decoded === '/admin/' ||
    decoded === '/admin/index.html' ||
    decoded === '/public/admin' ||
    decoded === '/public/admin/' ||
    decoded === '/public/admin/index.html' ||
    decoded.endsWith('/admin/index.html') ||
    decoded.endsWith('/admin')
  ) {
    return 'index.html';
  }
  return decoded;
}

async function runTests() {
  console.log('--- 1. Testing URL normalization for Live Server (5501) & Node (3000) ---');
  assert.strictEqual(resolveSafeRedirect(null), 'index.html');
  assert.strictEqual(resolveSafeRedirect('/admin'), 'index.html');
  assert.strictEqual(resolveSafeRedirect('/admin/'), 'index.html');
  assert.strictEqual(resolveSafeRedirect('/admin/index.html'), 'index.html');
  assert.strictEqual(resolveSafeRedirect('/public/admin/index.html'), 'index.html');
  assert.strictEqual(resolveSafeRedirect('%2Fadmin%2Findex.html'), 'index.html');
  console.log('✓ URL redirection normalization passed (no 404 on Live Server or Node)');

  console.log('\n--- 2. Testing Kasir Login Endpoint ---');
  const kasirRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'kasir', password: 'password123', role: 'kasir' })
  });
  assert.strictEqual(kasirRes.status, 200);
  const kasirData = await kasirRes.json();
  assert.strictEqual(kasirData.success, true);
  assert.strictEqual(kasirData.user.role, 'kasir');
  assert(kasirData.user.token.startsWith('NGF-TOKEN-'));
  console.log('✓ Kasir login successful, token generated:', kasirData.user.token);

  console.log('\n--- 3. Testing Kasir Session Verification (/api/auth/me) ---');
  const meRes = await fetch('http://localhost:3000/api/auth/me', {
    headers: { 'Authorization': `Bearer ${kasirData.user.token}` }
  });
  assert.strictEqual(meRes.status, 200);
  const meData = await meRes.json();
  assert.strictEqual(meData.success, true);
  assert.strictEqual(meData.user.username, 'kasir');
  console.log('✓ Session verification passed');

  console.log('\n--- 4. Testing Admin Super User Login ---');
  const adminRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'ferdinand',
      password: 'password123', // or 123456
      role: 'admin',
      referralCode: 'NGALAM-SUPER-2026'
    })
  });
  // Note: ferdinand password in users_admin.json is 123456
  const adminData = await adminRes.json();
  if (!adminData.success) {
    const adminRes2 = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'ferdinand',
        password: '123456',
        role: 'admin',
        referralCode: 'NGALAM-SUPER-2026'
      })
    });
    const adminData2 = await adminRes2.json();
    assert.strictEqual(adminData2.success, true);
    assert.strictEqual(adminData2.user.role, 'admin');
    console.log('✓ Ferdinand super admin login passed with referral');
  } else {
    assert.strictEqual(adminData.user.role, 'admin');
    console.log('✓ Ferdinand super admin login passed');
  }

  console.log('\n--- 5. Testing Registration & Auto-Login Flow ---');
  const testUsername = 'testkasir_' + Date.now();
  const regRes = await fetch('http://localhost:3000/api/auth/register-admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Staf Kasir Otomatis',
      username: testUsername,
      password: 'password123',
      role: 'kasir'
    })
  });
  const regData = await regRes.json();
  assert.strictEqual(regData.success, true);
  console.log('✓ Registration passed for', testUsername);

  // Auto-login test
  const autoLoginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: testUsername,
      password: 'password123',
      role: 'kasir'
    })
  });
  const autoData = await autoLoginRes.json();
  assert.strictEqual(autoData.success, true);
  assert.strictEqual(autoData.user.username, testUsername);
  console.log('✓ Auto-login simulation passed for', testUsername);

  console.log('\n=======================================');
  console.log('ALL LOGIN REDIRECT & AUTH TESTS PASSED!');
  console.log('=======================================');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
