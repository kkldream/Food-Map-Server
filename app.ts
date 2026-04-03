import express from 'express';
import createError from 'http-errors';
import session from 'express-session';
import {getDateFormat} from './models/utils';
import apiRoute from './routes/api';
import indexRoute from './routes/index';

declare global {
  // eslint-disable-next-line no-var
  var mongodbClient: any;
}

export function createApp() {
  const app = express();

  app.use(require('cors')());
  app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-session-secret',
    saveUninitialized: false,
    resave: false,
    name: 'user'
  }));

  app.set('views', './views');
  app.set('view engine', 'jade');

  app.use('/', (req, res, next) => {
    console.log(`[${getDateFormat()}] ${req.method}: ${req.originalUrl}`);
    next();
  });

  app.use('/', indexRoute);
  app.use('/api', apiRoute);

  app.use((req, res, next) => next(createError(404)));
  app.use((err: any, req: any, res: any, next: any) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
  });

  return app;
}
