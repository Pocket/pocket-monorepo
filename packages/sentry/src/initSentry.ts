import { NodeOptions } from '@sentry/node';
import * as Sentry from '@sentry/node';

export const initSentry = (options?: NodeOptions) => {
  Sentry.init({
    ...options,
    includeLocalVariables: true,
    maxValueLength: 2000,
  });
};
