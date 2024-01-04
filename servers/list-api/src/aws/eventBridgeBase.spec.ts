import {
  EventBridgeClient,
  PutEventsCommand,
} from '@aws-sdk/client-eventbridge';
import sinon from 'sinon';
import * as Sentry from '@sentry/node';
import { EventBridgeBase } from './eventBridgeBase';
import { eventBridgeClient } from './eventBridgeClient';
import { serverLogger } from '../server/logger';

describe('EventBridgeBase.putEvent', () => {
  const client = new EventBridgeBase(eventBridgeClient);
  const command: PutEventsCommand = new PutEventsCommand({
    Entries: [{ Detail: 'oui' }],
  });
  let consoleSpy: sinon.SinonSpy;
  let sentryStub: sinon.SinonStub;
  beforeEach(() => {
    consoleSpy = sinon.spy(serverLogger, 'error');
    sentryStub = sinon.stub(Sentry, 'captureException');
  });
  afterEach(() => sinon.restore());

  it('should log error if any events fail to send', async () => {
    sinon
      .stub(EventBridgeClient.prototype, 'send')
      .resolves({ FailedEntryCount: 1 });
    await client.putEvents(command);
    expect(sentryStub.callCount).toBe(1);
    expect(sentryStub.getCall(0).firstArg.message).toContain(
      `Failed to send event to event bus`,
    );
    expect(consoleSpy.callCount).toBe(1);
    expect(consoleSpy.getCall(0).firstArg.message).toContain(
      `Failed to send event to event bus`,
    );
  });

  it('should log error if send call throws error', async () => {
    sinon.stub(EventBridgeClient.prototype, 'send').rejects(new Error('boo!'));
    await client.putEvents(command);
    expect(sentryStub.callCount).toBe(1);
    expect(sentryStub.getCall(0).firstArg.message).toContain(
      `Failed to send event to event bus`,
    );
    expect(sentryStub.getCall(0).args[1]).toMatchObject({
      extra: { originalError: 'boo!' },
    });
    expect(consoleSpy.callCount).toBe(1);
    expect(consoleSpy.getCall(0).firstArg).toContain(
      `Failed to send event to event bus`,
    );
    expect(consoleSpy.getCall(0).firstArg).toContain(`boo!`);
  });
});
