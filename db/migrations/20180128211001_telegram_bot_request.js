exports.up = function(knex, Promise) {
  return knex.schema.createTable('telegram_bot_request', function(t) {
    t
      .increments('id')
      .unsigned()
      .primary();
    t.integer('chat_id', 10).notNull();
    t.text('request', 'mediumtext').nullable();
    t.dateTime('date').notNull();
    t.integer('user_id', 10).notNull();
    t.text('from', 'mediumtext');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('telegram_bot_request');
};