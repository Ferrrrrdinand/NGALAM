// Local JSON storage for quick offline access and sync with Neon PostgreSQL
// Data will be stored under the project root "data" folder (created if missing).
// Each table gets its own JSON file (e.g., data/users.json).

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
  if (!fs.existsSync(fp)) return {};
  try {
    const raw = fs.readFileSync(fp, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`[localStore] Failed to parse ${fp}:`, e.message);
    return {};
  }
}

function saveTable(table, data) {
  const fp = filePath(table);
  try {
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error(`[localStore] Unable to write ${fp}:`, e.message);
  }
}

function upsertRecord(table, record) {
  const collection = loadTable(table);
  collection[record.id] = record;
  saveTable(table, collection);
}

module.exports = {
  upsertRecord,
  loadTable,
  dataDir,
};
}

