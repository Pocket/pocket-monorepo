import { mockUnleash } from '@pocket-tools/feature-flags-client';
import { config } from '../../config';
import { Unleash, startUnleash } from 'unleash-client';
import { mockFlags } from '../../test/utils/mockUnleashFlags';

let _unleash: Unleash;

export async function unleash(): Promise<Unleash> {
  if (_unleash != null) return _unleash;
  if (process.env.NODE_ENV === 'test') {
    _unleash = mockUnleash(mockFlags)['unleash'];
  } else {
    _unleash = await startUnleash({
      url: config.unleash.endpoint,
      appName: config.serviceName,
      customHeaders: { Authorization: config.unleash.clientKey },
      timeout: config.unleash.timeout,
      namePrefix: config.unleash.namePrefix,
      refreshInterval: config.unleash.refreshInterval,
    });
  }
  return _unleash;
}
