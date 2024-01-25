import { BaseContext } from '../../shared/types';
import { ListItemResponse, ListItemSelect } from '../types';

export async function getShareableListItems(
  context: BaseContext,
  listId: number,
): Promise<ListItemResponse[]> {
  const { conn } = context;
  const listItems = conn
    .selectFrom('ListItem')
    .where('listId', '=', listId)
    .select(ListItemSelect)
    .orderBy('sortOrder', 'asc')
    .orderBy('createdAt', 'asc')
    // Temporary tiebreaker sort for deterministic response
    .orderBy('itemId', 'asc')
    .execute();
  return listItems;
}
