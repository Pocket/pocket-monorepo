import { config } from '../config';
import { ValidatedEventPayload } from '../types';
import { setTimeout } from 'timers/promises';
import { originalCorpusId } from './originalCorpusId';
/**
 * Returns index and ID of original content that would
 * be duplicated by a new syndication entry.
 */
export async function syndicationDupes(
  payload: ValidatedEventPayload[],
): Promise<Array<{ id: string; index: string }>> {
  const syndicatedItems: Array<{ index: string; url: string }> =
    payload.flatMap((item) => {
      if ('isSyndicated' in item.detail && item.detail.isSyndicated === true) {
        return [
          {
            index: config.indexLangMap[item.detail.language.toLowerCase()],
            url: item.detail.url,
          },
        ];
      }
      return [];
    });
  const dupesToDelete: Array<{ id: string; index: string }> = [];
  for await (const item of syndicatedItems) {
    const originalId = await originalCorpusId(item.url);
    if (originalId != null) {
      dupesToDelete.push({ index: item.index, id: originalId });
    }
    // Small delay between requests
    await setTimeout(200);
  }
  return dupesToDelete;
}
