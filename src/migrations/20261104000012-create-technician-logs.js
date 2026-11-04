'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('technician_logs')) {
      await queryInterface.createTable('technician_logs', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false
        },
        technician: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        action: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        details: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        raw_data: {
          type: Sequelize.JSONB,
          allowNull: true
        },
        timestamp: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('technician_logs');
  }
};
