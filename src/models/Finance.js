const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Finance = sequelize.define('Finance', {
    id: {
      type: DataTypes.STRING(100),
      primaryKey: true
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    date: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    source: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    recorded_by: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    raw_data: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'finances',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return Finance;
};
