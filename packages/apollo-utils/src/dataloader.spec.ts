import * as dataloader from './dataloader';

class FakeCache implements dataloader.LoaderCacheInterface {
  getKey(key: string): string {
    return '';
  }

  mget(keys: string[]): Promise<string[]> {
    return Promise.resolve(undefined);
  }

  mset(keyValues, ttl: number): Promise<void> {
    return Promise.resolve(undefined);
  }
}

const dataValues = [{ val: '1' }, { val: '2' }];

describe('dataloader', () => {
  let getKey;
  let mget;
  let mset;
  let batchFnProps: dataloader.BatchFnProps<{ val: string }, { val: string }>;

  beforeEach(async () => {
    getKey = FakeCache.prototype.getKey = jest
      .fn()
      .mockImplementation((key) => key);

    mset = FakeCache.prototype.mset = jest.fn();

    batchFnProps = {
      values: dataValues,
      valueKeyFn: (value) => value.val,
      callback: jest.fn().mockResolvedValue(dataValues),
      cache: new FakeCache(),
      maxAge: 300,
      cacheKeyPrefix: 'test-',
      returnTypeKeyFn: (value) => value.val,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('can get multiple values from the cache', async () => {
    mget = FakeCache.prototype.mget = jest
      .fn()
      .mockResolvedValue(
        batchFnProps.values.map((value) => JSON.stringify(value)),
      );

    const result = await dataloader.multiGetCachedValues(batchFnProps);

    expect(getKey).toHaveBeenCalledTimes(2);
    expect(mget).toHaveBeenCalledTimes(1);
    expect(result).toEqual(batchFnProps.values);
  });

  it('can set multiple values to the cache', async () => {
    await dataloader.multiSetCacheValues(dataValues, batchFnProps);

    expect(getKey).toHaveBeenCalledTimes(2);
    expect(mset).toHaveBeenCalledTimes(1);
    expect(mset).toHaveBeenCalledWith(
      batchFnProps.values.reduce((acc, value) => {
        return {
          ...acc,
          [batchFnProps.cacheKeyPrefix + value.val]: JSON.stringify(value),
        };
      }, {}),
      batchFnProps.maxAge,
    );
  });

  it('can reorder data based on order of input values using a cache key as index', async () => {
    const data = JSON.parse(JSON.stringify(batchFnProps.values));

    batchFnProps.values = batchFnProps.values.reverse();
    const result = await dataloader.reorderData(data, batchFnProps);

    expect(getKey).toHaveBeenCalledTimes(4);
    expect(result).toEqual(batchFnProps.values);
  });

  it('can batch process data and memoize using a cache implementation', async () => {
    const mockMultiGetCachedValues = jest
      .spyOn(dataloader, 'multiGetCachedValues')
      .mockResolvedValue([]);
    const mockMultiSetCacheValues = jest.spyOn(
      dataloader,
      'multiSetCacheValues',
    );

    const result = await dataloader.batchCacheFn(batchFnProps);

    expect(mockMultiGetCachedValues).toHaveBeenCalledTimes(1);
    expect(batchFnProps.callback).toHaveBeenCalledTimes(1);
    expect(mockMultiSetCacheValues).toHaveBeenCalledTimes(1);
    expect(result).toEqual(batchFnProps.values);
  });

  it('can batch process data and get data from cache', async () => {
    const mockMultiGetCachedValues = jest
      .spyOn(dataloader, 'multiGetCachedValues')
      .mockResolvedValue(batchFnProps.values);
    const mockMultiSetCacheValues = jest.spyOn(
      dataloader,
      'multiSetCacheValues',
    );

    const result = await dataloader.batchCacheFn(batchFnProps);

    expect(mockMultiGetCachedValues).toHaveBeenCalledTimes(1);
    expect(batchFnProps.callback).toHaveBeenCalledTimes(0);
    expect(mockMultiSetCacheValues).toHaveBeenCalledTimes(0);
    expect(result).toEqual(batchFnProps.values);
  });
});
