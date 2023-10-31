import * as Sentry from '@sentry/node';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { setLogger, setMorgan } from '@pocket-tools/ts-logger';
import config from '../config';
import { contextFactory, IContext } from './context';
import { startServer } from './server';

export const serverLogger = setLogger();

export async function startExpressServer(port: number): Promise<{
  app: Express.Application;
  server: ApolloServer<IContext>;
  url: string;
}> {
  Sentry.init({
    ...config.sentry,
    debug: config.sentry.environment == 'development',
  });

  // initialize express with exposed httpServer so that it may be
  // provided to drain plugin for graceful shutdown.
  const app = express();
  const httpServer = http.createServer(app);

  // set keepAliveTimeout and headersTimeout to values greater than ALB default (which is 60 seconds)
  httpServer.keepAliveTimeout = 60 * 1000 + 1000;
  httpServer.headersTimeout = 60 * 1000 + 2000;

  app.use(express.json(), setMorgan(serverLogger));

  // expose a health check url
  app.get('/.well-known/apollo/server-health', (req, res) => {
    res.status(200).send('ok');
  });

  // set up apollo server middleware
  const server = await startServer(httpServer);
  const url = '/';

  app.use(
    url,
    cors<cors.CorsRequest>(),
    expressMiddleware<IContext>(server, {
      context: contextFactory,
    })
  );

  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
  return { app, server, url };
}
