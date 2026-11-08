const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UnregisteredUser = sequelize.define('UnregisteredUser', {
    id: {
      type: DataTypes.STRING(100),
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    referralCode: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'referral_code'
    },
    referredByMitra: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'referred_by_mitra'
    },
    registeredVia: {
      type: DataTypes.STRING(100),
      defaultValue: 'Landing Modal',
      field: 'registered_via'
    },
    claimed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    claimedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'claimed_at'
    },
    rawData: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'raw_data'
    }
  }, {
    tableName: 'unregistered_users',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return UnregisteredUser;
};
