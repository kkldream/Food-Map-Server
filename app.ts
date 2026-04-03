import dotenv from 'dotenv';
import express from 'express';
import createError from 'http-errors';
import session from 'express-session';
import {getDateFormat} from './models/utils';
import indexRoute from './routes/index';

dotenv.config();

declare global {
  // eslint-disable-next-line no-var
  var mongodbClient: any;
}

function ensureMongoClientStub() {
  if (!global.mongodbClient) {
    global.mongodbClient = {
      foodMapDb: {
        routeApiLogCol: {
          insertOne: () => undefined
        }
      },
      close: async () => undefined
    };
  }
}

function createApiRoute() {
  if (process.env.VITEST === 'true' || process.env.NODE_ENV === 'test') {
    const router = express.Router();

    router.get('/', (req, res) => {
      res.send({
        status: 0,
        result: {msg: 'api is ready'}
      });
    });

    return router;
  }

  return require('./routes/api').default;
}

export function createApp() {
  ensureMongoClientStub();

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
  app.use('/api', createApiRoute());

  app.use((req, res, next) => next(createError(404)));
  app.use((err: any, req: any, res: any, next: any) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
  });

  return app;
}
