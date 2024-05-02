import { getUnleash, mockUnleash } from './index.js';
import { Unleash, destroy } from 'unleash-client';

describe('feature flags client', () => {
  afterEach(() => destroy());
  it('returns an unleash client instance', () => {
    const client = getUnleash({
      appName: 'test-app',
      url: 'http://localhost:4949',
      refreshInterval: 0,
    });
    expect(client).toBeInstanceOf(Unleash);
  });
  it('creates a mock instance if mock options are provided', () => {
    const { unleash: client } = mockUnleash([], {
      appName: 'test-app',
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
    const { unleash: client } = mockUnleash([testFeatureToggle], {
      appName: 'test-app',
    });
    expect(client).toBeInstanceOf(Unleash);
    expect(client.getFeatureToggleDefinition('test-toggle')).toEqual(
      testFeatureToggle,
    );
  });
  it('does not overrwrite bootstrapped data with fallback', () => {
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
    const { unleash: client } = mockUnleash([testFeatureToggle], {
      appName: 'test-app',
      url: 'http://localhost:4949',
    });
    expect(client).toBeInstanceOf(Unleash);
    expect(client.isEnabled('test-toggle', undefined, false)).toEqual(true);
  });
  it('allows for changing values', () => {
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
    const { unleash: client, repo } = mockUnleash([testFeatureToggle], {
      appName: 'test-app',
      url: 'http://localhost:4949',
    });
    expect(client).toBeInstanceOf(Unleash);
    expect(client.isEnabled('test-toggle', undefined, false)).toEqual(true);
    repo.setToggle('test-toggle', { ...testFeatureToggle, enabled: false });
    expect(client.isEnabled('test-toggle', undefined, true)).toEqual(false);
  });
});
