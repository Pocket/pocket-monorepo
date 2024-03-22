import { Testing } from 'cdktf';
import { PocketVPC } from './PocketVPC.js';
import 'cdktf/lib/testing/adapters/jest';
import { dataAwsVpc } from '@cdktf/provider-aws';

test('renders a VPC with minimal config', () => {
  const synthed = Testing.synthScope((stack) => {
    new PocketVPC(stack, 'testPocketVPC');
  });

  expect(synthed).toMatchSnapshot();
  expect(synthed).toHaveDataSource(dataAwsVpc.DataAwsVpc);
});
