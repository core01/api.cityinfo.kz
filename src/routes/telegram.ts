import express, { Request, Response, NextFunction } from 'express';
import Telegraf, { ContextMessageUpdate, Markup } from 'telegraf';
import _ from 'lodash';
import { ApiDB, CityDB } from '../databases';

export const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
export const router = express.Router();

// eslint-disable-next-line
const flags = {
  USD: '\u{1F1FA}\u{1F1F8}',
  EUR: '\u{1F1EA}\u{1F1FA}',
  RUB: '\u{1F1F7}\u{1F1FA}',
  CNY: '\u{1F1E8}\u{1F1F3}',
  GBP: '\u{1F1EC}\u{1F1E7}',
};

const defaultCityId: number = 4;

const formatDate = (digit: number) => {
  if (digit < 10) {
    return '0' + digit;
  }

  return digit;
};

const checkToken = (req: Request, res: Response, next: NextFunction) => {
  if (req.params.token !== process.env.TELEGRAM_BOT_TOKEN) {
    res.status(498).json({
      success: false,
      message: 'Failed token',
      token: req.params.token,
    });
  }
  next();
};

const citySelect = (ctx: ContextMessageUpdate) => {
  let keyboard = [
    ['Нур-Султан', 'Нур-Султан Опт'],
    ['Алматы', 'Алматы Опт'],
    ['Павлодар', 'Риддер'],
    ['Усть-Каменогорск', 'Усть-Каменогорск Опт'],
  ];

  ctx.reply(
    'Привет, ' +
    ctx.message.from.first_name +
    ', для просмотра курса валют в обменных пунктах нужно выбрать город.',
    // @ts-ignore
    Markup.keyboard(keyboard)
      .resize()
      .extra(),
  );
};

router.post('/:token/webhook', function (req: Request, res: Response, next: NextFunction) {
  checkToken(req, res, next);
  // @ts-ignore
  bot.handleUpdate(req.body, res.json);

  res.status(200).json({
    success: true,
  });
});

const attachChatToCity = (city: string, chatId: number) => {
  let cities: { [key: string]: number | string } = {
    'Нур-Султан': 3,
    'Нур-Султан Опт': 8,
    'Алматы': 2,
    'Алматы Опт': 7,
    'Павлодар': 1,
    'Риддер': 6,
    'Усть-Каменогорск': 4,
    'Усть-Каменогорск Опт': 5,
  };
  let cityId = cities[city];

  ApiDB.raw(
    'INSERT INTO telegram_bot_chats (chat_id,city_id) values (?, ?) ON DUPLICATE KEY UPDATE city_id=?',
    [chatId, cityId, cityId],
  ).catch(error => {
    console.log(error);
  });
};

const currencySelect = (ctx: ContextMessageUpdate) => {
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
    // GBP
    ['Продажа\u{1F1EC}\u{1F1E7}', 'Покупка\u{1F1EC}\u{1F1E7}'],
    ['Выбор города'],
  ];

  ctx.reply(
    'Выберите валюту',
    // @ts-ignore
    Markup.keyboard(keyboard)
      .resize()
      .extra(),
  );
};

/**
 * Get currency field name by request
 * @param text
 */
const getFieldName = (text: string) => {
  const aliases: { [key: string]: string } = {
    'Покупка\u{1F1FA}\u{1F1F8}': 'buyUSD',
    'Продажа\u{1F1FA}\u{1F1F8}': 'sellUSD',
    'Покупка\u{1F1EA}\u{1F1FA}': 'buyEUR',
    'Продажа\u{1F1EA}\u{1F1FA}': 'sellEUR',
    'Покупка\u{1F1F7}\u{1F1FA}': 'buyRUB',
    'Продажа\u{1F1F7}\u{1F1FA}': 'sellRUB',
    'Покупка\u{1F1E8}\u{1F1F3}': 'buyCNY',
    'Продажа\u{1F1E8}\u{1F1F3}': 'sellCNY',
    'Покупка\u{1F1EC}\u{1F1E7}': 'buyGBP',
    'Продажа\u{1F1EC}\u{1F1E7}': 'sellGBP',
  };

  return aliases[text];
};

const getUserCityId = async (chatId: number) => {
  const rows = await ApiDB.select('city_id')
    .from('telegram_bot_chats')
    .where({ chat_id: chatId });

  if (rows.length > 0) {
    return _.map(rows, 'city_id')[0];
  }

  return defaultCityId;
};

const getCityNameById = async (id: number) => {
  const rows = await CityDB.select('name')
    .from('new_exchCityNames')
    .where({ id: id });

  return _.map(rows, 'name')[0];
};

/**
 * Log request data into `telegram_bot_requests` table
 * @param ctx
 * @param field
 * @param cityName
 */
const saveRequest = (ctx: ContextMessageUpdate, field: string, cityName: string) => {
  // сохраняем статистику по запросу
  ApiDB.insert({
    chat_id: ctx.chat.id,
    request: field + ' ' + cityName,
    date: new Date(),
    message: JSON.stringify(ctx.message),
  })
    .into('telegram_bot_requests')
    .catch(error => {
      console.log(error);
    });
};

/**
 * Gets exchange courses
 * @param ctx
 */
const getCourses = async (ctx: ContextMessageUpdate) => {
  let userCityId = await getUserCityId(ctx.chat.id);
  let field = await getFieldName(ctx.message.text);
  let messageText = ctx.message.text;

  if (process.env.NODE_ENV !== 'development') {
    let name = await getCityNameById(userCityId);
    saveRequest(ctx, field, name);
  }
  let date = new Date();
  date.setHours(0, 0, 0, 0);
  let unixTime = Math.round((date.valueOf() / 1000));

  let where = {
    city_id: userCityId,
    hidden: 0,
    published: 1,
  };
  let order = 'ASC';
  if (field.substr(0, 3) === 'buy') {
    order = 'DESC';
  }
  CityDB.select(field, 'name', 'date_update', 'info', 'phones')
    .from('new_exchange_rates')
    .where(where)
    .andWhere('date_update', '>=', unixTime)
    .andWhere(field, '>=', 1)
    .orderBy(field, order)
    .limit(15)
    .then(async rates => {

      let responseText =
        '<b>Выгодные курсы</b> обмена валют <b>(ВЫГОДНЫЕ СВЕРХУ)</b>:\n\n\r';
      let responseCoursesText = '';
      _.forEach(rates, value => {
        let date = new Date(value.date_update * 1000);
        let hours = date.getHours();
        let year = date.getFullYear();
        let day = formatDate(date.getDate());
        let month = formatDate(date.getMonth() + 1);
        let minutes = formatDate(date.getMinutes());
        responseCoursesText +=
          `<b>${_.unescape(value.name)}</b>\n\r` +
          `${messageText} = <b>${value[field]} KZT</b>\n\r` +
          `<b>Время обновления:</b> ${day}.${month}.${year} ${hours}:${minutes}\n\r`;
        if (value.phones) {
          responseCoursesText +=
            `<b>Телефоны:</b> ${value.phones}\n\r` +
            `<b>Адрес:</b> ${value.info}\n\r`;
        } else {
          responseCoursesText += `<b>Информация:</b> ${value.info}\n\r`;
        }
        responseCoursesText += '\n\r';
      });
      let url = await getCityUrlById(userCityId);
      let replyText = '';
      if (responseCoursesText === '') {
        replyText = 'Нет выгодных курсов по данной валюте.';
      } else {
        replyText = responseText + responseCoursesText + '<b>(ВЫГОДНЫЕ КУРСЫ СВЕРХУ)</b>\n\r';
      }

      ctx.reply('');
      ctx.replyWithHTML(
        replyText,
        Markup.inlineKeyboard([
          Markup.urlButton('Больше обменных пунктов', url),
          // @ts-ignore
        ]).extra(),
      );
    });
};

/**
 * Get URL to SITE_URL by cityId
 * @param cityId
 */
const getCityUrlById = async (cityId: number) => {
  let cities: { [key: number]: string } = {
    1: 'pavlodar', //'Павлодар',
    2: 'almaty', //'Алматы',
    3: 'astana', //'Нур-Султан',
    4: 'ust-kamenogorsk', //'Усть-Каменогорск',
    5: 'ust-kamenogorsk', //'Усть-Каменогорск Опт',
    6: 'ridder', //'Риддер',
    7: 'almaty',
    8: 'astana',
  };
  let link = cities[cityId];
  let baseUrl = process.env.SITE_URL + '/exchange/';
  if (link !== undefined) {
    return baseUrl + link + '/';
  }

  return baseUrl;
};

bot.command('start', citySelect);

bot.hears('Выбор города', citySelect);
bot.hears('Начать сначала', citySelect);

bot.hears('Усть-Каменогорск', currencySelect);
bot.hears('Усть-Каменогорск Опт', currencySelect);
bot.hears('Нур-Султан', currencySelect);
bot.hears('Нур-Султан Опт', currencySelect);
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
// Продажа GBP
bot.hears('Продажа\u{1F1EC}\u{1F1E7}', getCourses);
bot.hears('Покупка\u{1F1EC}\u{1F1E7}', getCourses);

export default router;