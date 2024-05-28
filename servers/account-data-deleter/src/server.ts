import { config } from './config';
import { initSentry } from '@pocket-tools/sentry';
import * as Sentry from '@sentry/node';
// Sentry Setup
initSentry({
  ...config.sentry,
  debug: config.sentry.environment == 'development',
});

import express, { Application, json } from 'express';
import { queueDeleteRouter, stripeDeleteRouter } from './routes';
import { EventEmitter } from 'events';
import { BatchDeleteHandler } from './batchDeleteHandler';
import { serverLogger, setMorgan } from '@pocket-tools/ts-logger';
import { sentryPocketMiddleware } from '@pocket-tools/apollo-utils';
import { unleash } from './unleash';
const app: Application = express();

// Initialize unleash client
unleash();

app.use(
  // JSON parser to enable POST body with JSON
  json(),
  sentryPocketMiddleware,
  // Logging Setup, Express app-specific
  setMorgan(serverLogger),
);

// Endpoints
app.get('/health', (req, res) => {
  serverLogger.info('healthcheck Logger');
  res.status(200).send('ok');
});
app.use('/queueDelete', queueDeleteRouter);
app.use('/stripeDelete', stripeDeleteRouter);

Sentry.setupExpressErrorHandler(app);

// Start batch delete event handler
new BatchDeleteHandler(new EventEmitter());

// Start Express app
app
  .listen({ port: config.app.port }, () => {
    serverLogger.info(`🚀 Server ready at http://localhost:${config.app.port}`);
  })
  .on('error', (_error) => {
    Sentry.captureException(_error.message);
    return serverLogger.error('Error: ', _error.message);
  });
