import {
  SavedItem,
  PocketSave,
  PendingItemStatus,
  PendingItem,
  Item,
} from '../types';

export class ItemModel {
  /**
   * Resolve Item/Pending Item on a Save. If the Item has been fully
   * processed by the Parser, the Save parent will have a resolvedId
   * for the Item; otherwise it is a PendingItem.
   * @param parent the SavedItem/PocketSave entity to resolve Item for
   * @returns the Item | PendingItem (if not yet processed) result
   */
  public getBySave(
    parent:
      | Pick<SavedItem, 'url' | 'id' | 'resolvedId'>
      | Pick<PocketSave, 'givenUrl' | 'id' | 'resolvedId'>,
  ): Item | PendingItem {
    const url: string | null =
      'url' in parent
        ? parent.url
        : 'givenUrl' in parent
          ? parent.givenUrl
          : null;

    if (url == null) throw new Error('Invalid parent entity, missing a url');

    if (parent.resolvedId != null && parseInt(parent.resolvedId)) {
      return {
        __typename: 'Item',
        givenUrl: url,
        itemId: parent.id,
        resolvedId: parent.resolvedId,
      };
    }
    // resolvedId was null/undefined/0
    return {
      __typename: 'PendingItem',
      url,
      itemId: parent.id,
      status: PendingItemStatus.UNRESOLVED,
    };
  }
}
