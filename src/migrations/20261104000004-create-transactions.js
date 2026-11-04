'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('transactions')) {
      await queryInterface.createTable('transactions', {
        id: {
          type: Sequelize.STRING(100),
          primaryKey: true,
          allowNull: false
        },
        order_id: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        invoice_number: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        customer_name: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        total_amount: {
          type: Sequelize.DECIMAL(15, 2),
          defaultValue: 0
        },
        payment_method: {
          type: Sequelize.STRING(50),
          defaultValue: 'Tunai (Cash)'
        },
        cashier: {
          type: Sequelize.STRING(100),
          defaultValue: 'Ibu Sarah (Meja 1)'
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
    await queryInterface.dropTable('transactions');
  }
};
