import sinon from 'sinon';
import * as Sentry from '@sentry/node';
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import config from '../../config';
import { setTimeout } from 'timers/promises';
import EventEmitter from 'events';
import { EventType } from '../eventType';
import { UserEventsPayload, EventBridgeEventType } from './types';
import { EventBusHandler } from './eventBusHandler';

/**
 * Mock event payload
 */
const userEventData = {
  id: '1',
  email: 'test@email.com',
  isPremium: false,
};

describe('EventBusHandler', () => {
  const sandbox = sinon.createSandbox();
  const clientStub = sandbox
    .stub(EventBridgeClient.prototype, 'send')
    .resolves({ FailedEntryCount: 0 });
  const sentryStub = sandbox.stub(Sentry, 'captureException').resolves();
  const crumbStub = sandbox.stub(Sentry, 'addBreadcrumb').resolves();
  const consoleSpy = sandbox.spy(console, 'log');
  const emitter = new EventEmitter();
  new EventBusHandler().init(emitter);
  const now = new Date('2022-01-01 00:00:00');
  let clock;

  beforeAll(() => {
    clock = sinon.useFakeTimers({
      now: now,
      shouldAdvanceTime: false,
    });
  });

  afterEach(() => sandbox.resetHistory());
  afterAll(() => {
    sandbox.restore();
    clock.restore();
  });

  it('registers listeners on all events in the config map', () => {
    const fake = sinon.stub().returns({ eventType: 'fake' });
    const testEmitter = new EventEmitter();
    const mapping = {
      [EventType.ACCOUNT_DELETE]: () => fake(),
    };
    new EventBusHandler().init(testEmitter, mapping);
    expect(testEmitter.listeners('ACCOUNT_DELETE').length).toBe(1);
    testEmitter.emit('ACCOUNT_DELETE');
    expect(fake.callCount).toBe(1);
  });

  describe('user account delete event', () => {
    const partialExpectedEvent: Omit<UserEventsPayload, 'eventType'> = {
      userId: '1',
      email: 'test@email.com',
      isPremium: false,
      apiId: '1',
      version: '1.0.0',
      timestamp: now.getTime() / 1000,
    };

    it('should send event to event bus with proper event data', async () => {
      const eventType = EventBridgeEventType.ACCOUNT_DELETION;
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
      const expectedEvent: UserEventsPayload = {
        eventType,
        ...partialExpectedEvent,
      };
      // Wait just a tad in case promise needs time to resolve
      await setTimeout(100);
      expect(sentryStub.callCount).toBe(0);
      expect(consoleSpy.callCount).toBe(0);
      // Listener was registered on event
      expect(emitter.listeners(emittedEvent).length).toBe(1);
      // Event was sent to Event Bus
      expect(clientStub.callCount).toBe(1);
      // Check that the payload is correct; since it's JSON, we need to decode the data
      // otherwise it also does ordering check
      const sendCommand = clientStub.getCall(0).args[0].input as any;
      expect(sendCommand).toHaveProperty('Entries');
      expect(sendCommand.Entries[0]).toMatchObject({
        Source: config.aws.eventBus.eventBridge.source,
        EventBusName: config.aws.eventBus.name,
        DetailType: eventType,
      });
      expect(JSON.parse(sendCommand.Entries[0]['Detail'])).toEqual(
        expectedEvent,
      );
    });
  });

  describe('user email updated event', () => {
    const partialExpectedEvent: Omit<UserEventsPayload, 'eventType'> = {
      userId: '1',
      email: 'test@email.com',
      isPremium: false,
      apiId: '1',
      version: '1.0.0',
      timestamp: now.getTime() / 1000,
    };

    it('should send event to event bus with proper event data', async () => {
      const eventType = EventBridgeEventType.ACCOUNT_EMAIL_UPDATED;
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
      const expectedEvent: UserEventsPayload = {
        eventType,
        ...partialExpectedEvent,
      };
      // Wait just a tad in case promise needs time to resolve
      await setTimeout(100);
      expect(sentryStub.callCount).toBe(0);
      expect(consoleSpy.callCount).toBe(0);
      // Listener was registered on event
      expect(emitter.listeners(emittedEvent).length).toBe(1);
      // Event was sent to Event Bus
      expect(clientStub.callCount).toBe(1);
      // Check that the payload is correct; since it's JSON, we need to decode the data
      // otherwise it also does ordering check
      const sendCommand = clientStub.getCall(0).args[0].input as any;
      expect(sendCommand).toHaveProperty('Entries');
      expect(sendCommand.Entries[0]).toMatchObject({
        Source: config.aws.eventBus.eventBridge.source,
        EventBusName: config.aws.eventBus.name,
        DetailType: eventType,
      });
      expect(JSON.parse(sendCommand.Entries[0]['Detail'])).toEqual(
        expectedEvent,
      );
    });
  });

  it('should log error if any events fail to send', async () => {
    clientStub.restore();
    sandbox
      .stub(EventBridgeClient.prototype, 'send')
      .resolves({ FailedEntryCount: 1 });
    emitter.emit(EventType.ACCOUNT_DELETE, {
      user: {
        ...userEventData,
      },
      apiUser: {
        apiId: '1',
      },
      eventType: EventType.ACCOUNT_DELETE,
    });
    // Wait just a tad in case promise needs time to resolve
    await setTimeout(100);
    expect(sentryStub.callCount).toBe(1);
    expect(sentryStub.getCall(0).firstArg.message).toContain(
      `Failed to send event 'account-deletion' to event bus`,
    );
    expect(consoleSpy.callCount).toBe(1);
    expect(consoleSpy.getCall(0).firstArg.message).toContain(
      `Failed to send event 'account-deletion' to event bus`,
    );
  });
  it('should log error if send call throws error', async () => {
    clientStub.restore();
    sandbox
      .stub(EventBridgeClient.prototype, 'send')
      .rejects(new Error('boo!'));
    emitter.emit(EventType.ACCOUNT_DELETE, {
      user: {
        ...userEventData,
      },
      apiUser: {
        apiId: '1',
      },
      eventType: EventType.ACCOUNT_DELETE,
    });
    // Wait just a tad in case promise needs time to resolve
    await setTimeout(100);
    expect(sentryStub.callCount).toBe(1);
    expect(sentryStub.getCall(0).firstArg.message).toContain('boo!');
    expect(crumbStub.callCount).toBe(1);
    expect(crumbStub.getCall(0).firstArg.message).toContain(
      `Failed to send event 'account-deletion' to event bus`,
    );
    expect(consoleSpy.callCount).toBe(2);
    expect(consoleSpy.getCall(0).firstArg.message).toContain(
      `Failed to send event 'account-deletion' to event bus`,
    );
  });
});
