import { Testing } from 'cdktf';
import { PocketVPC } from './PocketVPC.js';

test('renders a VPC with minimal config', () => {
  const synthed = Testing.synthScope((stack) => {
    new PocketVPC(stack, 'testPocketVPC');
  });

  expect(synthed).toMatchSnapshot();
});
