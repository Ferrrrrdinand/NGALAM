const crypto = require('crypto');
const db = require('./db');

let UnregisteredUser = null;
try {
  const models = require('../src/models');
  UnregisteredUser = models.UnregisteredUser;
} catch (_) {}

function generateUserReferralCode(name) {
  const clean = (name || '').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 5) || 'USER';
  const random = Math.floor(1000 + Math.random() * 9000);
  return `USR-${clean}-${random}`;
}

function normalizePhone(val) {
  if (!val) return '';
  let digits = String(val).replace(/\D/g, '');
  if (digits.startsWith('62')) digits = '0' + digits.slice(2);
  return digits;
}

/**
 * Simpan data calon pelanggan dari Landing Modal (atau modal awal website) ke Database
 */
async function createUnregisteredUser({ name, phone, email = '', referredByMitra = '', registeredVia = 'Landing Modal' }) {
  const cleanName = (name || '').trim();
  const cleanPhone = normalizePhone(phone);
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanRefMitra = (referredByMitra || '').trim().toUpperCase();
  
  if (!cleanName || !cleanPhone) {
    throw new Error('Nama dan nomor WhatsApp wajib diisi');
  }
  
  const now = new Date();
  const id = `UNREG-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
  
  let referralCode = generateUserReferralCode(cleanName);
  
  const rawData = {
    createdAt: now.toISOString(),
    userAgent: 'web',
    name: cleanName,
    phone: cleanPhone,
    referredByMitra: cleanRefMitra || null
  };

  let savedRecord = null;

  // 1. Coba simpan via Sequelize jika tersedia
  if (UnregisteredUser) {
    try {
      const existing = await UnregisteredUser.findOne({ where: { referralCode } });
      if (existing) {
        referralCode = generateUserReferralCode(cleanName + crypto.randomBytes(2).toString('hex'));
      }

      savedRecord = await UnregisteredUser.create({
        id,
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail || null,
        referralCode,
        referredByMitra: cleanRefMitra || null,
        registeredVia,
        claimed: false,
        rawData
      });
    } catch (seqErr) {
      console.warn('[UnregisteredUser] Sequelize insert warning, trying direct pg query:', seqErr.message);
    }
  }

  // 2. Fallback / direct PostgreSQL query jika Sequelize tidak berhasil
  if (!savedRecord) {
    try {
      await db.ensureDbReady();
      const insertQuery = `
        INSERT INTO unregistered_users 
          (id, name, phone, email, referral_code, referred_by_mitra, registered_via, claimed, raw_data, created_at)
        VALUES 
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          phone = EXCLUDED.phone,
          referred_by_mitra = EXCLUDED.referred_by_mitra
        RETURNING *;
      `;
      const res = await db.query(insertQuery, [
        id,
        cleanName,
        cleanPhone,
        cleanEmail || null,
        referralCode,
        cleanRefMitra || null,
        registeredVia,
        false,
        JSON.stringify(rawData)
      ]);
      if (res && res.rows && res.rows[0]) {
        savedRecord = res.rows[0];
      }
    } catch (pgErr) {
      console.error('[UnregisteredUser] Direct PostgreSQL insert error:', pgErr.message);
      throw pgErr;
    }
  }

  // 3. Catat ke Activity Log sistem
  try {
    await db.logActivity('PROSPECT_CAPTURED', 'unregistered_users', id, {
      name: cleanName,
      phone: cleanPhone,
      referralCode,
      referredByMitra: cleanRefMitra || null,
      registeredVia,
      createdAt: now.toISOString()
    });
  } catch (_) {}

  return {
    id: savedRecord?.id || id,
    name: cleanName,
    phone: cleanPhone,
    referralCode: savedRecord?.referral_code || referralCode,
    referredByMitra: cleanRefMitra || null,
    claimed: false,
    createdAt: now.toISOString()
  };
}

/**
 * Ambil seluruh log calon pelanggan dari database untuk panel admin
 */
async function getAllProspects() {
  try {
    await db.ensureDbReady();
    const res = await db.query(`
      SELECT 
        id, 
        name, 
        phone, 
        email, 
        referral_code AS "referralCode", 
        referred_by_mitra AS "referredByMitra", 
        registered_via AS "registeredVia", 
        claimed, 
        claimed_at AS "claimedAt", 
        raw_data AS "rawData", 
        created_at AS "createdAt"
      FROM unregistered_users
      ORDER BY created_at DESC
    `);

    return res.rows || [];
  } catch (err) {
    console.error('[UnregisteredUser] getAllProspects error:', err.message);
    // Coba fallback via Sequelize
    if (UnregisteredUser) {
      try {
        const users = await UnregisteredUser.findAll({ order: [['created_at', 'DESC']] });
        return users.map(u => u.toJSON ? u.toJSON() : u);
      } catch (_) {}
    }
    return [];
  }
}

async function findUnregisteredByPhone(phone) {
  const cleanPhone = normalizePhone(phone);
  if (!cleanPhone) return null;
  
  if (UnregisteredUser) {
    try {
      return await UnregisteredUser.findOne({
        where: { phone: cleanPhone, claimed: false }
      });
    } catch (_) {}
  }

  try {
    const res = await db.query(
      'SELECT * FROM unregistered_users WHERE phone = $1 AND claimed = false LIMIT 1',
      [cleanPhone]
    );
    return res.rows[0] || null;
  } catch (_) {
    return null;
  }
}

async function findUnregisteredById(id) {
  if (UnregisteredUser) {
    try {
      return await UnregisteredUser.findByPk(id);
    } catch (_) {}
  }

  try {
    const res = await db.query('SELECT * FROM unregistered_users WHERE id = $1', [id]);
    return res.rows[0] || null;
  } catch (_) {
    return null;
  }
}

async function markAsClaimed(id) {
  try {
    if (UnregisteredUser) {
      const user = await UnregisteredUser.findByPk(id);
      if (user) {
        user.claimed = true;
        user.claimedAt = new Date();
        await user.save();
        return user;
      }
    }
  } catch (_) {}

  try {
    const res = await db.query(`
      UPDATE unregistered_users 
      SET claimed = true, claimed_at = NOW() 
      WHERE id = $1 
      RETURNING *
    `, [id]);
    return res.rows[0] || null;
  } catch (_) {
    return null;
  }
}

async function deleteProspect(id) {
  if (!id) return false;
  try {
    await db.query('DELETE FROM unregistered_users WHERE id = $1', [id]);
    await db.logActivity('PROSPECT_DELETE', 'unregistered_users', id, { id });
    return true;
  } catch (err) {
    console.error('[UnregisteredUser] deleteProspect error:', err.message);
    if (UnregisteredUser) {
      try {
        await UnregisteredUser.destroy({ where: { id } });
        return true;
      } catch (_) {}
    }
    return false;
  }
}

module.exports = {
  createUnregisteredUser,
  getAllProspects,
  findUnregisteredByPhone,
  findUnregisteredById,
  markAsClaimed,
  deleteProspect
};
