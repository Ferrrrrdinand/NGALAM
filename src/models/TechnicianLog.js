const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TechnicianLog = sequelize.define('TechnicianLog', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    technician: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    raw_data: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'technician_logs',
    underscored: true,
    timestamps: false
  });

  return TechnicianLog;
};
