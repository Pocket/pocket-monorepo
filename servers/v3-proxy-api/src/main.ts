import * as Sentry from '@sentry/node';
import express, { Application, json } from 'express';
import config from './config';
import { Server, createServer } from 'http';

import v3GetRouter from './routes/v3Get';

Sentry.init({
  ...config.sentry,
  debug: config.sentry.environment == 'development',
});

//todo: set telemetry -
// would it make sense to add them here or directly export/add to this package
export const app: Application = express();
export const server: Server = createServer(app);

app.use(json());
app.set('query parser', 'simple');
app.get('/.well-known/server-health', (req, res) => {
  res.status(200).send('ok');
});

// register public API routes
app.use('/v3/get', v3GetRouter);

server.listen({ port: config.app.port }, () =>
  console.log(
    `🚀 v3 Proxy API is ready at http://localhost:${config.app.port}`,
  ),
);
