import { Testing } from 'cdktf';
import {
  PocketEventBridgeWithLambdaTarget,
  PocketEventBridgeWithLambdaTargetProps,
} from './PocketEventBridgeWithLambdaTarget';
import { LAMBDA_RUNTIMES } from '../base/ApplicationVersionedLambda.ts';

const config: PocketEventBridgeWithLambdaTargetProps = {
  name: 'test-event-bridge-lambda',
  eventRule: {
    eventPattern: {
      source: ['aws.states'],
      'detail-type': ['Step Functions Execution Status Change'],
    },
  },
  lambda: {
    runtime: LAMBDA_RUNTIMES.PYTHON38,
    handler: 'index.handler',
  },
};

test('renders an event bridge and lambda target with rule description', () => {
  const synthed = Testing.synthScope((stack) => {
    new PocketEventBridgeWithLambdaTarget(stack, 'test-event-bridge-lambda', {
      ...config,
      eventRule: { ...config.eventRule, description: 'Test description' },
    });
  });
  expect(synthed).toMatchSnapshot();
});

test('renders an event bridge and lambda target with event bus name', () => {
  const synthed = Testing.synthScope((stack) => {
    new PocketEventBridgeWithLambdaTarget(stack, 'test-event-bridge-lambda', {
      ...config,
      eventRule: { ...config.eventRule, eventBusName: 'test-bus' },
    });
  });
  expect(synthed).toMatchSnapshot();
});
