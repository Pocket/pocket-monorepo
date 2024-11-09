import { CollectionPayload } from '@pocket-tools/event-bridge';
import { config } from '../config';
import { buildCollectionUrl } from '../utils';

/**
 * Index a Collection object in the search cluster.
 * Returns the commands for a bulk operation
 * of the Collection and all Stories it contains.
 */
export function upsertCollection(event: CollectionPayload): any[] {
  const { collection } = event;
  const index = config.indexLangMap[collection.language.toLowerCase()];

  const inheritedFields = {
    created_at: collection.createdAt,
    collection_labels: collection.labels?.map((label) => label.name),
    language: collection.language,
    curation_category: collection.curationCategory?.name,
    iab_child: collection.IABChildCategory?.name,
    iab_parent: collection.IABParentCategory?.name,
    status: collection.status.toLowerCase(),
  };
  const parentCommands = [
    { index: { _index: index, _id: collection.externalId } },
    {
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
  ];
  const storyCommands = collection.stories.flatMap((story) => {
    return [
      { index: { _index: index, _id: story.collection_story_id } },
      {
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
    ];
  });
  return [...parentCommands, ...storyCommands];
}
