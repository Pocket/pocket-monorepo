import { Item, ItemSummary } from '../model';
import { DateTime } from 'luxon';
import config from '../config';

import ogs from 'open-graph-scraper';
import { serverLogger } from '@pocket-tools/ts-logger';

export const deriveItemSummary = async (item: Item): Promise<ItemSummary> => {
  const openGraphData = await openGraphMetadata(item);
  const itemCard = {
    id: item.id,
    image: item.topImage ?? item.images?.[0],
    excerpt: item.excerpt,
    title: item.title ?? item.givenUrl,
    authors: item.authors,
    domain: item.domainMetadata,
    datePublished: item.datePublished
      ? DateTime.fromSQL(item.datePublished, {
          zone: config.mysql.tz,
        }).toJSDate()
      : null,
    url: item.givenUrl,
    item,
    // If we have data from opengraph, let's overwrite the Parser content
    ...openGraphData,
  };
  return itemCard;
};

const openGraphMetadata = async (item: Item): Promise<Partial<ItemSummary>> => {
  // TODO: replace with pocket user agent
  const userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36';

  const openGraphData = await ogs({
    url: item.givenUrl,
    onlyGetOpenGraphInfo: false,
    fetchOptions: { headers: { 'user-agent': userAgent } },
  });

  if (openGraphData.error) {
    return {};
  }

  const result = openGraphData.result;
  const firstImage = result.ogImage ? result.ogImage[0] : undefined;
  serverLogger.debug('Open Graph Data', { opengraph: openGraphData.result });

  // We return a parital object that is expanded into the main ItemSummary object populated with Item data.
  // We use undefined because that will make the root object default to Item data when not existant
  // TODO:
  // authors, published date, etc
  return {
    title: result.ogTitle ?? undefined,
    image: firstImage
      ? {
          imageId: '1',
          url: firstImage.url,
          src: firstImage.url,
          width: firstImage.width ?? undefined,
          height: firstImage.height ?? undefined,
        }
      : undefined,
    excerpt: result.ogDescription ?? undefined,
    domain: result.ogSiteName
      ? { ...item.domainMetadata, name: result.ogSiteName }
      : undefined,
  };
};
