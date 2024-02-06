import { ObjectUpdateTrigger } from '../../snowtype/snowplow';

export type BasicCollectionEventPayloadWithContext = {
  object_version: string;
  collection: Collection;
};

export type EventTypeString = keyof typeof EventType;

export type CollectionEventPayloadSnowplow =
  BasicCollectionEventPayloadWithContext & {
    eventType: EventTypeString;
  };
export const SnowplowEventMap: Record<EventTypeString, ObjectUpdateTrigger> = {
  COLLECTION_CREATED: 'collection_created',
  COLLECTION_UPDATED: 'collection_updated',
};

export enum EventType {
  COLLECTION_CREATED = 'COLLECTION_CREATED',
  COLLECTION_UPDATED = 'COLLECTION_UPDATED',
}

/**
 * This Collection type aligns with what we have in collection-api i.e the object keys are the same as the Collection type.
 * The child types however map to the snowplow schema for the Collection object. These types should be refactored @Herraj
 */
export type Collection = {
  externalId: string;
  slug: string;
  title: string;
  status: CollectionStatus;
  language: CollectionLanguage;
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

/**
 * All of the types below map to the sub types in the snowplow Collection schema. See the comment above for the Collection type.
 */
export enum CollectionLanguage {
  DE = 'DE',
  EN = 'EN',
}

export enum CollectionPartnershipType {
  PARTNERED = 'PARTNERED',
  SPONSORED = 'SPONSORED',
}

export type CollectionStatus = 'draft' | 'review' | 'published' | 'archived';

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
  type: CollectionPartnershipType;
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
