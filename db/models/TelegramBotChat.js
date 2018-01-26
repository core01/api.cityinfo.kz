const Sequelize = require('sequelize');
const { ApiDB } = require('../../db');
const TelegramBotRequest = require('./TelegramBotRequest');

const TelegramBotChat = ApiDB.define(
  'TelegramBotChat',
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    city_id: {
      type: Sequelize.INTEGER
    },
    chat_id: {
      type: Sequelize.INTEGER
    }
  },
  {
    tableName: 'telegram_bot_chats',
    timestamps: false
  }
);

module.exports = TelegramBotChat;