import { FeatureInterface } from 'unleash-client/lib/feature';
import { config } from '../../config';
export const mockFlags: Array<FeatureInterface> = [
  {
    enabled: true,
    name: config.unleash.flags.semanticSearch.name,
    stale: false,
    type: 'release',
    project: 'default',
    variants: [],
    strategies: [],
    impressionData: false,
  },
];
