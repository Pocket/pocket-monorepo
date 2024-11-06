import { PocketEventType } from '../events';
import { BaseEvent } from './base';

export type CollectionPocketEventType =
  | PocketEventType.COLLECTION_CREATED
  | PocketEventType.COLLECTION_UPDATED;

export type CollectionEvent = CollectionCreated | CollectionUpdated;

interface CollectionBaseEvent extends BaseEvent {
  'detail-type': CollectionPocketEventType;
  detail: CollectionPayload;
}

export interface CollectionCreated extends CollectionBaseEvent {
  'detail-type': PocketEventType.COLLECTION_CREATED;
}

export interface CollectionUpdated extends CollectionBaseEvent {
  'detail-type': PocketEventType.COLLECTION_UPDATED;
}

/**
 * NOTE: The following is from the Content monorepo
 */

export interface CollectionPayload {
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
}

export interface CollectionStoryAuthor {
  name: string;
  sort_order: number;
}

export interface CurationCategory {
  collection_curation_category_id: string;
  name: string;
  slug: string;
}

export interface CollectionPartnership {
  collection_partnership_id: string;
  name: string;
  blurb: string;
  image_url: string;
  type: string;
  url: string;
}

export interface CollectionAuthor {
  collection_author_id: string;
  name: string;
  active: boolean;
  slug?: string;
  bio?: string;
  image_url?: string;
}

export interface CollectionStory {
  collection_story_id: string;
  url: string;
  title: string;
  excerpt: string;
  image_url?: string;
  publisher?: string;
  authors: CollectionStoryAuthor[];
  is_from_partner: boolean;
  sort_order?: number;
}

export interface IABParentCategory {
  collection_iab_parent_category_id: string;
  name: string;
  slug: string;
}

export interface IABChildCategory {
  collection_iab_child_category_id: string;
  name: string;
  slug: string;
}

export interface Label {
  collection_label_id: string;
  name: string;
}
