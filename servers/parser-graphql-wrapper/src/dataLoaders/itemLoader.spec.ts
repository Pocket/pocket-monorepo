import * as itemLoader from './itemLoader';
import { getItemByUrl } from './itemLoader';
import { Item } from '../model';
import { LoaderCacheInterface } from '@pocket-tools/apollo-utils';
import nock from 'nock';

class FakeCache implements LoaderCacheInterface {
  getKey(key: string): string {
    return key;
  }

  mget(keys: string[]): Promise<string[]> {
    return Promise.resolve(undefined);
  }

  mset(keyValues, ttl: number): Promise<void> {
    return Promise.resolve(undefined);
  }
}

const items: Item[] = [
  {
    itemId: '1',
    resolvedId: '1',
    givenUrl: 'https://example.com/article-slug',
    normalUrl: 'https://example.com/article-slug',
    domainMetadata: {
      name: 'domain1',
      logo: 'logo1',
    },
    authors: [
      {
        id: '1',
      },
    ],
  },
  {
    itemId: '2',
    resolvedId: '2',
    givenUrl: 'https://example.com/article-slug-2',
    normalUrl: 'https://example.com/article-slug-2',
    domainMetadata: {
      name: 'domain2',
      logo: 'logo2',
    },
    authors: [
      {
        id: '2',
      },
    ],
  },
];

const itemIds = [items[0].itemId, items[1].itemId];
const itemUrls = [items[0].givenUrl, items[1].givenUrl];

const extraItem: Item = {
  itemId: '3',
  resolvedId: '3',
  givenUrl: 'https://example.com/article-slug-3',
  normalUrl: 'https://example.com/article-slug-3',
  domainMetadata: {
    name: 'domain3',
    logo: 'logo3',
  },
  authors: [
    {
      id: '3',
    },
  ],
};

const extraItemId = extraItem.itemId;
const extraItemUrl = extraItem.givenUrl;

// Skipping this test for now in favor of the integration test. Mocking functions were failing.
describe.skip('itemLoader - functional', () => {
  let mockBatchGetItemUrlsByItemIds;
  let mockBatchGetItemsByItemUrls;

  beforeEach(async () => {
    mockBatchGetItemUrlsByItemIds = jest
      .spyOn(itemLoader, 'batchGetItemUrlsByItemIds')
      .mockResolvedValue([
        {
          url: items[0].givenUrl,
          itemId: items[0].itemId,
        },
        {
          url: items[1].givenUrl,
          itemId: items[1].itemId,
        },
      ]);

    mockBatchGetItemsByItemUrls = jest
      .spyOn(itemLoader, 'batchGetItemsByItemUrls')
      .mockResolvedValue(items);

    // TODO: FakeCache needs to match the ElasticacheRedis interface
    // if we want to re-enable these skipped tests. Commented out to
    // appease tsc
    // jest.spyOn(cache, 'getRedisCache').mockReturnValue(new FakeCache());

    FakeCache.prototype.mget = jest.fn().mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('batchGetItemsByIds', () => {
    it('gets items by id using a batch function', async () => {
      const batchItems = await itemLoader.batchGetItemsByIds(itemIds);

      expect(batchItems).toEqual(items);
      expect(mockBatchGetItemUrlsByItemIds).toHaveBeenCalledTimes(1);
    });

    it('gets items by ids from cache using a batch function', async () => {
      FakeCache.prototype.mget = jest
        .fn()
        .mockResolvedValue(items.map((item) => JSON.stringify(item)));

      const batchItems = await itemLoader.batchGetItemsByIds(itemIds);

      expect(batchItems).toEqual(items);
      expect(mockBatchGetItemUrlsByItemIds).toHaveBeenCalledTimes(0);
    });

    it('only gets item ids that are not in cache from the database', async () => {
      FakeCache.prototype.mget = jest
        .fn()
        .mockResolvedValue(items.map((item) => JSON.stringify(item)));

      await itemLoader.batchGetItemsByIds([...itemIds, extraItemId]);

      expect(mockBatchGetItemUrlsByItemIds).toHaveBeenCalledWith([extraItemId]);
    });

    it('returns items in the same order as ids', async () => {
      const batchItems = await itemLoader.batchGetItemsByIds([
        itemIds[1],
        itemIds[0],
      ]);

      expect(batchItems).toEqual([items[1], items[0]]);
    });
  });

  describe('batchGetItemsByUrls', () => {
    it('gets items by urls using a batch function', async () => {
      const batchItems = await itemLoader.batchGetItemsByUrls(itemUrls);

      expect(batchItems).toEqual(items);
      expect(mockBatchGetItemsByItemUrls).toHaveBeenCalledTimes(1);
    });

    it('gets items by urls from cache using a batch function', async () => {
      FakeCache.prototype.mget = jest
        .fn()
        .mockResolvedValue(items.map((item) => JSON.stringify(item)));

      const batchItems = await itemLoader.batchGetItemsByUrls(itemUrls);

      expect(batchItems).toEqual(items);
      expect(mockBatchGetItemsByItemUrls).toHaveBeenCalledTimes(0);
    });

    it('only gets item urls that are not in cache from the parser', async () => {
      FakeCache.prototype.mget = jest
        .fn()
        .mockResolvedValue(items.map((item) => JSON.stringify(item)));

      await itemLoader.batchGetItemsByUrls([...itemUrls, extraItemUrl]);

      expect(mockBatchGetItemsByItemUrls).toHaveBeenCalledWith([extraItemUrl]);
    });

    it('returns items in the same order as urls', async () => {
      const batchItems = await itemLoader.batchGetItemsByUrls([
        itemUrls[1],
        itemUrls[0],
      ]);

      expect(batchItems).toEqual([items[1], items[0]]);
    });
  });

  describe('getItemByUrl', () => {
    it('returns the provided itemId instead of the itemId from the parser request', async () => {
      const urlToParse = 'http://parse.me';
      nock('http://example-parser.com')
        .get('/')
        .query({ url: urlToParse })
        .reply(200, {
          item_id: '147',
          given_url: urlToParse,
          authors: [],
          images: [],
          videos: [],
          resolved_id: '16822',
        });

      const response = await getItemByUrl(urlToParse, '12');
      expect(response.itemId).toEqual('12');
    });
  });
});
