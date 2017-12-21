const express = require('express')
const dotenv = require('dotenv').config()
const path = require('path')
const favicon = require('serve-favicon')
const logger = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const compression = require('compression')
const helmet = require('helmet')
const {bot} = require('./routes/telegram')

//const index = require('./routes/index')
//const users = require('./routes/users')
const telegram = require('./routes/telegram')

const app = express()

app.use(bot.webhookCallback('/telegram/' + process.env.TELEGRAM_BOT_TOKEN +
    '/webhook'))
bot.telegram.setWebhook(process.env.API_URL + '/telegram/' +
    process.env.TELEGRAM_BOT_TOKEN + '/webhook')

// view engine setup
//app.set('views', path.join(__dirname, 'views'))
//app.set('view engine', 'pug')

app.use(helmet())
app.use('/telegram', telegram)
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(cookieParser())
app.use(compression()) //Compress all routes
app.use(express.static(path.join(__dirname, 'public')))

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    const err = new Error('Not Found')
    err.status = 404
    next(err)
})

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    let response = {success: false, code: err.status || 500, message: err.message};
    response = req.app.get('env') !== 'production' ? Object.assign(response, {stack: err.stack}) : response

    res.status(err.status || 500)
    res.json(response)

})

module.exports = app
