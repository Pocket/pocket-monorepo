import DataLoader from 'dataloader';
import { batchGetShortUrl } from '../shortUrl/shortUrl';
import {
  BatchAddShareUrlInput,
  getSharedUrlsResolverRepo,
} from '../datasources/mysql';

const partialBatchGetShortUrls = async (
  inputs: readonly BatchAddShareUrlInput[],
) => {
  const shareRepo = await getSharedUrlsResolverRepo();
  return await batchGetShortUrl(inputs, shareRepo);
};

export const ShortUrlLoader = () =>
  new DataLoader<BatchAddShareUrlInput, string, string>(
    (inputs) => partialBatchGetShortUrls(inputs),
    {
      cacheKeyFn: (key) => `${key.itemId}|${key.resolvedId}|${key.givenUrl}`,
    },
  );
