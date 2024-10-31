import * as Sentry from '@sentry/node';
import { setTimeout } from 'timers/promises';
import EventEmitter from 'events';
import { EventType } from '../eventType';
import { EventBusHandler } from './eventBusHandler';
import {
  AccountPayload,
  PocketEventType,
  PocketEventBridgeClient,
  AccountDelete,
  AccountEmailUpdated,
} from '@pocket-tools/event-bridge';

/**
 * Mock event payload
 */
const userEventData = {
  id: '1',
  email: 'test@email.com',
  isPremium: false,
};

describe('EventBusHandler', () => {
  const clientStub: jest.SpyInstance = jest
    .spyOn(PocketEventBridgeClient.prototype, 'sendPocketEvent')
    .mockImplementation(() => Promise.resolve());
  const sentryStub: jest.SpyInstance = jest
    .spyOn(Sentry, 'captureException')
    .mockImplementation(() => '');
  const emitter = new EventEmitter();
  new EventBusHandler().init(emitter);
  const now = new Date('2022-01-01 00:00:00');

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

  it('registers listeners on all events in the config map', () => {
    const fake = jest.fn().mockReturnValue({ eventType: 'fake' });
    const testEmitter = new EventEmitter();
    const mapping = {
      [EventType.ACCOUNT_DELETE]: () => fake(),
    };
    new EventBusHandler().init(testEmitter, mapping);
    expect(testEmitter.listeners('ACCOUNT_DELETE').length).toBe(1);
    testEmitter.emit('ACCOUNT_DELETE');
    expect(fake).toHaveBeenCalledTimes(1);
  });

  describe('user account delete event', () => {
    const partialExpectedEvent: Omit<AccountPayload, 'eventType'> = {
      userId: '1',
      email: 'test@email.com',
      isPremium: false,
      apiId: '1',
      version: '1.0.0',
      timestamp: now.getTime() / 1000,
    };

    it('should send event to event bus with proper event data', async () => {
      const eventType = PocketEventType.ACCOUNT_DELETION;
      const emittedEvent = EventType.ACCOUNT_DELETE;
      emitter.emit(emittedEvent, {
        user: {
          ...userEventData,
        },
        apiUser: {
          apiId: '1',
        },
        eventType: emittedEvent,
      });
      const expectedEvent: AccountPayload = {
        eventType,
        ...partialExpectedEvent,
      };
      // Wait just a tad in case promise needs time to resolve
      await setTimeout(100);
      // Listener was registered on event
      expect(emitter.listeners(emittedEvent).length).toBe(1);
      // Event was sent to Event Bus
      expect(clientStub).toHaveBeenCalledTimes(1);
      // Check that the payload is correct; since it's JSON, we need to decode the data
      // otherwise it also does ordering check
      const sendCommand = clientStub.mock.calls[0][0] as any;
      const pocketEvent: AccountDelete = {
        'detail-type': PocketEventType.ACCOUNT_DELETION,
        detail: expectedEvent,
        source: 'user-events',
      };
      expect(sendCommand).toMatchObject(pocketEvent);
    });
  });

  describe('user email updated event', () => {
    const partialExpectedEvent: Omit<AccountPayload, 'eventType'> = {
      userId: '1',
      email: 'test@email.com',
      isPremium: false,
      apiId: '1',
      version: '1.0.0',
      timestamp: now.getTime() / 1000,
    };

    it('should send event to event bus with proper event data', async () => {
      const eventType = PocketEventType.ACCOUNT_EMAIL_UPDATED;
      const emittedEvent = EventType.ACCOUNT_EMAIL_UPDATED;
      emitter.emit(emittedEvent, {
        user: {
          ...userEventData,
        },
        apiUser: {
          apiId: '1',
        },
        eventType: emittedEvent,
      });
      const expectedEvent: AccountPayload = {
        eventType,
        ...partialExpectedEvent,
      };
      // Wait just a tad in case promise needs time to resolve
      await setTimeout(100);
      expect(sentryStub).toHaveBeenCalledTimes(0);
      // Listener was registered on event
      expect(emitter.listeners(emittedEvent).length).toBe(1);
      // Event was sent to Event Bus
      expect(clientStub).toHaveBeenCalledTimes(1);
      // Check that the payload is correct; since it's JSON, we need to decode the data
      // otherwise it also does ordering check
      const sendCommand = clientStub.mock.calls[0][0] as any;
      const pocketEvent: AccountEmailUpdated = {
        'detail-type': PocketEventType.ACCOUNT_EMAIL_UPDATED,
        detail: expectedEvent,
        source: 'user-events',
      };
      expect(sendCommand).toMatchObject(pocketEvent);
    });
  });
});
