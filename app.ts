import express from 'express';
import createError from 'http-errors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
const { apiResponseBase } = require('./models/dataStruct/apiResponseBase');
const { getDateFormat } = require('./models/utils');

dotenv.config();

// start express listen
const app = express();
const port = 3000;
app.listen(port, () => {
    console.log(`server is running on http://localhost:${port}/`);
});
app.use(bodyParser.json())

// view engine setup
app.set('views', './views');
app.set('view engine', 'jade');

// routes handler
app.use('/', function (req: any, res: any, next: any) {
    console.log(`[${getDateFormat()}] ${req.method}: ${req.originalUrl}`);
    next();
});
app.use('/', require('./routes/index'));

app.use('/api', function (req: any, res: any, next: any) {
    let token = req.body.token;
    if (token === process.env.REQUEST_TOKEN) {
        delete req.body.token;
        next();
    } else res.send({errMsg: 'token fail'});
});
app.use('/api/restaurant', require('./routes/googleRoute'));
app.use('/api/user', require('./routes/userRoute'));
app.use(function (req: any, res: any, next: any) {
    let response = apiResponseBase();
    response.status = -1;
    response.errMsg = `Not found '${req.url}' api`;
    res.send(response);
});

// catch 404 and forward to error handler
app.use(function (req: any, res: any, next: any) {
    next(createError(404));
});

// error handler
app.use(function (err: any, req: any, res: any, next: any) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});