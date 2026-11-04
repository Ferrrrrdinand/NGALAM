'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('activity_logs')) {
      await queryInterface.createTable('activity_logs', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false
        },
        action: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        table_name: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        record_id: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        payload: {
          type: Sequelize.JSONB,
          allowNull: true
        },
        performed_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('activity_logs');
  }
};
