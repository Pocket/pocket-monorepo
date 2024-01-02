import {
  Collection,
  CollectionAuthor,
  CollectionLanguage,
  CollectionStatus,
  CollectionStory,
  CollectionStoryAuthor,
  CollectionPartnership,
  CollectionPartnershipType,
  CurationCategory,
  IABParentCategory,
  IABChildCategory,
  Label,
} from './types';

const testAuthor: CollectionAuthor = {
  active: true,
  bio: 'test-author-bio',
  collection_author_id: 'test-author-id',
  image_url: 'www.test-author-image.com',
  name: 'testAuthor',
  slug: 'test-author',
};

const testStoryAuthor: CollectionStoryAuthor = {
  name: 'test-story-author',
  sort_order: 1,
};

const testStory: CollectionStory = {
  authors: [testStoryAuthor],
  excerpt: 'test-story-excerpt',
  collection_story_id: 'test-story-id',
  is_from_partner: true,
  image_url: 'www.test-story-image-url.com',
  publisher: 'test-story-publisher',
  sort_order: 1,
  title: 'test-story-title',
  url: 'test-story-url',
};

const testLabel: Label = {
  collection_label_id: 'test-label-id',
  name: 'test-label-name',
};

const testCurationCategory: CurationCategory = {
  collection_curation_category_id: 'test-curation-category-id',
  name: 'test-curation-category-name',
  slug: 'test-curation-category-name',
};

const testPartnership: CollectionPartnership = {
  blurb: 'test-partnership-blurb',
  collection_partnership_id: 'test-partnership-id',
  image_url: 'www.test-partnership-image.com',
  name: 'test-partnership-name',
  type: CollectionPartnershipType.PARTNERED,
  url: 'www.test-partnership-url.com',
};

const IABParentCategory: IABParentCategory = {
  collection_iab_parent_category_id: 'test-iab-category-id',
  name: 'test-iab-category-name',
  slug: 'test-iab-category-slug',
};

const IABChildCategory: IABChildCategory = {
  collection_iab_child_category_id: 'test-iab-category-id',
  name: 'test-iab-category-name',
  slug: 'test-iab-category-slug',
};

export const testCollectionData: Collection = {
  externalId: 'test-collection-id',
  slug: 'test-collection-slug',
  title: 'test-collection-title',
  status: CollectionStatus.PUBLISHED,
  language: CollectionLanguage.EN,
  authors: [testAuthor],
  stories: [testStory],
  createdAt: 1675978338, // 2023-02-09 16:32:18
  updatedAt: 1675978338,

  imageUrl: 'www.test-collection-image.com',
  labels: [testLabel],
  intro: 'test-collection-intro',
  curationCategory: testCurationCategory,
  excerpt: 'test-collection-excerpt',
  partnership: testPartnership,
  publishedAt: 1675978338,
  IABParentCategory: IABParentCategory,
  IABChildCategory: IABChildCategory,
};
