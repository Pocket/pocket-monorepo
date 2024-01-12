import {
  CreateShareableListInput,
  ShareableList,
  UpdateShareableListInput,
} from '../../../database/types';
import {
  createShareableList as dbCreateShareableList,
  deleteShareableList as dbDeleteShareableList,
  updateShareableList as dbUpdateShareableList,
} from '../../../database/mutations';
import { IPublicContext } from '../../context';
import { executeMutation } from '../utils';

/**
 * @param parent
 * @param data
 * @param context
 */
export async function createShareableList(
  parent,
  { listData, listItemData },
  context: IPublicContext
): Promise<ShareableList> {
  if (listItemData) {
    listData['listItem'] = listItemData;
  }
  return await executeMutation<CreateShareableListInput, ShareableList>(
    context,
    listData,
    dbCreateShareableList
  );
}

/**
 * The update list mutation. Handles everything, including toggling the list
 * between PRIVATE and PUBLIC.
 *
 * @param parent
 * @param data
 * @param context
 */
export async function updateShareableList(
  parent,
  { data },
  context: IPublicContext
): Promise<ShareableList> {
  return await executeMutation<UpdateShareableListInput, ShareableList>(
    context,
    data,
    dbUpdateShareableList
  );
}

/**
 * @param parent
 * @param externalId
 * @param context
 */
export async function deleteShareableList(
  parent,
  { externalId },
  context: IPublicContext
): Promise<ShareableList> {
  return await executeMutation<string, ShareableList>(
    context,
    externalId,
    dbDeleteShareableList
  );
}
