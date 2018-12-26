exports.up = function(knex) {
  return knex.schema.createTable('telegram_bot_requests', function(t) {
    t
      .increments('id')
      .unsigned()
      .primary();
    t.integer('chat_id', 10).notNull();
    t.text('request', 'mediumtext').nullable();
    t.dateTime('date').notNull();
    t.text('message', 'mediumtext');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('telegram_bot_requests');
};