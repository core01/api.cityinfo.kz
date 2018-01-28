require('dotenv').config();

const knex = require('knex');

const ApiDBConfig = {
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS
  },
  migrations: {
    directory: __dirname + '/db/migrations',
    tableName: 'migrations'
  }
};

const CityDBConfig = {
  client: 'mysql2',
  connection: {
    host: process.env.CITY_DB_HOST,
    database: process.env.CITY_DB_NAME,
    user: process.env.CITY_DB_USER,
    password: process.env.CITY_DB_PASS
  }
};

module.exports = {
  ApiDBConfig: ApiDBConfig,
  CityDBConfig: CityDBConfig,
  ApiDB: knex(ApiDBConfig),
  CityDB: knex(CityDBConfig)
};