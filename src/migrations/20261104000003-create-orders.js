'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('orders')) {
      await queryInterface.createTable('orders', {
        id: {
          type: Sequelize.STRING(100),
          primaryKey: true,
          allowNull: false
        },
        customer_name: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        whatsapp: {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        device_type: {
          type: Sequelize.STRING(100),
          defaultValue: 'Smartphone'
        },
        brand_model: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        damage_description: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        status: {
          type: Sequelize.STRING(100),
          defaultValue: 'Registrasi & Masuk'
        },
        cost: {
          type: Sequelize.DECIMAL(15, 2),
          defaultValue: 0
        },
        duration: {
          type: Sequelize.STRING(100),
          defaultValue: '30 - 60 Menit'
        },
        technician: {
          type: Sequelize.STRING(100),
          defaultValue: 'Teknisi Lab Meja 1'
        },
        step: {
          type: Sequelize.INTEGER,
          defaultValue: 1
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
    await queryInterface.dropTable('orders');
  }
};
