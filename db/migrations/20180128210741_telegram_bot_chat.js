exports.up = function(knex) {
  return knex.schema.createTable('telegram_bot_chats', function(t) {
    t.integer('city_id').notNull();
    t
      .integer('chat_id')
      .unsigned()
      .primary()
      .notNull();
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('telegram_bot_chats');
};