import { Testing } from 'cdktf';
import sinon from 'sinon';
import { LAMBDA_RUNTIMES } from '../base/ApplicationVersionedLambda';
import {
  PocketApiGateway,
  PocketApiGatewayProps,
} from './PocketApiGatewayLambdaIntegration';

const config: PocketApiGatewayProps = {
  name: 'test-api-lambda',
  stage: 'test',
  domain: 'exampleapi.getpocket.dev',
  basePath: 'fxaProxy',
  routes: [
    {
      path: 'endpoint',
      method: 'POST',
      eventHandler: {
        name: 'lambda-endpoint',
        lambda: {
          runtime: LAMBDA_RUNTIMES.PYTHON38,
          handler: 'index.handler',
        },
      },
    },
  ],
};

describe('PocketApiGatewayLambdaIntegration', () => {
  let clock;
  const now = 1637693316456;

  beforeAll(() => {
    clock = sinon.useFakeTimers({
      now: now,
      shouldAdvanceTime: false,
    });
  });

  afterAll(() => clock.restore());

  it('renders an api gateway with a lambda integration', () => {
    const synthed = Testing.synthScope((stack) => {
      new PocketApiGateway(stack, 'test-api-lambda', {
        ...config,
      });
    });
    expect(synthed).toMatchSnapshot();
  });
});
