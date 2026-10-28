/**
 * NGALAM FIX PRO - Technician Live Tracking & Presence Service
 * Manages individual technician accounts, real-time online/offline presence,
 * work status ("standby", "handled phone", "offline"), and admin audit logging.
 */

const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');
const LOGS_FILE = path.join(__dirname, '..', 'data', 'technician_logs.json');

/**
 * Load all users from disk
 */
function readUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('[TechnicianService] Error reading users.json:', err.message);
  }
  return [];
}

/**
 * Write users to disk safely
 */
function writeUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[TechnicianService] Error writing users.json:', err.message);
    return false;
  }
}

/**
 * Load technician activity logs
 */
function readLogs() {
  try {
    if (fs.existsSync(LOGS_FILE)) {
      const raw = fs.readFileSync(LOGS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('[TechnicianService] Error reading technician_logs.json:', err.message);
  }
  return [];
}

/**
 * Write technician activity logs
 */
function writeLogs(logs) {
  try {
    // Keep last 150 log entries
    const trimmed = logs.slice(0, 150);
    fs.writeFileSync(LOGS_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[TechnicianService] Error writing technician_logs.json:', err.message);
    return false;
  }
}

/**
 * Add an audit log entry visible to Admin & Manager
 */
function addAuditLog({ technicianName, username, action, details, statusBadge }) {
  const logs = readLogs();
  const entry = {
    id: 'LOG-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
    displayTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    displayDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
    technicianName: technicianName || username,
    username: username,
    action: action, // e.g. "Login", "Logout", "Mulai Pengerjaan", "Servis Selesai", "Status Standby"
    details: details || '',
    statusBadge: statusBadge || 'standby' // "online", "offline", "handled", "standby"
  };
  logs.unshift(entry);
  writeLogs(logs);
  return entry;
}

/**
 * Initialize default logs if file doesn't exist
 */
if (!fs.existsSync(LOGS_FILE)) {
  writeLogs([
    {
      id: 'LOG-INIT-01',
      timestamp: new Date().toISOString(),
      displayTime: '08:30:00',
      displayDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      technicianName: 'Mas Rian (Spesialis iPhone & Layar)',
      username: 'rian',
      action: 'Sistem Diaktifkan',
      details: 'Sistem monitoring meja lab teknisi aktif dan siap menerima data sesi.',
      statusBadge: 'standby'
    }
  ]);
}

const WORKSHOP_REGISTRATION_CODE = '082335493176-082335493176';

/**
 * Get all individual technicians (excludes alias unless requested)
 */
function getAllTechnicians(includeAlias = false) {
  const users = readUsers();
  return users
    .filter((u) => u.role === 'teknisi' && (includeAlias || u.id !== 'USR-TECH-ALIAS'))
    .map((u) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      avatar: u.avatar || '🛠️',
      phone: u.phone || '',
      email: u.email || '',
      desk: u.desk || 'Meja Lab Workshop',
      specialty: u.specialty || 'Spesialis Servis Smartphone',
      onlineStatus: u.onlineStatus || 'offline', // "online" | "offline"
      workStatus: u.workStatus || 'offline',     // "standby" | "handled phone" | "offline"
      currentJob: u.currentJob || null,         // { orderId, phoneType, customerName, step, startedAt }
      handledToday: typeof u.handledToday === 'number' ? u.handledToday : 0,
      lastActive: u.lastActive || new Date().toISOString()
    }));
}

/**
 * Find a technician by username or id
 */
function findTechnician(identifier) {
  if (!identifier) return null;
  const clean = identifier.trim().toLowerCase();
  const users = readUsers();
  return users.find(
    (u) =>
      u.role === 'teknisi' &&
      (u.username.toLowerCase() === clean || u.id.toLowerCase() === clean || (u.name && u.name.toLowerCase().includes(clean)))
  );
}

/**
 * Set technician status to ONLINE & STANDBY when they login
 */
function setTechnicianOnline(identifier) {
  const users = readUsers();
  const clean = (identifier || '').trim().toLowerCase();
  let updatedTech = null;

  users.forEach((u) => {
    if (u.role === 'teknisi' && (u.username.toLowerCase() === clean || u.id.toLowerCase() === clean)) {
      u.onlineStatus = 'online';
      // If currentJob was deleted or completed, clear it
      if (u.currentJob && u.currentJob.orderId) {
        try {
          const ordersRaw = fs.readFileSync(path.join(__dirname, '..', 'data', 'orders.json'), 'utf-8');
          const ordersList = JSON.parse(ordersRaw);
          const activeOrder = ordersList.find(o => o.id === u.currentJob.orderId);
          if (!activeOrder || activeOrder.step === 5) {
            u.currentJob = null;
          }
        } catch (_) {}
      }
      u.workStatus = u.currentJob ? 'handled phone' : 'standby';
      u.lastActive = new Date().toISOString();
      updatedTech = u;
    }
  });

  if (updatedTech) {
    writeUsers(users);
    addAuditLog({
      technicianName: updatedTech.name,
      username: updatedTech.username,
      action: 'Login Berhasil',
      details: `${updatedTech.name} login ke sistem. Status berubah menjadi ONLINE (${updatedTech.workStatus.toUpperCase()}).`,
      statusBadge: 'online'
    });
  }

  return updatedTech;
}

/**
 * Set technician status to OFFLINE when they logout
 */
function setTechnicianOffline(identifier) {
  const users = readUsers();
  const clean = (identifier || '').trim().toLowerCase();
  let updatedTech = null;

  users.forEach((u) => {
    if (u.role === 'teknisi' && (u.username.toLowerCase() === clean || u.id.toLowerCase() === clean)) {
      u.onlineStatus = 'offline';
      u.workStatus = 'offline';
      u.lastActive = new Date().toISOString();
      updatedTech = u;
    }
  });

  if (updatedTech) {
    writeUsers(users);
    addAuditLog({
      technicianName: updatedTech.name,
      username: updatedTech.username,
      action: 'Logout / Keluar Akun',
      details: `${updatedTech.name} logout dari sistem. Status berubah menjadi OFFLINE.`,
      statusBadge: 'offline'
    });
  }

  return updatedTech;
}

/**
 * Set technician status to "handled phone" when they work on a smartphone
 */
function setTechnicianHandledPhone(identifier, jobDetails = {}) {
  const users = readUsers();
  const clean = (identifier || '').trim().toLowerCase();
  let updatedTech = null;

  users.forEach((u) => {
    if (
      u.role === 'teknisi' &&
      (u.username.toLowerCase() === clean ||
        u.id.toLowerCase() === clean ||
        (u.name && u.name.toLowerCase().includes(clean)))
    ) {
      u.onlineStatus = 'online'; // working means online
      u.workStatus = 'handled phone';
      u.currentJob = {
        orderId: jobDetails.orderId || 'NGF-TICKET',
        phoneType: jobDetails.phoneType || 'Smartphone',
        customerName: jobDetails.customerName || 'Pelanggan',
        step: jobDetails.step || 2,
        startedAt: new Date().toISOString()
      };
      u.lastActive = new Date().toISOString();
      updatedTech = u;
    }
  });

  // Also sync alias if needed
  if (clean === 'teknisi' || clean === 'rian') {
    users.forEach((u) => {
      if (u.username === 'rian' || u.username === 'teknisi') {
        u.onlineStatus = 'online';
        u.workStatus = 'handled phone';
        u.currentJob = {
          orderId: jobDetails.orderId || 'NGF-TICKET',
          phoneType: jobDetails.phoneType || 'Smartphone',
          customerName: jobDetails.customerName || 'Pelanggan',
          step: jobDetails.step || 2,
          startedAt: new Date().toISOString()
        };
        u.lastActive = new Date().toISOString();
      }
    });
  }

  if (updatedTech) {
    writeUsers(users);
    addAuditLog({
      technicianName: updatedTech.name,
      username: updatedTech.username,
      action: 'Mengerjakan HP (Handled Phone)',
      details: `Menangani unit: ${jobDetails.phoneType || 'Smartphone'} milik ${jobDetails.customerName || 'Pelanggan'} [Tiket: ${jobDetails.orderId || '-'}].`,
      statusBadge: 'handled'
    });
  }

  return updatedTech;
}

/**
 * Set technician status to "standby" when repair is finished (Step 5)
 */
function setTechnicianStandby(identifier, completedOrderInfo = null) {
  const users = readUsers();
  const clean = (identifier || '').trim().toLowerCase();
  let updatedTech = null;

  users.forEach((u) => {
    if (
      u.role === 'teknisi' &&
      (u.username.toLowerCase() === clean ||
        u.id.toLowerCase() === clean ||
        (u.name && u.name.toLowerCase().includes(clean)))
    ) {
      u.onlineStatus = 'online';
      u.workStatus = 'standby';
      u.currentJob = null;
      u.handledToday = (u.handledToday || 0) + 1;
      u.lastActive = new Date().toISOString();
      updatedTech = u;
    }
  });

  // Sync alias
  if (clean === 'teknisi' || clean === 'rian') {
    users.forEach((u) => {
      if (u.username === 'rian' || u.username === 'teknisi') {
        u.onlineStatus = 'online';
        u.workStatus = 'standby';
        u.currentJob = null;
        u.handledToday = (u.handledToday || 0) + 1;
        u.lastActive = new Date().toISOString();
      }
    });
  }

  if (updatedTech) {
    writeUsers(users);
    const orderText = completedOrderInfo ? ` Tiket: ${completedOrderInfo.orderId || completedOrderInfo.id || '-'}` : '';
    addAuditLog({
      technicianName: updatedTech.name,
      username: updatedTech.username,
      action: 'Servis Selesai -> Standby',
      details: `Servis unit selesai${orderText}. Status teknisi kembali ke STANDBY (Siap menerima unit baru). Total hari ini: ${updatedTech.handledToday} unit.`,
      statusBadge: 'standby'
    });
  }

  return updatedTech;
}

/**
 * Auto-route order status update to matching technician
 */
function handleOrderStepChange(order, newStep) {
  if (!order) return;
  const techStr = (order.technician || '').toLowerCase();
  let matchedTechUsername = order.assignedTechnicianUsername ? order.assignedTechnicianUsername.toLowerCase() : null;
  if (!matchedTechUsername && techStr.includes('ferdinand')) {
    matchedTechUsername = 'ferdinand';
  }
  if (!matchedTechUsername) {
    return; // No technician assigned to this order yet
  }

  const stepNum = parseInt(newStep, 10);
  if (stepNum >= 2 && stepNum <= 4) {
    // Under active repair -> handled phone
    setTechnicianHandledPhone(matchedTechUsername, {
      orderId: order.id,
      phoneType: order.phoneType,
      customerName: order.customerName,
      step: stepNum
    });
  } else if (stepNum >= 5) {
    // Finished -> standby
    setTechnicianStandby(matchedTechUsername, {
      orderId: order.id,
      phoneType: order.phoneType
    });
  }
}

/**
 * Create a new technician account (Self-Registration with code or Admin creation)
 */
async function createTechnician(payload = {}, { isAdmin = false } = {}) {
  const {
    registrationCode = '',
    username = '',
    password = '',
    name = '',
    phone = '',
    email = '',
    desk = '',
    specialty = '',
    avatar = '🔬'
  } = payload;

  // 1. Otorisasi Kode Registrasi jika bukan Admin
  if (!isAdmin) {
    const cleanCode = (registrationCode || '').trim();
    if (cleanCode !== WORKSHOP_REGISTRATION_CODE) {
      throw new Error('Kode pendaftaran workshop tidak valid! Akses pendaftaran teknisi lab dilindungi kode otorisasi workshop resmi (082335493176-082335493176).');
    }
  }

  // 2. Validasi input dasar
  const cleanUsername = (username || '').trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
  const cleanPassword = (password || '').trim();
  const cleanName = (name || '').trim();

  if (!cleanUsername || cleanUsername.length < 3) {
    throw new Error('Username teknisi minimal 3 karakter (hanya huruf kecil, angka, underscore/titik).');
  }
  if (!cleanPassword || cleanPassword.length < 4) {
    throw new Error('Kata sandi teknisi minimal 4 karakter.');
  }
  if (!cleanName) {
    throw new Error('Nama lengkap teknisi wajib diisi.');
  }

  const users = readUsers();

  // 3. Cek keunikan username
  const exists = users.find(u => (u.username || '').toLowerCase() === cleanUsername);
  if (exists) {
    throw new Error(`Username "${cleanUsername}" sudah digunakan. Silakan pilih username yang berbeda.`);
  }

  // 4. Generate ID unik
  const techCount = users.filter(u => u.role === 'teknisi').length + 1;
  const newId = `USR-TECH-${String(techCount).padStart(2, '0')}-${Date.now().toString().slice(-4)}`;

  const newTech = {
    id: newId,
    username: cleanUsername,
    email: email ? email.trim() : `${cleanUsername}@ngalamfixpro.com`,
    password: cleanPassword,
    name: cleanName,
    role: 'teknisi',
    avatar: avatar || '🔬',
    phone: phone ? phone.trim() : '081330304324',
    desk: desk ? desk.trim() : 'Meja Lab Workshop - Teknisi Baru',
    specialty: specialty ? specialty.trim() : 'Spesialis Servis Smartphone & Hardware Lab',
    onlineStatus: 'offline',
    workStatus: 'standby',
    currentJob: null,
    handledToday: 0,
    lastActive: new Date().toISOString()
  };

  users.push(newTech);
  writeUsers(users);

  // 5. Catat ke Audit Log
  const creatorLabel = isAdmin ? 'Akses Admin Panel' : 'Registrasi Mandiri (Kode Workshop)';
  addAuditLog({
    technicianName: newTech.name,
    username: newTech.username,
    action: isAdmin ? 'Admin Tambah Teknisi' : 'Registrasi Teknisi Baru',
    details: `Akun teknisi baru "${newTech.name}" (@${newTech.username}) berhasil ditambahkan via ${creatorLabel}.`,
    statusBadge: 'standby'
  });

  // 6. Sinkronisasi otomatis ke Google Spreadsheet (Sheet: AkunTeknisi)
  try {
    const { syncTechniciansToGoogleSheets } = require('./financeService');
    syncTechniciansToGoogleSheets().catch(err => {
      console.warn('[TechnicianService] Background Google Sheets sync warning:', err.message);
    });
  } catch (syncErr) {
    console.warn('[TechnicianService] Could not invoke syncTechniciansToGoogleSheets:', syncErr.message);
  }

  return {
    id: newTech.id,
    username: newTech.username,
    name: newTech.name,
    role: newTech.role,
    avatar: newTech.avatar,
    phone: newTech.phone,
    email: newTech.email,
    desk: newTech.desk,
    specialty: newTech.specialty,
    onlineStatus: newTech.onlineStatus,
    workStatus: newTech.workStatus,
    handledToday: newTech.handledToday
  };
}

/**
 * Update technician details (by Admin)
 */
async function updateTechnician(idOrUsername, updates = {}) {
  if (!idOrUsername) {
    throw new Error('ID atau Username teknisi wajib diisi.');
  }

  const cleanId = String(idOrUsername).trim().toLowerCase();
  const users = readUsers();
  const techIndex = users.findIndex(
    u => u.role === 'teknisi' && (u.id.toLowerCase() === cleanId || u.username.toLowerCase() === cleanId)
  );

  if (techIndex === -1) {
    throw new Error(`Data teknisi dengan ID/Username "${idOrUsername}" tidak ditemukan.`);
  }

  const tech = users[techIndex];

  if (updates.name && updates.name.trim()) {
    tech.name = updates.name.trim();
  }
  if (updates.phone !== undefined) {
    tech.phone = updates.phone.trim();
  }
  if (updates.email !== undefined) {
    tech.email = updates.email.trim();
  }
  if (updates.desk !== undefined) {
    tech.desk = updates.desk.trim();
  }
  if (updates.specialty !== undefined) {
    tech.specialty = updates.specialty.trim();
  }
  if (updates.avatar) {
    tech.avatar = updates.avatar;
  }
  if (updates.password && updates.password.trim().length > 0) {
    tech.password = updates.password.trim();
  }
  if (updates.onlineStatus && (updates.onlineStatus === 'online' || updates.onlineStatus === 'offline')) {
    tech.onlineStatus = updates.onlineStatus;
  }
  if (updates.workStatus) {
    tech.workStatus = updates.workStatus;
  }
  if (typeof updates.handledToday === 'number') {
    tech.handledToday = updates.handledToday;
  }

  users[techIndex] = tech;
  writeUsers(users);

  // Catat Audit Log
  addAuditLog({
    technicianName: tech.name,
    username: tech.username,
    action: 'Admin Edit Data Teknisi',
    details: `Profil meja lab & akun teknisi "${tech.name}" (@${tech.username}) diperbarui oleh Admin.`,
    statusBadge: tech.onlineStatus || 'standby'
  });

  // Sinkronisasi otomatis ke Google Spreadsheet (Sheet: AkunTeknisi)
  try {
    const { syncTechniciansToGoogleSheets } = require('./financeService');
    syncTechniciansToGoogleSheets().catch(err => {
      console.warn('[TechnicianService] Background Google Sheets sync warning:', err.message);
    });
  } catch (syncErr) {
    console.warn('[TechnicianService] Could not invoke syncTechniciansToGoogleSheets:', syncErr.message);
  }

  return {
    id: tech.id,
    username: tech.username,
    name: tech.name,
    role: tech.role,
    avatar: tech.avatar,
    phone: tech.phone,
    email: tech.email,
    desk: tech.desk,
    specialty: tech.specialty,
    onlineStatus: tech.onlineStatus,
    workStatus: tech.workStatus,
    handledToday: tech.handledToday
  };
}

/**
 * Delete technician account (by Admin)
 */
async function deleteTechnician(idOrUsername) {
  if (!idOrUsername) {
    throw new Error('ID atau Username teknisi wajib diisi.');
  }

  const cleanId = String(idOrUsername).trim().toLowerCase();
  const users = readUsers();
  const target = users.find(
    u => u.role === 'teknisi' && (u.id.toLowerCase() === cleanId || u.username.toLowerCase() === cleanId)
  );

  if (!target) {
    throw new Error(`Data teknisi dengan ID/Username "${idOrUsername}" tidak ditemukan.`);
  }

  const remainingTechs = users.filter(u => u.role === 'teknisi' && u !== target);
  if (remainingTechs.length === 0) {
    throw new Error('Tidak dapat menghapus teknisi terakhir. Sistem lab harus memiliki minimal 1 teknisi.');
  }

  const newUsers = users.filter(u => u !== target);
  writeUsers(newUsers);

  // Catat Audit Log
  addAuditLog({
    technicianName: target.name,
    username: target.username,
    action: 'Admin Hapus Teknisi',
    details: `Akun teknisi "${target.name}" (@${target.username}) telah dihapus dari sistem lab oleh Admin.`,
    statusBadge: 'offline'
  });

  // Sinkronisasi otomatis ke Google Spreadsheet (Sheet: AkunTeknisi)
  try {
    const { syncTechniciansToGoogleSheets } = require('./financeService');
    syncTechniciansToGoogleSheets().catch(err => {
      console.warn('[TechnicianService] Background Google Sheets sync warning:', err.message);
    });
  } catch (syncErr) {
    console.warn('[TechnicianService] Could not invoke syncTechniciansToGoogleSheets:', syncErr.message);
  }

  return { success: true, deleted: target.username, name: target.name };
}

module.exports = {
  getAllTechnicians,
  findTechnician,
  setTechnicianOnline,
  setTechnicianOffline,
  setTechnicianHandledPhone,
  setTechnicianStandby,
  handleOrderStepChange,
  getActivityLogs: readLogs,
  addAuditLog,
  createTechnician,
  updateTechnician,
  deleteTechnician,
  WORKSHOP_REGISTRATION_CODE
};
