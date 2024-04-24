import { ItemSummary } from '../__generated__/resolvers-types';

import { IContext } from '../apollo/context';

export const itemSummaryFromUrl = async (
  url: string,
  context: IContext,
): Promise<ItemSummary> => {
  const item = await context.dataSources.parserAPI.getItemData(url);
  return await context.dataSources.itemSummaryRouter.deriveItemSummary(
    item,
    context,
  );
};
