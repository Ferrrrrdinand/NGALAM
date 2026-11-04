const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Commission = sequelize.define('Commission', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    referral_code: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    order_id: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    commission_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'Tercatat'
    },
    raw_data: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'commissions',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return Commission;
};
