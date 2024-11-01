import * as Sentry from '@sentry/node';
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { AccountDelete, PocketEventType } from './events';
import { PocketEventBridgeClient } from './client';

describe('EventBusHandler', () => {
  const clientStub: jest.SpyInstance = jest
    .spyOn(EventBridgeClient.prototype, 'send')
    .mockImplementation(() => Promise.resolve({ FailedEntryCount: 0 }));
  const sentryStub: jest.SpyInstance = jest
    .spyOn(Sentry, 'captureException')
    .mockImplementation(() => '');
  const now = new Date('2022-01-01 00:00:00');
  const pocketEventBridgeClient = new PocketEventBridgeClient({
    eventBus: { name: 'test' },
  });

  const expectedEvent: AccountDelete = {
    'detail-type': PocketEventType.ACCOUNT_DELETION,
    detail: {
      userId: '1',
      email: 'test@email.com',
      isPremium: false,
      apiId: '1',
      version: '1.0.0',
      timestamp: now.getTime() / 1000,
      eventType: PocketEventType.ACCOUNT_DELETION,
    },
    source: 'user-events',
  };

  beforeAll(() => {
    jest.useFakeTimers({
      now: now,
      doNotFake: [
        'nextTick',
        'setImmediate',
        'clearImmediate',
        'setInterval',
        'clearInterval',
        'setTimeout',
        'clearTimeout',
      ],
      advanceTimers: false,
    });
  });

  afterEach(() => jest.clearAllMocks());
  afterAll(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  describe('pocket event', () => {
    it('should send event to event bus with proper event data', async () => {
      await pocketEventBridgeClient.sendPocketEvent(expectedEvent);
      // Event was sent to Event Bus
      expect(clientStub).toHaveBeenCalledTimes(1);
      // Check that the payload is correct; since it's JSON, we need to decode the data
      // otherwise it also does ordering check
      const sendCommand = clientStub.mock.calls[0][0].input as any;
      expect(sendCommand).toHaveProperty('Entries');
      expect(sendCommand.Entries[0]).toMatchObject({
        Source: expectedEvent.source,
        EventBusName: 'test',
        DetailType: expectedEvent['detail-type'],
      });
      expect(JSON.parse(sendCommand.Entries[0]['Detail'])).toEqual(
        expectedEvent.detail,
      );
    });
  });

  it('should log error if any events fail to send', async () => {
    clientStub.mockRestore();
    jest
      .spyOn(EventBridgeClient.prototype, 'send')
      .mockImplementationOnce(() => Promise.resolve({ FailedEntryCount: 1 }));
    await pocketEventBridgeClient.sendPocketEvent(expectedEvent);

    // Wait just a tad in case promise needs time to resolve
    expect(sentryStub).toHaveBeenCalledTimes(1);
    expect(sentryStub.mock.calls[0][0].message).toContain(
      `Failed to send event 'account-deletion' to event bus`,
    );
  });
  it('should log error if send call throws error', async () => {
    clientStub.mockRestore();
    jest
      .spyOn(EventBridgeClient.prototype, 'send')
      .mockImplementationOnce(() => Promise.reject(new Error('boo!')));
    await pocketEventBridgeClient.sendPocketEvent(expectedEvent);

    expect(sentryStub).toHaveBeenCalledTimes(1);
    expect(sentryStub.mock.calls[0][0].message).toContain('boo!');
  });
});
