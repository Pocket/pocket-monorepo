import { ValidLanguageApprovedItemPayload } from '../types';
import { config } from '../config';

/**
 * Index an "Approved Item" in the search cluster.
 * Returns commands for bulk operation.
 */
export function upsertApprovedItem(event: ValidLanguageApprovedItemPayload) {
  const index = config.indexLangMap[event.language.toLowerCase()];
  return [
    { index: { _index: index, _id: event.approvedItemExternalId } },
    {
      corpusId: event.approvedItemExternalId,
      title: event.title,
      url: event.url,
      excerpt: event.excerpt,
      is_syndicated: event.isSyndicated,
      language: event.language,
      publisher: event.publisher,
      topic: event.topic,
      authors: event.authors?.map((author) => author.name),
      created_at: event.createdAt
        ? Math.round(new Date(event.createdAt).getTime() / 1000)
        : undefined,
      published_at: event.datePublished
        ? Math.round(new Date(event.datePublished).getTime() / 1000)
        : undefined,
      is_collection: event.isCollection,
      is_collection_story: false,
      curation_source: event.source,
      quality_rank: event.grade
        ? config.gradeRankMap[event.grade.toLowerCase()]
        : undefined,
    },
  ];
}
