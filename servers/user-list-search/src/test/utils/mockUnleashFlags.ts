import type { FeatureInterface } from 'unleash-client/lib/feature';
export const mockFlags = (
  input: Array<{ name: string; enabled: boolean }>,
): Array<FeatureInterface> =>
  input.map(({ name, enabled }) => ({
    enabled,
    name,
    stale: false,
    type: 'release',
    project: 'default',
    variants: [],
    strategies: [],
    impressionData: false,
  }));
