import { NodeOptions } from '@sentry/node/types/types';
import * as Sentry from '@sentry/node';

export const initSentry = (options?: NodeOptions) => {
  Sentry.init({
    ...options,
    includeLocalVariables: true,
    maxValueLength: 2000,
  });
};
