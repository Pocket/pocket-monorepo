import * as Sentry from '@sentry/node';
import { sentryDsn } from './config.js';

Sentry.init({ dsn: sentryDsn });

export default Sentry;
