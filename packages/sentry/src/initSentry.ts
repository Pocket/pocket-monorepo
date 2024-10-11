// SENTRY MUST BE IMPORTED FIRST. DO NOT CHANGE THE ORDER OF IMPORTS
// https://docs.sentry.io/platforms/javascript/guides/express/migration/v7-to-v8/#updated-sdk-initialization
import * as Sentry from '@sentry/node';
import { type NodeOptions } from '@sentry/node';

export const initSentry = (
  options?: NodeOptions,
): Sentry.NodeClient | undefined => {
  return Sentry.init({
    ...options,
    tracesSampleRate: 0.0,
    includeLocalVariables: true,
    maxValueLength: 2000,
  });
};
