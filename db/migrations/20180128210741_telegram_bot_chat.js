exports.up = function(knex, Promise) {
  return knex.schema.createTable('telegram_bot_chat', function(t) {
    t.integer('city_id').notNull();
    t
      .integer('chat_id')
      .unsigned()
      .primary()
      .notNull();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('telegram_bot_chat');
};