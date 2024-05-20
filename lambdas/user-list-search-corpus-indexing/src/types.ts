export type EventPayload = {
  messageId: string;
  detailType: string;
  detail: ApprovedItemPayload | CollectionPayload;
};

// See indices .docker/aws-resources/elasticsearch
export type CorpusItemIndex = {
  meta: { _id: string; _index: string };
  fields: Partial<{
    title: string;
    url: string;
    excerpt: string;
    is_syndicated: boolean;
    language: string;
    publisher: string;
    topic: string;
    authors: string | string[];
    created_at: number; // seconds from epoch
    published_at: number; // seconds from epoch
    is_collection: boolean;
    collection_labels: string | string[];
    curation_category: string;
    iab_parent: string;
    iab_child: string;
    is_collection_story?: boolean;
    parent_id?: string;
  }>;
};

// See infrastructure/pocket-event-bridge/src/event-rules/corpus-events/eventConfig.ts
// and infrastructure/pocket-event-bridge/src/event-rules/collection-events/eventConfig.ts
export const validDetailTypes = [
  'add-approved-item',
  'updated-approved-item',
  'collection-created',
  'collection-updated',
];

type Author = { name: string; sortOrder: number };

// Types below are all copied from:
// https://github.com/Pocket/content-monorepo/blob/7342cb5468f11fc0b3ffdddf8693b6aeeb64f26e/servers/curated-corpus-api/src/events/types.ts#L95
export type ApprovedItemPayload = {
  eventType: string;
  approvedItemExternalId: string;
  url: string;
  authors?: Author[];
  title?: string | null;
  excerpt?: string | null;
  language?: string | null;
  publisher?: string | null;
  imageUrl?: string | null;
  topic?: string | null;
  createdAt?: string | null; // UTC timestamp string
  createdBy?: string | null; // UTC timestamp string
  updatedAt?: string | null; // UTC timestamp string
  datePublished?: string; // UTC timestamp string
  isSyndicated?: boolean;
  isCollection?: boolean;
  domainName?: string;
  isTimeSensitive?: boolean;
};

// servers/shared-snowplow-consumer/src/eventConsumer/collectionEvents/types.ts
export type CollectionPayload = {
  collection: {
    externalId: string;
    slug: string;
    title: string;
    status: string;
    language: string;
    authors: CollectionAuthor[];
    stories: CollectionStory[];
    createdAt: number; // in seconds
    updatedAt: number; // in seconds

    imageUrl?: string;
    labels?: Label[];
    intro?: string;
    curationCategory?: CurationCategory;
    excerpt?: string;
    partnership?: CollectionPartnership;
    publishedAt?: number; // in seconds
    IABParentCategory?: IABParentCategory;
    IABChildCategory?: IABChildCategory;
  };
};

export type CollectionStoryAuthor = { name: string; sort_order: number };

export type CurationCategory = {
  collection_curation_category_id: string;
  name: string;
  slug: string;
};

export type CollectionPartnership = {
  collection_partnership_id: string;
  name: string;
  blurb: string;
  image_url: string;
  type: string;
  url: string;
};

export type CollectionAuthor = {
  collection_author_id: string;
  name: string;
  active: boolean;
  slug?: string;
  bio?: string;
  image_url?: string;
};

export type CollectionStory = {
  collection_story_id: string;
  url: string;
  title: string;
  excerpt: string;
  image_url?: string;
  publisher?: string;
  authors: CollectionStoryAuthor[];
  is_from_partner: boolean;
  sort_order?: number;
};

export type IABParentCategory = {
  collection_iab_parent_category_id: string;
  name: string;
  slug: string;
};

export type IABChildCategory = {
  collection_iab_child_category_id: string;
  name: string;
  slug: string;
};

export type Label = { collection_label_id: string; name: string };
