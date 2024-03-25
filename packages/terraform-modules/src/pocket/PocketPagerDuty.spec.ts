import { Testing } from 'cdktf';
import { PocketPagerDuty, PocketPagerDutyProps } from './PocketPagerDuty.js';

const config: PocketPagerDutyProps = {
  prefix: 'Test-Env',
  service: {
    criticalEscalationPolicyId: 'critical-id',
    nonCriticalEscalationPolicyId: 'non-critical-id',
  },
};

test('renders a Pocket PagerDuty for critical and non-critical actions', () => {
  const synthed = Testing.synthScope((stack) => {
    new PocketPagerDuty(stack, 'test-pagerduty', config);
  });
  expect(synthed).toMatchSnapshot();
});

test('renders a Pocket PagerDuty with custom auto resolve timeout', () => {
  const synthed = Testing.synthScope((stack) => {
    new PocketPagerDuty(stack, 'test-pagerduty', {
      ...config,
      service: {
        ...config.service,
        autoResolveTimeout: 4,
      },
    });
  });
  expect(synthed).toMatchSnapshot();
});

test('renders a Pocket PagerDuty with custom acknowledgement timeout', () => {
  const synthed = Testing.synthScope((stack) => {
    new PocketPagerDuty(stack, 'test-pagerduty', {
      ...config,
      service: {
        ...config.service,
        acknowledgementTimeout: 100,
      },
    });
  });
  expect(synthed).toMatchSnapshot();
});

test('renders a Pocket PagerDuty with sns topic tags', () => {
  const synthed = Testing.synthScope((stack) => {
    new PocketPagerDuty(stack, 'test-pagerduty', {
      ...config,
      sns: {
        topic: {
          tags: {
            Test: 'Topic',
          },
        },
      },
    });
  });
  expect(synthed).toMatchSnapshot();
});

test('renders a Pocket PagerDuty with custom sns topic subscription confirmation timeout in minutes', () => {
  const synthed = Testing.synthScope((stack) => {
    new PocketPagerDuty(stack, 'test-pagerduty', {
      ...config,
      sns: {
        subscription: {
          confirmationTimeoutInMinutes: 10,
        },
      },
    });
  });
  expect(synthed).toMatchSnapshot();
});
