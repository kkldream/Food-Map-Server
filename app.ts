import express from 'express';
import createError from 'http-errors';
import dotenv from 'dotenv';
import {getDateFormat} from './models/utils';
import indexRoute from './routes/index';
import apiRoute from './routes/api';
import MongodbClient from "./models/mongodbMgr";
import session from 'express-session';

dotenv.config();

// init express
const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());
app.use(session({
    secret: 'mySecret',
    saveUninitialized: false,
    resave: false,
    name: 'user'
}));

// mongodb init
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
declare global { var mongodbClient: MongodbClient; }
global.mongodbClient = new MongodbClient(MONGODB_URL, () => {
    console.log('mongo client is connected');
    // start express listen
    app.listen(port, () => {
        console.log(`server is running on http://localhost:${port}/`);
    });
});

// view engine setup
app.set('views', './views');
app.set('view engine', 'jade');

// routes handler
app.use('/', function (req: any, res: any, next: any) {
    console.log(`[${getDateFormat()}] ${req.method}: ${req.originalUrl}`);
    next();
});
app.use('/api', apiRoute);
app.use('/', indexRoute);

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

// 終止程式時觸發
process.on('SIGINT', async () => {
    await global.mongodbClient.close();
    process.exit(0);
});
