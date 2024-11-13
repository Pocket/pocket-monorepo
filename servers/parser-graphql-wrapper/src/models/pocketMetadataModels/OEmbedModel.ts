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
import { extract, hasProvider } from '@extractus/oembed-extractor';
import { serverLogger } from '@pocket-tools/ts-logger';
import { unleash } from '../../unleash';
import config from '../../config';

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
    try {
      const oembedData = await this.parseOEmbed(item);
      // If we have data from oembed, let's overwrite the Parser content
      // Also uses lodash for a deep merge with the fallback data ignoring undefined
      return merge(fallbackParserPocketMetadata, oembedData);
    } catch (e) {
      serverLogger.error('Error parsing oembed', { error: e });
      return fallbackParserPocketMetadata;
    }
  }

  isEnabled(context: IContext, url: string): boolean {
    if (this.matcher.test(url)) {
      return true;
    }

    // If the oembed is turned on for all domains, let's use it
    const enabled = unleash().isEnabled(
      config.unleash.flags.allOEmbedParser.name,
      {
        userId: context.encodedUserId,
        remoteAddress: context.ip,
      },
      config.unleash.flags.allOEmbedParser.fallback,
    );
    return enabled && hasProvider(url);
  }

  async parseOEmbed(item: Item): Promise<Partial<OEmbed>> {
    if (!hasProvider(item.givenUrl)) {
      serverLogger.debug('No oembed provider found for url', {
        url: item.givenUrl,
      });
      return {};
    }

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
