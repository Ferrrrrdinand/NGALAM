const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log('Connecting to Neon Cloud DB...');

  // 1. Sync Mitra to users table
  const mitraPath = path.join(__dirname, '..', 'data', 'users_mitra.json');
  if (fs.existsSync(mitraPath)) {
    const mitras = JSON.parse(fs.readFileSync(mitraPath, 'utf8'));
    for (const m of mitras) {
      const id = m.id || m.username || m.referralCode;
      const username = m.username || id;
      const name = m.name || m.username || 'Mitra Rekanan';
      const role = 'mitra';
      const email = m.email || null;
      const phone = m.phone || m.whatsapp || null;
      const refCode = m.referralCode || m.referral_code || null;
      const rate = m.commissionRate || m.commission_rate || 5;

      await pool.query(`
        INSERT INTO users (id, username, name, email, phone, role, referral_code, commission_rate, raw_data, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET 
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          referral_code = EXCLUDED.referral_code,
          commission_rate = EXCLUDED.commission_rate,
          raw_data = EXCLUDED.raw_data
      `, [id, username, name, email, phone, role, refCode, rate, JSON.stringify(m)]);
    }
    console.log(`Synced ${mitras.length} Mitra to Neon Cloud users table!`);
  }

  // 2. Check orders count
  const resOrd = await pool.query('SELECT count(*) FROM orders');
  console.log(`Current orders in Neon: ${resOrd.rows[0].count}`);

  await pool.end();
  console.log('Done!');
}

run().catch((e) => {
  console.error('Error during sync:', e);
  process.exit(1);
});
