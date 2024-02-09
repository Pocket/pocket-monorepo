import { Testing } from 'cdktf';

import {
  ApplicationServerlessRedis,
  ApplicationServerlessRedisProps,
} from './ApplicationServerlessRedis';

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

  it('renders redis with more then 3 subnets', () => {
    const config: ApplicationServerlessRedisProps = {
      ...BASE_CONFIG,
      subnetIds: ['subnet-1', 'subnet-2', 'subnet-3', 'subnet-4'],
    };
    const synthed = Testing.synthScope((stack) => {
      new ApplicationServerlessRedis(stack, 'testRedis', config);
    });
    expect(synthed).toMatchSnapshot();
  });

  it('errors redis with less then 2 subnets', () => {
    const config: ApplicationServerlessRedisProps = {
      ...BASE_CONFIG,
      subnetIds: ['subnet-1'],
    };

    Testing.synthScope((stack) => {
      expect(() => {
        new ApplicationServerlessRedis(stack, 'testRedis', config);
      }).toThrow('Elasticache serverless requires at least 2 subnets');
    });
  });
});
