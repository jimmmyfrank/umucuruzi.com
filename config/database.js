const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || "bowrstfi01ymihlsu4oj",
  process.env.DB_USER || "uyor7bojzohrr2to", 
  process.env.DB_PASSWORD || "uyor7bojzohrr2to",
  {
    host: process.env.DB_HOST || "bowrstfi01ymihlsu4oj-mysql.services.clever-cloud.com",
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
