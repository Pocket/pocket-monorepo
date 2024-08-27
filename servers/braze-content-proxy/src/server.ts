import express, { Application, json } from 'express';
import * as Sentry from '@sentry/node';
import collectionRouter from './routes/collection';
import scheduledStoriesRouter from './routes/scheduledItems';
import { Server, createServer } from 'http';
import { serverLogger } from '@pocket-tools/ts-logger';

export async function startServer(port: number) {
  const app: Application = express();
  const httpServer: Server = createServer(app);

  app.use(json());
  app.get('/.well-known/server-health', (req, res) => {
    res.status(200).send('ok');
  });

  app.use('/collection/', collectionRouter);
  app.use('/scheduled-items/', scheduledStoriesRouter);

  app.set('query parser', 'simple');
  app.get('/.well-known/server-health', (req, res) => {
    res.status(200).send('ok');
  });

  app.use((err, req, res, next) => {
    if (res.headersSent) {
      return next(err);
    }

    // Log error to CloudWatch
    serverLogger.error(err);

    // Send error to Sentry
    Sentry.captureException(err);

    /**
     * If Pocket Hits stories are unavailable for whatever reason, the emails
     * should not be sent out. To achieve this, Braze needs to receive a 500 or 502
     * error if anything is amiss - if a 404 error is sent instead, Braze will
     * render an empty string and proceed with sending out the email.
     *
     * See Braze docs on Connected Content:
     * https://www.braze.com/docs/user_guide/personalization_and_dynamic_content/connected_content/making_an_api_call/
     */
    res.status(500).json({ error: err.message });
  });

  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
  return { server: httpServer, app };
}
