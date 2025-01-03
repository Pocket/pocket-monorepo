import { SyndicatedItemPayload } from '../types.ts';
import { config } from '../config.ts';
import { upsertApprovedItem } from './ApprovedItem.ts';
import { originalCorpusId } from '../queries/index.ts';

/**
 * Index a Syndicated Item in the search corpus.
 * Returns commands to index the item in bulk
 * operation, plus any delete operations required
 * (if the syndicated item duplicates an existing
 * record).
 */
export async function upsertSyndicatedItem(
  event: SyndicatedItemPayload,
): Promise<Array<any>> {
  const index = config.indexLangMap[event.language.toLowerCase()];
  const indexCommands = upsertApprovedItem(event) as Array<any>; // heterogenous bulk command has no types
  // If this newly syndicated article already existed in the corpus,
  // delete the corpus entry so that we prefer the syndicated version
  // (and do not have duplicates in results)
  const duplicateId = await originalCorpusId(event.url);
  if (duplicateId != null) {
    indexCommands.push({ delete: { _index: index, _id: duplicateId } });
  }
  return indexCommands;
}
