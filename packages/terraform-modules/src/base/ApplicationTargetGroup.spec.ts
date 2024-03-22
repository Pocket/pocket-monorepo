import { Testing } from 'cdktf';
import { ApplicationTargetGroup } from './ApplicationTargetGroup.js';

describe('ApplicationTargetGroup', () => {
  it('renders a Target Group without tags', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationTargetGroup(stack, 'testTargetGroup', {
        shortName: 'ABC',
        vpcId: '123',
        healthCheckPath: '/',
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders a Target Group with tags', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationTargetGroup(stack, 'testTargetGroup', {
        shortName: 'A1BC',
        vpcId: '123',
        healthCheckPath: '/',
        tags: {
          name: 'thedude',
          hobby: 'bowling',
        },
      });
    });
    expect(synthed).toMatchSnapshot();
  });
});
