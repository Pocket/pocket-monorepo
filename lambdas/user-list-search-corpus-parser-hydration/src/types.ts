// Note: These are reused (copied) from user-list-search-corpus-indexing/src/types
// since they listen to the same event

export type EventPayload = {
  messageId: string;
  detailType: string;
  detail: ApprovedItemPayload | CollectionPayload;
};

export type IndexMeta = {
  meta: { _id: string; _index: string };
};

export interface BulkRequestMeta extends IndexMeta {
  url: string;
  messageId: string;
  title?: string;
  excerpt?: string;
}

export interface BulkRequestPayload extends BulkRequestMeta {
  fields: ParserDocumentFields & { passage_embeddings?: number[] };
}

// See indices .docker/aws-resources/elasticsearch
export type ParserDocumentFields = Partial<{
  pocket_parser_extracted_text: string | null;
  est_time_to_consume_minutes: number;
  // Overall categorization for the content (e.g. article/index/video)
  content_type_parent: string;
  // Child types for the content
  // e.g. an article with embedded videos would have video as a child type
  content_type_children: string[];
  // Unindexed fields that can be returned in the response
  // for downstream data joins/deduplication
  pocket_item_id: string;
  pocket_resolved_id: string;
  pocket_normal_url: string;
  pocket_resolved_url: string;
  // The URL sent to the parser request (should be the same as
  // the URL field provided in the message
  pocket_parser_request_given_url: string;
}>;

export type ParserResult = {
  item_id: string;
  resolved_id: string;
  given_url: string;
  normal_url: string;
  resolved_normal_url: string;
  time_to_read: number;
  article: string | null;
  isArticle: number;
  has_video: string;
  has_image: string;
  isIndex: number;
  title: string | null;
  excerpt: string | null;
  videos?: { [id: number]: { length: string } };
};

// See infrastructure/pocket-event-bridge/src/event-rules/corpus-events/eventConfig.ts
// and infrastructure/pocket-event-bridge/src/event-rules/collection-events/eventConfig.ts
export const validDetailTypes = [
  'add-approved-item',
  'update-approved-item',
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
  source?: string | null;
  grade?: string | null;
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
