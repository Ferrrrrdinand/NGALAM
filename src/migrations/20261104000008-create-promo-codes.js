'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('promo_codes')) {
      await queryInterface.createTable('promo_codes', {
        id: {
          type: Sequelize.STRING(100),
          primaryKey: true,
          allowNull: false
        },
        code: {
          type: Sequelize.STRING(50),
          unique: true,
          allowNull: false
        },
        discount_type: {
          type: Sequelize.STRING(50),
          defaultValue: 'fixed'
        },
        discount_value: {
          type: Sequelize.DECIMAL(15, 2),
          defaultValue: 0
        },
        min_spend: {
          type: Sequelize.DECIMAL(15, 2),
          defaultValue: 0
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        active: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        raw_data: {
          type: Sequelize.JSONB,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('promo_codes');
  }
};
