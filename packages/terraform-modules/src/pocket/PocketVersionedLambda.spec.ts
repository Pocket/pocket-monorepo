import { Testing, TerraformStack } from 'cdktf';
import {
  PocketVersionedLambda,
  PocketVersionedLambdaProps,
} from './PocketVersionedLambda';
import { LAMBDA_RUNTIMES } from '../base/ApplicationVersionedLambda.js';

const config: PocketVersionedLambdaProps = {
  name: 'test-lambda',
  lambda: {
    runtime: LAMBDA_RUNTIMES.PYTHON38,
    handler: 'index.handler',
  },
};

test('renders a lambda target', () => {
  const synthed = Testing.synthScope((stack) => {
    new PocketVersionedLambda(stack, 'test-lambda', config);
  });
  expect(synthed).toMatchSnapshot();
});

test('renders a lambda target with tags', () => {
  const synthed = Testing.synthScope((stack) => {
    new PocketVersionedLambda(stack, 'test-lambda', {
      ...config,
      tags: {
        my: 'tags',
        for: 'test',
      },
    });
  });
  expect(synthed).toMatchSnapshot();
});

test('renders a lambda with lambda description', () => {
  const synthed = Testing.synthScope((stack) => {
    new PocketVersionedLambda(stack, 'test-lambda', {
      ...config,
      lambda: { ...config.lambda, description: 'Test description' },
    });
  });
  expect(synthed).toMatchSnapshot();
});

test('renders a lambda with timeout', () => {
  const synthed = Testing.synthScope((stack) => {
    new PocketVersionedLambda(stack, 'test-lambda', {
      ...config,
      lambda: { ...config.lambda, timeout: 300 },
    });
  });
  expect(synthed).toMatchSnapshot();
});

test('renders a lambda with environment variables', () => {
  const synthed = Testing.synthScope((stack) => {
    new PocketVersionedLambda(stack, 'test-lambda', {
      ...config,
      lambda: {
        ...config.lambda,
        environment: {
          my: 'var',
          IS: 'good',
        },
      },
    });
  });
  expect(synthed).toMatchSnapshot();
});

test('renders a lambda with vpc config', () => {
  const synthed = Testing.synthScope((stack) => {
    new PocketVersionedLambda(stack, 'test-lambda', {
      ...config,
      lambda: {
        ...config.lambda,
        vpcConfig: {
          subnetIds: ['1', '2'],
          securityGroupIds: ['sec1', 'sec2'],
        },
      },
    });
  });
  expect(synthed).toMatchSnapshot();
});

test('renders a lambda with s3 bucket', () => {
  const synthed = Testing.synthScope((stack) => {
    new PocketVersionedLambda(stack, 'test-lambda', {
      ...config,
      lambda: {
        ...config.lambda,
        s3Bucket: 'test-bucket',
      },
    });
  });
  expect(synthed).toMatchSnapshot();
});

test('renders a lambda with log retention', () => {
  const synthed = Testing.synthScope((stack) => {
    new PocketVersionedLambda(stack, 'test-lambda', {
      ...config,
      lambda: {
        ...config.lambda,
        logRetention: 10,
      },
    });
  });
  expect(synthed).toMatchSnapshot();
});

test('renders a lambda with execution policy', () => {
  const synthed = Testing.synthScope((stack) => {
    new PocketVersionedLambda(stack, 'test-lambda', {
      ...config,
      lambda: {
        ...config.lambda,
        executionPolicyStatements: [
          {
            effect: 'Allow',
            actions: ['*'],
            resources: ['*'],
          },
        ],
      },
    });
  });
  expect(synthed).toMatchSnapshot();
});

test('renders a lambda with code deploy', () => {
  const synthed = Testing.synthScope((stack) => {
    new PocketVersionedLambda(stack, 'test-lambda', {
      ...config,
      lambda: {
        ...config.lambda,
        codeDeploy: {
          deploySnsTopicArn: 'arn:test',
          detailType: 'FULL',
          region: 'us-east-1',
          accountId: 'test-account',
        },
      },
    });
  });
  expect(synthed).toMatchSnapshot();
});

test('renders a lambda with code deploy with all deploy notifications turned on', () => {
  const synthed = Testing.synthScope((stack) => {
    new PocketVersionedLambda(stack, 'test-lambda', {
      ...config,
      lambda: {
        ...config.lambda,
        codeDeploy: {
          deploySnsTopicArn: 'arn:test',
          detailType: 'FULL',
          region: 'us-east-1',
          accountId: 'test-account',
          notifications: {
            // omitting notifyOnFailed since it's set to true by default if not provided
            notifyOnStarted: true,
            notifyOnSucceeded: true,
          },
        },
      },
    });
  });
  expect(synthed).toMatchSnapshot();
});

test('renders a lambda with alarms', () => {
  const synthed = Testing.synthScope((stack) => {
    new PocketVersionedLambda(stack, 'test-lambda', {
      ...config,
      lambda: {
        ...config.lambda,
        alarms: {
          invocations: {
            period: 60,
            threshold: 1,
          },
          errors: {
            period: 60,
            threshold: 1,
          },
          throttles: {
            period: 60,
            threshold: 1,
          },
          concurrentExecutions: {
            period: 60,
            threshold: 1,
          },
          duration: {
            period: 60,
            threshold: 1,
          },
        },
      },
    });
  });
  expect(synthed).toMatchSnapshot();
});

test('it can treat missing data as breaching', () => {
  const synthed = Testing.synthScope((stack) => {
    new PocketVersionedLambda(stack, 'test-lambda', {
      ...config,
      lambda: {
        ...config.lambda,
        alarms: {
          invocations: {
            period: 60,
            threshold: 1,
            treatMissingData: 'breaching',
          },
        },
      },
    });
  });
  expect(synthed).toMatchSnapshot();
});

test('renders a lambda with concurrencyLimit', () => {
  const synthed = Testing.synthScope((stack) => {
    new PocketVersionedLambda(stack, 'test-lambda', {
      ...config,
      lambda: {
        ...config.lambda,
        reservedConcurrencyLimit: 10,
      },
    });
  });
  expect(synthed).toMatchSnapshot();
});

test('renders a lambda with memorySizeInMb', () => {
  const synthed = Testing.synthScope((stack) => {
    new PocketVersionedLambda(stack, 'test-lambda', {
      ...config,
      lambda: {
        ...config.lambda,
        memorySizeInMb: 512,
      },
    });
  });
  expect(synthed).toMatchSnapshot();
});

const testAlarmValidation = (alarmType: string) => {
  const app = Testing.app();
  const stack = new TerraformStack(app, 'test');

  const eventBridgeLambdaConfig = {
    ...config,
    lambda: {
      ...config.lambda,
      alarms: {
        [alarmType]: {
          period: 60,
          threshold: 1,
          datapointsToAlarm: 2,
        },
      },
    },
  };

  expect(
    () =>
      new PocketVersionedLambda(stack, 'test-lambda', eventBridgeLambdaConfig),
  ).toThrow(Error);
};

test('it validates alarms config', () => {
  testAlarmValidation('invocations');
  testAlarmValidation('throttles');
  testAlarmValidation('concurrentExecutions');
  testAlarmValidation('errors');
  testAlarmValidation('duration');
});
