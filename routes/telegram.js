'use strict'

const express = require('express')
const router = express.Router()
const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')
const _ = require('lodash')
const { Op } = require('sequelize')

const botan = require('botanio')(process.env.BOTAN_TOKEN)
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)

const TelegramBotChat = require('../server/models/TelegramBotChat')
const ExchangeRate = require('../server/models/ExchangeRate')
const CityName = require('../server/models/CityName')

const flags = {
  USD: '\u{1F1FA}\u{1F1F8}',
  EUR: '\u{1F1EA}\u{1F1FA}',
  RUB: '\u{1F1F7}\u{1F1FA}',
  CNY: '\u{1F1E8}\u{1F1F3}'
}

const checkToken = function(req, res, next) {
  if (req.params.token !== process.env.TELEGRAM_BOT_TOKEN) {
    res.status(498).json({
      success: false,
      message: 'Failed token',
      token: req.params
    })
  }
  next()
}
const WrongCurrencyException = message => {
  this.message = message
  this.name = 'WrongCurrencyException'
}
const WrongCityException = message => {
  this.message = message
  this.name = 'WrongCityException'
}

const citySelect = ctx => {
  let keyboard = [
    ['Усть-Каменогорск', 'Усть-Каменогорск ОПТ'],
    ['Астана', 'Алматы', 'Павлодар', 'Риддер']
  ]

  ctx.reply(
    'Привет, ' +
      ctx.message.from.first_name +
      ', для просмотра курса валют в обменных пунктах нужно выбрать город.',
    Markup.keyboard(keyboard)
      .resize()
      .extra()
  )
}

router.post('/:token/webhook', function(req, res, next) {
  checkToken(req, res, next)
  bot.handleUpdate(req.body, res.json)
  res.status(200).json({
    success: true,
    message: ''
  })
})

router.get('/test', (req, res, next) => {
  TelegramBotChat.findAll().then(projects => {
    console.log(projects)
  })
  res.status(200).json({
    success: true,
    message: 'works'
  })
})

const attachChatToCity = (city, chatId) => {
  let cities = {
    'Усть-Каменогорск': 4,
    'Усть-Каменогорск ОПТ': 5,
    Павлодар: 1,
    Алматы: 2,
    Астана: 3,
    Риддер: 6
  }
  let cityId = cities[city]
  console.log(cityId + ' ss  ' + city)
  if (cityId !== undefined) {
    TelegramBotChat.findOrCreate({
      where: {
        chat_id: chatId
      },
      defaults: {
        city_id: cityId
      }
    }).spread((chat, created) => {
      if (created === false) {
        chat
          .update({
            city_id: cityId
          })
          .then(() => {})
      }
    })
  } else {
    throw new WrongCityException('Wrong city name = {$city}')
  }
}

const currencySelect = ctx => {
  attachChatToCity(ctx.message.text, ctx.chat.id)
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
  ]

  ctx.reply(
    'Выберите валюту',
    Markup.keyboard(keyboard)
      .resize()
      .extra()
  )
}

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
  }
  return aliases[text]
}
const getCourses = ctx => {
  //$this->attachChatToCity($text, $updates->getMessage()->getChat()->getId());
  TelegramBotChat.findOne({
    where: {
      chat_id: ctx.chat.id
    }
  }).then(async chat => {
    let userCityId = chat.city_id
    let field = await getFieldName(ctx.message.text)
    CityName.findOne({
      where: {
        id: userCityId
      }
    }).then(city => {
      try {
        botan.track(ctx.message, field + ' ' + city.name)
      } catch (err) {
        console.log('error with botan')
      }
    })
    let date = new Date()
    let yesterday = Math.round(date.setDate(date.getDate() - 1) / 1000)

    ExchangeRate.findAll({
      where: {
        city_id: userCityId,
        hidden: 0,
        published: 1,
        date_update: {
          [Op.gte]: yesterday
        }
      },
      attributes: [field, 'name', 'date_update', 'info', 'phones']
    }).then(async rates => {
      let responseText =
        '<b>Выгодные курсы</b> обмена валюты, по запросу "<b>' +
        ctx.message.text +
        '</b>":\n\r'
      let responseCoursesText = ''
      // arr Best undefined
      let arrBest = await getBestCoursesByText(ctx.message.text, rates)
      _.forEach(rates, value => {
        if (parseFloat(value[field]) === parseFloat(arrBest[field])) {
          let date = new Date(value.date_update * 1000)
          let day = date.getDate()
          let month = date.getMonth() + 1
          let hours = date.getHours()
          let year = date.getFullYear()
          let minutes = '0' + date.getMinutes()

          responseCoursesText += `<b>${_.unescape(value.name)}</b>\n\r
          ${ctx.message.text} = <b>${value[field]} KZT</b>\n\r
          <b>Время обновления:</b> ${day}.${month}.${year} ${hours}:${minutes}\n\r`
          if (value.phones) {
            responseCoursesText += `<b>Телефоны:</b> ${value.phones}\n\r
            <b>Адрес:</b> ${value.info}\n\r`
          } else {
            responseCoursesText += `<b>Информация:</b> ${value.info}\n\r`
          }
          responseCoursesText += '\n\r'
        }
      })
      let url = await getCityUrlById(userCityId)
      let replyText = ''
      if (responseCoursesText === '') {
        replyText = 'Нет выгодных курсов по данной валюте.'
      } else {
        replyText = responseText + responseCoursesText
      }
      return ctx.replyWithHTML(
        replyText,
        Markup.inlineKeyboard([
          Markup.urlButton('Более подробно на сайте', url)
        ]).extra()
      )
    })
  })
}
const getCityUrlById = async city_id => {
  let cities = {
    1: 'pavlodar', //'Павлодар',
    2: 'almaty', //'Алматы',
    3: 'astana', //'Астана',
    4: 'ust-kamenogorsk', //'Усть-Каменогорск',
    5: 'ust-kamenogorsk', //'Усть-Каменогорск ОПТ',
    6: 'ridder' //'Риддер',
  }
  let link = cities[city_id]
  let baseUrl = process.env.SITE_URL + '/exchange/'
  if (link !== undefined) {
    return baseUrl + link + '/'
  }
  return baseUrl
}
const getBestCoursesByText = async (text, rates) => {
  let field = await getFieldName(text)

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
    }
    _.forEach(rates, function(value) {
      if (field.substr(0, 3) === 'sel') {
        if (value[field] <= arrBest[field] && parseFloat(value[field]) > 0) {
          arrBest[field] = parseFloat(value[field])
        }
      } else {
        if (value[field] >= arrBest[field] && parseFloat(value[field]) > 0) {
          arrBest[field] = parseFloat(value[field])
        }
      }
    })
    return arrBest
  } else {
    throw new WrongCurrencyException('Wrong alias {text}')
  }
}

bot.command('start', citySelect)

bot.hears('Выбор города', citySelect)
bot.hears('Начать сначала', citySelect)

bot.hears('Усть-Каменогорск', currencySelect)
bot.hears('Усть-Каменогорск ОПТ', currencySelect)
bot.hears('Астана', currencySelect)
bot.hears('Алматы', currencySelect)
bot.hears('Павлодар', currencySelect)
bot.hears('Риддер', currencySelect)

bot.hears('Продажа\u{1F1FA}\u{1F1F8}', getCourses)
bot.hears('Покупка\u{1F1FA}\u{1F1F8}', getCourses)
// EUR
bot.hears('Продажа\u{1F1EA}\u{1F1FA}', getCourses)
bot.hears('Покупка\u{1F1EA}\u{1F1FA}', getCourses)
// RUB
bot.hears('Продажа\u{1F1F7}\u{1F1FA}', getCourses)
bot.hears('Покупка\u{1F1F7}\u{1F1FA}', getCourses)
// Продажа CNY
bot.hears('Продажа\u{1F1E8}\u{1F1F3}', getCourses)
bot.hears('Покупка\u{1F1E8}\u{1F1F3}', getCourses)

module.exports = router
module.exports.bot = bot