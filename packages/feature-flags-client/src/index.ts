import { initialize, Unleash, UnleashConfig } from 'unleash-client';
import { FeatureInterface } from 'unleash-client/lib/feature';
import { serverLogger } from '@pocket-tools/ts-logger';
import mockClient from './mockClient';

export type FeatureFlagsOptions = {
  config: UnleashConfig;
  mockOptions?: {
    shouldMock?: boolean;
    bootstrap?: FeatureInterface[];
  };
};

/**
 * Create and return an Unleash client instance (global).
 *
 * Note that the client setup is asynchronous and non-blocking.
 * The unleash client may serve stale data cached to disk or
 * use fallback behavior when the application first starts up.
 * We don't want to block the application on unleash/feature
 * flags, and instead the fallback behavior should be appropriate
 * as default.
 *
 * If a mock configuration is provided, the client will return
 * the optionally provided feature strategies, and will not
 * connect to a real server instance.
 * @returns Unleash client instance (globally set)
 */
export function getClient(options: FeatureFlagsOptions) {
  const { config, mockOptions = {} } = options;
  const { shouldMock = false, bootstrap = [] } = mockOptions;
  // The actual unleash client. Note that this is not a blocking
  // call, so it's possible that the application uses stale toggles
  // on startup (defaults to any fallback values provided to `isEnabled`,
  // etc. until client is marked as ready).
  let unleash: Unleash;
  if (!shouldMock) {
    unleash = initialize(config);
    unleash.on('error', (err) =>
      serverLogger.error('Unleash errror', { data: err }),
    );
  } else {
    return mockClient(config, bootstrap);
  }
  return unleash;
}
