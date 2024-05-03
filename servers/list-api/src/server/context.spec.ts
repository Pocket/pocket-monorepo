import { ContextManager, IContext } from './context.js';
import { Knex } from 'knex';
import DataLoader from 'dataloader';
import { SavedItemDataService } from '../dataService/index.js';
import { SavedItem } from '../types/index.js';
import { EventType, ItemsEventEmitter } from '../businessEvents/index.js';
import * as Sentry from '@sentry/node';
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
    const sentryScopeSpy = jest.spyOn(Sentry, 'configureScope');
    beforeEach(() => sentryScopeSpy.mockReset());
    afterAll(() => {
      sentryScopeSpy.mockRestore();
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
        expect(sentryScopeSpy).toHaveBeenCalledTimes(1);
        const scopeConfigureCallback = sentryScopeSpy.mock.calls[0][0];
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
    let sentryEventSpy: jest.SpyInstance;
    let sentryExceptionSpy: jest.SpyInstance;
    const context = new ContextManager({
      request: {
        headers: { userid: '1', apiid: '0' },
      } as unknown as Request,
      dbClient: jest.fn() as unknown as Knex,
      eventEmitter: new ItemsEventEmitter(),
    });
    beforeEach(() => {
      jest.restoreAllMocks();
      sentryEventSpy = jest.spyOn(Sentry, 'captureEvent');
      sentryExceptionSpy = jest.spyOn(Sentry, 'captureException');
    });
    afterAll(() => jest.restoreAllMocks());
    it('should log a warning to Sentry if save is undefined', async () => {
      await context.emitItemEvent(EventType.ARCHIVE_ITEM, undefined);
      expect(sentryEventSpy).toHaveBeenCalledTimes(1);
      const event = sentryEventSpy.mock.calls[0][0];
      expect(event.message).toContain('Save was null or undefined');
      expect(event.level).toStrictEqual('warning');
    });
    it('should log a warning to Sentry if save is null', async () => {
      await context.emitItemEvent(EventType.ARCHIVE_ITEM, null);
      expect(sentryEventSpy).toHaveBeenCalledTimes(1);
      const event = sentryEventSpy.mock.calls[0][0];
      expect(event.message).toContain('Save was null or undefined');
      expect(event.level).toStrictEqual('warning');
    });
    it('should emit event if data is valid', async () => {
      const emitStub = jest
        .spyOn(context.eventEmitter, 'emitItemEvent')
        .mockReturnValue();
      jest
        .spyOn(context.models.tag, 'getBySaveId')
        .mockImplementation(() => Promise.resolve([]));
      await context.emitItemEvent(EventType.ARCHIVE_ITEM, savedItem);
      expect(emitStub).toHaveBeenCalledTimes(1);
    });
    it('should emit event to listener', async () => {
      const listenerFn = jest.fn();
      // listener
      context.eventEmitter.on(EventType.ARCHIVE_ITEM, listenerFn);
      jest
        .spyOn(context.models.tag, 'getBySaveId')
        .mockImplementation(() => Promise.resolve([]));
      await context.emitItemEvent(EventType.ARCHIVE_ITEM, savedItem);
      expect(listenerFn).toHaveBeenCalledTimes(1);
    });
    it('should send exception with warning level to Sentry if payload generation fails', async () => {
      jest.spyOn(context.models.tag, 'getBySaveId').mockImplementation(() => {
        throw new Error('my error');
      });
      await context.emitItemEvent(EventType.ARCHIVE_ITEM, savedItem);
      expect(sentryExceptionSpy).toHaveBeenCalledTimes(1);
      const event = sentryExceptionSpy.mock.calls[0];
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
