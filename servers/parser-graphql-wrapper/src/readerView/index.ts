import { IntMask } from '@pocket-tools/int-mask';
import { IContext } from '../context';
import { ReaderFallback } from '../model';
import { deriveItemSummary } from '../preview/preview';

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

  const itemCard = await deriveItemSummary(item);

  return { itemCard };
}
