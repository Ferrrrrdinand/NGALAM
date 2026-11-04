'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('users')) {
      await queryInterface.createTable('users', {
        id: {
          type: Sequelize.STRING(100),
          primaryKey: true,
          allowNull: false
        },
        username: {
          type: Sequelize.STRING(100),
          unique: true,
          allowNull: false
        },
        password: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        name: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        role: {
          type: Sequelize.STRING(50),
          allowNull: false,
          defaultValue: 'kasir'
        },
        category: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        avatar: {
          type: Sequelize.STRING(50),
          defaultValue: '👤'
        },
        phone: {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        email: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        referral_code: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        commission_rate: {
          type: Sequelize.DECIMAL(10, 2),
          defaultValue: 10
        },
        total_commission: {
          type: Sequelize.DECIMAL(15, 2),
          defaultValue: 0
        },
        status: {
          type: Sequelize.STRING(50),
          defaultValue: 'Siaga / Aktif'
        },
        last_active: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        desk: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        specialty: {
          type: Sequelize.TEXT,
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
    await queryInterface.dropTable('users');
  }
};
