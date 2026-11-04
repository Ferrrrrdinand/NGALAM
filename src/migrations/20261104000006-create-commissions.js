'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('commissions')) {
      await queryInterface.createTable('commissions', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false
        },
        referral_code: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        order_id: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        commission_amount: {
          type: Sequelize.DECIMAL(15, 2),
          defaultValue: 0
        },
        status: {
          type: Sequelize.STRING(50),
          defaultValue: 'Tercatat'
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
    await queryInterface.dropTable('commissions');
  }
};
