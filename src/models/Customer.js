const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Customer = sequelize.define('Customer', {
    id: {
      type: DataTypes.STRING(100),
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    whatsapp: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    district: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    pin: {
      type: DataTypes.STRING(50),
      defaultValue: '123456'
    },
    registered_at: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    registered_via: {
      type: DataTypes.STRING(100),
      defaultValue: 'Portal Pelanggan Web'
    },
    raw_data: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'customers',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return Customer;
};
