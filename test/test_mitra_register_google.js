const assert = require('assert');
const http = require('http');
const express = require('express');
const cors = require('cors');
const apiRoutes = require('../src/routes');
const userService = require('../services/userService');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', apiRoutes);

const server = http.createServer(app);

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: '127.0.0.1',
      port: server.address().port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
        ...headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = data;
        try { parsed = JSON.parse(data); } catch (_) {}
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function run() {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  console.log(`Test server on ${server.address().port}`);
  const phone = '08999000' + Math.floor(1000 + Math.random() * 9000);
  const username = `test_mitra_${Date.now()}`;
  const created = [];

  try {
    const reg = await request('POST', '/api/mitra/register', {
      name: 'Mitra Test Registrasi',
      username,
      password: 'rahasia123',
      phone,
      category: 'Mitra Kurir Ojek Online (Motor)'
    });

    assert.strictEqual(reg.status, 201, `register status ${reg.status}`);
    assert.strictEqual(reg.body.success, true);
    assert(reg.body.driver, 'register must return driver');
    assert(reg.body.driver.referralCode, 'register must return referralCode');
    assert.strictEqual(reg.body.driver.password, undefined, 'password must not leak');
    assert(reg.body.token, 'register must issue JWT');
    assert(String(reg.headers['set-cookie']).includes('ngalam_mitra_token='), 'register must set auth cookie');
    created.push(reg.body.driver.id);
    console.log('✅ Mitra register returns driver + JWT + cookie');

    const dup = await request('POST', '/api/mitra/register', {
      name: 'Mitra Test Registrasi',
      username,
      password: 'rahasia123',
      phone,
      category: 'Mitra Kurir Ojek Online (Motor)'
    });
    assert.strictEqual(dup.status, 409, `duplicate register status ${dup.status}`);
    assert.strictEqual(dup.body.code, 'PHONE_TAKEN');
    console.log('✅ Duplicate mitra register returns 409 without logging in');

    const login = await request('POST', '/api/mitra/login', {
      identifier: username,
      password: 'rahasia123'
    });
    assert.strictEqual(login.status, 200);
    assert.strictEqual(login.body.success, true);
    assert.strictEqual(login.body.driver.referralCode, reg.body.driver.referralCode);
    console.log('✅ New mitra can login with registered credentials');

    const oldAppUrl = process.env.APP_URL;
    const oldClientId = process.env.GOOGLE_CLIENT_ID;
    const oldCustomerRedirect = process.env.GOOGLE_REDIRECT_URI;
    const oldMitraRedirect = process.env.GOOGLE_REDIRECT_URI_MITRA;
    process.env.APP_URL = 'https://stale.invalid';
    delete process.env.GOOGLE_REDIRECT_URI;
    delete process.env.GOOGLE_REDIRECT_URI_MITRA;
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';

    const hostHeaders = {
      host: 'ngalamfixpro.vercel.app',
      'x-forwarded-proto': 'https',
      'x-forwarded-host': 'ngalamfixpro.vercel.app'
    };
    const mitraOauth = await request('GET', '/api/mitra/auth/google', null, hostHeaders);
    assert.strictEqual(mitraOauth.status, 302);
    const mitraLocation = mitraOauth.headers.location || '';
    assert(mitraLocation.startsWith('https://accounts.google.com/'));
    assert(decodeURIComponent(mitraLocation).includes('https://ngalamfixpro.vercel.app/api/mitra/auth/google/callback'));

    const customerOauth = await request('GET', '/api/customer/auth/google', null, hostHeaders);
    assert.strictEqual(customerOauth.status, 302);
    const customerLocation = customerOauth.headers.location || '';
    assert(customerLocation.startsWith('https://accounts.google.com/'));
    assert(decodeURIComponent(customerLocation).includes('https://ngalamfixpro.vercel.app/api/customer/auth/google/callback'));
    console.log('✅ Google OAuth callbacks follow the incoming host, ignoring stale APP_URL');

    if (oldAppUrl === undefined) delete process.env.APP_URL; else process.env.APP_URL = oldAppUrl;
    if (oldClientId === undefined) delete process.env.GOOGLE_CLIENT_ID; else process.env.GOOGLE_CLIENT_ID = oldClientId;
    if (oldCustomerRedirect === undefined) delete process.env.GOOGLE_REDIRECT_URI; else process.env.GOOGLE_REDIRECT_URI = oldCustomerRedirect;
    if (oldMitraRedirect === undefined) delete process.env.GOOGLE_REDIRECT_URI_MITRA; else process.env.GOOGLE_REDIRECT_URI_MITRA = oldMitraRedirect;

    console.log('\n🎉 MITRA REGISTER & GOOGLE OAUTH TESTS PASSED');
  } finally {
    const users = userService.getMitraUsers();
    const remaining = users.filter(u => !created.includes(u.id));
    if (remaining.length !== users.length) {
      await userService.saveMitraUsers(remaining);
    }
    await new Promise(r => server.close(r));
  }
}

run().then(() => process.exit(0)).catch((err) => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
