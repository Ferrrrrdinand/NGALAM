'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('banners')) {
      await queryInterface.createTable('banners', {
        id: {
          type: Sequelize.STRING(100),
          primaryKey: true,
          allowNull: false
        },
        title: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        image_url: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        badge_tag: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        badge_pill: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        promo_code: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        button_text: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        button_link: {
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
    await queryInterface.dropTable('banners');
  }
};
