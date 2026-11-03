// Local JSON storage for quick offline access and sync with Neon PostgreSQL
// Data is stored under the project root "data" folder.
// Each table gets its own JSON file (e.g., data/users.json, data/customers.json, data/activity_logs.json).

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function filePath(table) {
  return path.join(dataDir, `${table}.json`);
}

function loadTable(table) {
  const fp = filePath(table);
  if (!fs.existsSync(fp)) return [];
  try {
    const raw = fs.readFileSync(fp, 'utf8');
    const parsed = JSON.parse(raw.replace(/^\uFEFF/, ''));
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === 'object' && parsed !== null) return Object.values(parsed);
    return [];
  } catch (e) {
    console.warn(`[localStore] Gagal membaca ${fp}:`, e.message);
    return [];
  }
}

function saveTable(table, data) {
  const fp = filePath(table);
  try {
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error(`[localStore] Gagal menulis ${fp}:`, e.message);
    return false;
  }
}

function upsertRecord(table, record) {
  if (!record || typeof record !== 'object') return;
  const list = loadTable(table);
  const idKey = record.id || record.token || record.username;
  if (!idKey) {
    list.push(record);
    saveTable(table, list);
    return;
  }

  const idx = list.findIndex(item => {
    return (item.id && item.id === idKey) ||
           (item.token && item.token === idKey) ||
           (item.username && item.username === idKey);
  });

  if (idx >= 0) {
    list[idx] = { ...list[idx], ...record };
  } else {
    list.push(record);
  }
  saveTable(table, list);
}

function appendActivityLog(action, tableName, recordId, payload) {
  const logs = loadTable('activity_logs');
  const logEntry = {
    id: 'LOG-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    action: action || 'UNKNOWN',
    table_name: tableName || 'general',
    record_id: String(recordId || ''),
    payload: payload || null,
    performed_at: new Date().toISOString()
  };
  logs.unshift(logEntry);
  if (logs.length > 500) logs.length = 500;
  saveTable('activity_logs', logs);
  return logEntry;
}

module.exports = {
  upsertRecord,
  loadTable,
  saveTable,
  appendActivityLog,
  dataDir,
};
