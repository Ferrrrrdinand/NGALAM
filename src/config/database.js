const net = require('net');
if (typeof net.setDefaultAutoSelectFamily === 'function') {
  net.setDefaultAutoSelectFamily(false);
}

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const { Sequelize } = require('sequelize');

const databaseUrl = process.env.DATABASE_URL || '';
const isNeonOrSsl = databaseUrl.includes('neon.tech') || databaseUrl.includes('sslmode=require');

const dbConfig = {
  url: databaseUrl,
  dialect: 'postgres',
  logging: process.env.DB_LOGGING === 'true' ? console.log : false,
  dialectOptions: {
    ssl: isNeonOrSsl ? { require: true, rejectUnauthorized: false } : false
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, {
      dialect: 'postgres',
      logging: dbConfig.logging,
      dialectOptions: dbConfig.dialectOptions,
      pool: dbConfig.pool
    })
  : new Sequelize({
      database: process.env.PGDATABASE || 'ngalam_fix_pro',
      username: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || '',
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      dialect: 'postgres',
      logging: dbConfig.logging,
      dialectOptions: dbConfig.dialectOptions,
      pool: dbConfig.pool
    });

module.exports = {
  development: dbConfig,
  test: dbConfig,
  production: dbConfig,
  sequelize,
  Sequelize
};
