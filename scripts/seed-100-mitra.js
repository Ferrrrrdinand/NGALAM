const { hashPassword } = require('../src/utils/security');
const crypto = require('crypto');

async function seed100Mitra() {
  const { sequelize, User } = require('../src/models');
  
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    const mitras = [];
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

    for (let i = 1; i <= 100; i++) {
      const num = String(i).padStart(3, '0');
      const mitraId = `USR-MITRA-PRE-${num}`;
      const username = `mitra_pre_${num}`;
      const referralCode = `MITRA-${num}`;

      mitras.push({
        id: mitraId,
        username: username,
        password: hashPassword(crypto.randomBytes(32).toString('hex')),
        name: `Mitra Rekanan ${num}`,
        role: 'mitra',
        category: 'Mitra Pre-Registered',
        avatar: '🤝',
        phone: null,
        email: `pre.mitra.${num}@placeholder.ngalamfixpro.local`,
        referral_code: referralCode,
        google_id: null,
        auth_provider: null,
        is_pre_created: true,
        commission_rate: 10,
        total_commission: 0,
        status: 'Menunggu Aktivasi',
        last_active: `${dateStr}, Belum Diklaim`,
        desk: null,
        specialty: 'Mitra Rekanan Kurir & Bengkel',
        raw_data: {
          preCreatedAt: now.toISOString(),
          qrPrinted: false
        }
      });
    }

    await User.bulkCreate(mitras, { 
      updateOnDuplicate: ['name', 'status', 'is_pre_created', 'referral_code']
    });

    console.log(`✅ Successfully seeded ${mitras.length} pre-created mitra accounts`);
    console.log(`📋 Referral Codes: MITRA-001 to MITRA-100`);
    console.log(`\n🎯 Next steps:`);
    console.log(`   1. Run: node scripts/generate-qr-batch.js`);
    console.log(`   2. Print QR codes from: public/qr-codes/`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
}

seed100Mitra();
