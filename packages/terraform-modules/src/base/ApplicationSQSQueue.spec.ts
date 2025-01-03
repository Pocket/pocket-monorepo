import { Testing, TerraformStack } from 'cdktf';
import {
  ApplicationSQSQueue,
  ApplicationSQSQueueProps,
} from './ApplicationSQSQueue.ts';

describe('ApplicationSQSQueue', () => {
  it('renders an sqs queue without tags', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationSQSQueue(stack, 'testSQS', {
        name: 'TEST',
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an sqs queue with tags', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationSQSQueue(stack, 'testSQS', {
        name: 'TEST',
        tags: {
          test: '123',
          environment: 'prod',
        },
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an sqs queue with max message size', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationSQSQueue(stack, 'testSQS', {
        name: 'TEST',
        maxMessageSize: 86753,
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  const testFieldValidation = (config: ApplicationSQSQueueProps) => {
    const sqsConfig = {
      name: 'test',
      ...config,
    };

    expect(
      () =>
        new ApplicationSQSQueue(
          new TerraformStack(Testing.app(), 'test'),
          'test-sqs',
          sqsConfig,
        ),
    ).toThrow(Error);
  };

  it('test sqs validators', () => {
    testFieldValidation({ visibilityTimeoutSeconds: -1 });
    testFieldValidation({ visibilityTimeoutSeconds: 43201 });

    testFieldValidation({ messageRetentionSeconds: 59 });
    testFieldValidation({ messageRetentionSeconds: 1209601 });

    testFieldValidation({ maxMessageSize: 234 });
    testFieldValidation({ maxMessageSize: 262145 });

    testFieldValidation({ delaySeconds: -1 });
    testFieldValidation({ delaySeconds: 901 });

    testFieldValidation({ receiveWaitTimeSeconds: -1 });
    testFieldValidation({ receiveWaitTimeSeconds: 24 });
  });
});
