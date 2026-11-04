const fs = require('fs');
const path = require('path');
const db = require('../models');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

async function pullNeon() {
  console.log('📥 [Sequelize Pull] Menarik seluruh data terbaru dari Neon PostgreSQL ke lokal...');
  const results = {};

  // Pull Users
  const users = await db.User.findAll({ order: [['username', 'ASC']] });
  const userList = users.map(u => u.raw_data || u.toJSON());
  fs.writeFileSync(path.join(DATA_DIR, 'users.json'), JSON.stringify(userList, null, 2), 'utf-8');
  results.users = userList.length;

  // Split users into respective role files
  const admins = userList.filter(u => u.role === 'admin' || u.role === 'superadmin');
  const kasirs = userList.filter(u => u.role === 'kasir');
  const teknisis = userList.filter(u => u.role === 'teknisi');
  const mitras = userList.filter(u => u.role === 'mitra' || u.role === 'ojol');

  if (admins.length) fs.writeFileSync(path.join(DATA_DIR, 'users_admin.json'), JSON.stringify(admins, null, 2), 'utf-8');
  if (kasirs.length) fs.writeFileSync(path.join(DATA_DIR, 'users_kasir.json'), JSON.stringify(kasirs, null, 2), 'utf-8');
  if (teknisis.length) fs.writeFileSync(path.join(DATA_DIR, 'users_teknisi.json'), JSON.stringify(teknisis, null, 2), 'utf-8');
  if (mitras.length) fs.writeFileSync(path.join(DATA_DIR, 'users_mitra.json'), JSON.stringify(mitras, null, 2), 'utf-8');

  // Pull Customers
  const customers = await db.Customer.findAll({ order: [['id', 'ASC']] });
  const custList = customers.map(c => c.raw_data || c.toJSON());
  fs.writeFileSync(path.join(DATA_DIR, 'customers.json'), JSON.stringify(custList, null, 2), 'utf-8');
  results.customers = custList.length;

  // Pull Orders
  const orders = await db.Order.findAll({ order: [['created_at', 'DESC']] });
  const orderList = orders.map(o => o.raw_data || o.toJSON());
  fs.writeFileSync(path.join(DATA_DIR, 'orders.json'), JSON.stringify(orderList, null, 2), 'utf-8');
  results.orders = orderList.length;

  // Pull Transactions
  const transactions = await db.Transaction.findAll({ order: [['created_at', 'DESC']] });
  const trxList = transactions.map(t => t.raw_data || t.toJSON());
  fs.writeFileSync(path.join(DATA_DIR, 'transactions.json'), JSON.stringify(trxList, null, 2), 'utf-8');
  results.transactions = trxList.length;

  // Pull Finances
  const finances = await db.Finance.findAll({ order: [['created_at', 'DESC']] });
  const finList = finances.map(f => f.raw_data || f.toJSON());
  fs.writeFileSync(path.join(DATA_DIR, 'finances.json'), JSON.stringify(finList, null, 2), 'utf-8');
  results.finances = finList.length;

  // Pull Banners
  const banners = await db.Banner.findAll();
  const bannerList = banners.map(b => b.raw_data || b.toJSON());
  fs.writeFileSync(path.join(DATA_DIR, 'banners.json'), JSON.stringify(bannerList, null, 2), 'utf-8');
  results.banners = bannerList.length;

  // Pull Promo Codes
  const promoCodes = await db.PromoCode.findAll();
  const promoList = promoCodes.map(p => p.raw_data || p.toJSON());
  fs.writeFileSync(path.join(DATA_DIR, 'promo_codes.json'), JSON.stringify(promoList, null, 2), 'utf-8');
  results.promoCodes = promoList.length;

  // Pull Testimonials
  const testimonials = await db.Testimonial.findAll();
  const testList = testimonials.map(t => t.raw_data || t.toJSON());
  fs.writeFileSync(path.join(DATA_DIR, 'testimonials.json'), JSON.stringify(testList, null, 2), 'utf-8');
  results.testimonials = testList.length;

  console.log('✅ [Sequelize Pull] Data berhasil ditarik ke folder data/:', results);
  return results;
}

if (require.main === module) {
  pullNeon()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ [Sequelize Pull Error]:', err);
      process.exit(1);
    });
}

module.exports = pullNeon;
