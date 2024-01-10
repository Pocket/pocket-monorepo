import { Item, SavedItem } from '../types';
import { IContext } from '../server/context';
import { SavedItemDataService } from '../dataService';

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
