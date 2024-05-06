import { Testing } from 'cdktf';
import {
  ApplicationLambdaCodeDeploy,
  ApplicationVersionedLambdaCodeDeployProps,
} from './ApplicationLambdaCodeDeploy.js';

const config: ApplicationVersionedLambdaCodeDeployProps = {
  name: 'Test-Lambda-Code-Deploy',
  region: 'us-east-1',
  accountId: '123',
};

describe('ApplicationLambdaCodeDeploy', () => {
  it('renders a lambda code deploy app', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationLambdaCodeDeploy(stack, 'test-lambda-code-deploy', config);
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders a lambda code deploy app with sns topic arn', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationLambdaCodeDeploy(stack, 'test-lambda-code-deploy', {
        ...config,
        deploySnsTopicArn: 'test:deploy-topic:arn',
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders a lambda code deploy app with sns topic arn and detail type', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationLambdaCodeDeploy(stack, 'test-lambda-code-deploy', {
        ...config,
        deploySnsTopicArn: 'test:deploy-topic:arn',
        detailType: 'FULL',
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders a lambda code deploy app with default notifications', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationLambdaCodeDeploy(stack, 'test-lambda-code-deploy', {
        ...config,
        deploySnsTopicArn: 'test:deploy-topic:arn',
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders a lambda code deploy app with started and succeeded notifications only', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationLambdaCodeDeploy(stack, 'test-lambda-code-deploy', {
        ...config,
        deploySnsTopicArn: 'test:deploy-topic:arn',
        notifications: {
          //have to explicitly set notifyOnFailed to false since it'll be set to true as default
          notifyOnFailed: false,
          notifyOnStarted: true,
          notifyOnSucceeded: true,
        },
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders a lambda code deploy app with all notifications enabled', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationLambdaCodeDeploy(stack, 'test-lambda-code-deploy', {
        ...config,
        deploySnsTopicArn: 'test:deploy-topic:arn',
        notifications: {
          //not setting the notifyOnFailed since it will be enabled by default if not provided
          notifyOnStarted: true,
          notifyOnSucceeded: true,
        },
      });
    });
    expect(synthed).toMatchSnapshot();
  });
});
