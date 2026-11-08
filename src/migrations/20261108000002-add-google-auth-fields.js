'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('users');
    
    if (!tableInfo.google_id) {
      await queryInterface.addColumn('users', 'google_id', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
    }
    
    if (!tableInfo.auth_provider) {
      await queryInterface.addColumn('users', 'auth_provider', {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: 'local'
      });
    }
    
    if (!tableInfo.is_pre_created) {
      await queryInterface.addColumn('users', 'is_pre_created', {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      });
    }
    
    if (!tableInfo.claimed_at) {
      await queryInterface.addColumn('users', 'claimed_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'claimed_at');
    await queryInterface.removeColumn('users', 'is_pre_created');
    await queryInterface.removeColumn('users', 'auth_provider');
    await queryInterface.removeColumn('users', 'google_id');
  }
};
