import { Testing } from 'cdktf';
import {
  ApplicationEventBus,
  ApplicationEventBusProps,
} from './ApplicationEventBus';

describe('ApplicationEventBus', () => {
  it('renders an event bus with name and target', () => {
    const props: ApplicationEventBusProps = {
      name: 'test-event-bus',
      tags: { service: 'test-service' },
    };
    const synthed = Testing.synthScope((stack) => {
      new ApplicationEventBus(stack, 'test-event-bus', props);
    });
    expect(synthed).toMatchSnapshot();
  });
});
