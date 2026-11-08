const { sequelize, Sequelize } = require('../config/database');

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Register models
db.User = require('./User')(sequelize);
db.Customer = require('./Customer')(sequelize);
db.Order = require('./Order')(sequelize);
db.Transaction = require('./Transaction')(sequelize);
db.Finance = require('./Finance')(sequelize);
db.Commission = require('./Commission')(sequelize);
db.Banner = require('./Banner')(sequelize);
db.PromoCode = require('./PromoCode')(sequelize);
db.Testimonial = require('./Testimonial')(sequelize);
db.Session = require('./Session')(sequelize);
db.ActivityLog = require('./ActivityLog')(sequelize);
db.TechnicianLog = require('./TechnicianLog')(sequelize);
db.UnregisteredUser = require('./UnregisteredUser')(sequelize);

// Associations
// Order belongsTo Customer (whatsapp / customer_name)
// Transaction belongsTo Order
db.Transaction.belongsTo(db.Order, { foreignKey: 'order_id', targetKey: 'id', as: 'order' });
db.Order.hasMany(db.Transaction, { foreignKey: 'order_id', sourceKey: 'id', as: 'transactions' });

// Order hasMany Commissions
db.Commission.belongsTo(db.Order, { foreignKey: 'order_id', targetKey: 'id', as: 'order' });
db.Order.hasMany(db.Commission, { foreignKey: 'order_id', sourceKey: 'id', as: 'commissions' });

// Session belongsTo User
db.Session.belongsTo(db.User, { foreignKey: 'user_id', targetKey: 'id', as: 'user' });

module.exports = db;
