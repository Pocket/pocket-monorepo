import { IntMask } from '@pocket-tools/int-mask';
import { IContext } from '../apollo/context';
import { ReaderFallback } from '../__generated__/resolvers-types';
import { deriveItemSummary } from '../preview';

const notFound = { message: "We couldn't find that page." };

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
  const itemLoaderResult = await context.dataLoaders.itemIdLoader.load(id);

  if (itemLoaderResult == null || itemLoaderResult.url == null) {
    return notFound;
  }

  const item = await context.dataSources.parserAPI.getItemData(
    itemLoaderResult.url,
  );

  if (item == null) {
    return notFound;
  }

  const itemCard = await deriveItemSummary(item, context);

  return { itemCard };
}
