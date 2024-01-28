import * as Sentry from '@sentry/node';
import express, { Application, json } from 'express';
import http from 'http';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { errorHandler, defaultPlugins } from '@pocket-tools/apollo-utils';
import { createApollo4QueryValidationPlugin } from 'graphql-constraint-directive/apollo4';

import { schema } from './apollo';
import config from '../config';
import { getContext, IContext } from '../context';
import queueDeleteRouter from './routes/queueDelete';
import { setMorgan, serverLogger } from '@pocket-tools/ts-logger';

export async function startServer(port: number): Promise<{
  app: Application;
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

  // expose a health check url
  app.get('/.well-known/apollo/server-health', (req, res) => {
    res.status(200).send('ok');
  });

  app.use(
    // JSON parser to enable POST body with JSON
    json(),
    // JSON parser to enable POST body with JSON
    setMorgan(serverLogger),
  );
  app.use('/queueDelete', queueDeleteRouter);

  const server = new ApolloServer<IContext>({
    schema,
    plugins: [
      ...defaultPlugins(httpServer),
      createApollo4QueryValidationPlugin({ schema }),
    ],
    formatError: config.app.environment !== 'test' ? errorHandler : undefined,
  });

  await server.start();

  // graphql endpoint is at server base route
  const url = '/';

  app.use(
    url,
    cors<cors.CorsRequest>(),
    expressMiddleware<IContext>(server, {
      context: getContext,
    }),
  );

  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
  return { app, server, url };
}
