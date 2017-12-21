const Sequelize = require('sequelize')
const { ApiDB } = require('../db')

const TelegramBotChat = ApiDB.define('telegram_bot_chats', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  city_id: {
    type: Sequelize.INTEGER,
  },
  chat_id: {
    type: Sequelize.INTEGER,
  },
  created_at: {
    type: Sequelize.DATE,
  },
  updated_at: {
    type: Sequelize.DATE,
  },
}, {
  timestamps: false,
})

module.exports = TelegramBotChat