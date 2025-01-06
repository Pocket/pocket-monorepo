import { Testing } from 'cdktf';
import { ApplicationRDSCluster } from './ApplicationRDSCluster.ts';

describe('ApplicationRDSCluster', () => {
  it('renders a RDS cluster', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationRDSCluster(stack, 'testRDSCluster', {
        prefix: 'bowling-',
        vpcId: 'rug',
        subnetIds: ['0', '1'],
        rdsConfig: {
          masterUsername: 'walter',
          masterPassword: 'bowling',
          databaseName: 'walter',
          engine: 'aurora-mysql',
        },
        tags: {
          whodis: 'walter',
        },
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders a RDS cluster with a database URL', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationRDSCluster(stack, 'testRDSCluster', {
        prefix: 'bowling-',
        vpcId: 'rug',
        subnetIds: ['0', '1'],
        rdsConfig: {
          masterUsername: 'walter',
          masterPassword: 'bowling',
          databaseName: 'walter',
          engine: 'aurora-mysql',
        },
        tags: {
          whodis: 'walter',
        },
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders a RDS cluster without a name', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationRDSCluster(stack, 'testRDSCluster', {
        prefix: 'bowling-',
        vpcId: 'rug',
        subnetIds: ['0', '1'],
        useName: false,
        rdsConfig: {
          masterUsername: 'walter',
          masterPassword: 'bowling',
          databaseName: 'walter',
          engine: 'aurora-mysql',
        },
        tags: {
          whodis: 'walter',
        },
      });
    });
    expect(synthed).toMatchSnapshot();
  });
});
