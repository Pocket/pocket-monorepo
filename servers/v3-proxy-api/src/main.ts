import * as Sentry from '@sentry/node';
import express, { Application, json } from 'express';
import config from './config';
import {
  clientErrorHandler,
  logAndCaptureErrors,
  sourceHeaderHandler,
} from './middleware';

import v3GetRouter from './routes/v3Get';
import v3AddRouter from './routes/v3Add';
import v3FetchRouter from './routes/v3Fetch';

Sentry.init({
  ...config.sentry,
  debug: config.sentry.environment == 'development',
});

//todo: set telemetry -
// would it make sense to add them here or directly export/add to this package

export const app: Application = express();

app.use(json());
app.set('query parser', 'simple');
app.get('/.well-known/server-health', (req, res) => {
  res.status(200).send('ok');
});

app.use(sourceHeaderHandler);

// register public API routes
app.use('/v3/get', v3GetRouter);
app.use('/v3/add', v3AddRouter);
app.use('/v3/fetch', v3FetchRouter);

// Error handling middleware (must be defined last)
app.use(logAndCaptureErrors);
app.use(clientErrorHandler);

export const server = app.listen({ port: config.app.port }, () =>
  console.log(
    `🚀 v3 Proxy API is ready at http://localhost:${config.app.port}`,
  ),
);
