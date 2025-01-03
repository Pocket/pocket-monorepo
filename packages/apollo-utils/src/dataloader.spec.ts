import {
  DataLoaderCacheInterface,
  KeyValueCacheSetOptions,
} from './cache/interface.ts';
import * as dataloader from './dataloader.ts';

class FakeCache implements DataLoaderCacheInterface {
  get(key: string): Promise<string | undefined> {
    return Promise.resolve(undefined);
  }
  set(
    key: string,
    value: string,
    options?: KeyValueCacheSetOptions | undefined,
  ): Promise<void> {
    return Promise.resolve(undefined);
  }

  delete(key: string): Promise<boolean | void> {
    return Promise.resolve();
  }

  getKey(key: string): string {
    return '';
  }
}

const dataValues = [{ val: '1' }, { val: '2' }];

describe('dataloader', () => {
  let getKey;
  let get;
  let set;
  let batchFnProps: dataloader.BatchFnProps<{ val: string }, { val: string }>;

  beforeEach(async () => {
    getKey = FakeCache.prototype.getKey = jest
      .fn()
      .mockImplementation((key) => key);

    set = FakeCache.prototype.set = jest.fn();

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
    get = FakeCache.prototype.get = jest
      .fn()
      .mockResolvedValueOnce(JSON.stringify(batchFnProps.values[0]))
      .mockResolvedValueOnce(JSON.stringify(batchFnProps.values[1]));

    const result = await dataloader.multiGetCachedValues(batchFnProps);

    expect(getKey).toHaveBeenCalledTimes(2);
    expect(get).toHaveBeenCalledTimes(2);
    expect(result).toEqual(batchFnProps.values);
  });

  it('can set multiple values to the cache', async () => {
    await dataloader.multiSetCacheValues(dataValues, batchFnProps);

    expect(getKey).toHaveBeenCalledTimes(2);
    expect(set).toHaveBeenCalledTimes(2);
    expect(set).toHaveBeenNthCalledWith(
      1,
      batchFnProps.cacheKeyPrefix + batchFnProps.values[0].val,
      JSON.stringify(batchFnProps.values[0]),
      { ttl: batchFnProps.maxAge },
    );
    expect(set).toHaveBeenNthCalledWith(
      2,
      batchFnProps.cacheKeyPrefix + batchFnProps.values[1].val,
      JSON.stringify(batchFnProps.values[1]),
      { ttl: batchFnProps.maxAge },
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
