const express = require('express');
// eslint-disable-next-line
const dotenv = require('dotenv').config();
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compression = require('compression');
const helmet = require('helmet');
const { bot } = require('./routes/telegram');

const telegram = require('./routes/telegram');
const courses = require('./routes/courses');

const app = express();

if (process.env.NODE_ENV === 'production') {
  app.use(
    bot.webhookCallback(
      '/telegram/' + process.env.TELEGRAM_BOT_TOKEN + '/webhook'
    )
  );
  bot.telegram.setWebhook(
    process.env.API_URL +
      '/telegram/' +
      process.env.TELEGRAM_BOT_TOKEN +
      '/webhook'
  );
}
app.use(helmet());
app.get('/', function (req, res) {
  res.json({ message: 'Welcome to cityinfo.kz api' });
});
app.use('/telegram', telegram);
app.use('/courses', courses);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(compression()); //Compress all routes

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res) {
  // set locals, only providing error in development
  let response = {
    success: false,
    code: err.status || 500,
    message: err.message
  };
  response =
    req.app.get('env') !== 'production'
      ? Object.assign(response, { stack: err.stack })
      : response;

  res.status(err.status || 500);
  res.json(response);
});

module.exports = app;