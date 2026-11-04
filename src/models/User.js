const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.STRING(100),
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'kasir'
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    avatar: {
      type: DataTypes.STRING(50),
      defaultValue: '👤'
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    referral_code: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    commission_rate: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 10
    },
    total_commission: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'Siaga / Aktif'
    },
    last_active: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    desk: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    specialty: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    raw_data: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'users',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return User;
};
