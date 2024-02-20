import { Unleash, UnleashEvents } from 'unleash-client';
import { RepositoryInterface } from 'unleash-client/lib/repository';
import { EventEmitter } from 'events';
import {
  EnhancedFeatureInterface,
  FeatureInterface,
} from 'unleash-client/lib/feature';
import { Segment } from 'unleash-client/lib/strategy/strategy';

/**
 * Create a local unleash client with bootstrapped feature
 * flags data for testing.
 * @param bootstrap Feature flags toggles (used for testing)
 */
const client = (bootstrap?: FeatureInterface[]) => {
  // Have to construct a custom repository and
  // emit the UnleashEvents.Ready event from it;
  // If using bootstrap data alone and not connecting
  // to a real unleash server, the client will override
  // bootstrapped data with fallback if provided
  class LocalRepo extends EventEmitter implements RepositoryInterface {
    private toggleData: { [key: string]: FeatureInterface };
    constructor(private data: FeatureInterface[]) {
      super();
      this.toggleData = data.reduce((compiled, curr) => {
        compiled[curr.name] = curr;
        return compiled;
      }, {});
    }
    stop(): void {
      true;
    }
    async start(): Promise<void> {
      true;
    }
    getToggles(): FeatureInterface[] {
      return this.data;
    }
    getSegment(id: number): Segment {
      return {} as unknown as Segment;
    }
    getToggle(name: string): FeatureInterface {
      return this.toggleData[name];
    }
    getTogglesWithSegmentData(): EnhancedFeatureInterface[] {
      return [];
    }
  }
  const repo = new LocalRepo(bootstrap);

  const unleash = new Unleash({
    appName: 'test-app',
    url: 'https://whatever.com/api',
    refreshInterval: 0,
    disableMetrics: true,
    repository: repo,
  });
  // Notify that it's ready (does not connect to anything)
  // If this isn't done, any fallbacks provided to `isEnabled`
  // or similar will override the passed data.
  repo.emit(UnleashEvents.Ready);
  return unleash;
};

export default client;
