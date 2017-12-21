const Sequelize = require('sequelize')
const {CityDB} = require('../db')

const ExchangeRate = CityDB.define('new_exchange_rates', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  exchanger_id: {
    type: Sequelize.INTEGER,
  },
  date_update: {
    type: Sequelize.INTEGER,
  },
  buyUSD: {
    type: Sequelize.FLOAT,
  },
  sellUSD: {
    type: Sequelize.FLOAT,
  },
  buyEUR: {
    type: Sequelize.FLOAT,
  },
  sellEUR: {
    type: Sequelize.FLOAT,
  },
  buyRUB: {
    type: Sequelize.FLOAT,
  },
  sellRUB: {
    type: Sequelize.FLOAT,
  },
  buyCNY: {
    type: Sequelize.FLOAT,
  },
  sellCNY: {
    type: Sequelize.FLOAT,
  },
  city_id: {
    type: Sequelize.INTEGER,
  },
  day_and_night: {
    type: Sequelize.TINYINT,
  },
  company_id: {
    type: Sequelize.INTEGER,
  },
  published: {
    type: Sequelize.TINYINT,
  },
  hidden: {
    type: Sequelize.TINYINT,
  },
  info: {
    type: Sequelize.TEXT('medium'),
  },
  phones: {
    type: Sequelize.TEXT('medium'),
  },
  name: {
    type: Sequelize.STRING,
  },
}, {
  timestamps: false,
})

module.exports = ExchangeRate