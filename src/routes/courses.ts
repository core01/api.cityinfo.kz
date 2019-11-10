import express, { Response } from 'express';
import _ from 'lodash';

const router = express.Router();

import { CityDB } from '../databases';
import { expressRequest } from '../index';

const checkToken = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const token = req.headers['courses-token'];
  if (token !== process.env.COURSES_TOKEN) {
    return res.status(498).json({
      success: false,
      message: 'Failed token',
      token: token ? token : null,
    });
  }
  return next();
};

interface Rate {
  [key: string]: number | string;
}

interface BestCourses {
  [key: string]: number;
}

interface Sorting {
  [key: string]: string;
}

interface exchangeRate {
  id: number;
  name: string;
  buyUSD: number;
  sellUSD: number;
  buyEUR: number;
  sellEUR: number;
  buyRUB: number;
  sellRUB: number;
  buyCNY: number;
  sellCNY: number;
  buyGBP: number;
  info: string;
  phones: string | string[];
  date_update: number;
  day_and_night: number;
  published: number;
  city_id: number;

  [key: string]: number | string | string[];
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
  for (let rate of rates) {
    for (let key in rate) {
      let rateValue = parseFloat(rate[key] as string);
      if (key.substr(0, 3) === 'sel') {
        if (rateValue <= arrBest[key] && rateValue > 0) {
          arrBest[key] = rateValue;
        }
      } else if (key.substr(0, 3) === 'buy') {
        if (rateValue >= arrBest[key] && rateValue > 0) {
          arrBest[key] = rateValue;
        }
      }
    }
  }

  return arrBest;
};

router.post('*', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Headers', 'courses-token');
  checkToken(req, res, next);
});

router.get('/:cityid/', function(req: express.Request, res: express.Response) {
  const gross: boolean = req.query.gross === "true";
  let where : {
    city_id: number;
    hidden: number;
    published: number;
    deleted: number;
    gross?: number;
  } = {
    city_id: req.params.cityid,
    hidden: 0,
    published: 1,
    deleted: 0,
  };

  if(gross){
   where.gross = 1;
  }

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
  let orderBy = { field: 'date_update', sorting: 'desc' };
  if (sorting[req.query.sortBy]) {
    orderBy.field = req.query.sortBy;
    orderBy.sorting = sorting[req.query.sortBy];
  }
  let date = new Date();
  date.setHours(0, 0, 0, 0);
  let unixTime = Math.round(date.valueOf() / 1000);

  let fields = [
    'id',
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
    'longitude',
    'latitude',
    'company_id',
    'gross',
  ];
  CityDB.select(fields)
    .from('new_exchange_rates')
    .where(where)
    .andWhere('date_update', '>=', unixTime)
    .orderBy(orderBy.field, orderBy.sorting)
    .then(async rows => {
      // получение выгодных курсов
      let best = await getBestCourses(rows);
      const rates = rows.map((rate: exchangeRate) => {
        rate.name = _.unescape(rate.name);
        if (rate.phones) {
          rate.phones = (rate.phones as string)
            .split(',')
            .map(phone => phone.trim());
        }

        return rate;
      });

      return res.status(200).json({ rates: rates, best: best });
    })
    .catch(function(error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Server error, please contact to administrator.',
      });
    });
});

router.post('/update/', function(req: expressRequest, res: Response) {
  let missingFields = [];
  if (req.body) {
    let exchangeRate: exchangeRate = req.body;
    let props = Object.keys(exchangeRate);
    let haystack = [
      'id',
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
      'longitude',
      'latitude',
      'company_id',
      'city_id',
    ];

    for (let prop of haystack) {
      if (props.includes(prop) && prop.length > 0) {
      } else {
        missingFields.push(prop);
      }
    }

    if (missingFields.length === 0) {
      if (exchangeRate['phones']) {
        exchangeRate['phones'] = (exchangeRate['phones'] as string)
          .split(',')
          .map(phone => phone.trim());
      }
      req.io.to(`${exchangeRate['city_id']}`).emit('update', exchangeRate);

      return res.status(200).json({
        success: true,
      });
    }
  }
  let response: {
    error: string;
    missingFileds?: string[];
  } = {
    error: 'All parameters are required',
  };

  if (missingFields.length > 0) {
    response.missingFileds = missingFields;
  }

  return res.status(422).json(response);
});

export default router;
