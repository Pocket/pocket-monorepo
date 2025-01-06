import { DataLoaderCacheInterface } from './cache/interface.ts';

export type BatchFnProps<T, U> = {
  /**
   * Values to be batch processed
   */
  values: T[];
  /**
   * Function to get the key from a value, for example value = {'name' => 'bob'}
   * Function will be (value) => value.name, to get the name value
   * to be used as the key get cached data.
   * @param value
   */
  valueKeyFn: (value: T) => string;
  /**
   * Function defined by caller to get data based on values
   * @param values
   */
  callback: (values: T[]) => Promise<U[]>;
  /**
   * Cache instance used for memoization
   */
  cache: DataLoaderCacheInterface;
  /**
   * Maximum expiration time in seconds for the cache
   */
  maxAge: number;
  /**
   * Prefix for the cache key
   */
  cacheKeyPrefix?: string;
  /**
   * Function to get the key from the return type.
   * IMPORTANT: This function should return the same key as valueKeyFn else
   * caching will break.
   * @param value
   */
  returnTypeKeyFn: (value: U) => string;
};

/**
 * Batch gets cache values
 * @param props
 */
export const multiGetCachedValues = async <T, U>(
  props: Omit<BatchFnProps<T, U>, 'callback' | 'maxAge' | 'returnTypeKeyFn'>,
): Promise<U[]> => {
  const keys = props.values.map(
    (value) => props.cacheKeyPrefix + props.valueKeyFn(value),
  );

  const cacheValues = (
    await Promise.all(
      keys.map((value) => props.cache.get(props.cache.getKey(value))),
    )
  ).map((value) => (value !== undefined ? value : null)); // filter the undefined values to null to mimic the old mget behavior from redis;

  return cacheValues
    .map((value) => JSON.parse(value as string))
    .filter(Boolean);
};

/**
 * Batch set cache values
 * @param values
 * @param props
 */
export const multiSetCacheValues = async <U>(
  values: U[],
  props: Omit<BatchFnProps<any, U>, 'values' | 'valueKeyFn' | 'callback'>,
): Promise<void> => {
  const cacheValues = values.reduce((acc, value) => {
    if (value) {
      return {
        ...acc,
        [props.cache.getKey(
          (props.cacheKeyPrefix ?? '') + props.returnTypeKeyFn(value),
        )]: JSON.stringify(value),
      };
    }

    return acc;
  }, {});

  if (
    Object.keys(cacheValues).length !== 0 &&
    cacheValues.constructor === Object
  ) {
    const promises: Promise<void>[] = [];

    for (const [key, value] of Object.entries(cacheValues)) {
      promises.push(
        props.cache.set(key, value as string, { ttl: props.maxAge }),
      );
    }

    await Promise.all(promises);
  }
};

/**
 * Reorders the data based on the order of the values prop using a cache key as index for search
 * @param data
 * @param props
 */
export const reorderData = <T, U>(
  data: U[],
  props: Omit<BatchFnProps<T, U>, 'maxAge' | 'callback'>,
): U[] => {
  props.cacheKeyPrefix = props.cacheKeyPrefix ?? '';

  const resultsAsObject = data.reduce((acc, value) => {
    if (value) {
      return {
        ...acc,
        [props.cache.getKey(
          props.cacheKeyPrefix + props.returnTypeKeyFn(value),
        )]: value,
      };
    }
    return acc;
  }, {});

  return props.values.map((value) => {
    return resultsAsObject[
      props.cache.getKey(props.cacheKeyPrefix + props.valueKeyFn(value))
    ];
  });
};

/**
 * Batch function with caching
 * @param props
 *
 * This is not going away immediately, but really should not be used anymore
 * outside `parser-graphql-wrapper`. If we run into performance issues, enabling
 * autopipelining in ioredis is recommended instead:
 * https://github.com/luin/ioredis#autopipelining
 * @deprecated
 */
export const batchCacheFn = async <valueType, returnType>(
  props: BatchFnProps<valueType, returnType>,
): Promise<returnType[]> => {
  // set the cache key prefix to empty string as default
  props.cacheKeyPrefix = props.cacheKeyPrefix ?? '';

  // get the cached values from the cache using the values
  const cachedValues = await multiGetCachedValues<valueType, returnType>(props);

  // if the length of the values is the same as the cached values, return here
  // since this means all the values were found in the cache
  if (props.values.length === cachedValues.length) return cachedValues;

  // get all the item values that were not found in the cache
  const cachedKeys = cachedValues.map(props.returnTypeKeyFn);
  const missedKeys = props.values.filter((value) => {
    return !cachedKeys.includes(props.valueKeyFn(value));
  });

  // call the callback
  const batchResult = await props.callback(missedKeys);

  // cache all the callback values
  await multiSetCacheValues<returnType>(batchResult, props);

  // add the cached values to the callback values
  const allValues = batchResult.concat(cachedValues);

  return reorderData<valueType, returnType>(allValues, props);
};
