const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.STRING(100),
      primaryKey: true
    },
    order_id: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    invoice_number: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    customer_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    total_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    payment_method: {
      type: DataTypes.STRING(50),
      defaultValue: 'Tunai (Cash)'
    },
    cashier: {
      type: DataTypes.STRING(100),
      defaultValue: 'Ibu Sarah (Meja 1)'
    },
    raw_data: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'transactions',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return Transaction;
};
