const { Sequelize } = require('sequelize');

// Normalize DB URL: strip ssl param and fix dialect scheme for Sequelize
const dbUrl = (process.env.DATABASE_URL || '')
  .replace(/^postgresql\+\w+:\/\//, 'postgres://')
  .replace(/[?&]ssl=[^&]*/g, '');

const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

module.exports = sequelize;