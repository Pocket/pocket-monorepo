import { Testing } from 'cdktf';
import { PocketVPC } from './PocketVPC.js'
import 'cdktf/lib/testing/adapters/jest';
import { DataAwsVpc } from '@cdktf/provider-aws/lib/data-aws-vpc';

test('renders a VPC with minimal config', () => {
  const synthed = Testing.synthScope((stack) => {
    new PocketVPC(stack, 'testPocketVPC');
  });

  expect(synthed).toMatchSnapshot();
  expect(synthed).toHaveDataSource(DataAwsVpc);
});
