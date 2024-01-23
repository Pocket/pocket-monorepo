import { config } from './config';
import * as Sentry from '@sentry/node';
import express, { json } from 'express';
import { queueDeleteRouter, stripeDeleteRouter } from './routes';
// import { EventEmitter } from 'events';
// import { BatchDeleteHandler } from './batchDeleteHandler';
import Logger from './logger';
import { setMorgan } from '@pocket-tools/ts-logger';

// Sentry Setup
Sentry.init({
  ...config.sentry,
  debug: config.sentry.environment == 'development',
});

const app = express();
app.use(
  // JSON parser to enable POST body with JSON
  json(),
  // Logging Setup, Express app-specific
  setMorgan(Logger),
);

// Endpoints
app.get('/health', (req, res) => {
  Logger.info('healthcheck Logger');
  res.status(200).send('ok');
});
app.use('/queueDelete', queueDeleteRouter);
app.use('/stripeDelete', stripeDeleteRouter);

// Start batch delete event handler
// Turning off for now for database migrations
// new BatchDeleteHandler(new EventEmitter());

// Start Express app
app
  .listen({ port: config.app.port }, () => {
    Logger.info(`🚀 Server ready at http://localhost:${config.app.port}`);
  })
  .on('error', (_error) => {
    Sentry.captureException(_error.message);
    return Logger.error('Error: ', _error.message);
  });
