require('dotenv').config();
const assert = require('assert');
const http = require('http');
const express = require('express');
const apiRoutes = require('../src/routes');
const userService = require('../services/userService');
const customerService = require('../services/customerService');
const db = require('../services/db');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', apiRoutes);
const server = http.createServer(app);

const stamp = Date.now();
const email = `oauth.flow.${stamp}@example.com`;
const googleSub = `oauth-sub-${stamp}`;
const phone = `0899${String(stamp).slice(-8)}`;
const realFetch = global.fetch;

global.fetch = async (url, opts) => {
  if (String(url).includes('oauth2.googleapis.com/token')) {
    return new Response(JSON.stringify({ access_token: 'mock-access-token' }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  }
  if (String(url).includes('googleapis.com/oauth2/v3/userinfo')) {
    return new Response(JSON.stringify({
      sub: googleSub,
      email,
      name: 'OAuth Flow Test',
      picture: ''
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  }
  return realFetch(url, opts);
};

function request(method, path, headers = {}, payload = null) {
  const body = payload ? JSON.stringify(payload) : '';
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: server.address().port,
      path,
      method,
      headers: {
        ...headers,
        ...(body ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) } : {})
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function getCookie(headers, name) {
  return [].concat(headers['set-cookie'] || [])
    .map((cookie) => String(cookie).split(';')[0])
    .find((cookie) => cookie.startsWith(`${name}=`)) || '';
}

async function startOauth(path) {
  const res = await request('GET', path);
  assert.strictEqual(res.status, 302, `${path} should redirect to Google`);
  const location = new URL(res.headers.location);
  assert.strictEqual(location.hostname, 'accounts.google.com');
  return {
    state: location.searchParams.get('state'),
    cookie: getCookie(res.headers, path.includes('/mitra/') ? 'ngalam_mitra_oauth_state' : 'ngalam_oauth_state')
  };
}

async function finishOauth(path, state, cookie) {
  return request('GET', `${path}/callback?code=mock-code&state=${state}`, { cookie });
}

async function run() {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  let customerId = '';
  let mitraId = '';

  try {
    await customerService.refreshCustomersFromDb();
    const seed = await customerService.upsertGoogleCustomer({
      googleId: `seed-${stamp}`,
      email,
      name: 'Existing Customer'
    });
    customerId = seed.id;

    const mitraStart = await startOauth('/api/mitra/auth/google');
    const mitraCallback = await finishOauth('/api/mitra/auth/google', mitraStart.state, mitraStart.cookie);
    assert.strictEqual(mitraCallback.status, 302);
    assert(mitraCallback.headers.location.includes('/mitra?auth=google'));
    assert(mitraCallback.headers.location.includes('needsPhone=1'), 'mitra Google signup must request phone');
    const mitraTokenCookie = getCookie(mitraCallback.headers, 'ngalam_mitra_token');
    assert(mitraTokenCookie, 'mitra Google callback must set token cookie');

    const mitraSession = await request('GET', '/api/mitra/auth/session', { cookie: mitraTokenCookie });
    assert.strictEqual(mitraSession.status, 200);
    const mitraData = JSON.parse(mitraSession.body);
    assert.strictEqual(mitraData.success, true);
    assert.strictEqual(mitraData.driver.email, email);
    assert.strictEqual(mitraData.driver.needsPhone, true);
    mitraId = mitraData.driver.id;
    console.log('✅ Google mitra signup works even when the same email is already a customer');

    const complete = await request('POST', '/api/mitra/auth/complete-profile', { cookie: mitraTokenCookie }, { phone });
    assert.strictEqual(complete.status, 200);
    const completeData = JSON.parse(complete.body);
    assert.strictEqual(completeData.success, true);
    assert.strictEqual(completeData.driver.phone, phone);
    assert.strictEqual(completeData.driver.needsPhone, false);
    console.log('✅ Mitra Google phone completion saves WhatsApp and clears needsPhone');

    const customerStart = await startOauth('/api/customer/auth/google');
    const customerCallback = await finishOauth('/api/customer/auth/google', customerStart.state, customerStart.cookie);
    assert.strictEqual(customerCallback.status, 302);
    assert(customerCallback.headers.location.includes('/login?auth=google'));
    const customerTokenCookie = getCookie(customerCallback.headers, 'ngalam_customer_token');
    assert(customerTokenCookie, 'customer Google callback must set token cookie');

    const customerSession = await request('GET', '/api/customer/me', { cookie: customerTokenCookie });
    assert.strictEqual(customerSession.status, 200);
    const customerData = JSON.parse(customerSession.body);
    assert.strictEqual(customerData.success, true);
    assert.strictEqual(customerData.customer.accountType, 'mitra');
    assert.strictEqual(customerData.customer.mitraId, mitraId);
    assert.strictEqual(customerData.customer.needsPhone, false);
    console.log('✅ Google customer login reuses the mitra identity instead of creating a duplicate customer');

    console.log('\n🎉 GOOGLE OAUTH FLOW TESTS PASSED');
  } finally {
    global.fetch = realFetch;
    await new Promise((resolve) => server.close(resolve));
    try {
      await userService.refreshUsersFromDb(true);
      const users = userService.getMitraUsers();
      const targetIds = users
        .filter((user) => String(user.email || '').toLowerCase() === email.toLowerCase())
        .map((user) => user.id);
      if (targetIds.length) {
        await userService.saveMitraUsers(users.filter((user) => !targetIds.includes(user.id)));
      }
      if (mitraId && !targetIds.includes(mitraId)) targetIds.push(mitraId);
      if (targetIds.length && db.isDbConnected()) {
        await db.query('DELETE FROM users WHERE id = ANY($1::text[])', [targetIds]);
      }
    } catch (err) {
      console.warn('[Google OAuth Test] Mitra cleanup warning:', err.message);
    }
    try {
      await customerService.refreshCustomersFromDb();
      const customers = customerService.getAllCustomers();
      const targetIds = customers
        .filter((customer) => String(customer.email || '').toLowerCase() === email.toLowerCase())
        .map((customer) => customer.id);
      if (targetIds.length) {
        customerService.saveCustomers(customers.filter((customer) => !targetIds.includes(customer.id)));
      }
      if (customerId && !targetIds.includes(customerId)) targetIds.push(customerId);
      if (targetIds.length && db.isDbConnected()) {
        await db.query('DELETE FROM customers WHERE id = ANY($1::text[])', [targetIds]);
      }
    } catch (err) {
      console.warn('[Google OAuth Test] Customer cleanup warning:', err.message);
    }
  }
}

run().then(() => process.exit(0)).catch((err) => {
  console.error('❌ Google OAuth flow test failed:', err.message);
  process.exit(1);
});
