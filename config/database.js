const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

if (process.env.DATABASE_URL) {
  // Production / Render configuration using Aiven's Service URI
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false 
      },
      connectTimeout: 60000 // Give the connection up to 60 seconds to handshake (fixes ETIMEDOUT)
    },
    pool: {
      max: 5, // Lowered from 10 to keep connections safe on free tier resources
      min: 0,
      acquire: 60000, // Wait up to 60 seconds to acquire a connection pool slot
      idle: 10000
    }
  });
} else {
  // Local development configuration
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect: 'mysql',
      logging: false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

module.exports = sequelize;
