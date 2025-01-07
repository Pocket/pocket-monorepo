import { sqsQueue } from '@cdktf/provider-aws';
import { Testing } from 'cdktf';
import { ApplicationSqsSnsTopicSubscription } from './ApplicationSqsSnsTopicSubscription.ts';

describe('ApplicationSqsSnsTopicSubscription', () => {
  const getConfig = (stack) => ({
    name: 'test-sns-subscription',
    snsTopicArn: 'arn:aws:sns:TopicName',
    sqsQueue: new sqsQueue.SqsQueue(stack, 'sqs', {
      name: 'test-sqs',
    }),
  });

  const getConfigWithDlq = (stack) => ({
    name: 'test-sns-subscription',
    snsTopicArn: 'arn:aws:sns:TopicName',
    sqsQueue: new sqsQueue.SqsQueue(stack, 'sqs', {
      name: 'test-sqs',
    }),
    snsDlq: new sqsQueue.SqsQueue(stack, 'dlq', {
      name: 'test-sqs-dlq',
    }),
  });

  it('renders an SQS SNS subscription without tags', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationSqsSnsTopicSubscription(
        stack,
        'sqs-sns-subscription',
        getConfig(stack),
      );
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an SQS SNS subscription with tags', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationSqsSnsTopicSubscription(stack, 'sqs-sns-subscription', {
        ...getConfig(stack),
        tags: { hello: 'there' },
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an SQS SNS subscription witg dlq passed', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationSqsSnsTopicSubscription(stack, 'sqs-sns-subscription', {
        ...getConfigWithDlq(stack),
        tags: { hello: 'there' },
      });
    });
    expect(synthed).toMatchSnapshot();
  });
});
