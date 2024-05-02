import DataLoader from 'dataloader';
import { batchGetShortUrl } from '../shortUrl/shortUrl.js';
import { BatchAddShareUrlInput, conn } from '../databases/readitlaShares.js';

const partialBatchGetShortUrls = async (
  inputs: readonly BatchAddShareUrlInput[],
) => {
  return await batchGetShortUrl(inputs, conn());
};

export const ShortUrlLoader = () =>
  new DataLoader<BatchAddShareUrlInput, string, string>(
    (inputs) => partialBatchGetShortUrls(inputs),
    {
      cacheKeyFn: (key) => `${key.itemId}|${key.resolvedId}|${key.givenUrl}`,
    },
  );
