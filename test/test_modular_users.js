require('dotenv').config();
const path = require('path');
const fs = require('fs');
const assert = require('assert');

const userService = require('../services/userService');
const authService = require('../services/authService');
const technicianService = require('../services/technicianService');
const financeService = require('../services/financeService');

async function runTests() {
  console.log('=== TEST 1: Check PostgreSQL users table connection ===');
  await userService.refreshUsersFromDb(true);
  const details = userService.getUserTableDetails();
  console.log('Details:', JSON.stringify(details, null, 2));

  assert.strictEqual(details.admin.table, 'users');
  assert.strictEqual(details.teknisi.table, 'users');
  assert.strictEqual(details.mitra.table, 'users');
  assert.strictEqual(details.admin.connected, true);
  console.log('-> TEST 1 PASSED: Admin, kasir, teknisi, and mitra are served from the users table!\n');

  console.log('=== TEST 2: Verify Role Buckets ===');
  const admins = userService.getAdminUsers();
  const techs = userService.getTeknisiUsers();
  const mitras = userService.getMitraUsers();

  console.log(`Admins count: ${admins.length}`);
  console.log(`Teknisi count: ${techs.length}`);
  console.log(`Mitra count: ${mitras.length}`);

  // All admins must have admin/kasir/owner role
  admins.forEach(a => {
    assert(['admin', 'kasir', 'owner', 'superadmin'].includes(a.role), `Expected admin role, got ${a.role}`);
  });
  // All technicians must have teknisi role
  techs.forEach(t => {
    assert.strictEqual(t.role, 'teknisi', `Expected teknisi role, got ${t.role}`);
  });
  // All mitras must have ojol/mitra role
  mitras.forEach(m => {
    assert(['ojol', 'mitra', 'kurir'].includes(m.role), `Expected mitra role, got ${m.role}`);
  });
  console.log('-> TEST 2 PASSED: Each user category is filtered by role from the users table!\n');

  console.log('=== TEST 3: Login Across All 3 Roles ===');
  // 1. Admin Login
  const adminLogin = await authService.loginUser({
    identifier: 'admin',
    password: 'password123',
    role: 'admin',
    referralCode: 'NGALAM-SUPER-2026'
  });
  assert.strictEqual(adminLogin.success, true);
  console.log('Admin login OK:', adminLogin.user.name);

  // 2. Kasir Login
  const kasirLogin = await authService.loginUser({
    identifier: 'kasir',
    password: 'password123',
    role: 'kasir'
  });
  assert.strictEqual(kasirLogin.success, true);
  console.log('Kasir login OK:', kasirLogin.user.name);

  // 3. Teknisi Login
  const techLogin = await authService.loginUser({
    identifier: 'rian',
    password: 'password123',
    role: 'teknisi'
  });
  assert.strictEqual(techLogin.success, true);
  console.log('Teknisi login OK:', techLogin.user.name);

  // 4. Mitra Login
  const mitraLogin = await authService.loginUser({
    identifier: 'mitra_demo',
    password: 'password123',
    role: 'ojol'
  });
  assert.strictEqual(mitraLogin.success, true);
  console.log('Mitra login OK:', mitraLogin.user.name);
  console.log('-> TEST 3 PASSED: Authentication resolves users from the PostgreSQL users table!\n');

  console.log('=== TEST 4: Technician Live Status Update (writes to users table) ===');
  const updatedTech = await technicianService.setTechnicianOnline('rian');
  assert.strictEqual(updatedTech.onlineStatus, 'online');
  await userService.refreshUsersFromDb(true);
  const rianInDb = userService.getTeknisiUsers().find(t => t.username === 'rian');
  assert.strictEqual(rianInDb.onlineStatus, 'online');
  await technicianService.setTechnicianOffline('rian');
  console.log('-> TEST 4 PASSED: Technician status update persisted to the users table!\n');

  console.log('=== TEST 5: Mitra Commission Recording (writes to users table) ===');
  await userService.refreshUsersFromDb(true);
  const initialCommission = userService.getMitraUsers().find(m => m.username === 'mitra_demo').totalCommission || 0;
  const commResult = await financeService.recordMitraCommission('MTR-DEMO-001', 25000);
  assert.strictEqual(commResult.success, true);
  await userService.refreshUsersFromDb(true);
  const freshMitras = userService.getMitraUsers();
  const demoMitraInDb = freshMitras.find(m => m.username === 'mitra_demo');
  assert.strictEqual(demoMitraInDb.totalCommission, initialCommission + 25000);
  console.log(`Mitra commission updated from ${initialCommission} to ${demoMitraInDb.totalCommission}`);
  demoMitraInDb.totalCommission = initialCommission;
  demoMitraInDb.balance = Math.max(0, (demoMitraInDb.balance || 0) - 25000);
  await userService.saveMitraUsers(freshMitras);
  console.log('-> TEST 5 PASSED: Mitra commission persisted to the users table!\n');

  console.log('=== TEST 6: Combined User List ===');
  const allUsers = userService.getAllUsers();
  assert(allUsers.length >= 7, `Expected at least 7 users, got ${allUsers.length}`);
  console.log(`-> TEST 6 PASSED: ${allUsers.length} users are available from PostgreSQL.\n`);

  console.log('=============================================');
  console.log('🎉 ALL MODULAR USER DATABASE TESTS PASSED 100%! 🎉');
  console.log('=============================================');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
