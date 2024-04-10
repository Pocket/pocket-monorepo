import { Item, PendingItem, PendingItemStatus, SavedItem, Tag } from '../types';
import { SavedItemDataService, TagDataService } from '../dataService';
import { IContext } from '../server/context';

/**
 * Get paginated saved item tags
 * @param parent
 * @param args
 * @param context
 */
export async function suggestedTags(
  parent: SavedItem,
  args,
  context: IContext,
): Promise<Pick<Tag, 'id' | 'name'>[]> {
  if (!context.userIsPremium) {
    //Return an empty array if the user is not premium
    //Suggested Tags is a premium feature.
    return [];
  }

  return new TagDataService(
    context,
    new SavedItemDataService(context),
  ).getSuggestedTags(parent);
}

/**
 * Resolve Item entity using the givenUrl
 * @param parent
 */
export async function item(
  parent: SavedItem,
): Promise<Pick<Item, 'givenUrl'> | PendingItem> {
  if (parseInt(parent.resolvedId)) {
    return {
      __typename: 'Item',
      givenUrl: parent.url,
    };
  }
  return {
    __typename: 'PendingItem',
    itemId: parent.id,
    url: parent.url,
    status: PendingItemStatus.UNRESOLVED,
  };
}
