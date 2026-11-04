'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('testimonials')) {
      await queryInterface.createTable('testimonials', {
        id: {
          type: Sequelize.STRING(100),
          primaryKey: true,
          allowNull: false
        },
        customer_name: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        rating: {
          type: Sequelize.INTEGER,
          defaultValue: 5
        },
        comment: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        device: {
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
        },
        updated_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('testimonials');
  }
};
