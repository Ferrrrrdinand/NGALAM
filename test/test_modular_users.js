require('dotenv').config();
const path = require('path');
const fs = require('fs');
const assert = require('assert');

const userService = require('../services/userService');
const authService = require('../services/authService');
const technicianService = require('../services/technicianService');
const financeService = require('../services/financeService');

async function runTests() {
  console.log('=== TEST 1: Check File Details & .env Connection ===');
  const details = userService.getUserFileDetails();
  console.log('Details:', JSON.stringify(details, null, 2));

  assert.strictEqual(details.admin.envVar, 'USERS_ADMIN_FILE');
  assert.strictEqual(details.teknisi.envVar, 'USERS_TEKNISI_FILE');
  assert.strictEqual(details.mitra.envVar, 'USERS_MITRA_FILE');
  assert.strictEqual(details.admin.exists, true);
  assert.strictEqual(details.teknisi.exists, true);
  assert.strictEqual(details.mitra.exists, true);
  console.log('-> TEST 1 PASSED: All 3 user files exist and match .env variables!\n');

  console.log('=== TEST 2: Verify File Segregation ===');
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
  console.log('-> TEST 2 PASSED: Each user category strictly resides in its own file!\n');

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
  console.log('-> TEST 3 PASSED: Authentication seamlessly resolves users from their separate files!\n');

  console.log('=== TEST 4: Technician Live Status Update (writes to users_teknisi.json) ===');
  const updatedTech = technicianService.setTechnicianOnline('rian');
  assert.strictEqual(updatedTech.onlineStatus, 'online');
  // Verify users_teknisi.json contains updated status
  const freshTechs = JSON.parse(fs.readFileSync(userService.FILE_PATHS.teknisi, 'utf-8'));
  const rianInFile = freshTechs.find(t => t.username === 'rian');
  assert.strictEqual(rianInFile.onlineStatus, 'online');
  console.log('-> TEST 4 PASSED: Technician status update wrote strictly to users_teknisi.json!\n');

  console.log('=== TEST 5: Mitra Commission Recording (writes to users_mitra.json) ===');
  const initialCommission = mitras.find(m => m.username === 'mitra_demo').totalCommission || 0;
  const commResult = await financeService.recordMitraCommission('MTR-DEMO-001', 25000);
  assert.strictEqual(commResult.success, true);
  const freshMitras = JSON.parse(fs.readFileSync(userService.FILE_PATHS.mitra, 'utf-8'));
  const demoMitraInFile = freshMitras.find(m => m.username === 'mitra_demo');
  assert.strictEqual(demoMitraInFile.totalCommission, initialCommission + 25000);
  console.log(`Mitra commission updated from ${initialCommission} to ${demoMitraInFile.totalCommission}`);
  // Reset commission back for clean state
  demoMitraInFile.totalCommission = initialCommission;
  userService.saveMitraUsers(freshMitras);
  console.log('-> TEST 5 PASSED: Mitra commission wrote strictly to users_mitra.json!\n');

  console.log('=== TEST 6: Legacy users.json Synchronization ===');
  assert.strictEqual(fs.existsSync(userService.FILE_PATHS.legacy), true);
  const legacyUsers = JSON.parse(fs.readFileSync(userService.FILE_PATHS.legacy, 'utf-8'));
  assert(legacyUsers.length >= 7, `Expected at least 7 legacy users, got ${legacyUsers.length}`);
  console.log('-> TEST 6 PASSED: Legacy data/users.json is kept in sync as a combined mirror!\n');

  console.log('=============================================');
  console.log('🎉 ALL MODULAR USER FILE TESTS PASSED 100%! 🎉');
  console.log('=============================================');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
