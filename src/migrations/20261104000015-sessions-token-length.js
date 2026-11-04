'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE public.sessions ALTER COLUMN token TYPE VARCHAR(1000);
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE public.sessions ALTER COLUMN token TYPE VARCHAR(255);
    `);
  }
};
