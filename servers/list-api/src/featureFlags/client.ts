import { Unleash } from 'unleash-client';
import config from '../config';
import { getUnleash, mockUnleash } from '@pocket-tools/feature-flags-client';
import { FeatureInterface } from 'unleash-client/lib/feature';

let _unleash: Unleash;

export function getClient(localMocks?: FeatureInterface[]): Unleash {
  const unleashConfig = {
    url: config.unleash.endpoint,
    appName: config.serviceName,
    customHeaders: { Authorization: config.unleash.clientKey },
    timeout: 2000, // ms
    refreshInterval: 60000, //ms
  };
  if (process.env.NODE_ENV !== 'test') {
    if (_unleash == null) {
      _unleash = getUnleash(unleashConfig);
    }
    return _unleash;
  } else {
    const { unleash } = mockUnleash(localMocks ?? []);
    return unleash;
  }
}
