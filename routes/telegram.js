'use strict';

const express = require('express');
const router = express.Router();
const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');
const _ = require('lodash');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

const { ApiDB, CityDB } = require('../db');
//const { CityDB } = require('../db');
//const TelegramBotChat = require('../db/models/TelegramBotChat');
//const TelegramBotRequest = require('../db/models/TelegramBotRequest');
//const ExchangeRate = require('../db/models/ExchangeRate');
//const CityName = require('../db/models/CityName');

const flags = {
  USD: '\u{1F1FA}\u{1F1F8}',
  EUR: '\u{1F1EA}\u{1F1FA}',
  RUB: '\u{1F1F7}\u{1F1FA}',
  CNY: '\u{1F1E8}\u{1F1F3}'
};

const formatDate = digit => {
  if (digit < 10) {
    return '0' + digit;
  }
  return digit;
};
const checkToken = (req, res, next) => {
  if (req.params.token !== process.env.TELEGRAM_BOT_TOKEN) {
    res.status(498).json({
      success: false,
      message: 'Failed token',
      token: req.params
    });
  }
  next();
};
const WrongCurrencyException = message => {
  this.message = message;
  this.name = 'WrongCurrencyException';
};
const WrongCityException = message => {
  this.message = message;
  this.name = 'WrongCityException';
};

const citySelect = ctx => {
  let keyboard = [
    ['Астана', 'Астана Опт'],
    ['Алматы', 'Алматы Опт'],
    ['Павлодар', 'Риддер'],
    ['Усть-Каменогорск', 'Усть-Каменогорск ОПТ']
  ];

  ctx.reply(
    'Привет, ' +
      ctx.message.from.first_name +
      ', для просмотра курса валют в обменных пунктах нужно выбрать город.',
    Markup.keyboard(keyboard)
      .resize()
      .extra()
  );
};

router.post('/:token/webhook', function(req, res, next) {
  checkToken(req, res, next);
  bot.handleUpdate(req.body, res.json);
  res.status(200).json({
    success: true,
    message: ''
  });
});

router.get('/test', (req, res, next) => {
  let where = {
    city_id: 4,
    hidden: 0,
    published: 1
  };
  let date = new Date();
  date = Math.round(date.setHours(0, 0, 0, 0) / 1000);
  CityDB.select('*')
    .from('new_exchange_rates')
    .where(where)
    .andWhere('date_update', '>', date)
    .then(rows => {
      res.status(200).json({
        success: true,
        message: 'works',
        rows: rows
      });
    })
    .catch(function(error) {
      console.error(error);
    });
});

const attachChatToCity = (city, chatId) => {
  let cities = {
    Астана: 3,
    'Астана Опт': 8,
    Алматы: 2,
    'Алматы Опт': 7,
    Павлодар: 1,
    Риддер: 6,
    'Усть-Каменогорск': 4,
    'Усть-Каменогорск Опт': 5
  };
  let cityId = cities[city];
  if (cityId !== undefined) {
    ApiDB.raw(
      'INSERT INTO telegram_bot_chat (chat_id,city_id) values (?, ?) ON DUPLICATE KEY UPDATE city_id=?',
      [chatId, cityId, cityId]
    );
  } else {
    throw new WrongCityException('Wrong city name = {$city}');
  }
};

const currencySelect = ctx => {
  attachChatToCity(ctx.message.text, ctx.chat.id);
  let keyboard = [
    // USD
    ['Продажа\u{1F1FA}\u{1F1F8}', 'Покупка\u{1F1FA}\u{1F1F8}'],
    // EUR
    ['Продажа\u{1F1EA}\u{1F1FA}', 'Покупка\u{1F1EA}\u{1F1FA}'],
    // RUB
    ['Продажа\u{1F1F7}\u{1F1FA}', 'Покупка\u{1F1F7}\u{1F1FA}'],
    // CNY
    ['Продажа\u{1F1E8}\u{1F1F3}', 'Покупка\u{1F1E8}\u{1F1F3}'],
    ['Выбор города']
  ];

  ctx.reply(
    'Выберите валюту',
    Markup.keyboard(keyboard)
      .resize()
      .extra()
  );
};

const getFieldName = text => {
  const aliases = {
    'Покупка\u{1F1FA}\u{1F1F8}': 'buyUSD',
    'Продажа\u{1F1FA}\u{1F1F8}': 'sellUSD',
    'Покупка\u{1F1EA}\u{1F1FA}': 'buyEUR',
    'Продажа\u{1F1EA}\u{1F1FA}': 'sellEUR',
    'Покупка\u{1F1F7}\u{1F1FA}': 'buyRUB',
    'Продажа\u{1F1F7}\u{1F1FA}': 'sellRUB',
    'Покупка\u{1F1E8}\u{1F1F3}': 'buyCNY',
    'Продажа\u{1F1E8}\u{1F1F3}': 'sellCNY'
  };
  return aliases[text];
};
const getCourses = ctx => {
  //$this->attachChatToCity($text, $updates->getMessage()->getChat()->getId());
  ApiDB.select('city_id')
    .from('telegram_bot_chat')
    .where({ chat_id: ctx.chat.id })
    .then(async rows => {
      if (rows.lenght > 0) {
        let userCityId = _.map(rows, 'city_id')[0];
        let field = await getFieldName(ctx.message.text);
        CityDB.select('name')
          .from('new_exchCityNames')
          .where({ chat_id: ctx.chat.id })
          .then(rows => {
            return _.map(rows, 'name')[0];
          })
          .then(name => {
            // сохраняем статистику по запросу
            console.log('Записать статистику по запросу ' + name);
          });

        let date = new Date();
        date = Math.round(date.setHours(0, 0, 0, 0) / 1000);
        let where = {
          city_id: userCityId,
          hidden: 0,
          published: 1
        };
        CityDB.select(field, 'name', 'date_update', 'info', 'phones')
          .from('new_exchange_rates')
          .where(where)
          .andWhere('date_update', '>', date)
          .then(async rates => {
            let responseText =
              '<b>Выгодные курсы</b> обмена валюты, по запросу "<b>' +
              ctx.message.text +
              '</b>":\n\r';
            let responseCoursesText = '';
            // arr Best undefined
            let arrBest = await getBestCoursesByText(ctx.message.text, rates);
            _.forEach(rates, value => {
              if (parseFloat(value[field]) === parseFloat(arrBest[field])) {
                let date = new Date(value.date_update * 1000);
                let day = date.getDate();
                let month = date.getMonth() + 1;
                let hours = date.getHours();
                let year = date.getFullYear();
                let minutes = date.getMinutes();
                day = formatDate(day);
                month = formatDate(month);
                minutes = formatDate(minutes);
                responseCoursesText +=
                  `<b>${_.unescape(value.name)}</b>\n\r` +
                  `${ctx.message.text} = <b>${value[field]} KZT</b>\n\r` +
                  `<b>Время обновления:</b> ${day}.${month}.${year} ${hours}:${minutes}\n\r`;
                if (value.phones) {
                  responseCoursesText +=
                    `<b>Телефоны:</b> ${value.phones}\n\r` +
                    `<b>Адрес:</b> ${value.info}\n\r`;
                } else {
                  responseCoursesText += `<b>Информация:</b> ${value.info}\n\r`;
                }
                responseCoursesText += '\n\r';
              }
            });
            let url = await getCityUrlById(userCityId);
            let replyText = '';
            if (responseCoursesText === '') {
              replyText = 'Нет выгодных курсов по данной валюте.';
            } else {
              replyText = responseText + responseCoursesText;
            }
            //ctx.reply('');
            ctx.replyWithHTML(
              replyText,
              Markup.inlineKeyboard([
                Markup.urlButton('Более подробно на сайте', url)
              ]).extra()
            );
          });
      }
    });
};
const getCityUrlById = async city_id => {
  let cities = {
    1: 'pavlodar', //'Павлодар',
    2: 'almaty', //'Алматы',
    3: 'astana', //'Астана',
    4: 'ust-kamenogorsk', //'Усть-Каменогорск',
    5: 'ust-kamenogorsk', //'Усть-Каменогорск ОПТ',
    6: 'ridder', //'Риддер',
    7: 'almaty',
    8: 'astana'
  };
  let link = cities[city_id];
  let baseUrl = process.env.SITE_URL + '/exchange/';
  if (link !== undefined) {
    return baseUrl + link + '/';
  }
  return baseUrl;
};
const getBestCoursesByText = async (text, rates) => {
  let field = await getFieldName(text);

  if (field !== undefined) {
    let arrBest = {
      buyUSD: -1,
      buyEUR: -1,
      buyRUB: -1,
      buyCNY: -1,
      sellUSD: 10000,
      sellRUB: 10000,
      sellEUR: 10000,
      sellCNY: 10000
    };
    _.forEach(rates, function(value) {
      if (field.substr(0, 3) === 'sel') {
        if (value[field] <= arrBest[field] && parseFloat(value[field]) > 0) {
          arrBest[field] = parseFloat(value[field]);
        }
      } else {
        if (value[field] >= arrBest[field] && parseFloat(value[field]) > 0) {
          arrBest[field] = parseFloat(value[field]);
        }
      }
    });
    return arrBest;
  } else {
    throw new WrongCurrencyException('Wrong alias {text}');
  }
};

bot.command('start', citySelect);

bot.hears('Выбор города', citySelect);
bot.hears('Начать сначала', citySelect);

bot.hears('Усть-Каменогорск', currencySelect);
bot.hears('Усть-Каменогорск Опт', currencySelect);
bot.hears('Астана', currencySelect);
bot.hears('Астана Опт', currencySelect);
bot.hears('Алматы', currencySelect);
bot.hears('Алматы Опт', currencySelect);
bot.hears('Павлодар', currencySelect);
bot.hears('Риддер', currencySelect);

bot.hears('Продажа\u{1F1FA}\u{1F1F8}', getCourses);
bot.hears('Покупка\u{1F1FA}\u{1F1F8}', getCourses);
// EUR
bot.hears('Продажа\u{1F1EA}\u{1F1FA}', getCourses);
bot.hears('Покупка\u{1F1EA}\u{1F1FA}', getCourses);
// RUB
bot.hears('Продажа\u{1F1F7}\u{1F1FA}', getCourses);
bot.hears('Покупка\u{1F1F7}\u{1F1FA}', getCourses);
// Продажа CNY
bot.hears('Продажа\u{1F1E8}\u{1F1F3}', getCourses);
bot.hears('Покупка\u{1F1E8}\u{1F1F3}', getCourses);

module.exports = router;
module.exports.bot = bot;