import { mockRequest } from 'jest-mock-req-res';
import { IContext, ContextFactory } from './context';
import { UserEventEmitter } from './events/userEventEmitter';
import {
  BasicUserEventPayloadWithContext,
  EventType,
} from './events/eventType';
import knex, { Knex } from 'knex';
import { UserDataService } from './dataService/userDataService';

describe('tests for context factory initialization', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('When no headers are passed, we should have no user id in context', async () => {
    const request = mockRequest({
      headers: {
        'noop-header': 'foo',
      },
    });
    const context = await getContext(request);
    expect(context).toHaveProperty('userId');
    expect(context.userId).toBeUndefined();
    expect(context.transferSub).toBeUndefined();
    expect(context.fxaUserId).toBeUndefined();
    expect(context.models.user).toBeNull();
  });
  it('When the userid header is the only user-id-like header, use it', async () => {
    const request = mockRequest({
      headers: {
        userid: '99999',
      },
    });
    const context = await getContext(request);
    expect(context).toHaveProperty('userId');
    expect(context.userId).toBe('99999');
    expect(context.transferSub).toBeUndefined();
    expect(context.fxaUserId).toBeUndefined();
  });
  it('When transferSub header is present, FxA transfer takes priority', async () => {
    const request = mockRequest({
      headers: {
        userid: '99999',
        transfersub: '88888.abcxyz',
        fxauserid: 'fxa.id',
      },
    });
    jest
      .spyOn(UserDataService, 'getPocketIdByTransferSub')
      .mockImplementation(async () => {
        return '1010101010';
      });
    const context = await getContext(request);
    expect(context).toHaveProperty('userId');
    expect(context.userId).toBe('1010101010');
    expect(context.transferSub).toBe('88888.abcxyz');
    // we ignore fxaUserid when transferSub is present
    expect(context.fxaUserId).toBeUndefined();
  });
  it('When fxauserid header is present, it takes priority over userid', async () => {
    // Yes this looks very confusing. Here's what's happening:
    // We need to mock the UserDataService.fromFxaId static method, which is called
    // when the context is initializing in certain cases. We create this fake context
    // first in order to mock that static.
    const dummyContext = await getContext({ headers: { userid: '999' } });
    jest.spyOn(UserDataService, 'fromFxaId').mockImplementation(async () => {
      return new UserDataService(dummyContext, 'fxa.id.00');
    });
    const request = mockRequest({
      headers: {
        userid: '99999',
        fxauserid: 'fxa.id',
      },
    });
    const context = await getContext(request);
    expect(context).toHaveProperty('userId');
    expect(context.userId).toBe('fxa.id.00');
    expect(context.transferSub).toBeUndefined();
    // we ignore fxaUserid when transferSub is present
    expect(context.fxaUserId).toBe('fxa.id');
  });
});

/**
 * This is an attempt to mock the knex connections since there are called when initializing.
 *
 * All we're really achieving here at present is making sure we don't accidentally update the
 * db when running tests.
 *
 * In a future pass, will do some combination of:
 * - refactoring the db calls for better testability
 * - upgrading knex so we can use a pre-built knex mockikng library like knex-mock-client
 *
 * @returns A Knex instance with mocked update and insert methods
 */
function getDb(): Knex {
  const db: Knex = knex({ client: 'mysql2' });
  jest.spyOn(db, 'update').mockImplementation(() => {
    return this;
  });
  jest.spyOn(db, 'insert').mockImplementation(() => {
    return this;
  });
  return db;
}

/**
 * This will return a context after the initialize() function has been called.
 *
 * Both the constructor and the initialize evaluate the transfersub arguments. Our goal
 * here is to test the end assumed state so we can make sure that the cross-system contracts are
 * implemented properly and knwo that we're handling header expectations correctly.
 *
 * @param req
 * @returns A promise for a ready-to-use context
 */
async function getContext(req: any): Promise<IContext> {
  const db: Knex = getDb();
  return await ContextFactory({
    request: req,
    db: { readClient: db, writeClient: db },
    eventEmitter: noopEmitter,
  });
}

class NoopUserEventEmitter extends UserEventEmitter {
  emitUserEvent(
    event: EventType,
    data: BasicUserEventPayloadWithContext,
  ): void {
    // noop
  }
}

const noopEmitter: NoopUserEventEmitter = new NoopUserEventEmitter();
