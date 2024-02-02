// @TODO [kshahid] need to make a common library for pocket!
import * as Sentry from '@sentry/node';
import { config } from './config';

let INIT = false;

export const initSentry = (): any => {
  if (!INIT) {
    Sentry.init({
      ...config.sentry,
      debug: config.sentry.environment == 'development',
    });
    INIT = true;
    console.log('initialized');
  }

  return Sentry;
};

interface Map {
  [key: string]: Map | any;
}

const SCRUB_KEYS: Map = {
  '*': (val: any): any => val,
  email: (email: string): string => {
    const [local, domain] = (email || '').split('@', 2);
    return local.substr(0, 2) + '***********@' + domain;
  },
};

export const scrubData = (data: Sentry.Breadcrumb): Sentry.Breadcrumb => {
  const scrubbed: Map = {};

  for (const key in data) {
    let val: any = data[key];

    if (typeof val === 'object') {
      scrubbed[key] = scrubData(val);
    } else {
      const scrubber = SCRUB_KEYS[key] || SCRUB_KEYS['*'];
      if (val instanceof Date) {
        val = (val as Date).toISOString();
      }

      scrubbed[key] = scrubber(val);
    }
  }

  return scrubbed;
};

export const addBreadcrumbs = (breadcrumbs: Sentry.Breadcrumb): void => {
  initSentry().addBreadcrumb(scrubData(breadcrumbs));
};

export const captureException = async (
  exception: any,
  breadcrumbs?: Sentry.Breadcrumb,
): Promise<any> => {
  console.log(exception, breadcrumbs);

  const sentry = initSentry();

  if (breadcrumbs) {
    sentry.addBreadcrumb(scrubData(breadcrumbs));
  }

  sentry.captureException(exception);
  return await sentry.flush(2500);
};
