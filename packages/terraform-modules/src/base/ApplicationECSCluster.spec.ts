import { Testing } from 'cdktf';
import { ApplicationECSCluster } from './ApplicationECSCluster.js'

describe('ApplicationECSCluster', () => {
  it('renders an ECS cluster without tags', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationECSCluster(stack, 'testECSCluster', {
        prefix: 'bowling-',
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an ECS cluster with tags', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationECSCluster(stack, 'testECSCluster', {
        prefix: 'bowling-',
        tags: {
          name: 'maude',
          description: 'artist',
        },
      });
    });
    expect(synthed).toMatchSnapshot();
  });
});
