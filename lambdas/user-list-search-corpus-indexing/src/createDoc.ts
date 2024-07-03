import { EventPayload, CorpusItemIndex } from './types';
import { config } from './config';
import { buildCollectionUrl } from './utils';

/**
 * Build elasticsearch documents from the event payload.
 * Conditionally builds depending on event type.
 * Separated from the main handler solely it can be mocked for
 * generating bad test payloads...
 * @param payload EventPayload
 * @returns index documents for the bulk elasticsearch api
 */
export function createDoc(payload: EventPayload): CorpusItemIndex[] {
  if ('collection' in payload.detail) {
    const { collection } = payload.detail;
    const _index = config.indexLangMap[collection.language.toLowerCase()];
    const inheritedFields = {
      created_at: collection.createdAt,
      collection_labels: collection.labels?.map((label) => label.name),
      language: collection.language,
      curation_category: collection.curationCategory?.name,
      iab_child: collection.IABChildCategory?.name,
      iab_parent: collection.IABParentCategory?.name,
      status: collection.status.toLowerCase(),
    };
    const parent: CorpusItemIndex = {
      meta: { _id: collection.externalId, _index },
      fields: {
        corpusId: collection.externalId,
        title: collection.title,
        url: buildCollectionUrl(collection.slug, collection.language),
        excerpt: collection.excerpt,
        is_syndicated: false,
        publisher: 'Pocket',
        authors: collection.authors?.map((author) => author.name),
        published_at: collection.publishedAt,
        is_collection: true,
        is_collection_story: false,
        ...inheritedFields,
      },
    };
    const stories: CorpusItemIndex[] = collection.stories.map((story) => ({
      meta: {
        _id: story.collection_story_id,
        _index,
      },
      fields: {
        corpusId: story.collection_story_id,
        parent_collection_id: collection.externalId,
        url: story.url,
        title: story.title,
        excerpt: story.excerpt,
        publisher: story.publisher,
        authors: story.authors?.map((author) => author.name),
        is_collection_story: true,
        ...inheritedFields,
      },
    }));
    stories.push(parent);
    return stories;
  } else {
    const event = payload.detail;
    const data = [
      {
        meta: {
          _id: event.approvedItemExternalId,
          _index: config.indexLangMap[event.language.toLowerCase()],
        },
        fields: {
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
          is_collection_story: false,
          curation_source: event.source,
          quality_rank: event.grade
            ? config.gradeRankMap[event.grade.toLowerCase()]
            : undefined,
        },
      },
    ];
    return data;
  }
}
