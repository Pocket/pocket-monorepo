import { Testing } from 'cdktf';
import { ApplicationECR } from './ApplicationECR.ts';

describe('ApplicationECR', () => {
  it('renders an ECR without tags', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationECR(stack, 'testECR', {
        name: 'bowling',
      });
    });
    expect(synthed).toMatchSnapshot();
  });

  it('renders an ECR with tags', () => {
    const synthed = Testing.synthScope((stack) => {
      new ApplicationECR(stack, 'testECR', {
        name: 'bowling',
        tags: {
          name: 'rug',
          description: 'tiedtheroomtogether',
        },
      });
    });
    expect(synthed).toMatchSnapshot();
  });
});
