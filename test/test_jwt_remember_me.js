const assert = require('assert');
const jwt = require('jsonwebtoken');

const API_BASE = 'http://localhost:3000';

async function runJwtTests() {
  console.log('=== TEST 1: Staff Login with Remember Me = TRUE ===');
  const res1 = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'admin',
      password: 'admin123',
      role: 'admin',
      rememberMe: true
    })
  });

  assert.strictEqual(res1.status, 200, 'Status should be 200');
  const data1 = await res1.json();
  assert.strictEqual(data1.success, true, 'Login should succeed');
  assert(data1.user.token, 'Token must exist');
  
  const token1 = data1.user.token;
  const parts1 = token1.split('.');
  assert.strictEqual(parts1.length, 3, 'Token should be valid 3-part JWT');

  const decoded1 = jwt.decode(token1);
  assert(decoded1, 'JWT should be decodable');
  assert.strictEqual(decoded1.username, 'admin');
  assert.strictEqual(decoded1.rememberMe, true);
  
  const durationDays1 = Math.round((decoded1.exp - decoded1.iat) / 86400);
  assert.strictEqual(durationDays1, 30, 'Remember Me = true expiration should be 30 days');

  const cookieHeader1 = res1.headers.get('set-cookie') || '';
  assert(cookieHeader1.includes('Max-Age=2592000'), 'Set-Cookie should have Max-Age=2592000 (30 days)');
  console.log('✅ Staff Login (Remember Me: TRUE) passed: 30-day JWT generated.');

  console.log('\n=== TEST 2: Verify Session (/api/auth/me) with Bearer JWT ===');
  const meRes = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${token1}` }
  });
  assert.strictEqual(meRes.status, 200);
  const meData = await meRes.json();
  assert.strictEqual(meData.success, true);
  assert.strictEqual(meData.user.username, 'admin');
  assert.strictEqual(meData.user.token, token1);
  console.log('✅ /api/auth/me passed with Bearer JWT.');

  console.log('\n=== TEST 3: Staff Login with Remember Me = FALSE ===');
  const res2 = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'admin',
      password: 'admin123',
      role: 'admin',
      rememberMe: false
    })
  });

  assert.strictEqual(res2.status, 200);
  const data2 = await res2.json();
  assert.strictEqual(data2.success, true);
  const token2 = data2.user.token;
  const decoded2 = jwt.decode(token2);
  assert.strictEqual(decoded2.rememberMe, false);

  const durationDays2 = Math.round((decoded2.exp - decoded2.iat) / 86400);
  assert.strictEqual(durationDays2, 1, 'Standard expiration should be 1 day (24h)');

  const cookieHeader2 = res2.headers.get('set-cookie') || '';
  assert(cookieHeader2.includes('Max-Age=86400'), 'Set-Cookie should have Max-Age=86400 (1 day)');
  console.log('✅ Staff Login (Remember Me: FALSE) passed: 1-day JWT generated.');

  console.log('\n=== TEST 4: Customer Login with JWT & Remember Me ===');
  const custRes = await fetch(`${API_BASE}/api/customer/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: '081234567890',
      pin: '123456',
      rememberMe: true
    })
  });

  if (custRes.status === 200) {
    const custData = await custRes.json();
    assert.strictEqual(custData.success, true);
    assert(custData.customer.token);
    const decodedCust = jwt.decode(custData.customer.token);
    assert(decodedCust);
    assert.strictEqual(decodedCust.role, 'customer');
    assert.strictEqual(decodedCust.rememberMe, true);
    const custDays = Math.round((decodedCust.exp - decodedCust.iat) / 86400);
    assert.strictEqual(custDays, 30);
    console.log('✅ Customer Login passed: 30-day JWT generated.');
  } else {
    console.log('ℹ️ Customer not registered yet, testing registration with Remember Me...');
    const regRes = await fetch(`${API_BASE}/api/customer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Pelanggan JWT',
        phone: '081234567890',
        email: 'testjwt@ngalamfixpro.com',
        district: 'Klojen',
        pin: '123456',
        rememberMe: true
      })
    });
    const regData = await regRes.json();
    assert(regData.customer.token);
    const decodedReg = jwt.decode(regData.customer.token);
    assert.strictEqual(decodedReg.role, 'customer');
    assert.strictEqual(decodedReg.rememberMe, true);
    console.log('✅ Customer Register with JWT & Remember Me passed.');
  }

  console.log('\n=== TEST 5: Tampered / Invalid JWT Token ===');
  const invalidRes = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { 'Authorization': 'Bearer invalid.tampered.token' }
  });
  assert.strictEqual(invalidRes.status, 401, 'Tampered token must return 401');
  console.log('✅ Tampered token properly rejected with 401.');

  console.log('\n=== TEST 6: Logout ===');
  const logoutRes = await fetch(`${API_BASE}/api/auth/logout`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}` }
  });
  assert.strictEqual(logoutRes.status, 200);
  const logoutCookie = logoutRes.headers.get('set-cookie') || '';
  assert(logoutCookie.includes('Max-Age=0'), 'Logout should invalidate cookie (Max-Age=0)');
  console.log('✅ Logout verified: cookie cleared with Max-Age=0.');

  console.log('\n=============================================');
  console.log('🎉 ALL JWT & REMEMBER ME TESTS PASSED!');
  console.log('=============================================');
}

runJwtTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
