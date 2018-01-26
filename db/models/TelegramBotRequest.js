const Sequelize = require('sequelize');
const { ApiDB } = require('../../db');
const TelegramBotChat = require('./TelegramBotChat');

const TelegramBotRequest = ApiDB.define(
  'TelegramBotRequest',
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    chat_id: { type: Sequelize.INTEGER },
    request: { type: Sequelize.STRING },
    date: { type: Sequelize.DATE },
    user_id: { type: Sequelize.INTEGER },
    data: { type: Sequelize.TEXT }
  },
  {
    tableName: 'telegram_bot_requests'
  }
);

TelegramBotRequest.hasOne(TelegramBotChat, {
  foreignKey: 'chat_id',
  targketKey: 'chat_id'
});

module.exports = TelegramBotRequest;