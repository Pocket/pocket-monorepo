import {
  Item,
  OEmbed,
  PocketMetadata,
  PocketMetadataSource,
} from '../../__generated__/resolvers-types';
import { IContext } from '../../apollo/context';
import { IPocketMetadataDataSource } from '../PocketMetadataModel';
import { merge } from 'lodash';

export class OEmbedModel implements IPocketMetadataDataSource {
  // Use oEmbed for TikTok, and others in the future
  matcher = /^(.*\b(tiktok\.com)\b).*$/;
  ttl = 7 * 60 * 60 * 24; // 7 days of ttl cache
  source = PocketMetadataSource.Oembed;

  async derivePocketMetadata(
    item: Item,
    fallbackParserPocketMetadata: PocketMetadata,
    context: IContext,
  ): Promise<OEmbed> {
    // If we have data from oembed, let's overwrite the Parser content
    // Also uses lodash for a deep merge with the fallback data ignoring undefined
    return merge(fallbackParserPocketMetadata);
  }

  isEnabled(context: IContext): boolean {
    return true;
  }
}
