const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // This allows Node to handshake securely with Aiven certificates
      },
      connectTimeout: 60000 // Prevents the application from exiting early during the handshake
    },
    pool: {
      max: 5, // Lowered from 10 to protect Aiven free tier memory constraints
      min: 0,
      acquire: 60000,
      idle: 10000
    }
  }
);

module.exports = sequelize;
