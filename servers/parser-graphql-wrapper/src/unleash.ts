import { getUnleash } from '@pocket-tools/feature-flags-client';
import config from './config';
import { Unleash } from 'unleash-client';

let _unleash: Unleash;

export function unleash(): Unleash {
  if (_unleash != null) return _unleash;
  _unleash = getUnleash({
    url: config.unleash.endpoint,
    appName: config.serviceName,
    customHeaders: { Authorization: config.unleash.clientKey },
    timeout: config.unleash.timeout,
    namePrefix: config.unleash.namePrefix,
    refreshInterval: config.unleash.refreshInterval,
  });
  return _unleash;
}
