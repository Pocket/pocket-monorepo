import * as Sentry from '@sentry/node';
import config from './config';

let INIT = false;

export const initSentry = () => {
  if (!INIT) {
    Sentry.init({
      dsn: config.sentry.dsn,
      release: config.sentry.release,
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
    let [local, domain] = (email || '').split('@', 2);
    return local.substr(0, 2) + '***********@' + domain;
  },
};

export const scrubData = (data: Map): Map => {
  const scrubbed: Map = {};

  for (let key in data) {
    let val: any = data[key];

    if (typeof val === 'object') {
      scrubbed[key] = scrubData(val);
    } else {
      const scrubber = SCRUB_KEYS[key] || SCRUB_KEYS['*'];
        if (val instanceof Date) {
          val = (<Date>val).toISOString();
        }

        scrubbed[key] = scrubber(val);
    }
  }

  return scrubbed;
};

export const addBreadcrumbs = (breadcrumbs: Map): void => {
  initSentry().addBreadcrumb(scrubData(breadcrumbs));
};

export const captureException = async (exception: any, breadcrumbs?: Map) => {
  console.log(exception, breadcrumbs);

  const sentry = initSentry();

  if (breadcrumbs) {
    sentry.addBreadcrumb(scrubData(breadcrumbs));
  }

  sentry.captureException(exception);
  await sentry.flush(2500);
};
