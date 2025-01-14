import { CollectionApprovedItemPayload } from '../types.ts';
import { config } from '../config.ts';
import { collectionIdFromCorpus } from '../queries/index.ts';

/**
 * Update a Collection entry with additional metadata from
 * the "ApprovedItem" copy of it in the Curated Corpus.
 * Making an assumption that the Corpus entry for a Collection
 * is added after the Collection is created, since the Collection
 * is the source of truth.
 * @param event
 * @returns
 */
export async function mergeCollection(event: CollectionApprovedItemPayload) {
  const index = config.indexLangMap[event.language.toLowerCase()];
  const collectionId = await collectionIdFromCorpus(event.url);
  if (collectionId == null) {
    return [];
  } else {
    return [
      { update: { _index: index, _id: collectionId } },
      // The unique metadata in the Corpus but not Collection store
      {
        doc: {
          // Can sometimes be changed from 'Pocket' to include a partner, e.g.
          // Pocket + Esquire
          publisher: event.publisher,
          topic: event.topic,
          curation_source: event.source,
          quality_rank: event.grade
            ? config.gradeRankMap[event.grade.toLowerCase()]
            : undefined,
          is_time_sensitive: event.isTimeSensitive,
        },
      },
    ];
  }
}
