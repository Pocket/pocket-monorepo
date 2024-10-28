# Tracing

We use this package to implement tracing within our servers. Requires Sentry as our trace propogator.

# Local/Test Setup

We use a feature flag to control the percentage of traces which we sample and send to our collector.

When running locally, you can construct a mock Unleash client which mimics this feature flag:

```
const unleash = mockUnleash([
  {
    name: 'perm.backend.sentry-trace-sampler-rate',
    enabled: true,
    strategies: [
      {
        name: 'default',
        constraints: [],
        parameters: {
          rollout: '100',
          stickiness: 'default',
          groupId: 'perm.backend.sentry-trace-sampler-rate',
        },
        variants: [
          {
            name: 'samplePercent',
            weight: 1000,
            payload: { type: PayloadType.NUMBER, value: '1.0' },
          },
        ],
      },
    ],
  },
]).unleash;
```
