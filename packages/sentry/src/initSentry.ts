import { NodeOptions } from '@sentry/node/types/types';
import * as Sentry from '@sentry/node';

export const initSentry = (options?: NodeOptions) => {
  Sentry.init({
    includeLocalVariables: true,
    maxValueLength: 2000,
    // https://github.com/getsentry/sentry-javascript/blob/develop/packages/node/src/sdk/index.ts#L82-L84
    tracesSampleRate: 0,
    ...options,
  });
};
