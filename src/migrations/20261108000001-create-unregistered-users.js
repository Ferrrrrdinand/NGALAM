'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('unregistered_users', {
      id: {
        type: Sequelize.STRING(100),
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      referral_code: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      referred_by_mitra: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      registered_via: {
        type: Sequelize.STRING(100),
        defaultValue: 'Landing Modal'
      },
      claimed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      claimed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      raw_data: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('unregistered_users', ['phone']);
    await queryInterface.addIndex('unregistered_users', ['email']);
    await queryInterface.addIndex('unregistered_users', ['claimed']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('unregistered_users');
  }
};
