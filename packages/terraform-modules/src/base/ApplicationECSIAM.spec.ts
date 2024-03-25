import { Testing } from 'cdktf';
import {
  ApplicationECSIAM,
  ApplicationECSIAMProps,
} from './ApplicationECSIAM.js';

const BASE_CONFIG: ApplicationECSIAMProps = {
  prefix: 'abides-dev',
  taskExecutionDefaultAttachmentArn: 'someArn',
  taskExecutionRolePolicyStatements: [],
  taskRolePolicyStatements: [],
};

describe('ApplicationECSIAM', () => {
  it('renders ECS IAM with minimal config', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationECSIAM(stack, 'testECSService', BASE_CONFIG);
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders ECS IAM with tags', () => {
    BASE_CONFIG.tags = {
      letsgo: 'bowling',
      donnie: 'throwinrockstonight',
    };

    const synthed = Testing.synthScope((stack) => {
      new ApplicationECSIAM(stack, 'testECSService', BASE_CONFIG);
    });
    expect(synthed).toMatchSnapshot();
  });
});
