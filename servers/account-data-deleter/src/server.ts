import { config } from './config';
import * as Sentry from '@sentry/node';
import express, { Application, json } from 'express';
import { queueDeleteRouter, stripeDeleteRouter } from './routes';
import { EventEmitter } from 'events';
import { BatchDeleteHandler } from './batchDeleteHandler';
import { serverLogger, setMorgan } from '@pocket-tools/ts-logger';
import { sentryPocketMiddleware } from '@pocket-tools/apollo-utils';
import { initSentry } from '@pocket-tools/sentry';
import { unleash } from './unleash';
const app: Application = express();

// Sentry Setup
initSentry(app, {
  ...config.sentry,
  debug: config.sentry.environment == 'development',
});

// Initialize unleash client
unleash();

// RequestHandler creates a separate execution context, so that all
// transactions/spans/breadcrumbs are isolated across requests
app.use(Sentry.Handlers.requestHandler() as express.RequestHandler);
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

app.use(
  // JSON parser to enable POST body with JSON
  json(),
  sentryPocketMiddleware,
  // Logging Setup, Express app-specific
  setMorgan(serverLogger),
);

// Endpoints
app.get('/health', (req, res) => {
  Logger.info('healthcheck Logger');
  res.status(200).send('ok');
});
app.use('/queueDelete', queueDeleteRouter);
app.use('/stripeDelete', stripeDeleteRouter);

// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler() as express.ErrorRequestHandler);

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
