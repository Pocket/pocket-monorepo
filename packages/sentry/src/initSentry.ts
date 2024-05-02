import * as Sentry from '@sentry/node';
import { NodeOptions } from '@sentry/node';
import { Application } from 'express';

export const initSentry = (app: Application, options?: NodeOptions) => {
  Sentry.init({
    ...options,
    includeLocalVariables: true,
    maxValueLength: 2000,
    integrations: [
      // Autoload will pull in mysql, apollo and graphql
      // https://github.com/getsentry/sentry-javascript/blob/1f3a796e904e2f84148db80304cb5bdb83a04cb1/packages/tracing-internal/src/node/integrations/lazy.ts#L13
      ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
      // enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // enable Express.js middleware tracing
      new Sentry.Integrations.Express({
        // to trace all requests to the default router
        app,
      }),
    ],
  });
};
