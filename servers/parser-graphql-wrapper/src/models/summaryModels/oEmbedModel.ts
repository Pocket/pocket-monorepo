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

export class oEmbedModel implements IItemSummaryDataSource {
  // Use oEmbed for TikTok, and others in the future
  matcher = /^(?!.*\b(tiktok\.com)\b).*$/;
  ttl = 7 * 60 * 60 * 24; // 7 days of ttl cache
  source = ItemSummarySource.Opengraph;

  async deriveItemSummary(
    item: Item,
    fallbackParserItemSummary: ItemSummary,
    context: IContext,
  ): Promise<ItemSummary> {
    // If we have data from oembed, let's overwrite the Parser content
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
}
