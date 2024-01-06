import express from 'express';
import * as Sentry from '@sentry/node';
import { create } from 'unleash-server';
import { setUnleash } from './unleashClient';
import { ApolloServer } from '@apollo/server';
import config from './config';
import { IAuthOption, IAuthType } from 'unleash-server/dist/lib/types/option';
import { enableJwtAuth } from './admin/jwtAuthHook';
import http from 'http';
import cors from 'cors';
import { json } from 'body-parser';
import { expressMiddleware } from '@apollo/server/express4';
import {
  RequestHandlerContext,
  buildContext,
  getApolloServer,
} from './graphql';

export interface ServerOptions {
  port?: number;
  featureStoreRefresh?: number;
}

export async function start(port: number): Promise<{
  app: Express.Application;
  server: ApolloServer<RequestHandlerContext>;
  graphqlUrl: string;
}> {
  // Initialize sentry
  Sentry.init({
    ...config.sentry,
    debug: config.sentry.environment == 'development',
  });

  const authOptions: Partial<IAuthOption> = {
    type: IAuthType.CUSTOM,
    customAuthHandler: enableJwtAuth,
    enableApiToken: false, // For now we do not require our clients that use the unleash endpoint to use API Tokens
  };

  //No Auth on the local testing environment
  //If needed you can go to AWS and get a local clientId and clientSecret to test auth.
  if (config.bypassAuth) {
    delete authOptions.customAuthHandler;
    //Enter a random email on the login page locally.
    authOptions.type = IAuthType.NONE;
  }

  const opts: ServerOptions = { port };

  const app = express();
  const httpServer = http.createServer(app);
  //Start a default unleash server based on the docs: https://docs.getunleash.io/docs/getting_started
  const instance = await create({
    db: {
      user: config.postgres.username,
      password: config.postgres.password,
      host: config.postgres.host,
      port: config.postgres.port as number,
      database: config.postgres.dbname,
      ssl: false,
      driver: 'postgres',
    },
    authentication: authOptions,
    ui: {
      environment: process.env.NODE_ENV,
      slogan: 'Pocket Toggles',
    },
  });

  //Set unleash to a global context so we can use it in our resolvers
  setUnleash(opts);

  const server = await getApolloServer(httpServer);

  const url = config.app.graphqlEndpoint;

  //Add the Apollo GraphQL Middleware
  app.use(
    url,
    cors<cors.CorsRequest>(),
    json(),
    expressMiddleware<RequestHandlerContext>(server, { context: buildContext }),
  );

  // Expose health check url
  app.get('/.well-known/apollo/server-health', (req, res) => {
    res.status(200).send('ok');
  });

  //Then setup everything about the unleash server that we can pass to other requests
  app.use(instance.app);

  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
  return { app, server, graphqlUrl: url };
}
