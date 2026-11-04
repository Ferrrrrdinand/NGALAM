const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.STRING(100),
      primaryKey: true
    },
    customer_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    whatsapp: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    device_type: {
      type: DataTypes.STRING(100),
      defaultValue: 'Smartphone'
    },
    brand_model: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    damage_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(100),
      defaultValue: 'Registrasi & Masuk'
    },
    cost: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    duration: {
      type: DataTypes.STRING(100),
      defaultValue: '30 - 60 Menit'
    },
    technician: {
      type: DataTypes.STRING(100),
      defaultValue: 'Teknisi Lab Meja 1'
    },
    step: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    raw_data: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'orders',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Order;
};
