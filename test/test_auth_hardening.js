const assert = require('assert');
const http = require('http');
const express = require('express');
const cors = require('cors');
const apiRoutes = require('../src/routes');
const userService = require('../services/userService');

const app = express();
app.use(cors());
app.use(express.json());
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
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function run() {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  try {
    const adminLogin = await request('POST', '/api/auth/login', {
      identifier: 'admin',
      password: 'fixprongalam2026',
      role: 'admin'
    });
    assert.strictEqual(adminLogin.status, 200);
    assert.strictEqual(adminLogin.body.user.username, 'admin');

    const oldAdmin = await request('POST', '/api/auth/login', {
      identifier: 'admin',
      password: 'admin123',
      role: 'admin'
    });
    assert.strictEqual(oldAdmin.status, 401);
    assert.strictEqual(oldAdmin.body.code, 'INVALID_ADMIN_PASSWORD');

    const otherAdmin = await request('POST', '/api/auth/login', {
      identifier: 'owner',
      password: 'password123',
      role: 'admin'
    });
    assert.strictEqual(otherAdmin.status, 403);
    assert.strictEqual(otherAdmin.body.code, 'ADMIN_ACCOUNT_ONLY');

    await userService.refreshUsersFromDb(true);
    assert.strictEqual(userService.getAdminUsers().length, 1);
    console.log('✅ Single admin account enforced');

    const registerAdmin = await request('POST', '/api/auth/register-admin', {});
    assert.strictEqual(registerAdmin.status, 404);
    const registerTech = await request('POST', '/api/technicians/register', {});
    assert.strictEqual(registerTech.status, 404);
    console.log('✅ Staff self-registration endpoints removed');

    const duplicateCustomerEmail = await request('POST', '/api/customer/register', {
      name: 'Duplicate Email',
      whatsapp: '089955550001',
      email: 'pelanggan.dummy@ngalamfixpro.com',
      password: 'rahasia123'
    });
    assert.strictEqual(duplicateCustomerEmail.status, 409);
    assert.strictEqual(duplicateCustomerEmail.body.code, 'CUSTOMER_EMAIL_TAKEN');

    const duplicateCustomerPhone = await request('POST', '/api/customer/register', {
      name: 'Duplicate Phone',
      whatsapp: '081234567890',
      email: 'duplicate.phone@example.com',
      password: 'rahasia123'
    });
    assert.strictEqual(duplicateCustomerPhone.status, 409);
    assert.strictEqual(duplicateCustomerPhone.body.code, 'CUSTOMER_PHONE_TAKEN');

    const mitraContactAsCustomer = await request('POST', '/api/customer/register', {
      name: 'Mitra Contact',
      whatsapp: '089955550002',
      email: 'mitra.dummy@ngalamfixpro.com',
      password: 'rahasia123'
    });
    assert.strictEqual(mitraContactAsCustomer.status, 409);
    assert.strictEqual(mitraContactAsCustomer.body.code, 'MITRA_ACCOUNT_EXISTS');

    const customerContactAsMitra = await request('POST', '/api/mitra/register', {
      name: 'Customer Contact Mitra',
      username: 'customer_contact_mitra',
      phone: '089955550003',
      email: 'pelanggan.dummy@ngalamfixpro.com',
      password: 'rahasia123'
    });
    assert.strictEqual(customerContactAsMitra.status, 409);
    assert.strictEqual(customerContactAsMitra.body.code, 'CUSTOMER_ACCOUNT_EXISTS');

    const duplicateMitraPhone = await request('POST', '/api/mitra/register', {
      name: 'Duplicate Mitra Phone',
      username: 'duplicate_mitra_phone',
      phone: '081234567899',
      email: 'duplicate.mitra.phone@example.com',
      password: 'rahasia123'
    });
    assert.strictEqual(duplicateMitraPhone.status, 409);
    assert.strictEqual(duplicateMitraPhone.body.code, 'PHONE_TAKEN');

    const duplicateMitraEmail = await request('POST', '/api/mitra/register', {
      name: 'Duplicate Mitra Email',
      username: 'duplicate_mitra_email',
      phone: '089955550004',
      email: 'mitra.dummy@ngalamfixpro.com',
      password: 'rahasia123'
    });
    assert.strictEqual(duplicateMitraEmail.status, 409);
    assert.strictEqual(duplicateMitraEmail.body.code, 'EMAIL_TAKEN');
    console.log('✅ Email and phone uniqueness enforced across account types');

    const mitraAsCustomer = await request('POST', '/api/customer/login', {
      identifier: 'mitra_demo',
      password: 'password123',
      rememberMe: true
    });
    assert.strictEqual(mitraAsCustomer.status, 200);
    assert.strictEqual(mitraAsCustomer.body.customer.accountType, 'mitra');
    assert(mitraAsCustomer.body.customer.mitraId);

    const wrongMitraPassword = await request('POST', '/api/customer/login', {
      identifier: 'mitra_demo',
      password: 'salah123'
    });
    assert.strictEqual(wrongMitraPassword.status, 401);
    assert.strictEqual(wrongMitraPassword.body.code, 'INVALID_MITRA_PASSWORD');

    const unknownCustomer = await request('POST', '/api/customer/login', {
      identifier: 'tidak_ada_999',
      password: 'rahasia123'
    });
    assert.strictEqual(unknownCustomer.status, 404);
    assert.strictEqual(unknownCustomer.body.code, 'ACCOUNT_NOT_FOUND');
    console.log('✅ Mitra can log in as customer with clear auth errors');

    console.log('\n🎉 AUTH HARDENING TESTS PASSED');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

run().then(() => process.exit(0)).catch((err) => {
  console.error('❌ Auth hardening test failed:', err.message);
  process.exit(1);
});
