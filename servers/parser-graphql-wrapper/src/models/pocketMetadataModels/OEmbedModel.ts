import {
  Item,
  OEmbed,
  OEmbedType,
  PocketMetadata,
  PocketMetadataSource,
} from '../../__generated__/resolvers-types';
import { IContext } from '../../apollo/context';
import { IPocketMetadataDataSource } from '../PocketMetadataModel';
import { merge } from 'lodash';
import { extract } from '@extractus/oembed-extractor';

export class OEmbedModel implements IPocketMetadataDataSource {
  // Use oEmbed for TikTok, and others in the future
  matcher = /^(.*\b(tiktok\.com|ted\.com)\b).*$/;
  ttl = 2 * 60 * 60 * 24; // 2 days of ttl cache since TikTok expires their oembed urls after 2 days of generation
  source = PocketMetadataSource.Oembed;
  version = 1;

  async derivePocketMetadata(
    item: Item,
    fallbackParserPocketMetadata: PocketMetadata,
    context: IContext,
  ): Promise<OEmbed> {
    const oembedData = await this.parseOEmbed(item);
    // If we have data from oembed, let's overwrite the Parser content
    // Also uses lodash for a deep merge with the fallback data ignoring undefined
    return merge(fallbackParserPocketMetadata, oembedData);
  }

  isEnabled(context: IContext): boolean {
    return true;
  }

  async parseOEmbed(item: Item): Promise<Partial<OEmbed>> {
    const userAgent =
      'PocketParser/2.0 (+https://getpocket.com/pocketparser_ua)';
    const result = await extract(item.givenUrl, null, {
      signal: AbortSignal.timeout(5000),
      headers: { 'user-agent': userAgent },
    });

    if (!result) {
      return {};
    }

    return {
      __typename: 'OEmbed',
      source: PocketMetadataSource.Oembed,
      authors: result.author_name
        ? [{ name: result.author_name, url: result.author_url, id: '1' }]
        : undefined,
      domain: result.provider_name ? { name: result.provider_name } : undefined,
      title: result.title,
      htmlEmbed: 'html' in result ? (result.html as string) : undefined,
      image: result.thumbnail_url
        ? {
            imageId: 1,
            url: result.thumbnail_url,
            src: result.thumbnail_url,
            height: result.thumbnail_height,
            width: result.thumbnail_width,
          }
        : undefined,
      type: result.type.toUpperCase() as OEmbedType, // cast because we manually convert to upper case which typescript doesnt understand
    };
  }
}
