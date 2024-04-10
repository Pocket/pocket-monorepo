import { IntMask } from '@pocket-tools/int-mask';
import { IContext } from '../context';
import { ReaderFallback } from '../model';
import { DateTime } from 'luxon';
import config from '../config';

/**
 * FallbackPage resolver for ReaderViewResult query
 * @param parent GraphQL root/parent field
 * @param _ GraphQL args (unused)
 * @param context GraphQL context
 * @returns Item, or NotFound result
 */
export async function fallbackPage(
  slug: string,
  context: IContext,
): Promise<ReaderFallback> {
  const id = IntMask.decode(slug).toString();
  const item = await context.dataLoaders.itemIdLoader.load(id);
  if (item == null) {
    return { message: "We couldn't find that page." };
  }
  const itemCard = {
    image: item.topImage ?? item.images?.[0],
    excerpt: item.excerpt,
    title: item.title,
    authors: item.authors,
    domain: item.domainMetadata,
    datePublished: DateTime.fromSQL(item.datePublished, {
      zone: config.mysql.tz,
    }).toJSDate(),
    url: item.givenUrl,
    item,
  };
  return { itemCard };
}
