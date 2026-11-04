'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('finances')) {
      await queryInterface.createTable('finances', {
        id: {
          type: Sequelize.STRING(100),
          primaryKey: true,
          allowNull: false
        },
        type: {
          type: Sequelize.STRING(50),
          allowNull: false
        },
        category: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        amount: {
          type: Sequelize.DECIMAL(15, 2),
          defaultValue: 0
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        date: {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        source: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        recorded_by: {
          type: Sequelize.STRING(100),
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
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('finances');
  }
};
