'use strict';

const express = require('express');
const router = express.Router();
const _ = require('lodash');
const { CityDB } = require('../db');

const checkToken = async (req, res, next) => {
  if (req.headers['courses-token'] !== process.env.COURSES_TOKEN) {
    return res.status(498).json({
      success: false,
      message: 'Failed token',
      token: req.headers['courses-token']
    });
  }
  return next();
};

router.all('*', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Headers', 'courses-token');
  checkToken(req, res, next);
});

router.get('/:cityid/', function(req, res, next) {
  let where = {
    city_id: req.params.cityid,
    hidden: 0,
    published: 1
  };

  let sorting = {
    buyUSD: 'desc',
    buyEUR: 'desc',
    buyRUB: 'desc',
    buyCNY: 'desc',
    sellUSD: 'asc',
    sellEUR: 'asc',
    sellRUB: 'asc',
    sellCNY: 'asc'
  };
  let orderBy = { field: 'id', sorting: 'desc' };
  if (sorting[req.query.sortBy]) {
    orderBy.field = req.query.sortBy;
    orderBy.sorting = sorting[req.query.sortBy];
  }
  let date = new Date();
  date = Math.round(date.setHours(0, 0, 0, 0) / 1000);
  let fields = [
    'name',
    'buyUSD',
    'sellUSD',
    'buyEUR',
    'sellEUR',
    'buyRUB',
    'sellRUB',
    'buyCNY',
    'sellCNY',
    'info',
    'phones',
    'date_update',
    'day_and_night',
    'published'
  ];
  CityDB.select(fields)
    .from('new_exchange_rates')
    .where(where)
    .andWhere('date_update', '>', date)
    .orderBy(orderBy.field, orderBy.sorting)
    .then(rows => {
      return res.status(200).json(rows);
    })
    .catch(function(error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Server error, please contact to administrator.'
      });
    });
});

module.exports = router;