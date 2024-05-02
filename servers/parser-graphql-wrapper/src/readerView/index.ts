import { IContext } from '../apollo/context';
import { ReaderFallback } from '../__generated__/resolvers-types';
import { itemIdFromSlug } from './idUtils';

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
  const id = itemIdFromSlug(slug);
  if (id == null) {
    return notFound;
  }
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

  const itemCard = await context.dataSources.itemSummaryModel.deriveItemSummary(
    item,
    context,
  );

  return { itemCard };
}
