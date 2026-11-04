'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('sessions')) {
      await queryInterface.createTable('sessions', {
        token: {
          type: Sequelize.STRING(1000),
          primaryKey: true,
          allowNull: false
        },
        user_id: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        name: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        username: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        role: {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        access_level: {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        raw_data: {
          type: Sequelize.JSONB,
          allowNull: true
        },
        login_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('sessions');
  }
};
