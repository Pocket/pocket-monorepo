import { initialize, Unleash, UnleashConfig } from 'unleash-client';
import { serverLogger } from '@pocket-tools/ts-logger';
export { mockClient } from './mockClient';

/*
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
export function getClient(config: UnleashConfig) {
  // The actual unleash client. Note that this is not a blocking
  // call, so it's possible that the application uses stale toggles
  // on startup (defaults to any fallback values provided to `isEnabled`,
  // etc. until client is marked as ready).
  let unleash: Unleash;
  unleash = initialize(config);
  unleash.on('error', (err) =>
    serverLogger.error('Unleash errror', { data: err }),
  );
  return unleash;
}
