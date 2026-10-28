const fs = require('fs');
const path = require('path');

const CUSTOMERS_FILE = path.join(__dirname, '..', 'data', 'customers.json');

function getAllCustomers() {
  try {
    if (!fs.existsSync(CUSTOMERS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(CUSTOMERS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading customers.json:', err.message);
    return [];
  }
}

function saveCustomers(customers) {
  try {
    fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify(customers, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing customers.json:', err.message);
    return false;
  }
}

function findCustomerByIdentifier(identifier) {
  if (!identifier) return null;
  const customers = getAllCustomers();
  const clean = identifier.trim().toLowerCase();
  const digits = clean.replace(/\D/g, '');

  return customers.find(c => {
    const cId = (c.id || '').toLowerCase();
    const cWa = (c.whatsapp || '').replace(/\D/g, '');
    const cEmail = (c.email || '').toLowerCase();

    if (cId === clean) return true;
    if (digits && digits.length >= 6 && cWa.includes(digits)) return true;
    if (cEmail && cEmail === clean) return true;
    return false;
  }) || null;
}

function registerNewCustomer({ name, whatsapp, email = '', district = 'Klojen, Kota Malang', pin = '123456', registeredVia = 'Portal Pelanggan Web' }) {
  if (!name || !name.trim()) {
    throw new Error('Nama lengkap pelanggan wajib diisi.');
  }
  if (!whatsapp || !whatsapp.trim()) {
    throw new Error('Nomor WhatsApp aktif wajib diisi.');
  }

  const cleanWa = whatsapp.trim();
  const existing = findCustomerByIdentifier(cleanWa);
  if (existing) {
    throw new Error(`Nomor WhatsApp ${cleanWa} sudah terdaftar dengan nama ${existing.name}. Silakan langsung masuk.`);
  }

  const customers = getAllCustomers();
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');

  const newId = `CUST-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(1000 + Math.random() * 9000))}`;

  const newCust = {
    id: newId,
    name: name.trim(),
    whatsapp: cleanWa,
    email: (email || '').trim().toLowerCase(),
    district: district.trim(),
    pin: pin ? pin.trim() : '123456',
    registeredAt: `${dateStr}, ${timeStr}`,
    registeredVia: registeredVia
  };

  customers.push(newCust);
  saveCustomers(customers);

  // Background sync ke Google Sheets jika terhubung
  try {
    const { appendCustomerRowToGoogleSheets } = require('./financeService');
    appendCustomerRowToGoogleSheets(newCust).catch(err => {
      console.warn('[CustomerService] Background sync customer failed:', err.message);
    });
  } catch (e) {
    // ignore
  }

  return newCust;
}

/**
 * Pastikan akun pelanggan tersedia (otomatis dibuat & disinkronkan ke Google Spreadsheet jika belum ada)
 */
function ensureCustomerAccount({ name, whatsapp, email = '', district = 'Klojen, Kota Malang', pin = '123456', registeredVia = 'Sistem Servis' }) {
  if (!whatsapp) return null;
  const existing = findCustomerByIdentifier(whatsapp);
  if (existing) {
    // Update jika ada data baru
    let changed = false;
    if (email && !existing.email) {
      existing.email = email.trim().toLowerCase();
      changed = true;
    }
    if (district && (!existing.district || existing.district === 'Malang')) {
      existing.district = district.trim();
      changed = true;
    }
    if (changed) {
      const customers = getAllCustomers();
      const idx = customers.findIndex(c => c.id === existing.id);
      if (idx !== -1) {
        customers[idx] = existing;
        saveCustomers(customers);
      }
    }
    return existing;
  }

  try {
    return registerNewCustomer({
      name: name || 'Pelanggan Setia',
      whatsapp: whatsapp,
      email: email,
      district: district,
      pin: pin,
      registeredVia: registeredVia
    });
  } catch (err) {
    console.warn('[CustomerService] ensureCustomerAccount fallback:', err.message);
    return null;
  }
}

/**
 * Sinkronkan seluruh data akun pelanggan ke Google Spreadsheet (Sheet: DataCustomer)
 */
async function syncCustomersWithGoogleSpreadsheet() {
  const { syncCustomersToGoogleSheets } = require('./financeService');
  return await syncCustomersToGoogleSheets();
}

module.exports = {
  getAllCustomers,
  saveCustomers,
  findCustomerByIdentifier,
  registerNewCustomer,
  ensureCustomerAccount,
  syncCustomersWithGoogleSpreadsheet
};

