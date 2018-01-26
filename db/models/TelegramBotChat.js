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
    },
    created_at: {
      type: Sequelize.DATE
    },
    updated_at: {
      type: Sequelize.DATE
    }
  },
  {
    tableName: 'telegram_bot_chats'
  }
);

TelegramBotChat.hasMany(TelegramBotRequest, {
  foreignKey: 'chat_id',
  targketKey: 'chat_id'
});

module.exports = TelegramBotChat;