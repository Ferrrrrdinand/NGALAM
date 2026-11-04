'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE public.customers ALTER COLUMN pin TYPE VARCHAR(255);
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE public.customers ALTER COLUMN pin TYPE VARCHAR(50);
    `);
  }
};
