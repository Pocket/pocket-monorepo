import {
  SharedUrlsResolverRepository,
  getSharedUrlsConnection,
  getSharedUrlsResolverRepo,
} from '../database/mysql';
import { shareUrl } from '../shortUrl/shortUrl';

describe('SharedUrls', () => {
  let sharedRepo: SharedUrlsResolverRepository;

  beforeAll(async () => {
    sharedRepo = await getSharedUrlsResolverRepo();
  });
  beforeEach(async () => {
    await sharedRepo.clear();
    await sharedRepo.query('ALTER TABLE share_urls AUTO_INCREMENT = 1');
  });

  afterAll(async () => {
    await sharedRepo.clear();
    await (await getSharedUrlsConnection()).destroy();
  });

  it('should be able to insert a new shared url and get it', async () => {
    const id = await sharedRepo.addToShareUrls(1, 1, 'https://www.google.com');
    expect(id).toBe(1); //one coz auto-increment
    const result = await sharedRepo.getShareUrls(1);
    expect(result).not.toBeNull();
    expect(result.itemId).toBe(1);
    expect(result.resolvedId).toBe(1);
    expect(result.givenUrl).toBe('https://www.google.com');
  });
  it('batch inserts many records and returns IDs', async () => {
    const result = await sharedRepo.batchAddToShareUrls([
      { itemId: 999, resolvedId: 1000, givenUrl: 'https://test-url.com' },
      { itemId: 123, resolvedId: 123, givenUrl: 'https://another-test.com' },
    ]);
    // Just being extra careful because there were some old typeorm bugs
    // that are probably solved, but...
    const moreResult = await sharedRepo.batchAddToShareUrls([
      { itemId: 7779, resolvedId: 10, givenUrl: 'https://test-url.com' },
    ]);
    // auto-increment on a cleared db, so we should get 1-2, 3
    expect(result).toEqual([1, 2]);
    expect(moreResult).toEqual([3]);
  });
  it('retrieves existing shareUrlIds and creates new ones for items that do not exist', async () => {
    await sharedRepo.batchAddToShareUrls([
      { itemId: 999, resolvedId: 999, givenUrl: 'https://test-url.com' },
      { itemId: 123, resolvedId: 123, givenUrl: 'https://another-test.com' },
    ]);
    const ids = await shareUrl.batchGetOrCreateShareUrls(
      [
        { itemId: 777, resolvedId: 777, givenUrl: 'https://some-url.com' },
        { itemId: 333, resolvedId: 333, givenUrl: 'https://who-knows.com' },
        {
          itemId: 123,
          resolvedId: 123,
          givenUrl: 'https://another-test.com',
        },
        { itemId: 999, resolvedId: 999, givenUrl: 'https://test-url.com' },
        {
          itemId: 222,
          resolvedId: 222,
          givenUrl: 'https://feeling-lucky.com',
        },
        { itemId: 777, resolvedId: 777, givenUrl: 'https://some-url.com' },
      ],
      sharedRepo,
    );
    expect(ids).toEqual([3, 4, 2, 1, 5, 3]);
  });
});
