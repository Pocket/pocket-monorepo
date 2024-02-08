import * as Sentry from '@sentry/node';
import { sentryDsn } from './config';

Sentry.init({ dsn: sentryDsn });

export default Sentry;
