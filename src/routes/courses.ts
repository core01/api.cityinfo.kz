import express, { Response } from 'express';

const router = express.Router();
import _ from 'lodash';

import { CityDB } from '../databases';
import { expressRequest } from '../index';

/*const checkToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.headers['courses-token'] !== process.env.COURSES_TOKEN) {
    return res.status(498).json({
      success: false,
      message: 'Failed token',
      token: req.headers['courses-token'],
    });
  }
  return next();
};*/

interface Rate {
  [key: string]: number | string
}

interface BestCourses {
  [key: string]: number
}

interface Sorting {
  [key: string]: string
}

interface exchangeRate {
  name: string,
  buyUSD: number,
  sellUSD: number,
  buyEUR: number,
  sellEUR: number,
  buyRUB: number,
  sellRUB: number,
  buyCNY: number,
  sellCNY: number,
  buyGBP: number,
  info: string,
  phones: string,
  date_update: number,
  day_and_night: number,
  published: number,
  city_id: number,
}

// Расчитывает выгодные курсы покупки/продажи
const getBestCourses = async (rates: Rate[]) => {

  let arrBest: BestCourses = {
    buyUSD: 1,
    buyEUR: 1,
    buyRUB: 1,
    buyCNY: 1,
    buyGBP: 1,
    sellUSD: 10000,
    sellRUB: 10000,
    sellEUR: 10000,
    sellCNY: 10000,
    sellGBP: 10000,
  };
  _.forEach(rates, function (rate) {
    _.forEach(rate, (value, key) => {
      let rateValue = parseFloat(value as string);
      if (key.substr(0, 3) === 'sel') {
        if (rateValue <= arrBest[key] && rateValue > 0) {
          arrBest[key] = rateValue;
        }
      } else if (key.substr(0, 3) === 'buy') {
        if (value >= arrBest[key] && rateValue > 0) {
          arrBest[key] = rateValue;
        }
      }
    });
  });
  return arrBest;
};

// router.all('*', (req, res, next) => {
//   res.setHeader('Access-Control-Allow-Headers', 'courses-token');
//   checkToken(req, res, next);
// });

router.get('/:cityid/', function (req: express.Request, res: express.Response) {
  let where = {
    city_id: req.params.cityid,
    hidden: 0,
    published: 1,
  };

  let sorting: Sorting = {
    buyUSD: 'desc',
    buyEUR: 'desc',
    buyRUB: 'desc',
    buyCNY: 'desc',
    buyGBP: 'desc',
    sellUSD: 'asc',
    sellEUR: 'asc',
    sellRUB: 'asc',
    sellCNY: 'asc',
    sellGBP: 'asc',
  };
  let orderBy = { field: 'id', sorting: 'desc' };
  if (sorting[req.query.sortBy]) {
    orderBy.field = req.query.sortBy;
    orderBy.sorting = sorting[req.query.sortBy];
  }
  let date = new Date();
  date.setHours(0, 0, 0, 0);
  let unixTime = Math.round((date.valueOf() / 1000));

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
    'buyGBP',
    'sellGBP',
    'info',
    'phones',
    'date_update',
    'day_and_night',
    'published',
  ];
  CityDB.select(fields)
    .from('new_exchange_rates')
    .where(where)
    .andWhere('date_update', '>=', unixTime)
    .orderBy(orderBy.field, orderBy.sorting)
    .then(async rows => {
      // получение выгодных курсов
      let best = await getBestCourses(rows);

      return res.status(200).json({ rates: rows, best: best });
    })
    .catch(function (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Server error, please contact to administrator.',
      });
    });
});

router.post('/update/', function (req: expressRequest, res: Response) {
  console.log(req.body);
  if (req.body) {
    let exchangeRate: exchangeRate = req.body;
    let props = Object.keys(exchangeRate);
    let haystack = [
      'name',
      'buyUSD',
      'sellUSD',
      'buyEUR',
      'sellEUR',
      'buyRUB',
      'sellRUB',
      'buyCNY',
      'sellCNY',
      'buyGBP',
      'sellGBP',
      'info',
      'phones',
      'date_update',
      'day_and_night',
      'published',
      'city_id',
    ];
    let count = 0;
    for (let prop of haystack) {
      if (props.includes(prop)) {
        count++;
      }
    }
    console.log(count);
    if (count === haystack.length) {
      req.io.emit('update', exchangeRate);

      return res.status(200).json({
        success: true,
      });
    }
  }

  return res.status(422).json({
    error: 'All parameters are required',
  });

});

export default router;