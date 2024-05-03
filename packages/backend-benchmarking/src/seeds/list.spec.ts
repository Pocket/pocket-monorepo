import { mockList } from './list.js';

describe('mockList', () => {
  it('should produce data when total count is divisible by batch size', () => {
    const mockListGenerator = mockList('abc123', { count: 10, batchSize: 2 });
    let batch = mockListGenerator.next();
    const results = [];
    const ids = [];
    while (!batch.done) {
      // Keep track of batch size
      results.push(batch.value['list'].length);
      ids.push(...batch.value['list'].map((l) => l.item_id));
      batch = mockListGenerator.next();
    }
    // No dupes, proper indexing
    expect(ids).toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(results).toStrictEqual([2, 2, 2, 2, 2]);
  });
  it('should produce data when total count is not divisible by batch size', () => {
    const mockListGenerator = mockList('abc123', { count: 10, batchSize: 3 });
    let batch = mockListGenerator.next();
    const results = [];
    while (!batch.done) {
      // Keep track of batch size
      results.push(batch.value['list'].length);
      batch = mockListGenerator.next();
    }
    expect(results).toStrictEqual([3, 3, 3, 1]);
  });
  it('should have characteristics according to data options', () => {
    const mockListGenerator = mockList('abc123', {
      minTimestamp: 1646096295000,
      maxTimestamp: 1646182692000,
    });
    let batch = mockListGenerator.next();
    const archive = [];
    const favorite = [];
    const article = [];
    const timestamps = [];
    function flatMapKey<T>(objects: T[], key: keyof T): T[keyof T][] {
      return objects.map((obj) => obj[key]);
    }
    function flatMapKeys<T>(
      objects: T[],
      keys: (keyof T)[],
      callback: (obj: any) => any,
    ): T[keyof T][] {
      return objects.reduce((acc, obj) => {
        acc.push(...keys.map((key) => callback(obj[key])));
        return acc;
      }, [] as any);
    }
    // I know this is ugly and a lot of code, but JS doesn't have good methods for manipulating data natively
    while (!batch.done) {
      archive.push(...flatMapKey(batch.value['list'], 'status'));
      favorite.push(...flatMapKey(batch.value['list'], 'favorite'));
      article.push(...flatMapKey(batch.value['items_extended'], 'is_article'));
      timestamps.push(
        ...flatMapKeys(
          batch.value['list'],
          ['time_read', 'time_favorited', 'time_added', 'time_updated'],
          (date: Date) => date?.getTime(),
        ),
      );
      batch = mockListGenerator.next();
    }
    const articleRate =
      article.reduce((sum, elem) => sum + elem, 0) / article.length;
    const favoriteRate =
      favorite.reduce((sum, elem) => sum + elem, 0) / favorite.length;
    const archivedRate =
      archive.reduce((sum, elem) => sum + elem, 0) / archive.length;
    const minTimestamp = Math.min(...timestamps.filter((t) => t != null));
    const maxTimestamp = Math.max(...timestamps.filter((t) => t != null));

    expect(archive.length).toEqual(1000);
    expect(favorite.length).toEqual(1000);
    expect(article.length).toEqual(1000);
    expect(timestamps.length).toEqual(4000);
    // 0.05 tolerance to reduce flakiness
    expect(articleRate).toBeCloseTo(0.9, 1);
    expect(favoriteRate).toBeCloseTo(0.1, 1);
    expect(archivedRate).toBeCloseTo(0.2, 1);
    expect(minTimestamp).toBeGreaterThanOrEqual(1646096295000);
    expect(maxTimestamp).toBeLessThanOrEqual(1646182692000);
  });
});
