import DataLoader from 'dataloader';
import { batchGetShortUrl } from '../shortUrl/shortUrl';
import { BatchAddShareUrlInput, conn } from '../databases/readitlaShares';

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
