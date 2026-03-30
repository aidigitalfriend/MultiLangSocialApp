const { Sequelize } = require('sequelize');

// Strip ssl query param from URL - handle via dialectOptions instead
const dbUrl = (process.env.DATABASE_URL || '').replace(/[?&]ssl=[^&]*/g, '');

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