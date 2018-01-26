'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      'telegram_bot_chats',
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER(10)
        },
        city_id: {
          type: Sequelize.INTEGER(10)
        },
        chat_id: {
          type: Sequelize.INTEGER(10)
        }
      },
      {
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci'
      }
    );
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('telegram_bot_chats');
  }
};