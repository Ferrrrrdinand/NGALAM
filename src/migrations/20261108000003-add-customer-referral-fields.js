'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('customers');
    
    if (!tableInfo.referral_code) {
      await queryInterface.addColumn('customers', 'referral_code', {
        type: Sequelize.STRING(100),
        allowNull: true
      });
    }
    
    if (!tableInfo.google_id) {
      await queryInterface.addColumn('customers', 'google_id', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
    }
    
    if (!tableInfo.auth_provider) {
      await queryInterface.addColumn('customers', 'auth_provider', {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: 'local'
      });
    }

    if (!tableInfo.referred_by_mitra) {
      await queryInterface.addColumn('customers', 'referred_by_mitra', {
        type: Sequelize.STRING(100),
        allowNull: true
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('customers', 'referred_by_mitra');
    await queryInterface.removeColumn('customers', 'auth_provider');
    await queryInterface.removeColumn('customers', 'google_id');
    await queryInterface.removeColumn('customers', 'referral_code');
  }
};
