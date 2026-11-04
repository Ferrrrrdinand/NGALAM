'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      DO $$
      DECLARE r RECORD;
      BEGIN
        FOR r IN
          SELECT conname
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
          WHERE n.nspname = 'public'
            AND t.relname = 'customers'
            AND c.contype = 'u'
            AND pg_get_constraintdef(c.oid) = 'UNIQUE (whatsapp)'
        LOOP
          EXECUTE format('ALTER TABLE public.customers DROP CONSTRAINT %I', r.conname);
        END LOOP;
      END $$;
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE public.customers ALTER COLUMN whatsapp DROP NOT NULL;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE public.customers ADD CONSTRAINT customers_whatsapp_key UNIQUE (whatsapp);
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE public.customers ALTER COLUMN whatsapp SET NOT NULL;
    `);
  }
};
