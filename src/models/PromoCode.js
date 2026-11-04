const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PromoCode = sequelize.define('PromoCode', {
    id: {
      type: DataTypes.STRING(100),
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false
    },
    discount_type: {
      type: DataTypes.STRING(50),
      defaultValue: 'fixed'
    },
    discount_value: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    min_spend: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    raw_data: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'promo_codes',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return PromoCode;
};
