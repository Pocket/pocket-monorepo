import https from 'https';
import { config } from './config';
import AWSXRay from 'aws-xray-sdk-core';
import xrayExpress from 'aws-xray-sdk-express';
import * as Sentry from '@sentry/node';
import express from 'express';
import { queueDeleteRouter, stripeDeleteRouter } from './routes';
import { EventEmitter } from 'events';
import { BatchDeleteHandler } from './batchDeleteHandler';
import Logger from './logger';
import morganMiddleware from './morgan';

// XRay (distributed tracing) Setup
AWSXRay.config([AWSXRay.plugins.ECSPlugin]);
AWSXRay.captureHTTPsGlobal(https, true);
AWSXRay.capturePromise();

// Sentry Setup
Sentry.init({
  ...config.sentry,
  debug: config.sentry.environment == 'development',
});

const app = express();
app.use(
  // JSON parser to enable POST body with JSON
  express.json(),
  // Logging Setup, Express app-specific
  morganMiddleware,
);

// Endpoints
app.get('/health', (req, res) => {
  Logger.info('healthcheck Logger');
  res.status(200).send('ok');
});
app.use('/queueDelete', queueDeleteRouter);
app.use('/stripeDelete', stripeDeleteRouter);

// Start batch delete event handler
new BatchDeleteHandler(new EventEmitter());

// XRay (Distributed Tracing) Setup, Express app-specific
app.use(xrayExpress.openSegment('account-data-deleter-api'));
AWSXRay.middleware.enableDynamicNaming('*');
AWSXRay.setLogger(Logger);
app.use(xrayExpress.closeSegment());

// Start Express app
app
  .listen({ port: config.app.port }, () => {
    Logger.info(`🚀 Server ready at http://localhost:${config.app.port}`);
  })
  .on('error', (_error) => {
    Sentry.captureException(_error.message);
    return Logger.error('Error: ', _error.message);
  });
