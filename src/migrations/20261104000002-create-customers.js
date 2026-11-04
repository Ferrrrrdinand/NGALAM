'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('customers')) {
      await queryInterface.createTable('customers', {
        id: {
          type: Sequelize.STRING(100),
          primaryKey: true,
          allowNull: false
        },
        name: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        whatsapp: {
          type: Sequelize.STRING(50),
          allowNull: true,
          unique: false
        },
        email: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        district: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        pin: {
          type: Sequelize.STRING(50),
          defaultValue: '123456'
        },
        registered_at: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        registered_via: {
          type: Sequelize.STRING(100),
          defaultValue: 'Portal Pelanggan Web'
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
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('customers');
  }
};
