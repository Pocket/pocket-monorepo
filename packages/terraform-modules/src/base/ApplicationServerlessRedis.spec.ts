import { Testing } from 'cdktf';

import {
  ApplicationServerlessRedis,
  ApplicationServerlessRedisProps,
} from './ApplicationServerlessRedis';
import { DataAwsSubnets } from '@cdktf/provider-aws/lib/data-aws-subnets';

const BASE_CONFIG: ApplicationServerlessRedisProps = {
  allowedIngressSecurityGroupIds: [],
  subnetIds: ['subnet-1', 'subnet-2', 'subnet-3'],
  vpcId: 'cool-vpc',
  prefix: `abides-dev`,
};

describe('ApplicationRedis', () => {
  it('renders redis with minimal config', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationServerlessRedis(stack, 'testRedis', BASE_CONFIG);
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders redis with tags', () => {
    const config: ApplicationServerlessRedisProps = {
      ...BASE_CONFIG,
      tags: {
        letsgo: 'bowling',
        donnie: 'throwinrockstonight',
      },
    };
    const synthed = Testing.synthScope((stack) => {
      new ApplicationServerlessRedis(stack, 'testRedis', config);
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders redis using data aws subnet', () => {
    const config: ApplicationServerlessRedisProps = {
      ...BASE_CONFIG,
    };
    const synthed = Testing.synthScope((stack) => {
      const subnets = new DataAwsSubnets(stack, 'subnets', {});

      new ApplicationServerlessRedis(stack, 'testRedis', {
        ...config,
        subnetIds: subnets.ids,
      });
    });
    expect(synthed).toMatchSnapshot();
  });
});
