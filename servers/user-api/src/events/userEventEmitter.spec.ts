import { UserEventEmitter } from './userEventEmitter';
import { BasicUserEventPayloadWithContext, EventType } from './eventType';
import sinon from 'sinon';

describe('UserEventEmitter', () => {
  const emitter = new UserEventEmitter();
  const handler = sinon.fake();
  Object.values(EventType).forEach((event: string) =>
    emitter.on(event, handler),
  );

  const payload: BasicUserEventPayloadWithContext = {
    user: {
      id: '1',
    },
    apiUser: { apiId: '2' },
  };

  afterEach(() => {
    handler.resetHistory();
  });

  it('should emit an ACCOUNT_DELETE event with expected data', () => {
    // Event is emitted synchronously so don't need to wait
    emitter.emitUserEvent(EventType.ACCOUNT_DELETE, payload);
    const expectedData = {
      ...payload,
      eventType: 'ACCOUNT_DELETE',
    };
    expect(handler.callCount).toBe(1);
    expect(handler.getCall(0).args[0]).toEqual(expectedData);
  });

  it('should emit an ACCOUNT_PASSWORD_CHANGED event with expected data', () => {
    // Event is emitted synchronously so don't need to wait
    emitter.emitUserEvent(EventType.ACCOUNT_PASSWORD_CHANGED, payload);
    const expectedData = {
      ...payload,
      eventType: 'ACCOUNT_PASSWORD_CHANGED',
    };
    expect(handler.callCount).toBe(1);
    expect(handler.getCall(0).args[0]).toEqual(expectedData);
  });
});
