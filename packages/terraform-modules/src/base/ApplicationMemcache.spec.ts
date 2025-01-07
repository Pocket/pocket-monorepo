import { Testing } from 'cdktf';
import { ApplicationElasticacheClusterProps } from './ApplicationElasticacheCluster.ts';

import { ApplicationMemcache } from './ApplicationMemcache.ts';

const BASE_CONFIG: ApplicationElasticacheClusterProps = {
  allowedIngressSecurityGroupIds: [],
  subnetIds: ['1234-123'],
  vpcId: 'cool-vpc',
  prefix: `abides-dev`,
};

describe('ApplicationMemcache', () => {
  it('renders memcached with minimal config', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationMemcache(stack, 'testMemcached', BASE_CONFIG);
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders memcached with tags', () => {
    const config: ApplicationElasticacheClusterProps = {
      ...BASE_CONFIG,
      tags: {
        letsgo: 'bowling',
        donnie: 'throwinrockstonight',
      },
    };
    const synthed = Testing.synthScope((stack) => {
      new ApplicationMemcache(stack, 'testMemcached', config);
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders memcached with node change', () => {
    const config: ApplicationElasticacheClusterProps = {
      ...BASE_CONFIG,
      node: {
        size: 'cache.m4.2xlarge',
        count: 5,
      },
    };
    const synthed = Testing.synthScope((stack) => {
      new ApplicationMemcache(stack, 'testMemcached', config);
    });
    expect(synthed).toMatchSnapshot();
  });
});
