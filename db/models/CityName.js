const Sequelize = require('sequelize');
const { CityDB } = require('../db');

const CityName = CityDB.define(
  'new_exchCityNames',
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: Sequelize.STRING(200)
    },
    comment: {
      type: Sequelize.TEXT('medium')
    }
  },
  {
    timestamps: false
  }
);

module.exports = CityName;