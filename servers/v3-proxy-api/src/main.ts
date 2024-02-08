import * as Sentry from '@sentry/node';
import express, { Express } from 'express';
import config from './config';

import v3GetRouter from './routes/v3Get';

Sentry.init({
  ...config.sentry,
  debug: config.sentry.environment == 'development',
});

//todo: set telemetry -
// would it make sense to add them here or directly export/add to this package
export const app: Express = express();
app.use(express.json());
app.get('/.well-known/server-health', (req, res) => {
  res.status(200).send('ok');
});

// register public API routes
app.use('/v3/get', v3GetRouter);

export const server = app.listen({ port: config.app.port }, () =>
  console.log(`🚀 v3 Proxy API is ready at http://localhost:${config.app.port}`)
);
