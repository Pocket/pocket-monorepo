import { Testing } from 'cdktf';
import { ApplicationElasticacheClusterProps } from './ApplicationElasticacheCluster.ts';

import { ApplicationRedis } from './ApplicationRedis.ts';

const BASE_CONFIG: ApplicationElasticacheClusterProps = {
  allowedIngressSecurityGroupIds: [],
  subnetIds: ['1234-123'],
  vpcId: 'cool-vpc',
  prefix: `abides-dev`,
};

describe('ApplicationRedis', () => {
  it('renders redis with minimal config', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationRedis(stack, 'testRedis', BASE_CONFIG);
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders redis with tags', () => {
    const config: ApplicationElasticacheClusterProps = {
      ...BASE_CONFIG,
      tags: {
        letsgo: 'bowling',
        donnie: 'throwinrockstonight',
      },
    };
    const synthed = Testing.synthScope((stack) => {
      new ApplicationRedis(stack, 'testRedis', config);
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders redis with node change', () => {
    const config: ApplicationElasticacheClusterProps = {
      ...BASE_CONFIG,
      node: {
        size: 'cache.m4.2xlarge',
        count: 5,
      },
    };
    const synthed = Testing.synthScope((stack) => {
      new ApplicationRedis(stack, 'testRedis', config);
    });
    expect(synthed).toMatchSnapshot();
  });
});
