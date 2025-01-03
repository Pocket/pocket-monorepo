import { Testing } from 'cdktf';
import {
  PocketSyntheticProps,
  PocketSyntheticCheck,
} from './PocketSynthetics.ts';

const config: PocketSyntheticProps = {
  uri: 'acme.getpocket.dev',
  verifySsl: true,
};

it('renders a Pocket New Relic synthetic check', () => {
  const synthed = Testing.synthScope((stack) => {
    new PocketSyntheticCheck(stack, 'test-synthetic', config);
  });
  expect(synthed).toMatchSnapshot();
});

it('allows passing different values for nrql config', () => {
  config.nrqlConfig = { query: 'SELECT * FROM MY-COOL-TABLE' };
  const synthed = Testing.synthScope((stack) => {
    new PocketSyntheticCheck(stack, 'test-synthetic', config);
  });
  expect(synthed).toMatchSnapshot();
});
