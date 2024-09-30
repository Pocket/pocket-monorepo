import { type NodeOptions } from '@sentry/node';
import * as Sentry from '@sentry/node';

export const initSentry = (options?: NodeOptions) => {
  Sentry.init({
    ...options,
    tracesSampler: (context) => {
      // Continue trace decision if there is any parentSampled information
      if (typeof context.parentSampled === 'boolean') {
        return context.parentSampled;
      }
      // Use the tracesSampler if it exists
      if (options?.tracesSampler != null) {
        return options.tracesSampler(context);
        // Otherwise, return the traces sample rate if it exists, just in case
        // (unsure about which takes precedence)
      } else if (options?.tracesSampleRate != null) {
        return options.tracesSampleRate;
        // Disable by default
      } else {
        return 0;
      }
    },
    includeLocalVariables: true,
    maxValueLength: 2000,
  });
};
