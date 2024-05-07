import {
  EventBridgeClient,
  PutEventsCommand,
} from '@aws-sdk/client-eventbridge';
import { EventBridgeBase } from './eventBridgeBase.js';
import { eventBridgeClient } from './eventBridgeClient.js';
import { serverLogger } from '@pocket-tools/ts-logger';
import { jest } from '@jest/globals';
import { SpyInstance } from 'jest-mock';
describe('EventBridgeBase.putEvent', () => {
  const client = new EventBridgeBase(eventBridgeClient);
  const command: PutEventsCommand = new PutEventsCommand({
    Entries: [{ Detail: 'oui' }],
  });
  let consoleSpy: SpyInstance;
  beforeEach(() => {
    consoleSpy = jest.spyOn(serverLogger, 'error').mockClear();
  });
  afterEach(() => jest.restoreAllMocks());

  it('should log error if any events fail to send', async () => {
    jest
      .spyOn(EventBridgeClient.prototype, 'send')
      .mockImplementation(() => Promise.resolve({ FailedEntryCount: 1 }));
    await client.putEvents(command);

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect((consoleSpy.mock.calls[0][0] as any).message).toContain(
      `Failed to send event to event bus`,
    );
  });

  it('should log error if send call throws error', async () => {
    jest.spyOn(EventBridgeClient.prototype, 'send').mockImplementation(() => {
      throw new Error('boo!');
    });
    await client.putEvents(command);
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toContain(
      `Failed to send event to event bus`,
    );
    expect(consoleSpy.mock.calls[0][0]).toContain(`boo!`);
  });
});
