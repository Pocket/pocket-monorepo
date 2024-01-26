import {
  ListItemResponse,
  ListResponse,
  ShareableListItem,
} from '../../../database/types';
import { BaseContext } from '../../types';
import { getShareableListItems } from '../../../database/queries/ShareableListItems';

// In the future we should add pagination to this field,
export async function ListItemsResolver(
  parent: ListResponse & { listItems?: ShareableListItem[] },
  args,
  context: BaseContext,
): Promise<ListItemResponse[]> {
  if (parent.listItems != null) {
    return parent.listItems as any;
  }
  return await getShareableListItems(context, parent.id);
}
