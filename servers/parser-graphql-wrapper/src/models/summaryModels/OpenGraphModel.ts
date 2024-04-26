import {
  Item,
  ItemSummary,
  ItemSummarySource,
} from '../../__generated__/resolvers-types';
import { IContext } from '../../apollo/context';
import config from '../../config';
import { unleash } from '../../unleash';
import { IItemSummaryDataSource } from '../ItemSummaryModel';
import ogs from 'open-graph-scraper';
import { merge } from 'lodash';

export class OpenGraphModel implements IItemSummaryDataSource {
  // Use OpenGraph for all domains except for youtube.com and reddit.
  // Open graph should be last in the matcher array
  matcher = /^(?!.*\b(youtube\.com|reddit\.com)\b).*$/;
  ttl = 7 * 60 * 60 * 24; // 7 days of ttl cache
  source = ItemSummarySource.Opengraph;

  async deriveItemSummary(
    item: Item,
    fallbackParserItemSummary: ItemSummary,
    context: IContext,
  ): Promise<ItemSummary> {
    const openGraphData = await this.openGraphMetadata(item);
    // If we have data from opengraph, let's overwrite the Parser content
    // Also uses lodash for a deep merge with the fallback data ignoring undefined
    return merge(fallbackParserItemSummary, openGraphData);
  }

  isEnabled(context: IContext): boolean {
    // If the open graph parser is enabled lets use it
    const enabled = unleash().isEnabled(
      config.unleash.flags.openGraphParser.name,
      {
        userId: context.userId,
        remoteAddress: context.ip,
      },
      config.unleash.flags.openGraphParser.fallback,
    );
    return enabled;
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

    if (!openGraphData || openGraphData.error) {
      return {};
    }

    const result = openGraphData.result;
    const firstImage = result.ogImage ? result.ogImage[0] : undefined;

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
