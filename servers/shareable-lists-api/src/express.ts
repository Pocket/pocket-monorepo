import cors from 'cors';
import express, { Application, json } from 'express';
import { Server, createServer } from 'http';

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { setMorgan, serverLogger } from '@pocket-tools/ts-logger';
import * as Sentry from '@sentry/node';

import config from './config';
import { client } from './database/client';
import deleteUserDataRouter from './public/routes/deleteUserData';
import { getPublicContext, IPublicContext } from './public/context';
import { getAdminContext, IAdminContext } from './admin/context';
import { startAdminServer } from './admin/server';
import { startPublicServer } from './public/server';
import { sentryPocketMiddleware } from '@pocket-tools/apollo-utils';
import { initSentry } from '@pocket-tools/sentry';
import { getRedis } from './cache';

/**
 * Initialize an express server.
 *
 * @param port number
 */
export async function startServer(port: number): Promise<{
  app: Application;
  adminServer: ApolloServer<IAdminContext>;
  adminUrl: string;
  publicServer: ApolloServer<IPublicContext>;
  publicUrl: string;
}> {
  // initialize express with exposed httpServer so that it may be
  // provided to drain plugin for graceful shutdown.
  const app: Application = express();
  const httpServer: Server = createServer(app);

  initSentry(app, {
    ...config.sentry,
    debug: config.sentry.environment == 'development',
  });

  // RequestHandler creates a separate execution context, so that all
  // transactions/spans/breadcrumbs are isolated across requests
  app.use(Sentry.Handlers.requestHandler() as express.RequestHandler);
  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());

  app.use(
    // JSON parser to enable POST body with JSON
    json(),
    sentryPocketMiddleware,
    // JSON parser to enable POST body with JSON
    setMorgan(serverLogger),
  );

  // Add route to delete user data
  app.use('/deleteUserData', deleteUserDataRouter);

  // expose a health check url that makes sure the express app is up and the db
  // and the cache is reachable
  app.get('/.well-known/apollo/server-health', async (req, res) => {
    // Check redis can connect
    try {
      const redis = getRedis();
      await redis.set('test', true, 1);
    } catch (error) {
      res.status(500).send('cache error');
      serverLogger.error(error);
      return;
    }

    try {
      const db = client();
      await db.$queryRaw`SELECT 1`;
    } catch (error) {
      res.status(500).send('db fail');
      serverLogger.error(error);
      return;
    }

    res.status(200).send('ok');
  });

  // set up the admin server
  const adminServer = await startAdminServer(httpServer);
  const adminUrl = '/admin';

  app.use(
    adminUrl,
    cors<cors.CorsRequest>(),
    expressMiddleware<IAdminContext>(adminServer, {
      context: getAdminContext,
    }),
  );

  // set up the public server
  const publicServer = await startPublicServer(httpServer);
  const publicUrl = '/';

  app.use(
    publicUrl,
    cors<cors.CorsRequest>(),
    expressMiddleware<IPublicContext>(publicServer, {
      context: getPublicContext,
    }),
  );

  // The error handler must be before any other error middleware and after all controllers
  app.use(Sentry.Handlers.errorHandler() as express.ErrorRequestHandler);

  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
  return { app, adminServer, adminUrl, publicServer, publicUrl };
}
