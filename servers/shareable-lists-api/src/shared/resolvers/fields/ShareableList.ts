import { ListResponse } from '../../../database/types';
import { BaseContext } from '../../types';
import { getShareableListItems } from '../../../database/queries/ShareableListItems';

// In the future we should add pagination to this field,
export async function ListItemsResolver(
  parent: ListResponse,
  args,
  context: BaseContext,
) {
  const res = await getShareableListItems(context, parent.id);
  console.log('retrieval of list items complete');
  console.log(JSON.stringify(res, null, 2));
  return res;
}
