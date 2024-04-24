import {
  Item,
  ItemSummary,
  ItemSummarySource,
} from '../__generated__/resolvers-types';
import { IContext } from '../apollo/context';
import config from '../config';
import { unleash } from '../unleash';
import { IItemSummaryDataSource } from './ItemSummaryRouter';
import ogs from 'open-graph-scraper';
import { serverLogger } from '@pocket-tools/ts-logger';
import { merge } from 'lodash';

export class OpenGraphDataSource implements IItemSummaryDataSource {
  async deriveItemSummary(
    item: Item,
    fallbackParserItemSummary: ItemSummary,
    context: IContext,
  ): Promise<ItemSummary> {
    const openGraphData = await this.openGraphMetadata(item);
    // If we have data from opengraph, let's overwrite the Parser content, unless its a domain we should be skipping
    // Also uses lodash for a deep merge ignoring undefined
    const itemCard = merge(fallbackParserItemSummary, openGraphData);

    return itemCard;
  }
  async supportsItem(item: Item, context: IContext): Promise<boolean> {
    // We skip these domains for opengraph data because the parser grabs it from their APIs which is more accurate.
    const openGraphDomainsToSkip = ['reddit.com', 'youtube.com'];
    if (openGraphDomainsToSkip.includes(item.domain)) {
      return false;
    }

    // If the open graph parser is enabled lets use it
    return unleash().isEnabled(
      config.unleash.flags.openGraphParser.name,
      {
        userId: context.userId,
        remoteAddress: context.ip,
      },
      config.unleash.flags.openGraphParser.fallback,
    );
  }
  source(): ItemSummarySource {
    return ItemSummarySource.Opengraph;
  }

  async openGraphMetadata(item: Item): Promise<Partial<ItemSummary>> {
    const userAgent =
      'PocketParser/2.0 (+https://getpocket.com/pocketparser_ua)';

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
      source: ItemSummarySource.Opengraph,
      title: result.ogTitle ?? undefined,
      image: firstImage
        ? {
            imageId: 1,
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
  }
}
