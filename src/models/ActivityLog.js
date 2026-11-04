const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ActivityLog = sequelize.define('ActivityLog', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    table_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    record_id: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    payload: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    performed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'activity_logs',
    underscored: true,
    timestamps: false
  });

  return ActivityLog;
};
