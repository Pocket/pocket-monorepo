import { dataAwsLambdaFunction } from '@cdktf/provider-aws';
import { Testing } from 'cdktf';
import { ApplicationLambdaSnsTopicSubscription } from './ApplicationLambdaSnsTopicSubscription.js';

describe('ApplicationSqsSnsTopicSubscription', () => {
  const getConfig = (stack) => ({
    name: 'test-sns-subscription',
    snsTopicArn: 'arn:aws:sns:TopicName',
    lambda: new dataAwsLambdaFunction.DataAwsLambdaFunction(stack, 'lambda', {
      functionName: 'test-lambda',
    }),
  });

  it('renders an Lambda <> SNS subscription without tags', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationLambdaSnsTopicSubscription(
        stack,
        'lambda-sns-subscription',
        getConfig(stack),
      );
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an SQS SNS subscription with tags', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationLambdaSnsTopicSubscription(
        stack,
        'lambda-sns-subscription',
        {
          ...getConfig(stack),
          tags: { hello: 'there' },
        },
      );
    });
    expect(synthed).toMatchSnapshot();
  });
});
