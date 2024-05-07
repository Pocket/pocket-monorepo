import { ContextManager, IContext } from './context.js';
import { Knex } from 'knex';
import DataLoader from 'dataloader';
import { SavedItemDataService } from '../dataService/index.js';
import { SavedItem } from '../types/index.js';
import { EventType, ItemsEventEmitter } from '../businessEvents/index.js';
import { Request } from 'express';
import { jest } from '@jest/globals';
import { SpyInstance } from 'jest-mock';

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
      },
    );
  });
  describe('event emitter', () => {
    const context = new ContextManager({
      request: {
        headers: { userid: '1', apiid: '0' },
      } as unknown as Request,
      dbClient: jest.fn() as unknown as Knex,
      eventEmitter: new ItemsEventEmitter(),
    });
    beforeEach(() => {
      jest.restoreAllMocks();
    });
    afterAll(() => jest.restoreAllMocks());
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
  });
  describe('dataloaders', () => {
    let batchUrlFnSpy: SpyInstance;
    let batchIdFnSpy: SpyInstance;
    let context: IContext;

    beforeEach(() => {
      batchUrlFnSpy =
        SavedItemDataService.prototype.batchGetSavedItemsByGivenUrls = jest
          .fn()
          .mockResolvedValue([savedItem] as never) as any;
      batchIdFnSpy =
        SavedItemDataService.prototype.batchGetSavedItemsByGivenIds = jest
          .fn()
          .mockResolvedValue([savedItem] as never) as any;
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
