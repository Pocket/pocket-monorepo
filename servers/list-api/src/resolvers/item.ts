import { Item, SavedItem } from '../types/index.js';
import { IContext } from '../server/context.js';
import { SavedItemDataService } from '../dataService/index.js';

/**
 * Resolve saved item on the Item entity
 * @param parent
 * @param args
 * @param context
 */
export function savedItem(
  parent: Item,
  args,
  context: IContext,
): Promise<SavedItem> {
  return new SavedItemDataService(context).getSavedItemByGivenUrl(
    parent.givenUrl,
  );
}
