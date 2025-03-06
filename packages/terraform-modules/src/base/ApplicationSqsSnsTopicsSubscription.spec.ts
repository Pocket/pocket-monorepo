import { sqsQueue } from '@cdktf/provider-aws';
import { Testing } from 'cdktf';
import { ApplicationSqsSnsTopicsSubscription } from './ApplicationSqsSnsTopicsSubscription.ts';

describe('ApplicationSqsSnsTopicSubscription', () => {
  const getConfig = (stack) => ({
    name: 'test-sns-subscription',
    subscriptions: [
      { name: 'TopicName', snsTopicArn: 'arn:aws:sns:TopicName' },
      { name: 'TopicSub2', snsTopicArn: 'arn:aws:sns:AnotherTopic' },
    ],
    sqsQueue: new sqsQueue.SqsQueue(stack, 'sqs', {
      name: 'test-sqs',
    }),
  });

  const getConfigWithDlq = (stack) => ({
    name: 'test-sns-subscription',
    subscriptions: [
      {
        snsTopicArn: 'arn:aws:sns:TopicName',
        name: 'TopicSub',
        snsDlq: new sqsQueue.SqsQueue(stack, 'dlq', {
          name: 'test-sqs-dlq',
        }),
      },
    ],
    sqsQueue: new sqsQueue.SqsQueue(stack, 'sqs', {
      name: 'test-sqs',
    }),
  });

  it('renders an SQS SNS subscription without tags', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationSqsSnsTopicsSubscription(
        stack,
        'sqs-sns-subscription',
        getConfig(stack),
      );
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an SQS SNS subscription with tags', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationSqsSnsTopicsSubscription(stack, 'sqs-sns-subscription', {
        ...getConfig(stack),
        tags: { hello: 'there' },
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an SQS SNS subscription with dlq passed', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationSqsSnsTopicsSubscription(stack, 'sqs-sns-subscription', {
        ...getConfigWithDlq(stack),
        tags: { hello: 'there' },
      });
    });
    expect(synthed).toMatchSnapshot();
  });
});
