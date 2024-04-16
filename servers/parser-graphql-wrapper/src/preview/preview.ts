import { Item, ItemSummary } from '../model';
import { DateTime } from 'luxon';
import config from '../config';

import ogs from 'open-graph-scraper';
import { serverLogger } from '@pocket-tools/ts-logger';
import { IContext } from '../context';
import { unleash } from '../unleash';

// We skip these domains for opengraph data because the parser grabs it from their APIs which is more accurate.
const openGraphDomainsToSkip = ['reddit.com', 'youtube.com'];

export const deriveItemSummary = async (
  item: Item,
  context: IContext,
): Promise<ItemSummary> => {
  let itemCard = {
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
  };

  // If the open graph parser is enabled lets use it
  if (
    unleash().isEnabled(
      config.unleash.flags.openGraphParser.name,
      {
        userId: context.userId,
        remoteAddress: context.ip,
      },
      config.unleash.flags.openGraphParser.fallback,
    )
  ) {
    const openGraphData = await openGraphMetadata(item);
    itemCard = {
      ...itemCard,
      // If we have data from opengraph, let's overwrite the Parser content, unless its a domain we should be skipping
      ...(openGraphDomainsToSkip.some((domain) =>
        item.givenUrl.includes(domain),
      )
        ? {}
        : openGraphData),
    };
  }
  return itemCard;
};

const openGraphMetadata = async (item: Item): Promise<Partial<ItemSummary>> => {
  const userAgent = 'PocketParser/2.0 (+https://getpocket.com/pocketparser_ua)';

  const openGraphData = await ogs({
    url: item.givenUrl,
    onlyGetOpenGraphInfo: false,
    fetchOptions: { headers: { 'user-agent': userAgent } },
    timeout: 3, // timeout after 3 seconds
  });

  if (openGraphData.error) {
    return {};
  }

  const result = openGraphData.result;
  const firstImage = result.ogImage ? result.ogImage[0] : undefined;
  serverLogger.debug('Open Graph Data', { opengraph: openGraphData.result });

  // We return a parital object that is expanded into the main ItemSummary object populated with Item data.
  // We use undefined because that will make the root object default to Item data when not existant
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
