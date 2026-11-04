const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Session = sequelize.define('Session', {
    token: {
      type: DataTypes.STRING(1000),
      primaryKey: true
    },
    user_id: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    access_level: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    raw_data: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    login_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'sessions',
    underscored: true,
    timestamps: false
  });

  return Session;
};
