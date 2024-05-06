import { Testing } from 'cdktf';
import {
  PocketAwsSyntheticCheckProps,
  PocketAwsSyntheticChecks,
} from './PocketCloudwatchSynthetics.js';

const testConfig: PocketAwsSyntheticCheckProps = {
  environment: 'Dev',
  prefix: 'ACME-Dev',
  query: [
    {
      endpoint: 'acme.getpocket.dev',
      userId: '1',
      data: '{"query": "query { someGraphQlQuery(arg1: \\"1\\", arg2: \\"1\\") {returnedAttr} }"}',
      jmespath: 'errors[0].message',
      response: 'Error - Not Found: A resource by that arg1 could not be found',
    },
  ],
  shortName: 'ACME',
  uptime: [
    {
      response: 'ok',
      url: `acme.getpocket.dev/.well-known/apollo/server-health`,
    },
  ],
};

describe('Pocket Cloudwatch Synthetics', () => {
  it('renders desired AWS Synthetic Checks', () => {
    const synthedStack = Testing.synthScope((stack) => {
      new PocketAwsSyntheticChecks(stack, 'test-synthetics', testConfig);
    });

    expect(synthedStack).toMatchSnapshot();
  });

  it('adds optional Alarms & Alarm Actions to Synthetic Checks ', () => {
    testConfig.alarmTopicArn =
      'arn:aws:sns:us-east-1:123456789101:Test-Sns-Topic';

    const synthedStack = Testing.synthScope((stack) => {
      new PocketAwsSyntheticChecks(stack, 'test-synthetics', testConfig);
    });

    expect(synthedStack).toMatchSnapshot();
  });
});
