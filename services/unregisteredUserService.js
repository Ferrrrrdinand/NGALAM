const crypto = require('crypto');
const { UnregisteredUser } = require('../src/models');

function generateUserReferralCode(name) {
  const clean = name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 5);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `USR-${clean}-${random}`;
}

function normalizePhone(val) {
  if (!val) return '';
  let digits = String(val).replace(/\D/g, '');
  if (digits.startsWith('62')) digits = '0' + digits.slice(2);
  return digits;
}

async function createUnregisteredUser({ name, phone, referredByMitra = '' }) {
  const cleanName = (name || '').trim();
  const cleanPhone = normalizePhone(phone);
  const cleanRefMitra = (referredByMitra || '').trim().toUpperCase();
  
  if (!cleanName || !cleanPhone) {
    throw new Error('Nama dan nomor telepon wajib diisi');
  }
  
  const now = new Date();
  const id = `UNREG-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
  
  let referralCode = generateUserReferralCode(cleanName);
  
  const existing = await UnregisteredUser.findOne({
    where: { referralCode }
  });
  
  if (existing) {
    referralCode = generateUserReferralCode(cleanName + crypto.randomBytes(2).toString('hex'));
  }
  
  const unregUser = await UnregisteredUser.create({
    id,
    name: cleanName,
    phone: cleanPhone,
    referralCode,
    referredByMitra: cleanRefMitra || null,
    registeredVia: 'Landing Modal',
    claimed: false,
    rawData: {
      createdAt: now.toISOString(),
      userAgent: 'web'
    }
  });
  
  return unregUser;
}

async function findUnregisteredByPhone(phone) {
  const cleanPhone = normalizePhone(phone);
  if (!cleanPhone) return null;
  
  return await UnregisteredUser.findOne({
    where: { phone: cleanPhone, claimed: false }
  });
}

async function findUnregisteredById(id) {
  return await UnregisteredUser.findByPk(id);
}

async function markAsClaimed(id) {
  const user = await UnregisteredUser.findByPk(id);
  if (user) {
    user.claimed = true;
    user.claimedAt = new Date();
    await user.save();
  }
  return user;
}

async function cleanupOldUnregistered(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const deleted = await UnregisteredUser.destroy({
    where: {
      claimed: false,
      created_at: { [require('sequelize').Op.lt]: cutoffDate }
    }
  });
  
  return deleted;
}

module.exports = {
  createUnregisteredUser,
  findUnregisteredByPhone,
  findUnregisteredById,
  markAsClaimed,
  cleanupOldUnregistered
};
