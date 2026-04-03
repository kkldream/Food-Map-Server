import express from 'express';
import session from 'express-session';
import {getEnv} from './lib/env';
import {errorHandler, notFoundHandler} from './middleware/errorHandler';
import {requestLogger} from './middleware/requestLogger';
import apiRoute from './routes/api';
import indexRoute from './routes/index';
import {registerSwagger} from './swagger';

interface CreateAppOptions {
  enableRequestLogging?: boolean;
}

export function createApp(options: CreateAppOptions = {}) {
  const {
    enableRequestLogging = true
  } = options;
  const env = getEnv();
  const app = express();

  app.use(require('cors')());
  app.use(session({
    secret: env.sessionSecret,
    saveUninitialized: false,
    resave: false,
    name: 'user'
  }));

  app.set('views', './views');
  app.set('view engine', 'jade');

  if (enableRequestLogging) {
    app.use('/', requestLogger);
  }

  registerSwagger(app);
  app.use('/', indexRoute);
  app.use('/api', apiRoute);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
