import express, { Application, json, urlencoded } from 'express';
import cors from 'cors';
import { sentryPocketMiddleware } from '@pocket-tools/apollo-utils';
import {
  clientErrorHandler,
  logAndCaptureErrors,
  sentryTagHandler,
  sourceHeaderHandler,
} from './middleware';
import { Server, createServer } from 'http';

import v3GetRouter from './routes/v3Get';
import v3AddRouter from './routes/v3Add';
import v3FetchRouter from './routes/v3Fetch';
import v3SendRouter from './routes/v3Send';
import multer from 'multer';

export async function startServer(port: number): Promise<{
  server: Server;
  app: Application;
}> {
  const app: Application = express();
  const httpServer: Server = createServer(app);
  const sizeLimit = '15mb';

  app.use(json({ limit: sizeLimit }));

  app.use(
    cors({
      credentials: true,
      origin: function (origin, callback) {
        // Put the requester in the Allow origin header.
        callback(null, origin);
      },
    }),
  );
  app.use(urlencoded({ limit: sizeLimit, extended: true }));
  app.use(multer().none());
  app.set('query parser', 'simple');
  app.get('/.well-known/server-health', (req, res) => {
    res.status(200).send('ok');
  });

  app.use(sourceHeaderHandler);
  app.use(sentryPocketMiddleware);
  app.use(sentryTagHandler);

  // register public API routes
  app.use('/v3/get', v3GetRouter);
  app.use('/v3/add', v3AddRouter);
  app.use('/v3/fetch', v3FetchRouter);
  app.use('/v3/send', v3SendRouter);

  // NOTE: we on purpose do not setup the sentry middleware in this service since it is a proxy and we log our own errors.

  // Error handling middleware (must be defined last)
  app.use(logAndCaptureErrors);
  app.use(clientErrorHandler);

  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
  return { server: httpServer, app };
}
