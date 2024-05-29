import * as Sentry from '@sentry/aws-serverless';

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

export const scrubData = (data: Map): Map => {
  const scrubbed: Map = {};

  for (const key in data) {
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
  Sentry.addBreadcrumb(scrubData(breadcrumbs));
};

export const captureException = async (exception: any, breadcrumbs?: Map) => {
  console.log(exception, breadcrumbs);

  if (breadcrumbs) {
    Sentry.addBreadcrumb(scrubData(breadcrumbs));
  }

  Sentry.captureException(exception);
  await Sentry.flush(2500);
};
