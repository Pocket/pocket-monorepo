import { ContextManager, IContext } from './context';
import { Knex } from 'knex';
import DataLoader from 'dataloader';
import { SavedItemDataService } from '../dataService';
import { SavedItem } from '../types';
import { EventType, ItemsEventEmitter } from '../businessEvents';
import * as Sentry from '@sentry/node';
import sinon from 'sinon';
import { Request } from 'express';

jest.mock('../dataService');

describe('context', () => {
  const savedItem: SavedItem = {
    id: '1',
    resolvedId: '1',
    url: 'dont-care.com',
    isFavorite: false,
    status: 'UNREAD',
    isArchived: false,
    item: {
      givenUrl: 'dont-care.com',
    },
  };
  describe('constructor', () => {
    const sentryScopeSpy = sinon.spy(Sentry, 'configureScope');
    beforeEach(() => sentryScopeSpy.resetHistory());
    afterAll(() => {
      sentryScopeSpy.restore();
    });
    test.each([
      { headers: { apiid: '2', encodedid: 'abc123' }, expectedApiId: '2' },
      {
        headers: { apiid: undefined, encodedid: 'abc123' },
        expectedApiId: '0',
      },
    ])(
      'sets the Sentry scope with appropriate headers',
      ({ headers, expectedApiId }) => {
        new ContextManager({
          request: {
            headers: { userid: '1', ...headers },
          },
          dbClient: jest.fn() as unknown as Knex,
          eventEmitter: new ItemsEventEmitter(),
        });
        // Mock out the scope methods used in the configureScope callback
        expect(sentryScopeSpy.callCount).toEqual(1);
        const scopeConfigureCallback = sentryScopeSpy.getCall(0).args[0];
        const mockScope = {
          setTag: jest.fn(),
          setUser: jest.fn(),
        } as unknown as Sentry.Scope; // Coercing since these are the only two methods we need to check
        scopeConfigureCallback(mockScope);
        expect(mockScope.setTag).toHaveBeenNthCalledWith(
          1,
          'pocket-api-id',
          expectedApiId,
        );
        expect(mockScope.setUser).toHaveBeenNthCalledWith(1, {
          id: headers.encodedid,
        });
      },
    );
  });
  describe('event emitter', () => {
    let sentryEventSpy;
    let sentryExceptionSpy;
    const context = new ContextManager({
      request: {
        headers: { userid: '1', apiid: '0' },
      } as unknown as Request,
      dbClient: jest.fn() as unknown as Knex,
      eventEmitter: new ItemsEventEmitter(),
    });
    beforeEach(() => {
      sinon.restore();
      sentryEventSpy = sinon.spy(Sentry, 'captureEvent');
      sentryExceptionSpy = sinon.spy(Sentry, 'captureException');
    });
    afterAll(() => sinon.restore());
    it('should log a warning to Sentry if save is undefined', async () => {
      await context.emitItemEvent(EventType.ARCHIVE_ITEM, undefined);
      expect(sentryEventSpy.callCount).toStrictEqual(1);
      const event = sentryEventSpy.getCall(0).args[0];
      expect(event.message).toContain('Save was null or undefined');
      expect(event.level).toStrictEqual('warning');
    });
    it('should log a warning to Sentry if save is null', async () => {
      await context.emitItemEvent(EventType.ARCHIVE_ITEM, null);
      expect(sentryEventSpy.callCount).toStrictEqual(1);
      const event = sentryEventSpy.getCall(0).args[0];
      expect(event.message).toContain('Save was null or undefined');
      expect(event.level).toStrictEqual('warning');
    });
    it('should emit event if data is valid', async () => {
      const emitStub = sinon
        .stub(context.eventEmitter, 'emitItemEvent')
        .resolves();
      sinon.stub(context.models.tag, 'getBySaveId').resolves([]);
      await context.emitItemEvent(EventType.ARCHIVE_ITEM, savedItem);
      expect(emitStub.callCount).toStrictEqual(1);
    });
    it('should emit event to listener', async () => {
      const listenerFn = sinon.fake();
      // listener
      context.eventEmitter.on(EventType.ARCHIVE_ITEM, listenerFn);
      sinon.stub(context.models.tag, 'getBySaveId').resolves([]);
      await context.emitItemEvent(EventType.ARCHIVE_ITEM, savedItem);
      expect(listenerFn.callCount).toStrictEqual(1);
    });
    it('should send exception with warning level to Sentry if payload generation fails', async () => {
      sinon
        .stub(context.models.tag, 'getBySaveId')
        .rejects(new Error('my error'));
      await context.emitItemEvent(EventType.ARCHIVE_ITEM, savedItem);
      expect(sentryExceptionSpy.callCount).toStrictEqual(1);
      const event = sentryExceptionSpy.getCall(0).args;
      expect(event[0].message).toContain('my error');
      expect(event[1].level).toStrictEqual('warning');
    });
  });
  describe('dataloaders', () => {
    let batchUrlFnSpy;
    let batchIdFnSpy;
    let context: IContext;

    beforeEach(() => {
      batchUrlFnSpy =
        SavedItemDataService.prototype.batchGetSavedItemsByGivenUrls = jest
          .fn()
          .mockResolvedValue([savedItem]);
      batchIdFnSpy =
        SavedItemDataService.prototype.batchGetSavedItemsByGivenIds = jest
          .fn()
          .mockResolvedValue([savedItem]);
      context = new ContextManager({
        request: {
          headers: { userid: '1', apiid: '0' },
        },
        dbClient: jest.fn() as unknown as Knex,
        eventEmitter: null,
      });
    });

    afterEach(() => jest.clearAllMocks());

    it('creates a data loader for saved items on initialization', async () => {
      const savedItems =
        await context.dataLoaders.savedItemsByUrl.load('dont-care.com');

      expect(context.dataLoaders.savedItemsByUrl).toBeInstanceOf(DataLoader);
      expect(context.dataLoaders.savedItemsByUrl).toBeInstanceOf(DataLoader);
      expect(batchUrlFnSpy.mock.calls[0][0]).toIncludeSameMembers([
        'dont-care.com',
      ]);
      expect(savedItems).toStrictEqual(savedItem);
    });
    it('Uses the same dataloader for every load request', async () => {
      // Referencing the loader 2x should return the same object
      const loader = context.dataLoaders.savedItemsByUrl;
      const loaderAgain = context.dataLoaders.savedItemsByUrl;
      await loader.load('dont-care.com');
      // At this point both loaders should have filled cache since referencing same object
      expect(Array.from((loader as any)._cacheMap.keys())).toContain(
        'dont-care.com',
      );
      expect(Array.from((loaderAgain as any)._cacheMap.keys())).toContain(
        'dont-care.com',
      );
      await loaderAgain.load('dont-care.com');
      // Second load should have used the cache, so only one call to batch fn
      expect(batchUrlFnSpy.mock.calls.length).toStrictEqual(1);
    });
    it('savedItemById dataloader should fill cache of savedItemByUrl dataloader', async () => {
      await context.dataLoaders.savedItemsById.load('1');
      const loadedItem =
        await context.dataLoaders.savedItemsByUrl.load('dont-care.com');
      expect(
        Array.from(
          (context.dataLoaders.savedItemsById as any)._cacheMap.keys(),
        ),
      ).toContain('1');
      expect(batchIdFnSpy.mock.calls.length).toStrictEqual(1);
      expect(batchUrlFnSpy.mock.calls.length).toStrictEqual(0);
      expect(loadedItem).toStrictEqual(savedItem);
    });
    it('savedItemByUrl dataloader should fill cache of savedItemById dataloader', async () => {
      await context.dataLoaders.savedItemsByUrl.load('dont-care.com');
      const loadedItem = await context.dataLoaders.savedItemsById.load('1');
      expect(
        Array.from(
          (context.dataLoaders.savedItemsById as any)._cacheMap.keys(),
        ),
      ).toContain('1');
      expect(batchUrlFnSpy.mock.calls.length).toStrictEqual(1);
      expect(batchIdFnSpy.mock.calls.length).toStrictEqual(0);
      expect(loadedItem).toStrictEqual(savedItem);
    });
  });
});
