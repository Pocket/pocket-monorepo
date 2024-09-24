import { ValidLanguageApprovedItemPayload } from '../types';
import { config } from '../config';

/**
 * Remove an "ApprovedItem" from the search cluster.
 * Returns commands for bulk operation.
 * Note that this will not work for deleting parent copies
 * of Collections in the Curated Corpus. We could do a lookup
 * similar to how the records are merged when a copy is made
 * in the corpus, but I don't think this matches the business
 * logic. The Collection entity should be the source of truth,
 * not the copy of the parent in the corpus. We already do not
 * return results if the Collection is archived.
 * TODO - Model how Collections are deleted.
 */
export function removeApprovedItem(
  event: ValidLanguageApprovedItemPayload,
): Array<any> {
  const index = config.indexLangMap[event.language.toLowerCase()];
  return [{ delete: { _index: index, _id: event.approvedItemExternalId } }];
}
