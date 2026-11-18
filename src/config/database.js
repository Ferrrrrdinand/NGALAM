const net = require('net');
if (typeof net.setDefaultAutoSelectFamily === 'function') {
  net.setDefaultAutoSelectFamily(false);
}

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const { Sequelize, DataTypes } = require('sequelize');

const databaseUrl = process.env.DATABASE_URL || '';

// Detect database dialect (postgres or mysql)
const isMySql = process.env.DB_DIALECT === 'mysql' || 
                process.env.MYSQL_DATABASE || 
                databaseUrl.startsWith('mysql://');

const dbDialect = isMySql ? 'mysql' : 'postgres';

// Seamless fallback for MySQL where JSONB doesn't exist natively
if (isMySql && DataTypes.JSONB) {
  DataTypes.JSONB = DataTypes.JSON;
}

const isSslConnection = dbDialect === 'postgres' && (
  /supabase\.(co|com)/i.test(databaseUrl) || 
  databaseUrl.includes('sslmode=require') || 
  process.env.PG_SSL === 'true'
);

function makeDialectOptions() {
  if (dbDialect === 'postgres') {
    return {
      ssl: isSslConnection ? { require: true, rejectUnauthorized: false } : false
    };
  }
  return {
    decimalNumbers: true
  };
}

const commonPool = {
  max: 10,
  min: 0,
  acquire: 30000,
  idle: 10000
};

const dbConfig = {
  url: databaseUrl,
  dialect: dbDialect,
  logging: process.env.DB_LOGGING === 'true' ? console.log : false,
  dialectOptions: makeDialectOptions(),
  pool: commonPool
};

let sequelize;

if (databaseUrl) {
  sequelize = new Sequelize(databaseUrl, {
    dialect: dbDialect,
    logging: dbConfig.logging,
    dialectOptions: makeDialectOptions(),
    pool: commonPool
  });
} else if (isMySql) {
  // MySQL Database Connection
  sequelize = new Sequelize({
    database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'ngalam_fix_pro',
    username: process.env.DB_USER || process.env.MYSQL_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.DB_PASS || process.env.MYSQL_PASSWORD || '',
    host: process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || process.env.MYSQL_PORT || '3306', 10),
    dialect: 'mysql',
    logging: dbConfig.logging,
    dialectOptions: makeDialectOptions(),
    pool: commonPool
  });
} else {
  // PostgreSQL (Neon / Supabase / Local) Connection
  sequelize = new Sequelize({
    database: process.env.PGDATABASE || 'ngalam_fix_pro',
    username: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '',
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    dialect: 'postgres',
    logging: dbConfig.logging,
    dialectOptions: makeDialectOptions(),
    pool: commonPool
  });
}

module.exports = {
  development: dbConfig,
  test: dbConfig,
  production: dbConfig,
  sequelize,
  Sequelize
};
