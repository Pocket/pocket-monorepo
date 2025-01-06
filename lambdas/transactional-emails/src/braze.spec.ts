import { generateSubscriptionPayloadForEmail } from './braze.ts';

describe('generateSubscriptionRequestBody', () => {
  it('should map subscription event', () => {
    const response = generateSubscriptionPayloadForEmail(
      'testSubscriptionId',
      true,
      ['test@email.com'],
    );
    expect(response).toEqual({
      subscription_groups: [
        {
          subscription_group_id: 'testSubscriptionId',
          subscription_state: 'subscribed',
          emails: ['test@email.com'],
        },
      ],
    });
  });
});
