import { afterEach, expect, jest, describe, it } from '@jest/globals';
import { ElasticacheRedis } from './ElasticacheRedis';
// import { KeyValueCacheSetOptions } from '@apollo/utils.keyvaluecache';

import Redis from 'ioredis-mock';

/**
 * Use of ioredis-mock might seem overkill for validation, but it works.
 *
 * Do not try to mock ioredis at a library level with something like
 * jest.Mock<Redis>. even commands like `get` and `set` are generated
 * at runtime.
 */

const cache = new ElasticacheRedis(new Redis(), new Redis());

describe('ElasticacheRedis', () => {
  afterEach(async () => jest.clearAllMocks());

  it('can get cache key', async () => {
    expect(cache.getKey('test')).toEqual('098f6bcd4621d373cade4e832627b4f6');
  });

  it('can get cache value', async () => {
    const readerData = { test: '1' };
    const cache = new ElasticacheRedis(
      new Redis(),
      new Redis({ data: readerData }),
    );

    const readerGetSpy = jest.spyOn((cache as any).readerClient, 'get');
    const primaryGetSpy = jest.spyOn((cache as any).primaryClient, 'get');
    const res = await cache.get('test');
    expect(res).toEqual(readerData.test);

    expect(readerGetSpy).toBeCalledTimes(1);
    expect(primaryGetSpy).toBeCalledTimes(0);
  });

  it('can multi get cache values', async () => {
    const readerData = { test1: '1', test2: '2' };
    const cache = new ElasticacheRedis(
      new Redis(),
      new Redis({ data: readerData }),
    );

    const readerMgetSpy = jest.spyOn((cache as any).readerClient, 'mget');
    const primaryMgetSpy = jest.spyOn((cache as any).primaryClient, 'mget');
    const res = await cache.mget(['test1', 'test2']);
    expect(res).toEqual(expect.arrayContaining(Object.values(readerData)));

    expect(readerMgetSpy).toBeCalledTimes(1);
    expect(primaryMgetSpy).toBeCalledTimes(0);
  });

  it('can set cache value', async () => {
    const primaryClient = new Redis();
    const cache = new ElasticacheRedis(primaryClient, new Redis());

    const readerSetSpy = jest.spyOn((cache as any).readerClient, 'set');
    const primarySetSpy = jest.spyOn((cache as any).primaryClient, 'set');
    const ttl = 300;
    await cache.set('test', 'val', { ttl });
    const res = await cache.get('test');
    expect(res).toEqual('val');
    const remainingTTL = await primaryClient.ttl('test');
    expect(remainingTTL <= 300).toBeTruthy();

    expect(readerSetSpy).toBeCalledTimes(0);
    expect(primarySetSpy).toBeCalledTimes(1);
  });

  it('can multi set cache values', async () => {
    const primaryClient = new Redis();
    const cache = new ElasticacheRedis(primaryClient, new Redis());

    const readerMultiSpy = jest.spyOn((cache as any).readerClient, 'multi');
    const primaryMultiSpy = jest.spyOn((cache as any).primaryClient, 'multi');

    const keyValues = { test1: 'val1', test2: 'val2' };
    const ttl = 300;

    await cache.mset(keyValues, ttl);
    const res = await primaryClient.mget(Object.keys(keyValues));
    expect(res).toEqual(expect.arrayContaining(Object.values(keyValues)));
    const remainingTTL1 = await primaryClient.ttl('test1');
    expect(remainingTTL1 <= 300).toBeTruthy();
    const remainingTTL2 = await primaryClient.ttl('test2');
    expect(remainingTTL2 <= 300).toBeTruthy();

    expect(readerMultiSpy).toBeCalledTimes(0);
    expect(primaryMultiSpy).toBeCalledTimes(1);
  });

  it('can delete a cache value', async () => {
    const primaryData = { test: '1' };
    const primaryClient = new Redis({ data: primaryData });
    const cache = new ElasticacheRedis(primaryClient, new Redis());

    const readerDelSpy = jest.spyOn((cache as any).readerClient, 'del');
    const primaryDelSpy = jest.spyOn((cache as any).primaryClient, 'del');

    await cache.delete('test');
    const res = await primaryClient.get('test');
    expect(res).toBeFalsy();

    expect(readerDelSpy).toBeCalledTimes(0);
    expect(primaryDelSpy).toBeCalledTimes(1);
  });

  it('can flush the cache', async () => {
    const data = { test: '1' };
    const primaryClient = new Redis({ data });
    const cache = new ElasticacheRedis(primaryClient, new Redis());

    const readerFlushdbSpy = jest.spyOn((cache as any).readerClient, 'flushdb');
    const primaryFlushdbSpy = jest.spyOn(
      (cache as any).primaryClient,
      'flushdb',
    );

    await cache.flush();
    const res = await primaryClient.get('test');
    expect(res).toBeFalsy();

    expect(readerFlushdbSpy).toBeCalledTimes(0);
    expect(primaryFlushdbSpy).toBeCalledTimes(1);
  });

  it('can clear the cache', async () => {
    const data = { test: '1' };
    const primaryClient = new Redis({ data });
    const cache = new ElasticacheRedis(primaryClient, new Redis());

    const readerFlushdbSpy = jest.spyOn((cache as any).readerClient, 'flushdb');
    const primaryFlushdbSpy = jest.spyOn(
      (cache as any).primaryClient,
      'flushdb',
    );

    await cache.clear();
    const res = await primaryClient.get('test');
    expect(res).toBeFalsy();

    expect(readerFlushdbSpy).toBeCalledTimes(0);
    expect(primaryFlushdbSpy).toBeCalledTimes(1);
  });

  it('can close the cache connection', async () => {
    const cache = new ElasticacheRedis(new Redis(), new Redis());

    const readerQuitSpy = jest.spyOn((cache as any).readerClient, 'quit');
    const primaryCloseSpy = jest.spyOn((cache as any).primaryClient, 'quit');

    await cache.close();

    expect(readerQuitSpy).toBeCalledTimes(1);
    expect(primaryCloseSpy).toBeCalledTimes(1);
  });
});
