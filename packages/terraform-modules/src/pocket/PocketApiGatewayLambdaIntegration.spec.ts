import { Testing } from 'cdktf';
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
  const now = 1637693316456;

  beforeAll(() => {
    jest.useFakeTimers({
      now: now,
      advanceTimers: false,
    });
  });

  afterAll(() => jest.useRealTimers());

  it('renders an api gateway with a lambda integration', () => {
    const synthed = Testing.synthScope((stack) => {
      new PocketApiGateway(stack, 'test-api-lambda', {
        ...config,
      });
    });
    expect(synthed).toMatchSnapshot();
  });
});
