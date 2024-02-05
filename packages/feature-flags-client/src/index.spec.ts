import { getClient } from '.';
import { Unleash, destroy } from 'unleash-client';

describe('feature flags client', () => {
  afterEach(() => destroy());
  it('returns an unleash client instance', () => {
    const client = getClient({
      config: {
        appName: 'test-app',
        url: 'http://localhost:4949',
        refreshInterval: 0,
      },
    });
    expect(client).toBeInstanceOf(Unleash);
  });
  it('creates a mock instance if mock options are provided', () => {
    const client = getClient({
      config: {
        appName: 'test-app',
        url: 'http://localhost:4949',
        refreshInterval: 0,
      },
      mockOptions: {
        shouldMock: true,
      },
    });
    expect(client).toBeInstanceOf(Unleash);
    expect(client.getFeatureToggleDefinitions()).toEqual([]);
  });
  it('bootstraps with mock data if provided', () => {
    const testFeatureToggle = {
      enabled: true,
      name: 'test-toggle',
      stale: false,
      type: 'release',
      project: 'default',
      variants: [],
      strategies: [],
      impressionData: false,
    };
    const client = getClient({
      config: {
        appName: 'test-app',
        url: 'http://localhost:4949',
        refreshInterval: 0,
      },
      mockOptions: {
        shouldMock: true,
        bootstrap: [testFeatureToggle],
      },
    });
    expect(client).toBeInstanceOf(Unleash);
    expect(client.getFeatureToggleDefinition('test-toggle')).toEqual(
      testFeatureToggle,
    );
  });
});
