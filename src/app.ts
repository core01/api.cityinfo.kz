import express from 'express';
import createError from 'http-errors';
import dotenv from 'dotenv';
import logger from 'morgan';
import path from 'path';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import compression from 'compression';
import helmet from 'helmet';

import courses from './routes/courses';
import telegram, { bot } from './routes/telegram';

// initialize configuration
dotenv.config();

const app = express();
app.set('port', process.env.PORT);

app.use(
  bot.webhookCallback(
    '/telegram/' + process.env.TELEGRAM_BOT_TOKEN + '/webhook',
  ),
);
bot.telegram.setWebhook(
  process.env.API_URL +
  '/telegram/' +
  process.env.TELEGRAM_BOT_TOKEN +
  '/webhook',
);

app.use(helmet());

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to cityinfo.kz api' });
});

app.use('/courses', courses);
app.use('/telegram', telegram);

app.use(compression()); //Compress all routes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(logger('dev'));
app.use(cookieParser());

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err: any, req: express.Request, res: express.Response) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

export default app;


