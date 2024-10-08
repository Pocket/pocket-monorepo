import { type NodeOptions } from '@sentry/node';
import { type SamplingContext } from '@sentry/types';
import { type Unleash } from 'unleash-client';

/**
 * Fetch a sample rate from a feature flag variant
 * If the variant is disabled or the payload cannot
 * be parsed, return 0 (do not sample).
 * @param client Unleash client reference (pre-initialized)
 * @param flagName the Flag with a variant which corresponds to
 * the desired sampling rate.
 */
export function featureFlagTraceSampler(
  client: Unleash,
  flagName: string,
): NodeOptions['tracesSampler'] {
  return (context: SamplingContext) => {
    // Continue trace decision, if there is any parentSampled information
    if (context.parentSampled !== undefined) {
      return context.parentSampled;
    }
    const variant = client.getVariant(flagName, context);
    if (variant.payload != null) {
      if (variant.payload.type === 'number') {
        return parseFloat(variant.payload.value);
      } else {
        return 0;
      }
    } else {
      return 0;
    }
  };
}
