import { SavedItem } from '../types';
import sinon from 'sinon';
import { SavedItemDataService } from '../dataService';
import {
  batchGetSavedItemsByIds,
  batchGetSavedItemsByUrls,
} from './savedItemsDataLoader';
import { writeClient } from '../database/client';
import { getClient } from '../featureFlags/client';

describe('savedItem data loader', function () {
  const testSavedItem: SavedItem[] = [
    {
      id: '1',
      resolvedId: '1',
      url: 'abc.com',
      isFavorite: false,
      isArchived: false,
      status: 'UNREAD',
      item: {
        givenUrl: 'abc.com',
      },
    },
    {
      id: '2',
      resolvedId: '2',
      url: 'def.com',
      isFavorite: false,
      isArchived: false,
      status: 'DELETED',
      item: {
        givenUrl: 'def.com',
      },
    },
  ];

  afterAll(() => {
    sinon.restore();
  });

  beforeAll(() => {
    sinon.restore();
  });

  it('batchGetSavedItemsByIds should return undefined for non-existent items', async () => {
    const promiseSavedItem = Promise.resolve(testSavedItem);
    const db = writeClient();
    const service = new SavedItemDataService({
      dbClient: db,
      userId: '1',
      apiId: 'backend',
      unleash: getClient(),
    });
    sinon
      .stub(service, 'batchGetSavedItemsByGivenIds')
      .returns(promiseSavedItem);

    const items = await batchGetSavedItemsByIds(service, ['3', '1']);
    expect(items.length).toEqual(2);
    expect(items[0]).toEqual(undefined);
    expect(items[1].id).toEqual('1');
  });

  it('batchGetSavedItemsByUrls should return undefined in the batch for non-existent items', async () => {
    const promiseSavedItem = Promise.resolve(testSavedItem);
    const db = writeClient();
    const service = new SavedItemDataService({
      dbClient: db,
      userId: '1',
      apiId: 'backend',
      unleash: getClient(),
    });
    sinon
      .stub(service, 'batchGetSavedItemsByGivenUrls')
      .returns(promiseSavedItem);

    const items = await batchGetSavedItemsByUrls(service, [
      'notFound.com',
      'abc.com',
    ]);
    expect(items.length).toEqual(2);
    expect(items[0]).toEqual(undefined);
    expect(items[1].url).toEqual('abc.com');
  });
});
