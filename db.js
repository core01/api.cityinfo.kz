const Sequelize = require('sequelize');

const ApiDB = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    operatorsAliases: false
  }
);
const CityDB = new Sequelize(
  process.env.CITY_DB_NAME,
  process.env.CITY_DB_USER,
  process.env.CITY_DB_PASS,
  {
    host: process.env.CITY_DB_HOST,
    dialect: 'mysql',
    operatorsAliases: false
  }
);

module.exports.ApiDB = ApiDB;
module.exports.CityDB = CityDB;