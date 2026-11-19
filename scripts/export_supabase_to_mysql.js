const { Client } = require('pg');
const fs = require('fs');

async function dump() {
  const client = new Client({
    connectionString: 'postgresql://postgres.fzkqghktpblbhdrqmogj:fixprongalam2026@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  const tables = [
    'users', 'customers', 'orders', 'transactions', 'finances',
    'commissions', 'testimonials', 'sessions', 'activity_logs',
    'technician_logs', 'warranties', 'promo_codes', 'banners',
    'qr_assets', 'ads', 'unregistered_users'
  ];

  let sqlDump = `-- ========================================================
-- NGALAM FIX PRO - Data Migration from Supabase to MySQL
-- Target DB: ngad2562_root
-- Generated: ${new Date().toISOString()}
-- ========================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

`;

  for (const table of tables) {
    try {
      const res = await client.query(`SELECT * FROM "${table}"`);
      if (res.rows.length === 0) {
        console.log(`Table ${table} is empty. Skipping.`);
        continue;
      }

      console.log(`Exporting ${res.rows.length} rows from ${table}...`);
      const cols = Object.keys(res.rows[0]);
      
      sqlDump += `-- Data for table: ${table} (${res.rows.length} rows)\n`;
      for (const row of res.rows) {
        const colNames = cols.map(c => '`' + c + '`').join(', ');
        const values = cols.map(c => {
          const val = row[c];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'boolean') return val ? 1 : 0;
          if (typeof val === 'number') return val;
          if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
          if (typeof val === 'object') {
            return `'${JSON.stringify(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
          }
          return `'${String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
        }).join(', ');

        sqlDump += `INSERT INTO \`${table}\` (${colNames}) VALUES (${values}) ON DUPLICATE KEY UPDATE \`${cols[0]}\`=\`${cols[0]}\`;\n`;
      }
      sqlDump += '\n';
    } catch (err) {
      console.error(`Error querying ${table}:`, err.message);
    }
  }

  sqlDump += 'SET FOREIGN_KEY_CHECKS = 1;\n';
  fs.writeFileSync('scripts/supabase_data_dump.sql', sqlDump);
  console.log('Successfully written scripts/supabase_data_dump.sql');
  await client.end();
}

dump().catch(console.error);

