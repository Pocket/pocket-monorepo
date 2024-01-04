import { PinpointController } from './pinpointController';

describe('PinpointController', () => {
  it('generates the correct emailEndpointId from userId', () => {
    const pinpointController = new PinpointController('lyledylandy');
    expect(pinpointController.emailEndpointId).toBe(
      '6872d15a1028c0d92ac9772647b5824e3fb71550efbf1e27530596ff637f544b',
    );
  });
  it('throws an error if try to construct with empty userId', () => {
    expect(() => new PinpointController('')).toThrow(
      "Can't create PinpointController",
    );
  });
});
