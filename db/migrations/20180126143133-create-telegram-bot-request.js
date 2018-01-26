'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      'telegram_bot_requests',
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER(10)
        },
        chat_id: {
          type: Sequelize.INTEGER(10)
        },
        request: {
          type: Sequelize.STRING
        },
        date: {
          type: 'TIMESTAMP',
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        user_id: {
          type: Sequelize.INTEGER(10)
        },
        from: {
          type: Sequelize.TEXT('medium')
        }
      },
      {
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci'
      }
    );
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('TelegramBotRequests');
  }
};