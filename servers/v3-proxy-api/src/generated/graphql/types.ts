// THIS FILE IS GENERATED, DO NOT EDIT!
/* tslint:disable */
/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Date: { input: any; output: any; }
  DateString: { input: any; output: any; }
  FunctionalBoostValue: { input: any; output: any; }
  ISOString: { input: any; output: any; }
  Markdown: { input: any; output: any; }
  Max300CharString: { input: any; output: any; }
  NonNegativeInt: { input: any; output: any; }
  Timestamp: { input: any; output: any; }
  Url: { input: any; output: any; }
  ValidUrl: { input: any; output: any; }
};

/**
 * Input data for adding multiple items to a list.
 * Appends to the end of the list.
 */
export type AddItemInput = {
  authors?: InputMaybe<Scalars['String']['input']>;
  excerpt?: InputMaybe<Scalars['String']['input']>;
  imageUrl?: InputMaybe<Scalars['Url']['input']>;
  itemId: Scalars['ID']['input'];
  note?: InputMaybe<Scalars['String']['input']>;
  publisher?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  url: Scalars['Url']['input'];
};

export type AdvancedSearchFilters = {
  contentType?: InputMaybe<SearchItemsContentType>;
  domain?: InputMaybe<Scalars['String']['input']>;
  isFavorite?: InputMaybe<Scalars['Boolean']['input']>;
  status?: InputMaybe<SearchItemsStatusFilter>;
  /**
   * Include only items with the following tags (exact)
   * in search results (OR combination)
   */
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type ArticleMarkdown = {
  __typename?: 'ArticleMarkdown';
  images?: Maybe<Array<MarkdownImagePosition>>;
  text: Scalars['String']['output'];
};

/**
 * The status of the syndicated article
 * TODO: rename to SyndicatedArticle status and move to schema-shared.graphql
 * (requires client changes)
 */
export enum ArticleStatus {
  Active = 'ACTIVE',
  Draft = 'DRAFT',
  Expired = 'EXPIRED'
}

/** Information about an Author of an article or some content */
export type Author = {
  __typename?: 'Author';
  /** Unique id for that Author */
  id: Scalars['ID']['output'];
  /** Display name */
  name?: Maybe<Scalars['String']['output']>;
  /** A url to that Author's site */
  url?: Maybe<Scalars['String']['output']>;
};

export type BaseError = {
  message: Scalars['String']['output'];
  path: Scalars['String']['output'];
};

/** Input object for creating and deleting highlights using bulk mutation. */
export type BatchWriteHighlightsInput = {
  create?: InputMaybe<Array<CreateHighlightInput>>;
  delete?: InputMaybe<Array<Scalars['ID']['input']>>;
};

/**
 * Result object for bulk create/delete highlights mutation.
 * Mutation is atomic -- if there is a response, all operations
 * were successful.
 *
 * The corresponding result array will be empty, but present, if there
 * were no requests for created/deleted.
 */
export type BatchWriteHighlightsResult = {
  __typename?: 'BatchWriteHighlightsResult';
  created: Array<Highlight>;
  deleted: Array<Scalars['ID']['output']>;
};

/** Row in a bulleted (unordered list) */
export type BulletedListElement = ListElement & {
  __typename?: 'BulletedListElement';
  /** Row in a list. */
  content: Scalars['Markdown']['output'];
  /** Zero-indexed level, for handling nested lists. */
  level: Scalars['Int']['output'];
};

/**
 * Apollo Server @cacheControl directive caching behavior either for a single field, or for all fields that
 * return a particular type
 */
export enum CacheControlScope {
  Private = 'PRIVATE',
  Public = 'PUBLIC'
}

/** A requested image that is cached and has the requested image parameters */
export type CachedImage = {
  __typename?: 'CachedImage';
  /** Height of the cached image */
  height?: Maybe<Scalars['Int']['output']>;
  /** Id of the image that matches the ID from the requested options */
  id: Scalars['ID']['output'];
  /** URL of the cached image */
  url?: Maybe<Scalars['Url']['output']>;
  /** Width of the cached image */
  width?: Maybe<Scalars['Int']['output']>;
};

/** Set of parameters that will be used to change an image */
export type CachedImageInput = {
  /** File type of the requested image */
  fileType?: InputMaybe<ImageFileType>;
  /** Height of the image */
  height?: InputMaybe<Scalars['Int']['input']>;
  /** Id of the image in the returned result set */
  id: Scalars['ID']['input'];
  /** Quality of the image in whole percentage, 100 = full, quality 50 = half quality */
  qualityPercentage?: InputMaybe<Scalars['Int']['input']>;
  /** Width of the image */
  width?: InputMaybe<Scalars['Int']['input']>;
};

export type Collection = {
  __typename?: 'Collection';
  IABChildCategory?: Maybe<IabCategory>;
  /**
   * We will never return child categories in this type, so there's no need to
   * specify `IABParentCategory` here. The basic `IABCategory` is sufficient.
   */
  IABParentCategory?: Maybe<IabCategory>;
  authors: Array<CollectionAuthor>;
  curationCategory?: Maybe<CurationCategory>;
  excerpt?: Maybe<Scalars['Markdown']['output']>;
  externalId: Scalars['ID']['output'];
  imageUrl?: Maybe<Scalars['Url']['output']>;
  intro?: Maybe<Scalars['Markdown']['output']>;
  labels?: Maybe<Array<Maybe<Label>>>;
  /**
   * note that language is *not* being used as locale - only to specify the
   * language of the collection.
   */
  language: CollectionLanguage;
  partnership?: Maybe<CollectionPartnership>;
  publishedAt?: Maybe<Scalars['DateString']['output']>;
  /**
   * Provides short url for the given_url in the format: https://pocket.co/<identifier>.
   * marked as beta because it's not ready yet for large client request.
   */
  shortUrl?: Maybe<Scalars['Url']['output']>;
  slug: Scalars['String']['output'];
  status: CollectionStatus;
  stories: Array<CollectionStory>;
  title: Scalars['String']['output'];
};

export type CollectionAuthor = {
  __typename?: 'CollectionAuthor';
  active: Scalars['Boolean']['output'];
  bio?: Maybe<Scalars['Markdown']['output']>;
  externalId: Scalars['ID']['output'];
  imageUrl?: Maybe<Scalars['Url']['output']>;
  name: Scalars['String']['output'];
  slug?: Maybe<Scalars['String']['output']>;
};

/** valid language codes for collections */
export enum CollectionLanguage {
  /** German */
  De = 'DE',
  /** English */
  En = 'EN'
}

/**
 * If a collection was made in partnership with an external company, this
 * entity will hold all required info about that partnership.
 */
export type CollectionPartnership = {
  __typename?: 'CollectionPartnership';
  blurb: Scalars['Markdown']['output'];
  externalId: Scalars['String']['output'];
  imageUrl: Scalars['Url']['output'];
  name: Scalars['String']['output'];
  type: CollectionPartnershipType;
  url: Scalars['Url']['output'];
};

/** Type and enums related to Collections made in partnership with a company. */
export enum CollectionPartnershipType {
  Partnered = 'PARTNERED',
  Sponsored = 'SPONSORED'
}

export enum CollectionStatus {
  Archived = 'ARCHIVED',
  Draft = 'DRAFT',
  Published = 'PUBLISHED',
  Review = 'REVIEW'
}

export type CollectionStory = {
  __typename?: 'CollectionStory';
  authors: Array<CollectionStoryAuthor>;
  excerpt: Scalars['Markdown']['output'];
  externalId: Scalars['ID']['output'];
  /** if True, the story is provided by a partner and should be displayed as such */
  fromPartner: Scalars['Boolean']['output'];
  imageUrl?: Maybe<Scalars['Url']['output']>;
  item?: Maybe<Item>;
  publisher?: Maybe<Scalars['String']['output']>;
  sortOrder?: Maybe<Scalars['Int']['output']>;
  title: Scalars['String']['output'];
  url: Scalars['Url']['output'];
};

export type CollectionStoryAuthor = {
  __typename?: 'CollectionStoryAuthor';
  name: Scalars['String']['output'];
  sortOrder: Scalars['Int']['output'];
};

export type CollectionsFiltersInput = {
  /** If provided, will return all collections that match at least one of the labels. */
  labels?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  /** If not provided, or if an unsupported language is requested, defaults to `en` */
  language?: InputMaybe<Scalars['String']['input']>;
};

export type CollectionsResult = {
  __typename?: 'CollectionsResult';
  collections: Array<Collection>;
  pagination: Pagination;
};

/**
 * Represents an item that is in the Corpus and its associated manually edited metadata.
 * TODO: CorpusItem to implement PocketResource when it becomes available.
 */
export type CorpusItem = {
  __typename?: 'CorpusItem';
  /** The author names and sort orders associated with this CorpusItem. */
  authors: Array<CorpusItemAuthor>;
  /** The publication date for this story. */
  datePublished?: Maybe<Scalars['Date']['output']>;
  /** The excerpt of the Approved Item. */
  excerpt: Scalars['String']['output'];
  /** The GUID that is stored on an approved corpus item */
  id: Scalars['ID']['output'];
  /** The image for this item's accompanying picture. */
  image: Image;
  /** The image URL for this item's accompanying picture. */
  imageUrl: Scalars['Url']['output'];
  /** What language this item is in. This is a two-letter code, for example, 'EN' for English. */
  language: CorpusLanguage;
  /** The name of the online publication that published this story. */
  publisher: Scalars['String']['output'];
  /** The user's saved item, from the Corpus Item, if the corpus item was saved to the user's saves */
  savedItem?: Maybe<SavedItem>;
  /**
   * Provides short url for the given_url in the format: https://pocket.co/<identifier>.
   * marked as beta because it's not ready yet for large client request.
   */
  shortUrl?: Maybe<Scalars['Url']['output']>;
  /** If the Corpus Item is pocket owned with a specific type, this is the associated object (Collection or SyndicatedArticle). */
  target?: Maybe<CorpusTarget>;
  /** Time to read in minutes. Is nullable. */
  timeToRead?: Maybe<Scalars['Int']['output']>;
  /** The title of the Approved Item. */
  title: Scalars['String']['output'];
  /** The topic associated with the Approved Item. */
  topic?: Maybe<Scalars['String']['output']>;
  /** The URL of the Approved Item. */
  url: Scalars['Url']['output'];
};

/** An author associated with a CorpusItem. */
export type CorpusItemAuthor = {
  __typename?: 'CorpusItemAuthor';
  name: Scalars['String']['output'];
  sortOrder: Scalars['Int']['output'];
};

/** Valid language codes for curated corpus items. */
export enum CorpusLanguage {
  /** German */
  De = 'DE',
  /** English */
  En = 'EN',
  /** Spanish */
  Es = 'ES',
  /** French */
  Fr = 'FR',
  /** Italian */
  It = 'IT'
}

export type CorpusRecommendation = {
  __typename?: 'CorpusRecommendation';
  /** Content meta data. */
  corpusItem: CorpusItem;
  /** Clients should include this id in the `corpus_recommendation` Snowplow entity for impression, content_open, and engagement events related to this recommendation. This id is different across users, across requests, and across corpus items. The recommendation-api service associates metadata with this id to join and aggregate recommendations in our data warehouse. */
  id: Scalars['ID']['output'];
  /** Reason why this CorpusItem is recommended to the user, or null if no reason is available. */
  reason?: Maybe<RecommendationReason>;
  /**
   * Firefox clients require an integer id. Other clients should use `id` instead of this field. tileId uniquely identifies the ScheduledSurface, CorpusItem, and scheduled_date. tileId is greater than 0 and less than 2^53 to fit in a Javascript number (64-bit IEEE 754 float). The field type is a Float because a GraphQL Int is limited to 32 bit.
   * @deprecated Only to be used by Firefox. Other clients should use `id`. We plan to also migrate Firefox New Tab to use CorpusRecommendation.id instead of tileId to track recommendation telemetry.
   */
  tileId: Scalars['Float']['output'];
};

/** This is the same as Slate but in this type all recommendations are backed by CorpusItems. This means that the editorial team has editorial control over the items served by this endpoint. */
export type CorpusSlate = {
  __typename?: 'CorpusSlate';
  /** The display headline for the slate. Surface context may be required to render determine what to display. This will depend on if we connect the copy to the Surface, SlateExperiment, or Slate. */
  headline: Scalars['String']['output'];
  /** UUID */
  id: Scalars['ID']['output'];
  /** Link to a page where the user can explore more recommendations similar to this slate, or null if no link is provided. */
  moreLink?: Maybe<Link>;
  /** Indicates the main type of reason why recommendations are included in this slate, or null if none is available. */
  recommendationReasonType?: Maybe<RecommendationReasonType>;
  /** Recommendations for the current request context. */
  recommendations: Array<CorpusRecommendation>;
  /** A smaller, secondary headline that can be displayed to provide additional context on the slate. */
  subheadline?: Maybe<Scalars['String']['output']>;
  /** utm_source value that can be set on the url by the caller to attribute the recommendations. */
  utmSource?: Maybe<Scalars['String']['output']>;
};


/** This is the same as Slate but in this type all recommendations are backed by CorpusItems. This means that the editorial team has editorial control over the items served by this endpoint. */
export type CorpusSlateRecommendationsArgs = {
  count?: InputMaybe<Scalars['Int']['input']>;
};

/** A collection of slates. */
export type CorpusSlateLineup = {
  __typename?: 'CorpusSlateLineup';
  /** UUID */
  id: Scalars['ID']['output'];
  /** Slates. */
  slates: Array<CorpusSlate>;
};


/** A collection of slates. */
export type CorpusSlateLineupSlatesArgs = {
  count?: InputMaybe<Scalars['Int']['input']>;
};

/**
 * TODO: Make this type implement PocketResource when available.
 * https://getpocket.atlassian.net/wiki/spaces/PE/pages/2771714049/The+Future+of+Item
 */
export type CorpusTarget = Collection | SyndicatedArticle;

/** Input for creating a new User-highlighted passage on a SavedItem. */
export type CreateHighlightByUrlInput = {
  /**
   * Optionally, a client-generated UUID to identify the highlight.
   * If one is not passed, it will be created. Must be in UUID format,
   * or will fail generation. Will not overwrite existing data if there
   * is an ID collision.
   */
  id?: InputMaybe<Scalars['String']['input']>;
  /** Optional note generated by User */
  note?: InputMaybe<Scalars['String']['input']>;
  /**
   * Patch string generated by 'DiffMatchPatch' library, serialized
   * into text via `patch_toText` method.
   * Format is similar to UniDiff but is character-based.
   * The patched text depends on version. For example, the version 2
   * patch surrounds the highlighted text portion with a pair of
   * sentinel tags: '<pkt_tag_annotation></pkt_tag_annotation>'
   * Reference: https://github.com/google/diff-match-patch
   */
  patch: Scalars['String']['input'];
  /**
   * The full text of the highlighted passage. Used as a fallback for
   * rendering highlight if the patch fails.
   */
  quote: Scalars['String']['input'];
  /** The url of the Item that should be annotated in the User's list */
  url: Scalars['ValidUrl']['input'];
  /** Annotation data version */
  version: Scalars['Int']['input'];
};

/** Input for creating a new User-highlighted passage on a SavedItem. */
export type CreateHighlightInput = {
  /**
   * Optionally, a client-generated UUID to identify the highlight.
   * If one is not passed, it will be created. Must be in UUID format,
   * or will fail generation. Will not overwrite existing data if there
   * is an ID collision.
   */
  id?: InputMaybe<Scalars['String']['input']>;
  /** The ID of the Item that should be annotated in the User's list */
  itemId: Scalars['ID']['input'];
  /** Optional note generated by User */
  note?: InputMaybe<Scalars['String']['input']>;
  /**
   * Patch string generated by 'DiffMatchPatch' library, serialized
   * into text via `patch_toText` method.
   * Format is similar to UniDiff but is character-based.
   * The patched text depends on version. For example, the version 2
   * patch surrounds the highlighted text portion with a pair of
   * sentinel tags: '<pkt_tag_annotation></pkt_tag_annotation>'
   * Reference: https://github.com/google/diff-match-patch
   */
  patch: Scalars['String']['input'];
  /**
   * The full text of the highlighted passage. Used as a fallback for
   * rendering highlight if the patch fails.
   */
  quote: Scalars['String']['input'];
  /** Annotation data version */
  version: Scalars['Int']['input'];
};

/** Input data for creating a Shareable List. */
export type CreateShareableListInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  listItemNoteVisibility?: InputMaybe<ShareableListVisibility>;
  title: Scalars['String']['input'];
};

/** Input data for creating a Shareable List Item. */
export type CreateShareableListItemInput = {
  authors?: InputMaybe<Scalars['String']['input']>;
  excerpt?: InputMaybe<Scalars['String']['input']>;
  imageUrl?: InputMaybe<Scalars['Url']['input']>;
  itemId: Scalars['ID']['input'];
  listExternalId: Scalars['ID']['input'];
  note?: InputMaybe<Scalars['String']['input']>;
  publisher?: InputMaybe<Scalars['String']['input']>;
  sortOrder: Scalars['Int']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
  url: Scalars['Url']['input'];
};

/** Input data for creating a Shareable List Item during Shareable List creation. */
export type CreateShareableListItemWithList = {
  authors?: InputMaybe<Scalars['String']['input']>;
  excerpt?: InputMaybe<Scalars['String']['input']>;
  imageUrl?: InputMaybe<Scalars['Url']['input']>;
  itemId: Scalars['ID']['input'];
  note?: InputMaybe<Scalars['String']['input']>;
  publisher?: InputMaybe<Scalars['String']['input']>;
  sortOrder: Scalars['Int']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
  url: Scalars['Url']['input'];
};

/** This type represents the information we need on a curated item. */
export type CuratedInfo = {
  __typename?: 'CuratedInfo';
  excerpt?: Maybe<Scalars['String']['output']>;
  /** The image for this item's accompanying picture. */
  image?: Maybe<Image>;
  imageSrc?: Maybe<Scalars['Url']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type CurationCategory = {
  __typename?: 'CurationCategory';
  externalId: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  slug: Scalars['String']['output'];
};

export type DeleteSavedItemTagsInput = {
  /** The id of the SavedItem from which to delete a Tag association */
  savedItemId: Scalars['ID']['input'];
  /** The ids of the Tag to disassociate from the SavedItem */
  tagIds: Array<Scalars['ID']['input']>;
};

/** Metadata from a domain, originally populated from ClearBit */
export type DomainMetadata = {
  __typename?: 'DomainMetadata';
  /** Url for the logo image */
  logo?: Maybe<Scalars['Url']['output']>;
  /** Url for the greyscale logo image */
  logoGreyscale?: Maybe<Scalars['Url']['output']>;
  /** The name of the domain (e.g., The New York Times) */
  name?: Maybe<Scalars['String']['output']>;
};

/** The reason a user web session is being expired. */
export enum ExpireUserWebSessionReason {
  /** Expire web session upon logging out. */
  Logout = 'LOGOUT',
  /** Expire web session on account password change. */
  PasswordChanged = 'PASSWORD_CHANGED'
}

/** Input field to boost the score of an elasticsearch document based on a specific field and value */
export type FunctionalBoostField = {
  /** A float number to boost the score by */
  factor: Scalars['Float']['input'];
  /** Field to evaluate for boosting */
  field: Scalars['String']['input'];
  /** The mathematical operation to use for boosting */
  operation: SearchFunctionalBoostOperation;
  /** Field value to evaluate */
  value: Scalars['FunctionalBoostValue']['input'];
};

/** A User-highlighted passage on a SavedItem */
export type Highlight = {
  __typename?: 'Highlight';
  /** When the Highlight was created */
  _createdAt: Scalars['Timestamp']['output'];
  /** When the highlight was last updated */
  _updatedAt: Scalars['Timestamp']['output'];
  /** The ID for this Highlight annotation */
  id: Scalars['ID']['output'];
  /** Highlight Note associated with this Highlight */
  note?: Maybe<HighlightNote>;
  /**
   * Patch string generated by 'DiffMatchPatch' library, serialized
   * into text via `patch_toText` method. Use `patch_fromText` to
   * deserialize into an object that can be used by the DiffMatchPatch
   * library. Format is similar to UniDiff but is character-based.
   * The patched text depends on version. For example, the version 2
   * patch surrounds the highlighted text portion with a pair of
   * sentinel tags: '<pkt_tag_annotation></pkt_tag_annotation>'
   * Reference: https://github.com/google/diff-match-patch
   */
  patch: Scalars['String']['output'];
  /**
   * The full text of the highlighted passage. Used as a fallback for
   * rendering highlight if the patch fails.
   */
  quote: Scalars['String']['output'];
  /** Version number for highlight data specification */
  version: Scalars['Int']['output'];
};

export type HighlightNote = {
  __typename?: 'HighlightNote';
  /** When the HighlightNote was created */
  _createdAt: Scalars['Timestamp']['output'];
  /** When the HighlightNote was last updated */
  _updatedAt: Scalars['Timestamp']['output'];
  /** User entered text */
  text: Scalars['String']['output'];
};

/** Interactive Advertising Bureau Category - these are used on clients to serve relevant ads */
export type IabCategory = {
  __typename?: 'IABCategory';
  externalId: Scalars['String']['output'];
  name: Scalars['String']['output'];
  slug: Scalars['String']['output'];
};

export type IabParentCategory = {
  __typename?: 'IABParentCategory';
  children: Array<IabCategory>;
  externalId: Scalars['String']['output'];
  name: Scalars['String']['output'];
  slug: Scalars['String']['output'];
};

/** An image that is keyed on URL */
export type Image = {
  __typename?: 'Image';
  /** Query to get a cached and modified set of images based on the image from the original url, images will be matched by the client assigned id value */
  cachedImages?: Maybe<Array<Maybe<CachedImage>>>;
  /** A caption or description of the image */
  caption?: Maybe<Scalars['String']['output']>;
  /** A credit for the image, typically who the image belongs to / created by */
  credit?: Maybe<Scalars['String']['output']>;
  /** The determined height of the image at the url */
  height?: Maybe<Scalars['Int']['output']>;
  /** The id for placing within an Article View. Item.article will have placeholders of <div id='RIL_IMG_X' /> where X is this id. Apps can download those images as needed and populate them in their article view. */
  imageId: Scalars['Int']['output'];
  /**
   * Absolute url to the image
   * @deprecated use url property moving forward
   */
  src: Scalars['String']['output'];
  /** If the image is also a link, the destination url */
  targetUrl?: Maybe<Scalars['String']['output']>;
  /** The url of the image */
  url: Scalars['Url']['output'];
  /** The determined width of the image at the url */
  width?: Maybe<Scalars['Int']['output']>;
};


/** An image that is keyed on URL */
export type ImageCachedImagesArgs = {
  imageOptions: Array<CachedImageInput>;
};

/** The image file type */
export enum ImageFileType {
  Jpeg = 'JPEG',
  Png = 'PNG',
  Webp = 'WEBP'
}

export enum Imageness {
  /** Contains images (v3 value is 1) */
  HasImages = 'HAS_IMAGES',
  /** Is an image (v3 value is 2) */
  IsImage = 'IS_IMAGE',
  /** No images (v3 value is 0) */
  NoImages = 'NO_IMAGES'
}

/**
 * The heart of Pocket
 * A url and meta data related to it.
 */
export type Item = {
  __typename?: 'Item';
  /** If available, the url to an AMP version of this article */
  ampUrl?: Maybe<Scalars['Url']['output']>;
  /**
   * The pocket HTML string of the article.
   * Note: Web and Android as of 3/4/2022 use the Article field, any improvements made
   * within MArticle for parsing will not be reflected in the article field.
   * When that happens, the clients will work to move to MArticle.
   */
  article?: Maybe<Scalars['String']['output']>;
  /** List of Authors involved with this article */
  authors?: Maybe<Array<Maybe<Author>>>;
  /** If the item is a collection allow them to get the collection information */
  collection?: Maybe<Collection>;
  /**
   * The length in bytes of the content
   * @deprecated Clients should not use this
   */
  contentLength?: Maybe<Scalars['Int']['output']>;
  /** The date the article was published */
  datePublished?: Maybe<Scalars['DateString']['output']>;
  /** The date the parser resolved this item */
  dateResolved?: Maybe<Scalars['DateString']['output']>;
  /** The domain, such as 'getpocket.com' of the resolved_url */
  domain?: Maybe<Scalars['String']['output']>;
  /**
   * The primary database id of the domain this article is from
   * @deprecated Use a domain as the identifier instead
   */
  domainId?: Maybe<Scalars['String']['output']>;
  /** Additional information about the item domain, when present, use this for displaying the domain name */
  domainMetadata?: Maybe<DomainMetadata>;
  /** The string encoding code of this item's web page */
  encoding?: Maybe<Scalars['String']['output']>;
  /** A snippet of text from the article */
  excerpt?: Maybe<Scalars['String']['output']>;
  /** key field to identify the Item entity in the Parser service */
  givenUrl: Scalars['Url']['output'];
  /** 0=no images, 1=contains images, 2=is an image */
  hasImage?: Maybe<Imageness>;
  /**
   * Indicates that the item was stored via a different search_hash (using the old method), we'll need to look up a different id
   * @deprecated Most new items use a new hash
   */
  hasOldDupes?: Maybe<Scalars['Boolean']['output']>;
  /** 0=no videos, 1=contains video, 2=is a video */
  hasVideo?: Maybe<Videoness>;
  /** Keyword highlights from search */
  highlights?: Maybe<ItemHighlights>;
  /** A server generated unique id for this item based on itemId */
  id: Scalars['ID']['output'];
  /** Array of images within an article */
  images?: Maybe<Array<Maybe<Image>>>;
  /**
   * Indicates if the text of the url is a redirect to another url
   * @deprecated Clients should not use this
   */
  innerDomainRedirect?: Maybe<Scalars['Boolean']['output']>;
  /** true if the item is an article */
  isArticle?: Maybe<Scalars['Boolean']['output']>;
  /** true if the item is an index / home page, rather than a specific single piece of content */
  isIndex?: Maybe<Scalars['Boolean']['output']>;
  /**
   * The Item entity is owned by the Parser service.
   * We only extend it in this service to make this service's schema valid.
   * The key for this entity is the 'itemId'
   */
  itemId: Scalars['String']['output'];
  /** The detected language of the article */
  language?: Maybe<Scalars['String']['output']>;
  /** Estimated time to listen to the article, in seconds */
  listenDuration?: Maybe<Scalars['Int']['output']>;
  /**
   * Indicates if the url requires a login
   * @deprecated Clients should not use this
   */
  loginRequired?: Maybe<Scalars['Boolean']['output']>;
  /** The Marticle format of the article, used by clients for native article view. */
  marticle?: Maybe<Array<MarticleComponent>>;
  /** The mime type of this item's web page */
  mimeType?: Maybe<Scalars['String']['output']>;
  /**
   * A normalized value of the givenUrl.
   * It will look like a url but is not guaranteed to be a valid url, just a unique string that is used to eliminate common duplicates.
   * Item's that share a normal_url should be considered the same item. For example https://getpocket.com and http://getpocket.com will be considered the same since they both normalize to http://getpocket.com
   * This is technically the true identity of an item, since this is what the backend uses to tell if two items are the same.
   * However, for the clients to use this, they would all have to ship an implementation of the normalization function that the backend has exactly.
   * And even if it did that, some items, some of the earliest saves, use a legacy normalize function and the client would have no way to know when to use which normalizing function.
   */
  normalUrl: Scalars['String']['output'];
  /**
   * If a the domainId is a subdomain this is the primary domain id
   * @deprecated Use a domain as the identifier instead
   */
  originDomainId?: Maybe<Scalars['String']['output']>;
  /** The client preview/display logic for this url */
  preview?: Maybe<PocketMetadata>;
  /** A server generated unique reader slug for this item based on itemId */
  readerSlug: Scalars['String']['output'];
  /** Recommend similar articles to show in the bottom of an article. */
  relatedAfterArticle: Array<CorpusRecommendation>;
  /** Recommend similar articles after saving. */
  relatedAfterCreate: Array<CorpusRecommendation>;
  /** The item id of the resolved_url */
  resolvedId?: Maybe<Scalars['String']['output']>;
  /**
   * The resolved url, but ran through the normalized function
   * @deprecated Use the resolved url instead
   */
  resolvedNormalUrl?: Maybe<Scalars['Url']['output']>;
  /** If the givenUrl redirects (once or many times), this is the final url. Otherwise, same as givenUrl */
  resolvedUrl?: Maybe<Scalars['Url']['output']>;
  /**
   * The http response code of the given url
   * @deprecated Clients should not use this
   */
  responseCode?: Maybe<Scalars['Int']['output']>;
  /** Helper property to identify if the given item is in the user's list */
  savedItem?: Maybe<SavedItem>;
  /**
   * Provides short url for the given_url in the format: https://pocket.co/<identifier>.
   * marked as beta because it's not ready yet for large client request.
   */
  shortUrl?: Maybe<Scalars['Url']['output']>;
  /** If the url is an Article, the text in SSML format for speaking, i.e. Listen */
  ssml?: Maybe<Scalars['String']['output']>;
  /** If the item has a syndicated counterpart the syndication information */
  syndicatedArticle?: Maybe<SyndicatedArticle>;
  /**
   * Date this item was first parsed in Pocket
   * @deprecated Clients should not use this
   */
  timeFirstParsed?: Maybe<Scalars['DateString']['output']>;
  /** How long it will take to read the article (TODO in what time unit? and by what calculation?) */
  timeToRead?: Maybe<Scalars['Int']['output']>;
  /** The title as determined by the parser. */
  title?: Maybe<Scalars['String']['output']>;
  /** The page's / publisher's preferred thumbnail image */
  topImage?: Maybe<Image>;
  /**
   * The page's / publisher's preferred thumbnail image
   * @deprecated use the topImage object
   */
  topImageUrl?: Maybe<Scalars['Url']['output']>;
  /**
   * Indicates if the parser used fallback methods
   * @deprecated Clients should not use this
   */
  usedFallback?: Maybe<Scalars['Int']['output']>;
  /** Array of videos within the item If the item is a video, this will likely just contain one video */
  videos?: Maybe<Array<Maybe<Video>>>;
  /** Number of words in the article */
  wordCount?: Maybe<Scalars['Int']['output']>;
};


/**
 * The heart of Pocket
 * A url and meta data related to it.
 */
export type ItemRelatedAfterArticleArgs = {
  count?: InputMaybe<Scalars['Int']['input']>;
};


/**
 * The heart of Pocket
 * A url and meta data related to it.
 */
export type ItemRelatedAfterCreateArgs = {
  count?: InputMaybe<Scalars['Int']['input']>;
};

/** Elasticsearch highlights */
export type ItemHighlights = {
  __typename?: 'ItemHighlights';
  full_text?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  tags?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  title?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  url?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
};

export type ItemNotFound = {
  __typename?: 'ItemNotFound';
  message?: Maybe<Scalars['String']['output']>;
};

/** Union type for items that may or may not be processed */
export type ItemResult = Item | PendingItem;

export type ItemSummary = PocketMetadata & {
  __typename?: 'ItemSummary';
  authors?: Maybe<Array<Author>>;
  datePublished?: Maybe<Scalars['ISOString']['output']>;
  domain?: Maybe<DomainMetadata>;
  excerpt?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  image?: Maybe<Image>;
  item?: Maybe<Item>;
  source: PocketMetadataSource;
  title?: Maybe<Scalars['String']['output']>;
  url: Scalars['Url']['output'];
};

/** A label used to mark and categorize an Entity (e.g. Collection). */
export type Label = {
  __typename?: 'Label';
  externalId: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

/** Web link */
export type Link = {
  __typename?: 'Link';
  /** The link text displayed to the user. */
  text: Scalars['String']['output'];
  /** The URL to send the user to when clicking on the link. */
  url: Scalars['Url']['output'];
};

export type ListElement = {
  /** Row in a list. */
  content: Scalars['Markdown']['output'];
  /** Zero-indexed level, for handling nested lists. */
  level: Scalars['Int']['output'];
};

/** The Connection type for ListItem */
export type ListItemConnection = {
  __typename?: 'ListItemConnection';
  /** A list of edges. */
  edges?: Maybe<Array<ListItemEdge>>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** Identifies the total count of SavedItems in the connection. */
  totalCount: Scalars['Int']['output'];
};

/** An Edge in a Connection */
export type ListItemEdge = {
  __typename?: 'ListItemEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The ListItem at the end of the edge. */
  node: ShareableListItem;
};

export type MarkdownImagePosition = {
  __typename?: 'MarkdownImagePosition';
  index: Scalars['Int']['output'];
  position: Scalars['Int']['output'];
  /** Fallback is to use the images field in the Item entity */
  src?: Maybe<Scalars['String']['output']>;
};

/** Content of a blockquote */
export type MarticleBlockquote = {
  __typename?: 'MarticleBlockquote';
  /** Markdown text content. */
  content: Scalars['Markdown']['output'];
};

/** Content in a bulleted (unordered) list. */
export type MarticleBulletedList = {
  __typename?: 'MarticleBulletedList';
  rows: Array<BulletedListElement>;
};

/** A pre formatted text in the HTML content. */
export type MarticleCodeBlock = {
  __typename?: 'MarticleCodeBlock';
  /** Assuming the codeblock was a programming language, this field is used to identify it. */
  language?: Maybe<Scalars['Int']['output']>;
  /** Content of a pre tag */
  text: Scalars['String']['output'];
};

export type MarticleComponent = Image | MarticleBlockquote | MarticleBulletedList | MarticleCodeBlock | MarticleDivider | MarticleHeading | MarticleNumberedList | MarticleTable | MarticleText | UnMarseable | Video;

export type MarticleDivider = {
  __typename?: 'MarticleDivider';
  /** Always '---'; provided for convenience if building a markdown string */
  content: Scalars['Markdown']['output'];
};

/** A heading in an article, with markdown formatting. */
export type MarticleHeading = {
  __typename?: 'MarticleHeading';
  /** Heading text, in markdown. */
  content: Scalars['Markdown']['output'];
  /** Heading level. Restricted to values 1-6. */
  level: Scalars['Int']['output'];
};

/** Content in a bulleted (unordered) list. */
export type MarticleNumberedList = {
  __typename?: 'MarticleNumberedList';
  rows: Array<NumberedListElement>;
};

/** Content in a table. */
export type MarticleTable = {
  __typename?: 'MarticleTable';
  /** Raw HTML representation of the table. */
  html: Scalars['String']['output'];
};

/**
 * A section of the article's text content, in markdown.
 * A subset of gfm is supported. See README.md for more information.
 */
export type MarticleText = {
  __typename?: 'MarticleText';
  /** Markdown text content. Typically, a paragraph. */
  content: Scalars['Markdown']['output'];
};

/** Default Mutation Type */
export type Mutation = {
  __typename?: 'Mutation';
  /**
   * Attach share context to a Pocket Share. If a context already exists
   * on the Pocket Share, it will be overrwritten. Session ID via the `guid`
   * field on the JWT is used to determine ownership of a share.
   * That means users may only edit share links created in the same
   * session (intended to be a post-share add, not something returned to
   * later). It also lets us attribute ownership to anonymous/logged-out
   * users.
   * Null values in provided context will not overrwrite existing values
   * if there are any, but but empty values will (e.g. empty string, empty array).
   * Attempting to update a nonexistent share or a share that is not owned
   * by the session user will return ShareNotFound.
   */
  addShareContext?: Maybe<ShareResult>;
  /** Add a batch of items to an existing shareable list. */
  addToShareableList: ShareableList;
  /**
   * Make requests to create and delete highlights in a single batch.
   * Mutation is atomic -- if there is a response, all operations were successful.
   */
  batchWriteHighlights: BatchWriteHighlightsResult;
  /** Remove all tags associated to a SavedItem (included for v3 proxy). */
  clearTags?: Maybe<SavedItem>;
  /** Add a batch of items to an existing shareable list. */
  createAndAddToShareableList?: Maybe<ShareableList>;
  /** Create new highlight annotation(s). Returns the data for the created Highlight object. */
  createHighlightByUrl: Highlight;
  /** Create new highlight note. Returns the data for the created Highlight note. */
  createSavedItemHighlightNote?: Maybe<HighlightNote>;
  /** Create new highlight annotation(s). Returns the data for the created Highlight object(s). */
  createSavedItemHighlights: Array<Highlight>;
  /**
   * Add tags to the savedItems
   * Inputs a list of SavedItemTagsInput(ie. savedItemId and the list of tagName)
   * Returns the list of `SavedItem` for which the tags were added
   */
  createSavedItemTags: Array<SavedItem>;
  /**
   * Create a Pocket Share for a provided target URL, optionally
   * with additional share context.
   */
  createShareLink?: Maybe<PocketShare>;
  /**
   * Creates a Shareable List. Takes in an optional listItemData parameter to create a ShareableListItem
   * along with a ShareableList.
   */
  createShareableList?: Maybe<ShareableList>;
  /** Creates a Shareable List Item. */
  createShareableListItem?: Maybe<ShareableListItem>;
  /**
   * Deletes a SavedItem from the users list. Returns ID of the
   * deleted SavedItem
   */
  deleteSavedItem: Scalars['ID']['output'];
  /** Delete a highlight by its ID. */
  deleteSavedItemHighlight: Scalars['ID']['output'];
  /** Delete a highlight note by the Highlight ID. */
  deleteSavedItemHighlightNote: Scalars['ID']['output'];
  /**
   * Delete one or more tags from one or more SavedItems.
   * Note that if this operation results in a Tag having no associations
   * to a SavedItem, the Tag object will be deleted.
   */
  deleteSavedItemTags: Array<SavedItem>;
  /** Deletes a Shareable List. */
  deleteShareableList: ShareableList;
  /** Deletes a Shareable List Item. HIDDEN Lists cannot have their items deleted. */
  deleteShareableListItem: ShareableListItem;
  /**
   * Deletes a Tag object. This is deletes the Tag and all SavedItem associations
   * (removes the Tag from all SavedItems). Returns ID of the deleted Tag.
   */
  deleteTag: Scalars['ID']['output'];
  /**
   * Delete a tag entity identified by name (rather than ID), to support v3 proxy.
   * Disassociates this tag from all SavedItems.
   */
  deleteTagByName?: Maybe<Scalars['String']['output']>;
  /** Deletes user information and their pocket data for the given pocket userId. Returns pocket userId. */
  deleteUser: Scalars['ID']['output'];
  /**
   * Deletes user information and their pocket data for the given firefox account ID.
   * Returns firefox account ID sent as the query parameter with the request.
   */
  deleteUserByFxaId: Scalars['ID']['output'];
  /**
   * Expires a user's web session tokens by firefox account ID.
   * Called by fxa-webhook proxy. Need to supply a reason why to expire user web session.
   * Returns the user ID.
   */
  expireUserWebSessionByFxaId: Scalars['ID']['output'];
  /**
   * temporary mutation for apple user migration.
   * called by fxa-webhook proxy to update the fxaId and email of the user.
   * Returns the pocket userId on success
   * Note: requires `transfersub` to be set in the header.
   */
  migrateAppleUser: Scalars['ID']['output'];
  /**
   * 'Re-add' a SavedItem by id. Unarchives and undeletes the SavedItem
   * as applicable, and refreshes the "createdAt" timestamp.
   */
  reAddById?: Maybe<SavedItem>;
  /** Refresh an Item's article content. */
  refreshItemArticle: Item;
  /**
   * Removes specific tags associated to a SavedItem,
   * referenced by name, to support v3 proxy.
   */
  removeTagsByName?: Maybe<SavedItem>;
  /** Rename a tag identified by name (rather than ID), to support v3 proxy. */
  renameTagByName?: Maybe<Tag>;
  /**
   * Replaces the old tags associated with the savedItem to the new tag list
   * given in the entry
   * To remove all Tags from a SavedItem, use `updateSavedItemRemoveTags`.
   * Note: if there is a new tag name in the SavedItemTagsInput, then the tag record will be created
   * Inputs a list of SavedItemTagsInput(ie. savedItemId and list of tag names)
   * Returns the SavedItem for which the tags have been modified.
   * @deprecated use saveBatchUpdateTags
   */
  replaceSavedItemTags: Array<SavedItem>;
  /** Replace specific tags associated to a SavedItem, to support v3 proxy. */
  replaceTags?: Maybe<SavedItem>;
  /** Archives PocketSaves */
  saveArchive?: Maybe<SaveWriteMutationPayload>;
  /**
   * Batch update the Tags associated with a Save
   * by adding new tags and deleting existing tags.
   * Maximum of 150 operations (adds/deletes) per request.
   */
  saveBatchUpdateTags: SaveWriteMutationPayload;
  /**
   * Favorites PocketSaves
   * Accepts a list of PocketSave Ids that we want to favorite.
   */
  saveFavorite?: Maybe<SaveWriteMutationPayload>;
  /**
   * Save search to potentially appear in recentSearches response.
   * Requires premium account (otherwise will send ForbiddenError).
   */
  saveSearch?: Maybe<RecentSearch>;
  /** Unarchives PocketSaves */
  saveUnArchive?: Maybe<SaveWriteMutationPayload>;
  /**
   * Unfavorites PocketSaves
   * Accepts a list of PocketSave Ids that we want to unfavorite.
   */
  saveUnFavorite?: Maybe<SaveWriteMutationPayload>;
  /**
   * Creates a new Save; if the Save already exists (either in List or Archive), "re-add" it.
   * "Re-adding" unarchives and undeletes the Save as applicable, and refreshes the "createdAt"
   * timestamp.
   */
  saveUpsert: SaveWriteMutationPayload;
  /** Archive a SavedItem (identified by URL) */
  savedItemArchive?: Maybe<SavedItem>;
  /** 'Soft-delete' a SavedItem (identified by URL) */
  savedItemDelete?: Maybe<Scalars['Url']['output']>;
  /** Favorite a SavedItem (identified by URL) */
  savedItemFavorite?: Maybe<SavedItem>;
  /** Associate Tag(s) with a Save */
  savedItemTag?: Maybe<SavedItem>;
  /** Unarchive a SavedItem (identified by URL) */
  savedItemUnArchive?: Maybe<SavedItem>;
  /**
   * Undo the 'soft-delete' operation on a SavedItem (identified by URL).
   * Does not restore tags. Does not restore SavedItems that have been
   * 'hard-deleted' (record removed from the database entirely).
   */
  savedItemUnDelete?: Maybe<SavedItem>;
  /** 'Unfavorite' a 'favorite' SavedItem (identified by URL) */
  savedItemUnFavorite?: Maybe<SavedItem>;
  /**
   * Update the title display of a Saved Item, retrieved by URL.
   * This is user-save specific (does not update the metadata saved by the parser)
   * Clients should ensure the input fits in the utf8mb3 character set (BMP only,
   * which means no emoji) to avoid being rejected by the database.
   * In the future this will be more permissive.
   */
  savedItemUpdateTitle?: Maybe<SavedItem>;
  /**
   * Update an existing highlight annotation, by its ID.
   * If the given highlight ID does not exist, will return error data
   * and the highlight will not be created.
   */
  updateHighlight: Highlight;
  /** Archives a SavedItem */
  updateSavedItemArchive: SavedItem;
  /** Favorites a SavedItem */
  updateSavedItemFavorite: SavedItem;
  /**
   * Update an existing highlight annotation, by its ID.
   * If the given highlight ID does not exist, will return error data
   * and the highlight will not be created.
   * Note that if an ID is passed to the optional ID field in CreateHighlightInput,
   * it will be ignored, as this mutation does not allow updating the ID.
   * @deprecated use updateHighlight
   */
  updateSavedItemHighlight: Highlight;
  /**
   * Update an existing highlight note, by its ID.
   * If the given highlight ID does not exist, will return error data
   * and the note will not be updated.
   */
  updateSavedItemHighlightNote?: Maybe<HighlightNote>;
  /**
   * Removes all Tag associations from a SavedItem. Returns the
   * SavedItem that had its Tag associations cleared.
   * Note that if this operation results in a Tag having no associations
   * to a SavedItem, the Tag object will be deleted.
   * @deprecated use saveBatchUpdateTags
   */
  updateSavedItemRemoveTags: SavedItem;
  /**
   * Set the Tags that are associated with a SavedItem.
   * Will replace any existing Tag associations on the SavedItem.
   * To remove all Tags from a SavedItem, use `updateSavedItemRemoveTags`.
   * @deprecated use saveBatchUpdateTags
   */
  updateSavedItemTags: SavedItem;
  /**
   * Update the title display of a Saved Item, retrieved by ID.
   * This is user-save specific (does not update the metadata saved by the parser).
   * Clients should ensure the input fits in the utf8mb3 character set (BMP only,
   * which means no emoji) to avoid being rejected by the database.
   * In the future this will be more permissive.
   */
  updateSavedItemTitle?: Maybe<SavedItem>;
  /** Unarchives a SavedItem */
  updateSavedItemUnArchive: SavedItem;
  /** Undo the delete operation for a SavedItem */
  updateSavedItemUnDelete: SavedItem;
  /** Unfavorites a SavedItem */
  updateSavedItemUnFavorite: SavedItem;
  /** Updates a Shareable List. Cannot make a list public. */
  updateShareableList: ShareableList;
  /** Updates a single Shareable List Item. */
  updateShareableListItem: ShareableListItem;
  /** Updates an array of Shareable List Items (sortOrder). */
  updateShareableListItems: Array<ShareableListItem>;
  /**
   * Updates a Tag (renames the tag), and returns the updated Tag.
   * If a Tag with the updated name already exists in the database, will
   * associate that Tag to all relevant SavedItems rather than creating
   * a duplicate Tag object.
   */
  updateTag: Tag;
  /**
   * update the email of the user for the given pocket userId. Request is made by
   * an authenticated user, and the userID is inferred from the request headers `userid`.
   */
  updateUserEmail: User;
  /**
   * update the email of the user for the given firefox account ID. Request
   * is made by a backend service. The `userid` in the headers should match
   * the FxA ID or else an authentication error will be thrown.
   */
  updateUserEmailByFxaId: User;
  /** Updates user preferences for content recommendations across Pocket. */
  updateUserRecommendationPreferences: UserRecommendationPreferences;
  /**
   * Updates a SavedItem, undeletes and unarchives it, bringing it to the top of the user's list, if it exists
   * and creates it if it doesn't.
   */
  upsertSavedItem: SavedItem;
};


/** Default Mutation Type */
export type MutationAddShareContextArgs = {
  context: ShareContextInput;
  slug: Scalars['ID']['input'];
};


/** Default Mutation Type */
export type MutationAddToShareableListArgs = {
  items: Array<AddItemInput>;
  listExternalId: Scalars['ID']['input'];
};


/** Default Mutation Type */
export type MutationBatchWriteHighlightsArgs = {
  input?: InputMaybe<BatchWriteHighlightsInput>;
};


/** Default Mutation Type */
export type MutationClearTagsArgs = {
  savedItem: SavedItemRef;
  timestamp?: InputMaybe<Scalars['ISOString']['input']>;
};


/** Default Mutation Type */
export type MutationCreateAndAddToShareableListArgs = {
  itemData: Array<AddItemInput>;
  listData: CreateShareableListInput;
};


/** Default Mutation Type */
export type MutationCreateHighlightByUrlArgs = {
  input: CreateHighlightByUrlInput;
};


/** Default Mutation Type */
export type MutationCreateSavedItemHighlightNoteArgs = {
  id: Scalars['ID']['input'];
  input: Scalars['String']['input'];
};


/** Default Mutation Type */
export type MutationCreateSavedItemHighlightsArgs = {
  input: Array<CreateHighlightInput>;
};


/** Default Mutation Type */
export type MutationCreateSavedItemTagsArgs = {
  input: Array<SavedItemTagsInput>;
  timestamp?: InputMaybe<Scalars['ISOString']['input']>;
};


/** Default Mutation Type */
export type MutationCreateShareLinkArgs = {
  context?: InputMaybe<ShareContextInput>;
  target: Scalars['ValidUrl']['input'];
};


/** Default Mutation Type */
export type MutationCreateShareableListArgs = {
  listData: CreateShareableListInput;
  listItemData?: InputMaybe<CreateShareableListItemWithList>;
};


/** Default Mutation Type */
export type MutationCreateShareableListItemArgs = {
  data: CreateShareableListItemInput;
};


/** Default Mutation Type */
export type MutationDeleteSavedItemArgs = {
  id: Scalars['ID']['input'];
  timestamp?: InputMaybe<Scalars['ISOString']['input']>;
};


/** Default Mutation Type */
export type MutationDeleteSavedItemHighlightArgs = {
  id: Scalars['ID']['input'];
};


/** Default Mutation Type */
export type MutationDeleteSavedItemHighlightNoteArgs = {
  id: Scalars['ID']['input'];
};


/** Default Mutation Type */
export type MutationDeleteSavedItemTagsArgs = {
  input: Array<DeleteSavedItemTagsInput>;
};


/** Default Mutation Type */
export type MutationDeleteShareableListArgs = {
  externalId: Scalars['ID']['input'];
};


/** Default Mutation Type */
export type MutationDeleteShareableListItemArgs = {
  externalId: Scalars['ID']['input'];
};


/** Default Mutation Type */
export type MutationDeleteTagArgs = {
  id: Scalars['ID']['input'];
};


/** Default Mutation Type */
export type MutationDeleteTagByNameArgs = {
  tagName: Scalars['String']['input'];
  timestamp?: InputMaybe<Scalars['ISOString']['input']>;
};


/** Default Mutation Type */
export type MutationDeleteUserByFxaIdArgs = {
  id: Scalars['ID']['input'];
};


/** Default Mutation Type */
export type MutationExpireUserWebSessionByFxaIdArgs = {
  id: Scalars['ID']['input'];
  reason: ExpireUserWebSessionReason;
};


/** Default Mutation Type */
export type MutationMigrateAppleUserArgs = {
  email: Scalars['String']['input'];
  fxaId: Scalars['ID']['input'];
};


/** Default Mutation Type */
export type MutationReAddByIdArgs = {
  id: Scalars['ID']['input'];
  timestamp: Scalars['ISOString']['input'];
};


/** Default Mutation Type */
export type MutationRefreshItemArticleArgs = {
  url: Scalars['String']['input'];
};


/** Default Mutation Type */
export type MutationRemoveTagsByNameArgs = {
  savedItem: SavedItemRef;
  tagNames: Array<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['ISOString']['input']>;
};


/** Default Mutation Type */
export type MutationRenameTagByNameArgs = {
  newName: Scalars['String']['input'];
  oldName: Scalars['String']['input'];
  timestamp?: InputMaybe<Scalars['ISOString']['input']>;
};


/** Default Mutation Type */
export type MutationReplaceSavedItemTagsArgs = {
  input: Array<SavedItemTagsInput>;
  timestamp?: InputMaybe<Scalars['ISOString']['input']>;
};


/** Default Mutation Type */
export type MutationReplaceTagsArgs = {
  savedItem: SavedItemRef;
  tagNames: Array<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['ISOString']['input']>;
};


/** Default Mutation Type */
export type MutationSaveArchiveArgs = {
  id: Array<Scalars['ID']['input']>;
  timestamp: Scalars['ISOString']['input'];
};


/** Default Mutation Type */
export type MutationSaveBatchUpdateTagsArgs = {
  input: Array<SaveUpdateTagsInput>;
  timestamp: Scalars['ISOString']['input'];
};


/** Default Mutation Type */
export type MutationSaveFavoriteArgs = {
  id: Array<Scalars['ID']['input']>;
  timestamp: Scalars['ISOString']['input'];
};


/** Default Mutation Type */
export type MutationSaveSearchArgs = {
  search: RecentSearchInput;
};


/** Default Mutation Type */
export type MutationSaveUnArchiveArgs = {
  id: Array<Scalars['ID']['input']>;
  timestamp: Scalars['ISOString']['input'];
};


/** Default Mutation Type */
export type MutationSaveUnFavoriteArgs = {
  id: Array<Scalars['ID']['input']>;
  timestamp: Scalars['ISOString']['input'];
};


/** Default Mutation Type */
export type MutationSaveUpsertArgs = {
  input: Array<SaveUpsertInput>;
  timestamp: Scalars['ISOString']['input'];
};


/** Default Mutation Type */
export type MutationSavedItemArchiveArgs = {
  givenUrl: Scalars['Url']['input'];
  timestamp: Scalars['ISOString']['input'];
};


/** Default Mutation Type */
export type MutationSavedItemDeleteArgs = {
  givenUrl: Scalars['Url']['input'];
  timestamp: Scalars['ISOString']['input'];
};


/** Default Mutation Type */
export type MutationSavedItemFavoriteArgs = {
  givenUrl: Scalars['Url']['input'];
  timestamp: Scalars['ISOString']['input'];
};


/** Default Mutation Type */
export type MutationSavedItemTagArgs = {
  input: SavedItemTagInput;
  timestamp: Scalars['ISOString']['input'];
};


/** Default Mutation Type */
export type MutationSavedItemUnArchiveArgs = {
  givenUrl: Scalars['Url']['input'];
  timestamp: Scalars['ISOString']['input'];
};


/** Default Mutation Type */
export type MutationSavedItemUnDeleteArgs = {
  givenUrl: Scalars['Url']['input'];
  timestamp: Scalars['ISOString']['input'];
};


/** Default Mutation Type */
export type MutationSavedItemUnFavoriteArgs = {
  givenUrl: Scalars['Url']['input'];
  timestamp: Scalars['ISOString']['input'];
};


/** Default Mutation Type */
export type MutationSavedItemUpdateTitleArgs = {
  givenUrl: Scalars['Url']['input'];
  timestamp: Scalars['ISOString']['input'];
  title: Scalars['String']['input'];
};


/** Default Mutation Type */
export type MutationUpdateHighlightArgs = {
  id: Scalars['ID']['input'];
  input: UpdateHighlightInput;
};


/** Default Mutation Type */
export type MutationUpdateSavedItemArchiveArgs = {
  id: Scalars['ID']['input'];
  timestamp?: InputMaybe<Scalars['ISOString']['input']>;
};


/** Default Mutation Type */
export type MutationUpdateSavedItemFavoriteArgs = {
  id: Scalars['ID']['input'];
  timestamp?: InputMaybe<Scalars['ISOString']['input']>;
};


/** Default Mutation Type */
export type MutationUpdateSavedItemHighlightArgs = {
  id: Scalars['ID']['input'];
  input: CreateHighlightInput;
};


/** Default Mutation Type */
export type MutationUpdateSavedItemHighlightNoteArgs = {
  id: Scalars['ID']['input'];
  input: Scalars['String']['input'];
};


/** Default Mutation Type */
export type MutationUpdateSavedItemRemoveTagsArgs = {
  savedItemId?: InputMaybe<Scalars['ID']['input']>;
  timestamp?: InputMaybe<Scalars['ISOString']['input']>;
};


/** Default Mutation Type */
export type MutationUpdateSavedItemTagsArgs = {
  input: SavedItemTagUpdateInput;
};


/** Default Mutation Type */
export type MutationUpdateSavedItemTitleArgs = {
  id: Scalars['ID']['input'];
  timestamp: Scalars['ISOString']['input'];
  title: Scalars['String']['input'];
};


/** Default Mutation Type */
export type MutationUpdateSavedItemUnArchiveArgs = {
  id: Scalars['ID']['input'];
  timestamp?: InputMaybe<Scalars['ISOString']['input']>;
};


/** Default Mutation Type */
export type MutationUpdateSavedItemUnDeleteArgs = {
  id: Scalars['ID']['input'];
  timestamp?: InputMaybe<Scalars['ISOString']['input']>;
};


/** Default Mutation Type */
export type MutationUpdateSavedItemUnFavoriteArgs = {
  id: Scalars['ID']['input'];
  timestamp?: InputMaybe<Scalars['ISOString']['input']>;
};


/** Default Mutation Type */
export type MutationUpdateShareableListArgs = {
  data: UpdateShareableListInput;
};


/** Default Mutation Type */
export type MutationUpdateShareableListItemArgs = {
  data: UpdateShareableListItemInput;
};


/** Default Mutation Type */
export type MutationUpdateShareableListItemsArgs = {
  data: Array<UpdateShareableListItemsInput>;
};


/** Default Mutation Type */
export type MutationUpdateTagArgs = {
  input: TagUpdateInput;
};


/** Default Mutation Type */
export type MutationUpdateUserEmailArgs = {
  email: Scalars['String']['input'];
};


/** Default Mutation Type */
export type MutationUpdateUserEmailByFxaIdArgs = {
  email: Scalars['String']['input'];
  id: Scalars['ID']['input'];
};


/** Default Mutation Type */
export type MutationUpdateUserRecommendationPreferencesArgs = {
  input: UpdateUserRecommendationPreferencesInput;
};


/** Default Mutation Type */
export type MutationUpsertSavedItemArgs = {
  input: SavedItemUpsertInput;
};

export type NotFound = BaseError & {
  __typename?: 'NotFound';
  key?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  path: Scalars['String']['output'];
  value?: Maybe<Scalars['String']['output']>;
};

export type NumberedListElement = ListElement & {
  __typename?: 'NumberedListElement';
  /** Row in a list */
  content: Scalars['Markdown']['output'];
  /** Numeric index. If a nested item, the index is zero-indexed from the first child. */
  index: Scalars['Int']['output'];
  /** Zero-indexed level, for handling nested lists. */
  level: Scalars['Int']['output'];
};

export type OEmbed = PocketMetadata & {
  __typename?: 'OEmbed';
  authors?: Maybe<Array<Author>>;
  datePublished?: Maybe<Scalars['ISOString']['output']>;
  domain?: Maybe<DomainMetadata>;
  excerpt?: Maybe<Scalars['String']['output']>;
  htmlEmbed?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  image?: Maybe<Image>;
  item?: Maybe<Item>;
  source: PocketMetadataSource;
  title?: Maybe<Scalars['String']['output']>;
  type?: Maybe<OEmbedType>;
  url: Scalars['Url']['output'];
};

export enum OEmbedType {
  Link = 'LINK',
  Photo = 'PHOTO',
  Rich = 'RICH',
  Video = 'VIDEO'
}

/** Input for offset-pagination (internal backend use only). */
export type OffsetPaginationInput = {
  /** Defaults to 30 */
  limit?: InputMaybe<Scalars['Int']['input']>;
  /** Defaults to 0 */
  offset?: InputMaybe<Scalars['Int']['input']>;
};

/** Information about pagination in a connection. */
export type PageInfo = {
  __typename?: 'PageInfo';
  /** When paginating forwards, the cursor to continue. */
  endCursor?: Maybe<Scalars['String']['output']>;
  /** When paginating forwards, are there more items? */
  hasNextPage: Scalars['Boolean']['output'];
  /** When paginating backwards, are there more items? */
  hasPreviousPage: Scalars['Boolean']['output'];
  /** When paginating backwards, the cursor to continue. */
  startCursor?: Maybe<Scalars['String']['output']>;
};

/**
 * Represents a type of page for /explore
 * Deprecated for SlateLineups
 */
export enum PageType {
  EditorialCollection = 'editorial_collection',
  TopicPage = 'topic_page'
}

export type Pagination = {
  __typename?: 'Pagination';
  currentPage: Scalars['Int']['output'];
  perPage: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
  totalResults: Scalars['Int']['output'];
};

/**
 * Pagination request. To determine which edges to return, the connection
 * evaluates the `before` and `after` cursors (if given) to filter the
 * edges, then evaluates `first`/`last` to slice the edges (only include a
 * value for either `first` or `last`, not both). If all fields are null,
 * by default will return a page with the first 30 elements.
 */
export type PaginationInput = {
  /**
   * Returns the elements in the list that come after the specified cursor.
   * The specified cursor is not included in the result.
   */
  after?: InputMaybe<Scalars['String']['input']>;
  /**
   * Returns the elements in the list that come before the specified cursor.
   * The specified cursor is not included in the result.
   */
  before?: InputMaybe<Scalars['String']['input']>;
  /**
   * Returns the first _n_ elements from the list. Must be a non-negative integer.
   * If `first` contains a value, `last` should be null/omitted in the input.
   */
  first?: InputMaybe<Scalars['Int']['input']>;
  /**
   * Returns the last _n_ elements from the list. Must be a non-negative integer.
   * If `last` contains a value, `first` should be null/omitted in the input.
   */
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type PendingItem = {
  __typename?: 'PendingItem';
  /**
   * URL of the item that the user gave for the SavedItem
   * that is pending processing by parser
   */
  itemId: Scalars['String']['output'];
  status?: Maybe<PendingItemStatus>;
  url: Scalars['Url']['output'];
};

export enum PendingItemStatus {
  Resolved = 'RESOLVED',
  Unresolved = 'UNRESOLVED'
}

export type PocketMetadata = {
  authors?: Maybe<Array<Author>>;
  datePublished?: Maybe<Scalars['ISOString']['output']>;
  domain?: Maybe<DomainMetadata>;
  excerpt?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  image?: Maybe<Image>;
  item?: Maybe<Item>;
  source: PocketMetadataSource;
  title?: Maybe<Scalars['String']['output']>;
  url: Scalars['Url']['output'];
};

export enum PocketMetadataSource {
  Oembed = 'OEMBED',
  Opengraph = 'OPENGRAPH',
  PocketParser = 'POCKET_PARSER'
}

/**
 * New Pocket Save Type, replacing SavedItem.
 *
 * Represents a Pocket Item that a user has saved to their list.
 * (Said otherways, indicates a saved url to a users list and associated user specific information.)
 */
export type PocketSave = {
  __typename?: 'PocketSave';
  /** Indicates if the PocketSave is archived. */
  archived: Scalars['Boolean']['output'];
  /** Timestamp that the PocketSave became archived, null if not archived. */
  archivedAt?: Maybe<Scalars['ISOString']['output']>;
  /** Unix timestamp of when the PocketSave was created. */
  createdAt: Scalars['ISOString']['output'];
  /** Unix timestamp of when the entity was deleted. */
  deletedAt?: Maybe<Scalars['ISOString']['output']>;
  /** Indicates if the PocketSave is favorited. */
  favorite: Scalars['Boolean']['output'];
  /** Timestamp that the PocketSave became favorited, null if not favorited. */
  favoritedAt?: Maybe<Scalars['ISOString']['output']>;
  /** The url the user gave (as opposed to normalized URLs). */
  givenUrl: Scalars['String']['output'];
  /** Surrogate primary key. */
  id: Scalars['ID']['output'];
  /**
   * Link to the underlying Pocket Item for the URL.
   * Temporary until resource field is added. Will hopefully
   * make it easier for clients to adopt.
   * @deprecated use resource
   */
  item: ItemResult;
  /** The status of this PocketSave; Marked for review for possible removal. */
  status?: Maybe<PocketSaveStatus>;
  /** The Suggested Tags associated with this PocketSave, if the user is not premium or there are none, this will be empty. */
  suggestedTags?: Maybe<Array<Tag>>;
  /** The Tags associated with this PocketSave. */
  tags?: Maybe<Array<Tag>>;
  /** The title of the Resource; defaults to the URL. */
  title: Scalars['String']['output'];
  /** Unix timestamp of when the PocketSave was last updated, if any property on the PocketSave is modified this timestamp is set to the modified time. */
  updatedAt?: Maybe<Scalars['ISOString']['output']>;
};

/** Enum to specify the PocketSave Status (mapped to integers in data store). */
export enum PocketSaveStatus {
  Archived = 'ARCHIVED',
  Deleted = 'DELETED',
  Hidden = 'HIDDEN',
  Unread = 'UNREAD'
}

export type PocketShare = {
  __typename?: 'PocketShare';
  context?: Maybe<ShareContext>;
  createdAt: Scalars['ISOString']['output'];
  preview?: Maybe<PocketMetadata>;
  shareUrl: Scalars['ValidUrl']['output'];
  slug: Scalars['ID']['output'];
  targetUrl: Scalars['ValidUrl']['output'];
};

export enum PremiumFeature {
  /** Feature where you get an ad-free experience */
  AdFree = 'AD_FREE',
  /** Feature where you can highlight articles */
  Annotations = 'ANNOTATIONS',
  /** Feature where pocket saves permanent copies of all your saves */
  PermanentLibrary = 'PERMANENT_LIBRARY',
  /** Feature where pocket's search is enhanced */
  PremiumSearch = 'PREMIUM_SEARCH',
  /** Feature where pocket suggests tags */
  SuggestedTags = 'SUGGESTED_TAGS'
}

export enum PremiumStatus {
  /**
   * User has premium and its active
   * NOTE: User will still show as active if they turn off auto-renew or have otherwise canceled but the expiration date hasn't hit yet
   */
  Active = 'ACTIVE',
  /** User has had premium, but it is expired */
  Expired = 'EXPIRED',
  /** User has never had premium */
  Never = 'NEVER'
}

/** The publisher that the curation team set for the syndicated article */
export type Publisher = {
  __typename?: 'Publisher';
  /** Whether or not to show the article appeared on domain */
  appearedOnDomain: Scalars['Boolean']['output'];
  /** The article call to action to show if selected */
  articleCta?: Maybe<PublisherArticleCta>;
  /** Whether or not to attribute the publisher to the article */
  attributeCanonicalToPublisher: Scalars['Boolean']['output'];
  /** Square logo to use for the publisher */
  logo?: Maybe<Scalars['String']['output']>;
  /** Wide logo to use for the publisher */
  logoWide?: Maybe<Scalars['String']['output']>;
  /** Black wide based logo to use for the publisher */
  logoWideBlack?: Maybe<Scalars['String']['output']>;
  /** Name of the publisher of the article */
  name?: Maybe<Scalars['String']['output']>;
  /** The name to show to the article in recommendations */
  recommendationName?: Maybe<Scalars['String']['output']>;
  /** Whether or not to show an article call to action */
  showArticleCta: Scalars['Boolean']['output'];
  /** Whether or not to show the authors of the article */
  showAuthors: Scalars['Boolean']['output'];
  /** Whether or not to show publisher recomendations */
  showPublisherRecommendations?: Maybe<Scalars['Boolean']['output']>;
  /** Url of the publisher */
  url?: Maybe<Scalars['Url']['output']>;
};

/**
 * The call to action to show on a SyndicatedArticle for a specific publisher
 * TODO: rename to SyndicatedPublisherArticle and move to schema-shared.graphql
 * (requires client changes)
 */
export type PublisherArticleCta = {
  __typename?: 'PublisherArticleCta';
  /** The lead in text to show */
  leadIn?: Maybe<Scalars['String']['output']>;
  /** The text to show */
  text?: Maybe<Scalars['String']['output']>;
  /** The url to link to */
  url?: Maybe<Scalars['String']['output']>;
};

/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type Query = {
  __typename?: 'Query';
  /** Retrieves a Collection by the given slug. The Collection must be published. */
  collectionBySlug?: Maybe<Collection>;
  /**
   * Retrieves a Collection by the given slug. The Collection must be published.
   * @deprecated Use collectionBySlug instead
   */
  getCollectionBySlug?: Maybe<Collection>;
  /** Retrieves a paged set of published Collections. */
  getCollections: CollectionsResult;
  /**
   * Look up Item info by a url.
   * @deprecated Use itemByUrl instead
   */
  getItemByUrl?: Maybe<Item>;
  /**
   * Request a specific `Slate` by id
   * @deprecated Please use queries specific to the surface ex. setMomentSlate. If a named query for your surface does not yet exit please reach out to the Data Products team and they will happily provide you with a named query.
   */
  getSlate: Slate;
  /**
   * Request a specific `SlateLineup` by id
   * @deprecated Please use queries specific to the surface ex. setMomentSlate. If a named query for your surface does not yet exit please reach out to the Data Products team and they will happily provide you with a named query.
   */
  getSlateLineup: SlateLineup;
  /**
   * Look up SyndicatedArticle by a slug.
   * @deprecated use syndicatedArticleBySlug instead
   */
  getSyndicatedArticleBySlug?: Maybe<SyndicatedArticle>;
  /**
   * Returns a list of unleash toggles that are enabled for a given context.
   *
   * For more details on this check out https://docs.google.com/document/d/1dYS81h-DbQEWNLtK-ajLTylw454S32llPXUyBmDd5mU/edit# and https://getpocket.atlassian.net/wiki/spaces/PE/pages/1191444582/Feature+Flags+-+Unleash
   *
   * ~ For each of the enabled unleash toggles (via https://featureflags.readitlater.com/api/client/features or an unleash sdk)
   * ~ Check if the toggle is assigned/enabled for the provided {.context}
   * ~ Add an {UnleashAssignment} representing it to this list
   * ~ If no toggles are found, return an empty list
   * @deprecated use unleashAssignments instead
   */
  getUnleashAssignments?: Maybe<UnleashAssignmentList>;
  /** Get ranked corpus slates and recommendations to deliver a unified Home experience.  */
  homeSlateLineup: CorpusSlateLineup;
  /** Look up Item info by a url. */
  itemByUrl?: Maybe<Item>;
  /**
   * List all available topics that we have recommendations for.
   * @deprecated Use `getSlateLineup` with a specific SlateLineup instead.
   */
  listTopics: Array<Topic>;
  /** Get a slate of ranked recommendations for the Firefox New Tab. Currently supports the Italy, France, and Spain markets. */
  newTabSlate: CorpusSlate;
  /**
   * Resolve Reader View links which might point to SavedItems that do not
   * exist, aren't in the Pocket User's list, or are requested by a logged-out
   * user (or user without a Pocket Account).
   * Fetches data which clients can use to generate an appropriate fallback view
   * that allows users to preview the content and access the original source site.
   */
  readerSlug: ReaderViewResult;
  /** List all topics that the user can express a preference for. */
  recommendationPreferenceTopics: Array<Topic>;
  scheduledSurface: ScheduledSurface;
  /**
   * Resolve data for a Shared link, or return a Not Found
   * message if the share does not exist.
   */
  shareSlug?: Maybe<ShareResult>;
  /**
   * Looks up and returns a Shareable List with a given external ID for a given user.
   * (the user ID will be coming through with the headers)
   */
  shareableList?: Maybe<ShareableList>;
  /** Returns a publicly-shared Shareable List. Note: this query does not require user authentication. */
  shareableListPublic?: Maybe<ShareableListPublic>;
  /**
   * Looks up and returns an array of Shareable Lists for a given user ID for a given user.
   * (the user ID will be coming through with the headers)
   */
  shareableLists: Array<ShareableList>;
  /** Determines if the userid passed in the headers has access to the pilot program. */
  shareableListsPilotUser: Scalars['Boolean']['output'];
  /** This is a future improvement, not needed now. */
  surface: Surface;
  /** Look up the SyndicatedArticle by a slug */
  syndicatedArticleBySlug?: Maybe<SyndicatedArticle>;
  /**
   * Returns a list of unleash toggles that are enabled for a given context.
   *
   * For more details on this check out https://docs.google.com/document/d/1dYS81h-DbQEWNLtK-ajLTylw454S32llPXUyBmDd5mU/edit# and https://getpocket.atlassian.net/wiki/spaces/PE/pages/1191444582/Feature+Flags+-+Unleash
   *
   * ~ For each of the enabled unleash toggles (via https://featureflags.readitlater.com/api/client/features or an unleash sdk)
   * ~ Check if the toggle is assigned/enabled for the provided {.context}
   * ~ Add an {UnleashAssignment} representing it to this list
   * ~ If no toggles are found, return an empty list
   */
  unleashAssignments?: Maybe<UnleashAssignmentList>;
  /** Get a user entity for an authenticated client */
  user?: Maybe<User>;
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QueryCollectionBySlugArgs = {
  slug: Scalars['String']['input'];
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QueryGetCollectionBySlugArgs = {
  slug: Scalars['String']['input'];
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QueryGetCollectionsArgs = {
  filters?: InputMaybe<CollectionsFiltersInput>;
  page?: InputMaybe<Scalars['Int']['input']>;
  perPage?: InputMaybe<Scalars['Int']['input']>;
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QueryGetItemByUrlArgs = {
  url: Scalars['String']['input'];
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QueryGetSlateArgs = {
  recommendationCount?: InputMaybe<Scalars['Int']['input']>;
  slateId: Scalars['String']['input'];
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QueryGetSlateLineupArgs = {
  recommendationCount?: InputMaybe<Scalars['Int']['input']>;
  slateCount?: InputMaybe<Scalars['Int']['input']>;
  slateLineupId: Scalars['String']['input'];
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QueryGetSyndicatedArticleBySlugArgs = {
  slug: Scalars['String']['input'];
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QueryGetUnleashAssignmentsArgs = {
  context: UnleashContext;
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QueryHomeSlateLineupArgs = {
  locale?: Scalars['String']['input'];
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QueryItemByUrlArgs = {
  url: Scalars['String']['input'];
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QueryNewTabSlateArgs = {
  locale: Scalars['String']['input'];
  region?: InputMaybe<Scalars['String']['input']>;
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QueryReaderSlugArgs = {
  slug: Scalars['ID']['input'];
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QueryScheduledSurfaceArgs = {
  id: Scalars['ID']['input'];
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QueryShareSlugArgs = {
  slug: Scalars['ID']['input'];
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QueryShareableListArgs = {
  externalId: Scalars['ID']['input'];
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QueryShareableListPublicArgs = {
  externalId: Scalars['ID']['input'];
  slug: Scalars['String']['input'];
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QuerySurfaceArgs = {
  id: Scalars['ID']['input'];
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QuerySyndicatedArticleBySlugArgs = {
  slug: Scalars['String']['input'];
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QueryUnleashAssignmentsArgs = {
  context: UnleashContext;
};

/**
 * Metadata of an Item in Pocket for preview purposes,
 * or an ItemNotFound result if the record does not exist.
 */
export type ReaderFallback = ItemNotFound | ReaderInterstitial;

/**
 * Card preview data for Items resolved from reader view
 * (getpocket.com/read/) links.
 *
 * Should be used to create a view if Reader Mode cannot
 * be rendered (e.g. the link is visited by an anonymous
 * Pocket user, or a Pocket User that does not have the
 * underlying Item in their Saves). Due to legal obligations
 * we can only display Reader Mode for SavedItems.
 */
export type ReaderInterstitial = {
  __typename?: 'ReaderInterstitial';
  itemCard?: Maybe<PocketMetadata>;
};

/** Result for resolving a getpocket.com/read/<slug> link. */
export type ReaderViewResult = {
  __typename?: 'ReaderViewResult';
  fallbackPage?: Maybe<ReaderFallback>;
  /**
   * The SavedItem referenced by this reader view slug, if it
   * is in the Pocket User's list.
   */
  savedItem?: Maybe<SavedItem>;
  slug: Scalars['ID']['output'];
};

export type RecItUserProfile = {
  userModels: Array<Scalars['String']['input']>;
};

export type RecentSearch = {
  __typename?: 'RecentSearch';
  context?: Maybe<RecentSearchContext>;
  sortId: Scalars['Int']['output'];
  term: Scalars['String']['output'];
};

export type RecentSearchContext = {
  __typename?: 'RecentSearchContext';
  key?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['String']['output']>;
};

export type RecentSearchInput = {
  /** The term that was used for search */
  term: Scalars['String']['input'];
  /**
   * Optional, the time the search was performed.
   * Defaults to current server time at time of request.
   */
  timestamp?: InputMaybe<Scalars['ISOString']['input']>;
};

/** Represents a Recommendation from Pocket */
export type Recommendation = {
  __typename?: 'Recommendation';
  curatedInfo?: Maybe<CuratedInfo>;
  /** The feed id from mysql that this item was curated from (if it was curated) */
  feedId?: Maybe<Scalars['Int']['output']>;
  /**
   * A generated id from the Data and Learning team that represents the Recommendation - Deprecated
   * @deprecated Use `id`
   */
  feedItemId?: Maybe<Scalars['ID']['output']>;
  /** A generated id from the Data and Learning team that represents the Recommendation */
  id: Scalars['ID']['output'];
  /**
   * The Recommendation entity is owned by the Recommendation API service.
   * We extend it in this service to add an extra field ('curationInfo') to the Recommendation entity.
   * The key for this entity is the 'itemId' found within the Item entity which is owned by the Parser service.
   */
  item: Item;
  /**
   * The ID of the item this recommendation represents
   * TODO: Use apollo federation to turn this into an Item type.
   */
  itemId: Scalars['ID']['output'];
  /** The publisher of the item */
  publisher?: Maybe<Scalars['String']['output']>;
  /** The source of the recommendation */
  recSrc: Scalars['String']['output'];
};

export type RecommendationReason = {
  __typename?: 'RecommendationReason';
  /** A succinct name for the recommendation reason that can be displayed to the user. */
  name: Scalars['String']['output'];
  /** The type of reason for why the recommendation is made. */
  type: RecommendationReasonType;
};

/** Reasons why recommendations are made. Focuses on client needs and is not exhaustive. */
export enum RecommendationReasonType {
  /** Recommendations are sourced from the Pocket Hits newsletter. */
  PocketHits = 'POCKET_HITS',
  /** Recommendations that match the user's topic preferences are ranked higher. */
  PreferredTopics = 'PREFERRED_TOPICS'
}

/** Interface that all state based entities must implement */
export type RemoteEntity = {
  /** Unix timestamp of when the entity was created */
  _createdAt?: Maybe<Scalars['Int']['output']>;
  /** Unix timestamp of when the entity was deleted, 30 days after this date this entity will be HARD deleted from the database and no longer exist */
  _deletedAt?: Maybe<Scalars['Int']['output']>;
  /** Unix timestamp of when the entity was last updated, if any property on the entity is modified this timestamp is set to the modified time */
  _updatedAt?: Maybe<Scalars['Int']['output']>;
  /** Version of the entity, this will increment with each modification of the entity's field */
  _version?: Maybe<Scalars['Int']['output']>;
  /**
   * For tags entity, id denotes the unique tag Id.
   * For savedItems, id denotes the itemId.
   * Along with the userId provided in the header, we will use id to fetch savedItems/tags for the user.
   */
  id: Scalars['ID']['output'];
};

/** Union type for saveById - retrieving either PocketSaves or NotFound errors */
export type SaveByIdResult = NotFound | PocketSave;

/** Payload for mutations that delete Saves */
export type SaveDeleteMutationPayload = {
  __typename?: 'SaveDeleteMutationPayload';
  /** Any errors associated with the mutation. Empty if the mutation was succesful. */
  errors: Array<SaveMutationError>;
  success: Scalars['Boolean']['output'];
};

/**
 * Elasticsearch highlights.
 * Highlighted snippets from the following fields in the search results
 * so clients can show users where the query matches are.
 * Each field, if available, contains an array of html text snippets
 * that contain a match to the search term.
 * The matching text is wrapped in `<em>` tags, e.g. ["Hiss at <em>vacuum</em> cleaner if it fits i sits"]
 */
export type SaveItemSearchHighlights = {
  __typename?: 'SaveItemSearchHighlights';
  fullText?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  tags?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  title?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  url?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
};

/** All types in this union should implement BaseError, for client fallback */
export type SaveMutationError = NotFound | SyncConflict;

export type SaveUpdateTagsInput = {
  /**
   * Tags to add, by name text; if a Tag
   * with the given name does not exist,
   * one will be created.
   */
  addTagNames: Array<Scalars['String']['input']>;
  /** Tags to remove, by ID */
  removeTagIds: Array<Scalars['ID']['input']>;
  saveId: Scalars['ID']['input'];
};

/** Input field for upserting a Save. Used by saveUpsert mutation */
export type SaveUpsertInput = {
  /** Optional, create/update the SavedItem as a favorited item */
  isFavorite?: InputMaybe<Scalars['Boolean']['input']>;
  /** Optional, title of the SavedItem */
  title?: InputMaybe<Scalars['String']['input']>;
  /**
   * The url to create/update the SavedItem with. (the url to save to the list)
   * Must be at least a 4 character string which is the shortest url
   */
  url: Scalars['String']['input'];
};

/** Payload for mutations that create or update Saves */
export type SaveWriteMutationPayload = {
  __typename?: 'SaveWriteMutationPayload';
  /** Any errors associated with the mutation. Empty if the mutation was succesful. */
  errors: Array<SaveMutationError>;
  /** The mutated Save objects; empty if the mutation did not succeed. */
  save: Array<PocketSave>;
};

/**
 * Represents a Pocket Item that a user has saved to their list.
 * (Said otherways, indicates a saved url to a users list and associated user specific information.)
 */
export type SavedItem = RemoteEntity & {
  __typename?: 'SavedItem';
  /** Unix timestamp of when the entity was created */
  _createdAt: Scalars['Int']['output'];
  /** Unix timestamp of when the entity was deleted, 30 days after this date this entity will be HARD deleted from the database and no longer exist */
  _deletedAt?: Maybe<Scalars['Int']['output']>;
  /** Unix timestamp of when the entity was last updated, if any property on the entity is modified this timestamp is set to the modified time */
  _updatedAt?: Maybe<Scalars['Int']['output']>;
  /** Version of the entity, this will increment with each modification of the entity's field */
  _version?: Maybe<Scalars['Int']['output']>;
  /** Annotations associated to this SavedItem */
  annotations?: Maybe<SavedItemAnnotations>;
  /** Timestamp that the SavedItem became archied, null if not archived */
  archivedAt?: Maybe<Scalars['Int']['output']>;
  /** If the item is in corpus allow the saved item to reference it.  Exposing curated info for consistent UX */
  corpusItem?: Maybe<CorpusItem>;
  /** Timestamp that the SavedItem became favorited, null if not favorited */
  favoritedAt?: Maybe<Scalars['Int']['output']>;
  /** Surrogate primary key. This is usually generated by clients, but will be generated by the server if not passed through creation */
  id: Scalars['ID']['output'];
  /** Helper property to indicate if the SavedItem is archived */
  isArchived: Scalars['Boolean']['output'];
  /** Helper property to indicate if the SavedItem is favorited */
  isFavorite: Scalars['Boolean']['output'];
  /** Link to the underlying Pocket Item for the URL */
  item: ItemResult;
  /** The status of this SavedItem */
  status?: Maybe<SavedItemStatus>;
  /** The Suggested Tags associated with this SavedItem, if the user is not premium or there are none, this will be empty. */
  suggestedTags?: Maybe<Array<Tag>>;
  /** The Tags associated with this SavedItem */
  tags?: Maybe<Array<Tag>>;
  /** The title for user saved item. Set by the user and if not, set by the parser. */
  title?: Maybe<Scalars['String']['output']>;
  /** The url the user saved to their list */
  url: Scalars['String']['output'];
};

/**
 * Container for all annotations associated to a SavedItem.
 * Can be extended when more types of annotations are added.
 */
export type SavedItemAnnotations = {
  __typename?: 'SavedItemAnnotations';
  /** User-highlighted passages on a SavedItem */
  highlights?: Maybe<Array<Maybe<Highlight>>>;
};

/** The connection type for SavedItem. */
export type SavedItemConnection = {
  __typename?: 'SavedItemConnection';
  /** A list of edges. */
  edges?: Maybe<Array<Maybe<SavedItemEdge>>>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** Identifies the total count of SavedItems in the connection. */
  totalCount: Scalars['Int']['output'];
};

/** Payload for mutations that delete Saves */
export type SavedItemDeleteMutationPayload = {
  __typename?: 'SavedItemDeleteMutationPayload';
  /** Any errors associated with the mutation. Empty if the mutation was succesful. */
  errors: Array<SavedItemMutationError>;
  success: Scalars['Boolean']['output'];
};

/** An edge in a connection. */
export type SavedItemEdge = {
  __typename?: 'SavedItemEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The SavedItem at the end of the edge. */
  node?: Maybe<SavedItem>;
};

/** All types in this union should implement BaseError, for client fallback */
export type SavedItemMutationError = NotFound | SyncConflict;

/**
 * We don't have official oneOf support, but this will
 * throw if both `id` and `url` are unset/null.
 * Don't provide both... but if both are provided, it will
 * default to using ID.
 */
export type SavedItemRef = {
  id?: InputMaybe<Scalars['ID']['input']>;
  url?: InputMaybe<Scalars['Url']['input']>;
};

export type SavedItemSearchResult = {
  __typename?: 'SavedItemSearchResult';
  savedItem: SavedItem;
  /**
   * Highlighted snippets from fields in the search results
   * searchHighlights is a premium user feature. Not available for free search.
   */
  searchHighlights?: Maybe<SaveItemSearchHighlights>;
};

/** The connection type for SavedItem. */
export type SavedItemSearchResultConnection = {
  __typename?: 'SavedItemSearchResultConnection';
  /** A list of edges. */
  edges: Array<SavedItemSearchResultEdge>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** Identifies the total count of items in the connection. */
  totalCount: Scalars['Int']['output'];
};

/** An edge in a connection. */
export type SavedItemSearchResultEdge = {
  __typename?: 'SavedItemSearchResultEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: SavedItemSearchResult;
};

/** A page of SavedItemSearchResult, retrieved by offset-based pagination. */
export type SavedItemSearchResultPage = {
  __typename?: 'SavedItemSearchResultPage';
  entries: Array<SavedItemSearchResult>;
  limit: Scalars['Int']['output'];
  offset: Scalars['Int']['output'];
  totalCount: Scalars['Int']['output'];
};

export enum SavedItemStatus {
  Archived = 'ARCHIVED',
  Deleted = 'DELETED',
  Hidden = 'HIDDEN',
  Unread = 'UNREAD'
}

/** Valid statuses a client may use to filter SavedItems */
export enum SavedItemStatusFilter {
  Archived = 'ARCHIVED',
  Hidden = 'HIDDEN',
  Unread = 'UNREAD'
}

export type SavedItemTagAssociation = {
  __typename?: 'SavedItemTagAssociation';
  /** The ID of the SavedItem associated with the Tag */
  savedItemId: Scalars['ID']['output'];
  /** The ID of the Tag associated with the SavedItem */
  tagId: Scalars['ID']['output'];
};

/** Input field for adding Tag Associations to a SavedItem, by givenUrl */
export type SavedItemTagInput = {
  givenUrl: Scalars['Url']['input'];
  tagNames: Array<Scalars['String']['input']>;
};

/** Input field for setting all Tag associations on a SavedItem. */
export type SavedItemTagUpdateInput = {
  /** The SavedItem ID to associate Tags to */
  savedItemId: Scalars['ID']['input'];
  /** The set of Tag IDs to associate to the SavedItem */
  tagIds: Array<Scalars['ID']['input']>;
};

/** Input field for setting all Tag associations on a SavedItem. */
export type SavedItemTagsInput = {
  /** The SavedItem ID to associate Tags to */
  savedItemId: Scalars['ID']['input'];
  /** The set of Tag names to associate to the SavedItem */
  tags: Array<Scalars['String']['input']>;
};

/** Input field for upserting a SavedItem */
export type SavedItemUpsertInput = {
  /** Optional, create/update the SavedItem as a favorited item */
  isFavorite?: InputMaybe<Scalars['Boolean']['input']>;
  /** Optional, time that request was submitted by client epoch/unix time */
  timestamp?: InputMaybe<Scalars['Int']['input']>;
  /** Optional, title of the SavedItem */
  title?: InputMaybe<Scalars['String']['input']>;
  /**
   * The url to create/update the SavedItem with. (the url to save to the list)
   * Must be at least a 4 character string which is the shortest url
   */
  url: Scalars['String']['input'];
};

/** Payload for mutations that create or update SavedItems */
export type SavedItemWriteMutationPayload = {
  __typename?: 'SavedItemWriteMutationPayload';
  /** Any errors associated with the mutation. Empty if the mutation was succesful. */
  errors: Array<SavedItemMutationError>;
  /** The mutated SavedItem objects; empty if the mutation did not succeed. */
  savedItem: Array<SavedItem>;
};

/** A SavedItem can be one of these content types */
export enum SavedItemsContentType {
  /**
   * Item is a parsed page can be opened in reader view
   * @deprecated Use `IS_READABLE`.
   */
  Article = 'ARTICLE',
  /** Item is a parsed article that contains videos */
  HasVideo = 'HAS_VIDEO',
  /** Item is a video or a parsed article that contains videos */
  HasVideoInclusive = 'HAS_VIDEO_INCLUSIVE',
  /** Item is an un-parsable page and will be opened externally */
  IsExternal = 'IS_EXTERNAL',
  /** Item is an image */
  IsImage = 'IS_IMAGE',
  /** Item is a parsed page can be opened in reader view */
  IsReadable = 'IS_READABLE',
  /** Item is a video */
  IsVideo = 'IS_VIDEO',
  /**
   * Item is a parsed article that contains videos
   * @deprecated Use `HAS_VIDEO`.
   */
  Video = 'VIDEO'
}

/** Input field for filtering a user's list */
export type SavedItemsFilter = {
  /** Optional, filter to get SavedItems based on content type */
  contentType?: InputMaybe<SavedItemsContentType>;
  /**
   * Optional, filter to get SavedItems that have been archived.
   * This field is deprecated. Use status instead.
   * TODO: Add deprecate tag once input field deprecation is enabled.
   * Ref: https://github.com/apollographql/federation/issues/912
   */
  isArchived?: InputMaybe<Scalars['Boolean']['input']>;
  /** Optional, filter to get SavedItems that have been favorited */
  isFavorite?: InputMaybe<Scalars['Boolean']['input']>;
  /** Optional, filter to get SavedItems with highlights */
  isHighlighted?: InputMaybe<Scalars['Boolean']['input']>;
  /** Optional, filter to get user items based on status. Deprecated: use statuses instead. */
  status?: InputMaybe<SavedItemStatusFilter>;
  /** Optional, filters to get user items based on multiple statuses (OR operator) */
  statuses?: InputMaybe<Array<InputMaybe<SavedItemStatusFilter>>>;
  /** Optional, filter to get SavedItems associated to the specified Tag. */
  tagIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  /**
   * Optional, filter to get SavedItems associated to the specified Tag name.
   * To get untagged items, include the string '_untagged_'.
   */
  tagNames?: InputMaybe<Array<Scalars['String']['input']>>;
  /**
   * Optional, filter to get SavedItems updated before a unix timestamp.
   * Mutually exclusive with `updatedSince` option.
   */
  updatedBefore?: InputMaybe<Scalars['Int']['input']>;
  /**
   * Optional, filter to get SavedItems updated since a unix timestamp.
   * Mutually exclusive with `updatedBefore` option.
   */
  updatedSince?: InputMaybe<Scalars['Int']['input']>;
};

/** A page of SavedItems, retrieved by offset-based pagination. */
export type SavedItemsPage = {
  __typename?: 'SavedItemsPage';
  entries: Array<SavedItem>;
  limit: Scalars['Int']['output'];
  offset: Scalars['Int']['output'];
  totalCount: Scalars['Int']['output'];
};

/** Input to sort fetched SavedItems. If unspecified, defaults to CREATED_AT, ASC. */
export type SavedItemsSort = {
  /** The field by which to sort SavedItems */
  sortBy: SavedItemsSortBy;
  /** The order in which to sort SavedItems */
  sortOrder: SavedItemsSortOrder;
};

/** Enum to specify the sort by field (these are the current options, we could add more in the future) */
export enum SavedItemsSortBy {
  ArchivedAt = 'ARCHIVED_AT',
  CreatedAt = 'CREATED_AT',
  FavoritedAt = 'FAVORITED_AT',
  UpdatedAt = 'UPDATED_AT'
}

/** Enum to specify the sort order of SavedItems fetched */
export enum SavedItemsSortOrder {
  Asc = 'ASC',
  Desc = 'DESC'
}

/** Represents a surface that has scheduled items by day */
export type ScheduledSurface = {
  __typename?: 'ScheduledSurface';
  /** Agreed on GUID that is from our shared data pocket confluence */
  id: Scalars['ID']['output'];
  /** Subquery to get the ScheduledSurfaceItems to display to a user for a given date */
  items: Array<ScheduledSurfaceItem>;
  /** Internal name of the surface */
  name: Scalars['String']['output'];
};


/** Represents a surface that has scheduled items by day */
export type ScheduledSurfaceItemsArgs = {
  date: Scalars['Date']['input'];
};

/**
 * A scheduled entry for an CorpusItem to appear on a Scheduled Surface.
 * For example, a story that is scheduled to appear on December 31st, 2021 on the Scheduled Surface in Firefox for the US audience.
 */
export type ScheduledSurfaceItem = {
  __typename?: 'ScheduledSurfaceItem';
  /** The curated item that should run */
  corpusItem: CorpusItem;
  /** A backend GUID that represents this scheduled run */
  id: Scalars['ID']['output'];
  /** The date the item should run at */
  scheduledDate: Scalars['Date']['output'];
  /** Agreed on GUID that is from our shared data pocket confluence */
  surfaceId: Scalars['ID']['output'];
};

/** Input filed for filtering items */
export type SearchFilter = {
  /** Optional filter to items of a specific content type */
  contentType?: InputMaybe<Scalars['String']['input']>;
  /**
   * Optional filter to get items that matches the domain
   * domain should be in the url format, e.g getpocket.com (or) list.getpocket.com
   */
  domain?: InputMaybe<Scalars['String']['input']>;
  /** Optional filter to get items that are favorited */
  favorite?: InputMaybe<Scalars['Boolean']['input']>;
  /** Optional filter to get items in a specific state */
  status?: InputMaybe<SearchStatus>;
  /** Optional fitler to get item with specific tags */
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type SearchFilterInput = {
  /** Optional, filter to get SavedItems based on content type */
  contentType?: InputMaybe<SearchItemsContentType>;
  /**
   * Optional filter to get items that matches the domain
   * domain should be in the url format, e.g getpocket.com (or) list.getpocket.com
   */
  domain?: InputMaybe<Scalars['String']['input']>;
  /** Optional, filter to get user items that have been favorited */
  isFavorite?: InputMaybe<Scalars['Boolean']['input']>;
  /**
   * Optional, filter to get user items only based on title and url, ie Free Search
   * Note, though that if this is selected and the user is premium, they will not get search highligthing.
   */
  onlyTitleAndURL?: InputMaybe<Scalars['Boolean']['input']>;
  /** Optional, filter to get user items based on status. */
  status?: InputMaybe<SearchItemsStatusFilter>;
};

/**
 * Used to detemermine whether to add or multiply a document's score by the
 * functional boost factor
 */
export enum SearchFunctionalBoostOperation {
  Add = 'ADD',
  Multiply = 'MULTIPLY'
}

/** Input field to get elasticsearch highlights of keywords */
export type SearchHighlightField = {
  /** Field to highlight */
  field: Scalars['String']['input'];
  /** The number of characters to return in addition to the keyword */
  size: Scalars['Int']['input'];
};

/** A SavedItem can be one of these content types */
export enum SearchItemsContentType {
  Article = 'ARTICLE',
  Video = 'VIDEO'
}

/** Enum to specify the sort by field (these are the current options, we could add more in the future) */
export enum SearchItemsSortBy {
  /** Indicates when a SavedItem was created */
  CreatedAt = 'CREATED_AT',
  /**
   * Sort SavedItems based on a relevance score
   * This is a feature of elasticsearch and current only available for premium search
   */
  Relevance = 'RELEVANCE',
  /** Estimated time to read a SavedItem */
  TimeToRead = 'TIME_TO_READ'
}

/** Enum to specify the sort order of user items fetched */
export enum SearchItemsSortOrder {
  Asc = 'ASC',
  Desc = 'DESC'
}

/** Valid statuses a client may use to filter */
export enum SearchItemsStatusFilter {
  Archived = 'ARCHIVED',
  Unread = 'UNREAD'
}

/** Input field for search */
export type SearchParams = {
  /** Fields to search for the keyword in */
  fields: Array<InputMaybe<Scalars['String']['input']>>;
  /** Filters to be applied to the search */
  filters?: InputMaybe<SearchFilter>;
  /** Offset for pagination */
  from?: InputMaybe<Scalars['Int']['input']>;
  /** Operation to boost the score of a document based */
  functionalBoosts?: InputMaybe<Array<InputMaybe<FunctionalBoostField>>>;
  /** Fields that should be highlighted if keywords are found within them */
  highlightFields?: InputMaybe<Array<InputMaybe<SearchHighlightField>>>;
  /** Number of items to return */
  size?: InputMaybe<Scalars['Int']['input']>;
  /** Sorting for the search */
  sort?: InputMaybe<SearchSort>;
  /** The keyword to search for */
  term: Scalars['String']['input'];
};

/** The return type for the search query */
export type SearchResult = {
  __typename?: 'SearchResult';
  /** @deprecated Not required by implementing clients */
  page?: Maybe<Scalars['Int']['output']>;
  /** @deprecated Not required by implementing client */
  perPage?: Maybe<Scalars['Int']['output']>;
  /** Items found */
  results?: Maybe<Array<Maybe<Item>>>;
  /** Number of items found */
  totalResults: Scalars['Int']['output'];
};

/** Input field for sorting items */
export type SearchSort = {
  /** Direction of the sort (ASC/DESC) */
  direction: SearchSortDirection;
  /** Field in elasticsearch to sort by */
  field: Scalars['String']['input'];
};

/** Sort direction of the returned items. */
export enum SearchSortDirection {
  Asc = 'ASC',
  Desc = 'DESC'
}

export type SearchSortInput = {
  /** The field by which to sort user items */
  sortBy: SearchItemsSortBy;
  /** The order in which to sort user items */
  sortOrder?: InputMaybe<SearchItemsSortOrder>;
};

/**
 * An index item can be in one of these states
 * QUEUED implies an item that has not been archived
 */
export enum SearchStatus {
  Archived = 'ARCHIVED',
  Queued = 'QUEUED'
}

export type ShareContext = {
  __typename?: 'ShareContext';
  /** User-provided highlights of the content */
  highlights?: Maybe<Array<ShareHighlight>>;
  /** A user-provided comment/note on the shared content. */
  note?: Maybe<Scalars['String']['output']>;
};

/** Input for mutation which creates a new Pocket Share link. */
export type ShareContextInput = {
  /** Quoted content from the Share source */
  highlights?: InputMaybe<ShareHighlightInput>;
  /** A note/comment about the Share (up to 500 characters). */
  note?: InputMaybe<Scalars['String']['input']>;
};

export type ShareHighlight = {
  __typename?: 'ShareHighlight';
  /** Highlighted text on a piece of shared content. */
  quote: Scalars['String']['output'];
};

export type ShareHighlightInput = {
  /**
   * Highlighted text on a piece of shared content.
   * This is a permissive constraint but there needs
   * to be _a_ constraint.
   * This input is not required, but if present 'quotes'
   * is required as it is the only field.
   * Limited to 300 characters per quote (longer quotes
   * will not be rejected, but will be truncated).
   */
  quotes: Array<Scalars['Max300CharString']['input']>;
};

export type ShareNotFound = {
  __typename?: 'ShareNotFound';
  message?: Maybe<Scalars['String']['output']>;
};

export type ShareResult = PocketShare | ShareNotFound;

/** A user-created list of Pocket saves that can be shared publicly. */
export type ShareableList = {
  __typename?: 'ShareableList';
  /** The timestamp of when the list was created by its owner. */
  createdAt: Scalars['ISOString']['output'];
  /** Optional text description of a Shareable List. Provided by the Pocket user. */
  description?: Maybe<Scalars['String']['output']>;
  /** A unique string identifier in UUID format. */
  externalId: Scalars['ID']['output'];
  /** Pocket Saves that have been added to this list by the Pocket user. */
  items: ListItemConnection;
  /** The visibility of notes added to list items for this list. */
  listItemNoteVisibility: ShareableListVisibility;
  /**
   * Pocket Saves that have been added to this list by the Pocket user.
   * @deprecated use items
   */
  listItems: Array<ShareableListItem>;
  /** The moderation status of the list. Defaults to VISIBLE. */
  moderationStatus: ShareableListModerationStatus;
  /**
   * A URL-ready identifier of the list. Generated from the title
   * of the list when it's first made public. Unique per user.
   */
  slug?: Maybe<Scalars['String']['output']>;
  /** The status of the list. Defaults to PRIVATE. */
  status: ShareableListVisibility;
  /** The title of the list. Provided by the Pocket user. */
  title: Scalars['String']['output'];
  /**
   * The timestamp of when the list was last updated by its owner
   * or a member of the moderation team.
   */
  updatedAt: Scalars['ISOString']['output'];
  /** The user who created this shareable list. */
  user: User;
};


/** A user-created list of Pocket saves that can be shared publicly. */
export type ShareableListItemsArgs = {
  pagination?: InputMaybe<PaginationInput>;
};

/** A Pocket Save (story) that has been added to a Shareable List. */
export type ShareableListItem = {
  __typename?: 'ShareableListItem';
  /** A comma-separated list of story authors. Supplied by the Parser. */
  authors?: Maybe<Scalars['String']['output']>;
  /** The timestamp of when this story was added to the list by its owner. */
  createdAt: Scalars['ISOString']['output'];
  /** The excerpt of the story. Supplied by the Parser. */
  excerpt?: Maybe<Scalars['String']['output']>;
  /** A unique string identifier in UUID format. */
  externalId: Scalars['ID']['output'];
  /** The URL of the thumbnail image illustrating the story. Supplied by the Parser. */
  imageUrl?: Maybe<Scalars['Url']['output']>;
  /** The Parser Item ID. */
  itemId: Scalars['ID']['output'];
  /** User generated note to accompany this list item. */
  note?: Maybe<Scalars['String']['output']>;
  /** The name of the publisher for this story. Supplied by the Parser. */
  publisher?: Maybe<Scalars['String']['output']>;
  /** The custom sort order of stories within a list. Defaults to 1. */
  sortOrder: Scalars['Int']['output'];
  /**
   * The title of the story. Supplied by the Parser.
   * May not be available for URLs that cannot be resolved.
   * Not editable by the Pocket user, as are all the other
   * Parser-supplied story properties below.
   */
  title?: Maybe<Scalars['String']['output']>;
  /** The timestamp of when the story was last updated. Not used for the MVP. */
  updatedAt: Scalars['ISOString']['output'];
  /** The URL of the story saved to a list. */
  url: Scalars['Url']['output'];
};

/** The moderation status of a Shareable List. Defaults to VISIBLE. */
export enum ShareableListModerationStatus {
  /**
   * The list and its contents have been removed from view and further editing
   * by its owner as it violated the Pocket content moderation policy.
   */
  Hidden = 'HIDDEN',
  /** The list and its contents abide by the Pocket content moderation policy. */
  Visible = 'VISIBLE'
}

/**
 * A list that has been already shared publicly.
 * This type is needed as it needs to be cached.
 */
export type ShareableListPublic = {
  __typename?: 'ShareableListPublic';
  /** The timestamp of when the list was created by its owner. */
  createdAt: Scalars['ISOString']['output'];
  /** Optional text description of a Shareable List. Provided by the Pocket user. */
  description?: Maybe<Scalars['String']['output']>;
  /** A unique string identifier in UUID format. */
  externalId: Scalars['ID']['output'];
  /** The visibility of notes added to list items for this list. */
  listItemNoteVisibility: ShareableListVisibility;
  /** Pocket Saves that have been added to this list by the Pocket user. */
  listItems: Array<ShareableListItem>;
  /** The moderation status of the list. Defaults to VISIBLE. */
  moderationStatus: ShareableListModerationStatus;
  /**
   * A URL-ready identifier of the list. Generated from the title
   * of the list when it's first made public. Unique per user.
   */
  slug?: Maybe<Scalars['String']['output']>;
  /** The status of the list. Defaults to PRIVATE. */
  status: ShareableListVisibility;
  /** The title of the list. Provided by the Pocket user. */
  title: Scalars['String']['output'];
  /**
   * The timestamp of when the list was last updated by its owner
   * or a member of the moderation team.
   */
  updatedAt: Scalars['ISOString']['output'];
  /** The user who created this shareable list. */
  user: User;
};

/** The visibility levels used (e.g. list, list item note) in the Shareable List API. Defaults to PRIVATE - visible only to its owner. */
export enum ShareableListVisibility {
  /** Only visible to its owner - the Pocket user who created it. */
  Private = 'PRIVATE',
  /** Can be viewed by anyone in the world. */
  Public = 'PUBLIC'
}

/** A grouping of item recommendations that relate to each other under a specific name and description */
export type Slate = {
  __typename?: 'Slate';
  /** The description of the the slate */
  description?: Maybe<Scalars['String']['output']>;
  /** The name to show to the user for this set of recommendations */
  displayName?: Maybe<Scalars['String']['output']>;
  /** A unique guid/slug, provided by the Data & Learning team that can identify a specific experiment. Production apps typically won't request a specific one, but can for QA or during a/b testing. */
  experimentId: Scalars['ID']['output'];
  id: Scalars['String']['output'];
  /** An ordered list of the recommendations to show to the user */
  recommendations: Array<Recommendation>;
  /** A guid that is unique to every API request that returned slates, such as `getSlateLineup` or `getSlate`. The API will provide a new request id every time apps hit the API. */
  requestId: Scalars['ID']['output'];
};

export type SlateLineup = {
  __typename?: 'SlateLineup';
  /** A unique guid/slug, provided by the Data & Learning team that can identify a specific experiment. Production apps typically won't request a specific one, but can for QA or during a/b testing. */
  experimentId: Scalars['ID']['output'];
  /** A unique slug/id that describes a SlateLineup. The Data & Learning team will provide apps what id to use here for specific cases. */
  id: Scalars['ID']['output'];
  /** A guid that is unique to every API request that returned slates, such as `getRecommendationSlateLineup` or `getSlate`. The API will provide a new request id every time apps hit the API. */
  requestId: Scalars['ID']['output'];
  /** An ordered list of slates for the client to display */
  slates: Array<Slate>;
};

/**
 * Union type to reference a surface
 * This is a future improvement, not needed now.
 */
export type Surface = ScheduledSurface;

export type SyncConflict = BaseError & {
  __typename?: 'SyncConflict';
  message: Scalars['String']['output'];
  path: Scalars['String']['output'];
};

/** An article that Pocket has syndicated and we also host on our own site */
export type SyndicatedArticle = {
  __typename?: 'SyndicatedArticle';
  /** Array of author names in string format */
  authorNames: Array<Maybe<Scalars['String']['output']>>;
  /** Content for the syndicated article */
  content?: Maybe<Scalars['String']['output']>;
  /**
   * The pocket curation category of the Article, maps to the Pocket Curation Topic lists
   * @deprecated use topic instead
   */
  curationCategory?: Maybe<Scalars['String']['output']>;
  /** Excerpt  */
  excerpt?: Maybe<Scalars['String']['output']>;
  /** When does the contract for syndication expire */
  expiresAt?: Maybe<Scalars['String']['output']>;
  /** The Sub IAB category of the article defined at https://support.aerserv.com/hc/en-us/articles/207148516-List-of-IAB-Categories */
  iabSubCategory?: Maybe<Scalars['String']['output']>;
  /** The Main IAB category of the article defined at https://support.aerserv.com/hc/en-us/articles/207148516-List-of-IAB-Categories */
  iabTopCategory?: Maybe<Scalars['String']['output']>;
  /** The item id of this Syndicated Article */
  itemId?: Maybe<Scalars['ID']['output']>;
  /** The locale country of the article */
  localeCountry?: Maybe<Scalars['String']['output']>;
  /** The language of the article */
  localeLanguage?: Maybe<Scalars['String']['output']>;
  /** Primary image to use in surfacing this content */
  mainImage?: Maybe<Scalars['String']['output']>;
  /** The item id of the article we cloned */
  originalItemId: Scalars['ID']['output'];
  /** AWSDateTime — Format: YYYY-MM-DDThh:mm:ss.sssZ */
  publishedAt: Scalars['String']['output'];
  /** The manually set publisher information for this article */
  publisher?: Maybe<Publisher>;
  publisherUrl: Scalars['String']['output'];
  /** Recommend similar syndicated articles. */
  relatedEndOfArticle: Array<CorpusRecommendation>;
  /** Recommend similar articles from the same publisher. */
  relatedRightRail: Array<CorpusRecommendation>;
  /** Should ads be shown on this article or not */
  showAds: Scalars['Boolean']['output'];
  /** Slug that pocket uses for this article in the url */
  slug?: Maybe<Scalars['String']['output']>;
  /**
   * DRAFT — Article is not meant to be available to the public
   * EXPIRED — Article contract is up and should be redirected to original article
   * ACTIVE — Article is clear to be shown in syndicated form
   */
  status: ArticleStatus;
  /** Title of syndicated article */
  title: Scalars['String']['output'];
  /** The pocket topic of the Article, maps to the Pocket Curation Topic lists */
  topic?: Maybe<Scalars['String']['output']>;
};


/** An article that Pocket has syndicated and we also host on our own site */
export type SyndicatedArticleRelatedEndOfArticleArgs = {
  count?: InputMaybe<Scalars['Int']['input']>;
};


/** An article that Pocket has syndicated and we also host on our own site */
export type SyndicatedArticleRelatedRightRailArgs = {
  count?: InputMaybe<Scalars['Int']['input']>;
};

/** Represents a Tag that a User has created for their list */
export type Tag = {
  __typename?: 'Tag';
  /** Unix timestamp of when the entity was deleted, 30 days after this date this entity will be HARD deleted from the database and no longer exist */
  _deletedAt?: Maybe<Scalars['Int']['output']>;
  /** Version of the entity, this will increment with each modification of the entity's field */
  _version?: Maybe<Scalars['Int']['output']>;
  /** Surrogate primary key. This is usually generated by clients, but will be generated by the server if not passed through creation */
  id: Scalars['ID']['output'];
  /** The actual tag string the user created for their list */
  name: Scalars['String']['output'];
  /** paginated listing of all SavedItems associated with this Tag for the user */
  savedItems?: Maybe<SavedItemConnection>;
};


/** Represents a Tag that a User has created for their list */
export type TagSavedItemsArgs = {
  filter?: InputMaybe<SavedItemsFilter>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SavedItemsSort>;
};

/** The connection type for Tag. */
export type TagConnection = {
  __typename?: 'TagConnection';
  /** A list of edges. */
  edges?: Maybe<Array<Maybe<TagEdge>>>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
  /** Identifies the total count of Tags in the connection. */
  totalCount: Scalars['Int']['output'];
};

/** Input field for creating a Tag */
export type TagCreateInput = {
  /** The user provided tag string */
  name: Scalars['String']['input'];
  /** ID of the SavedItem to associate with this Tag */
  savedItemId: Scalars['ID']['input'];
};

/** Payload for mutations that delete Tags */
export type TagDeleteMutationPayload = {
  __typename?: 'TagDeleteMutationPayload';
  /** Any errors associated with the mutation. Empty if the mutation was succesful. */
  errors: Array<TagMutationError>;
  success: Scalars['Boolean']['output'];
};

/** An edge in a connection. */
export type TagEdge = {
  __typename?: 'TagEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The Tag at the end of the edge. */
  node?: Maybe<Tag>;
};

/** All types in this union should implement BaseError, for client fallback */
export type TagMutationError = NotFound | SyncConflict;

/** Input field for updating a Tag */
export type TagUpdateInput = {
  /** Tag ID */
  id: Scalars['ID']['input'];
  /** The updated tag string */
  name: Scalars['String']['input'];
};

/** Payload for mutations that create or update Tags */
export type TagWriteMutationPayload = {
  __typename?: 'TagWriteMutationPayload';
  /** Any errors associated with the mutation. Empty if the mutation was succesful. */
  errors: Array<TagMutationError>;
  /** The mutated Tag objects; empty if the mutation did not succeed. */
  tag: Array<Tag>;
};

/**
 * Represents a topic for /explore
 * Deprecated for SlateLineups
 */
export type Topic = {
  __typename?: 'Topic';
  /** The label the curator uses internally to get items onto this topic */
  curatorLabel: Scalars['String']['output'];
  /** The internal feed id that this topic will pull from if set */
  customFeedId?: Maybe<Scalars['ID']['output']>;
  /**
   * The name of the topic to show to the user
   * @deprecated displayName is deprecated. Use name instead.
   */
  displayName: Scalars['String']['output'];
  /** If returned a note to show to the user about the topic */
  displayNote?: Maybe<Scalars['String']['output']>;
  /** The id of the topic */
  id: Scalars['ID']['output'];
  /** Whether or not clients should show this topic ot users */
  isDisplayed: Scalars['Boolean']['output'];
  /** Whether or not this topic should be visiblly promoted (prominent on the page) */
  isPromoted: Scalars['Boolean']['output'];
  /** The name of the topic to show to the user */
  name: Scalars['String']['output'];
  /** The type of page this topic represents used in  generation */
  pageType: PageType;
  /** The query that was used internally for elasticsearch to find items */
  query: Scalars['String']['output'];
  /** The slug that should be used in the url to represent the topic */
  slug: Scalars['String']['output'];
  /** The description to use in the HTML markup for SEO and social media sharing */
  socialDescription?: Maybe<Scalars['String']['output']>;
  /** The image to use in the HTML markup for SEO and social media sharing */
  socialImage?: Maybe<Scalars['String']['output']>;
  /** The title to use in the HTML markup for SEO and social media sharing */
  socialTitle?: Maybe<Scalars['String']['output']>;
};

export type TopicInput = {
  /** The id of the topic */
  id: Scalars['ID']['input'];
};

/** Represents content that could not be parsed into a valid Marticle* component. */
export type UnMarseable = {
  __typename?: 'UnMarseable';
  /** The html that could not be parsed into a Marticle* component. */
  html: Scalars['String']['output'];
};

/** Details on the variant/status of this toggle for a given user/context */
export type UnleashAssignment = {
  __typename?: 'UnleashAssignment';
  /** Whether or not the provided context is assigned */
  assigned: Scalars['Boolean']['output'];
  /** The unleash toggle name, the same name as it appears in the admin interface and feature api */
  name: Scalars['String']['output'];
  /** If the variant has a payload, its payload value */
  payload?: Maybe<Scalars['String']['output']>;
  /** If the toggle has variants, the variant name it is assigned to */
  variant?: Maybe<Scalars['String']['output']>;
};

/** Contains a list of all toggles. */
export type UnleashAssignmentList = {
  __typename?: 'UnleashAssignmentList';
  assignments: Array<Maybe<UnleashAssignment>>;
};

/**
 * Information about the user and device. Based on https://unleash.github.io/docs/unleash_context
 *
 * Used to calculate assignment values.
 */
export type UnleashContext = {
  /**
   * A unique name for one of our apps. Can be any string, but here are some known/expected values:
   *
   * - `android`
   * - `ios`
   * - `web-discover`
   * - `web-app`
   */
  appName?: InputMaybe<Scalars['String']['input']>;
  /**
   * The environment the device is running in:
   * - `prod`
   * - `beta`
   * - `alpha`
   */
  environment?: InputMaybe<UnleashEnvironment>;
  properties?: InputMaybe<UnleashProperties>;
  /** The device's IP address. If omitted, inferred from either request header `x-forwarded-for` or the origin IP of the request. */
  remoteAddress?: InputMaybe<Scalars['String']['input']>;
  /** A device specific identifier that will be consistent across sessions, typically the encoded {guid} or some session token. */
  sessionId?: InputMaybe<Scalars['String']['input']>;
  /** If logged in, the user's encoded user id (uid). The {Account.user_id}. */
  userId?: InputMaybe<Scalars['String']['input']>;
};

export enum UnleashEnvironment {
  /** Internal team builds */
  Alpha = 'alpha',
  /** User facing, beta level builds */
  Beta = 'beta',
  /** User facing, production builds */
  Prod = 'prod'
}

/** Extended properties that Unleash can use to assign users through a toggle's strategies. */
export type UnleashProperties = {
  /** Only required on activation strategies that are based on account age */
  accountCreatedAt?: InputMaybe<Scalars['String']['input']>;
  /** If omitted, inferred from request header `accept-langauge`. */
  locale?: InputMaybe<Scalars['String']['input']>;
  /** Only required on activation strategies that are based whether a user model exists */
  recItUserProfile?: InputMaybe<RecItUserProfile>;
};

export type UpdateHighlightInput = {
  /** The ID of the Item that should be annotated in the User's list */
  itemId: Scalars['ID']['input'];
  /** Optional note generated by User */
  note?: InputMaybe<Scalars['String']['input']>;
  /**
   * Patch string generated by 'DiffMatchPatch' library, serialized
   * into text via `patch_toText` method.
   * Format is similar to UniDiff but is character-based.
   * The patched text depends on version. For example, the version 2
   * patch surrounds the highlighted text portion with a pair of
   * sentinel tags: '<pkt_tag_annotation></pkt_tag_annotation>'
   * Reference: https://github.com/google/diff-match-patch
   */
  patch: Scalars['String']['input'];
  /**
   * The full text of the highlighted passage. Used as a fallback for
   * rendering highlight if the patch fails.
   */
  quote: Scalars['String']['input'];
  /** Annotation data version */
  version: Scalars['Int']['input'];
};

/** Input data for updating a Shareable List. */
export type UpdateShareableListInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  externalId: Scalars['ID']['input'];
  listItemNoteVisibility?: InputMaybe<ShareableListVisibility>;
  status?: InputMaybe<ShareableListVisibility>;
  title?: InputMaybe<Scalars['String']['input']>;
};

/** Input data for updating a single Shareable List Item. */
export type UpdateShareableListItemInput = {
  externalId: Scalars['ID']['input'];
  note?: InputMaybe<Scalars['String']['input']>;
  sortOrder?: InputMaybe<Scalars['Int']['input']>;
};

/** Input data for updating an array of Shareable List Items, targeting sortOrder. */
export type UpdateShareableListItemsInput = {
  externalId: Scalars['ID']['input'];
  sortOrder: Scalars['Int']['input'];
};

export type UpdateUserRecommendationPreferencesInput = {
  /** Topics that the user expressed interest in. */
  preferredTopics: Array<TopicInput>;
};

/** Resolve by reference the User entity in this graph to provide user data with public lists. */
export type User = {
  __typename?: 'User';
  /** Timestamp of the date when account was created */
  accountCreationDate?: Maybe<Scalars['ISOString']['output']>;
  advancedSearch?: Maybe<SavedItemSearchResultConnection>;
  advancedSearchByOffset?: Maybe<SavedItemSearchResultPage>;
  /** The public avatar url for the user */
  avatarUrl?: Maybe<Scalars['String']['output']>;
  /** A users bio for their profile */
  description?: Maybe<Scalars['String']['output']>;
  /** Email address associated with the account. */
  email?: Maybe<Scalars['String']['output']>;
  /** The users first name */
  firstName?: Maybe<Scalars['String']['output']>;
  /** User id, provided by the user service. */
  id: Scalars['ID']['output'];
  /** Indicates if a user is FxA or not */
  isFxa?: Maybe<Scalars['Boolean']['output']>;
  /** The user's premium status */
  isPremium?: Maybe<Scalars['Boolean']['output']>;
  /** The users last name */
  lastName?: Maybe<Scalars['String']['output']>;
  /** The users first name and last name combined */
  name?: Maybe<Scalars['String']['output']>;
  /** Premium features that a user has access to */
  premiumFeatures?: Maybe<Array<Maybe<PremiumFeature>>>;
  /** Current premium status of the user */
  premiumStatus?: Maybe<PremiumStatus>;
  recentSearches?: Maybe<Array<RecentSearch>>;
  /** Preferences for recommendations that the user has explicitly set. */
  recommendationPreferences?: Maybe<UserRecommendationPreferences>;
  /** Get a PocketSave(s) by its id(s) */
  saveById: Array<SaveByIdResult>;
  /**
   * Get a SavedItem by its id
   * @deprecated Use saveById instead
   */
  savedItemById?: Maybe<SavedItem>;
  /** Get a general paginated listing of all SavedItems for the user */
  savedItems?: Maybe<SavedItemConnection>;
  /** Fetch SavedItems with offset pagination. Internal backend use only. */
  savedItemsByOffset?: Maybe<SavedItemsPage>;
  /**
   * Premium search query. Name will be updated after client input
   * @deprecated Use searchSavedItems
   */
  search: SearchResult;
  /** Get a paginated list of user items that match a given term */
  searchSavedItems?: Maybe<SavedItemSearchResultConnection>;
  searchSavedItemsByOffset?: Maybe<SavedItemSearchResultPage>;
  /** Get a paginated listing of all a user's Tags */
  tags?: Maybe<TagConnection>;
  /**
   * Get all tag names for a user.
   * If syncSince is passed, it will only return tags if changes
   * to a user's tags have occurred after syncSince. It will return
   * all of the user's tags (not just the changes).
   *
   * Yes, this is bad graphql design. It's serving a specific
   * REST API which has unlimited SQL queries, and we do not want to
   * make it possible to request every associated SavedItem
   * node on a tag object. Just biting the bullet on this one.
   */
  tagsList?: Maybe<Array<Scalars['String']['output']>>;
  /** The public username for the user */
  username?: Maybe<Scalars['String']['output']>;
};


/** Resolve by reference the User entity in this graph to provide user data with public lists. */
export type UserAdvancedSearchArgs = {
  filter?: InputMaybe<AdvancedSearchFilters>;
  pagination?: InputMaybe<PaginationInput>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<SearchSortInput>;
};


/** Resolve by reference the User entity in this graph to provide user data with public lists. */
export type UserAdvancedSearchByOffsetArgs = {
  filter?: InputMaybe<AdvancedSearchFilters>;
  pagination?: InputMaybe<OffsetPaginationInput>;
  queryString?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<SearchSortInput>;
};


/** Resolve by reference the User entity in this graph to provide user data with public lists. */
export type UserSaveByIdArgs = {
  ids: Array<Scalars['ID']['input']>;
};


/** Resolve by reference the User entity in this graph to provide user data with public lists. */
export type UserSavedItemByIdArgs = {
  id: Scalars['ID']['input'];
};


/** Resolve by reference the User entity in this graph to provide user data with public lists. */
export type UserSavedItemsArgs = {
  filter?: InputMaybe<SavedItemsFilter>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SavedItemsSort>;
};


/** Resolve by reference the User entity in this graph to provide user data with public lists. */
export type UserSavedItemsByOffsetArgs = {
  filter?: InputMaybe<SavedItemsFilter>;
  pagination?: InputMaybe<OffsetPaginationInput>;
  sort?: InputMaybe<SavedItemsSort>;
};


/** Resolve by reference the User entity in this graph to provide user data with public lists. */
export type UserSearchArgs = {
  params: SearchParams;
};


/** Resolve by reference the User entity in this graph to provide user data with public lists. */
export type UserSearchSavedItemsArgs = {
  filter?: InputMaybe<SearchFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SearchSortInput>;
  term: Scalars['String']['input'];
};


/** Resolve by reference the User entity in this graph to provide user data with public lists. */
export type UserSearchSavedItemsByOffsetArgs = {
  filter?: InputMaybe<SearchFilterInput>;
  pagination?: InputMaybe<OffsetPaginationInput>;
  sort?: InputMaybe<SearchSortInput>;
  term: Scalars['String']['input'];
};


/** Resolve by reference the User entity in this graph to provide user data with public lists. */
export type UserTagsArgs = {
  pagination?: InputMaybe<PaginationInput>;
};


/** Resolve by reference the User entity in this graph to provide user data with public lists. */
export type UserTagsListArgs = {
  syncSince?: InputMaybe<Scalars['ISOString']['input']>;
};

export type UserRecommendationPreferences = {
  __typename?: 'UserRecommendationPreferences';
  /** Topics that the user expressed interest in. */
  preferredTopics?: Maybe<Array<Topic>>;
};

/** A Video, typically within an Article View of an Item or if the Item is a video itself. */
export type Video = {
  __typename?: 'Video';
  /** If known, the height of the video in px */
  height?: Maybe<Scalars['Int']['output']>;
  /** If known, the length of the video in seconds */
  length?: Maybe<Scalars['Int']['output']>;
  /** Absolute url to the video */
  src: Scalars['String']['output'];
  /** The type of video */
  type: VideoType;
  /** The video's id within the service defined by type */
  vid?: Maybe<Scalars['String']['output']>;
  /** The id of the video within Article View. Item.article will have placeholders of <div id='RIL_VID_X' /> where X is this id. Apps can download those images as needed and populate them in their article view. */
  videoId: Scalars['Int']['output'];
  /** If known, the width of the video in px */
  width?: Maybe<Scalars['Int']['output']>;
};

export enum VideoType {
  /** Brightcove (v3 value is 8) */
  Brightcove = 'BRIGHTCOVE',
  /** Flash (v3 value is 6) */
  Flash = 'FLASH',
  /** html5 (v3 value is 5) */
  Html5 = 'HTML5',
  /** iframe (v3 value is 7) */
  Iframe = 'IFRAME',
  /** video iframe (v3 value is 4) */
  VimeoIframe = 'VIMEO_IFRAME',
  /** Vimeo Link (v3 value is 2) */
  VimeoLink = 'VIMEO_LINK',
  /** Vimeo Moogaloop (v3 value is 3) */
  VimeoMoogaloop = 'VIMEO_MOOGALOOP',
  /** Youtube (v3 value is 1) */
  Youtube = 'YOUTUBE'
}

export enum Videoness {
  /** Contains videos (v3 value is 1) */
  HasVideos = 'HAS_VIDEOS',
  /** Is a video (v3 value is 2) */
  IsVideo = 'IS_VIDEO',
  /** No videos (v3 value is 0) */
  NoVideos = 'NO_VIDEOS'
}

export type AccountFieldsFragment = { __typename?: 'User', id: string, username?: string | null, email?: string | null, accountCreationDate?: any | null, name?: string | null, firstName?: string | null, lastName?: string | null, isPremium?: boolean | null, isFxa?: boolean | null, description?: string | null, avatarUrl?: string | null, premiumStatus?: PremiumStatus | null, premiumFeatures?: Array<PremiumFeature | null> | null };

export type HighlightFieldsFragment = { __typename?: 'SavedItem', annotations?: { __typename?: 'SavedItemAnnotations', highlights?: Array<{ __typename?: 'Highlight', id: string, patch: string, quote: string, version: number, _createdAt: any } | null> | null } | null };

export type ItemCompleteFragment = { __typename: 'Item', itemId: string, resolvedId?: string | null, wordCount?: number | null, title?: string | null, timeToRead?: number | null, listenDuration?: number | null, resolvedUrl?: any | null, givenUrl: any, excerpt?: string | null, domain?: string | null, isArticle?: boolean | null, isIndex?: boolean | null, hasVideo?: Videoness | null, hasImage?: Imageness | null, language?: string | null, authors?: Array<{ __typename?: 'Author', id: string, name?: string | null, url?: string | null } | null> | null, domainMetadata?: { __typename?: 'DomainMetadata', logo?: any | null, logoGreyscale?: any | null, name?: string | null } | null, images?: Array<{ __typename?: 'Image', imageId: number, url: any, height?: number | null, width?: number | null, credit?: string | null, caption?: string | null } | null> | null, videos?: Array<{ __typename?: 'Video', videoId: number, src: string, width?: number | null, type: VideoType, vid?: string | null, length?: number | null, height?: number | null } | null> | null, topImage?: { __typename?: 'Image', url: any } | null };

export type ItemParserMetadataFragment = { __typename?: 'Item', normalUrl: string, resolvedUrl?: any | null, domainId?: string | null, originDomainId?: string | null, responseCode?: number | null, mimeType?: string | null, contentLength?: number | null, encoding?: string | null, dateResolved?: any | null, datePublished?: any | null, innerDomainRedirect?: boolean | null, loginRequired?: boolean | null, timeFirstParsed?: any | null, resolvedNormalUrl?: any | null, usedFallback?: number | null, topImage?: { __typename?: 'Image', url: any } | null };

export type ItemSimpleFragment = { __typename: 'Item', itemId: string, resolvedId?: string | null, wordCount?: number | null, title?: string | null, timeToRead?: number | null, listenDuration?: number | null, resolvedUrl?: any | null, givenUrl: any, excerpt?: string | null, domain?: string | null, isArticle?: boolean | null, isIndex?: boolean | null, hasVideo?: Videoness | null, hasImage?: Imageness | null, language?: string | null, topImage?: { __typename?: 'Image', url: any } | null };

export type RecentSearchFieldsFragment = { __typename?: 'User', recentSearches?: Array<{ __typename?: 'RecentSearch', term: string, sortId: number, context?: { __typename?: 'RecentSearchContext', key?: string | null, value?: string | null } | null }> | null };

export type SavedItemCompleteFragment = { __typename?: 'SavedItem', id: string, status?: SavedItemStatus | null, url: string, isFavorite: boolean, isArchived: boolean, _updatedAt?: number | null, _createdAt: number, favoritedAt?: number | null, archivedAt?: number | null, title?: string | null, item: { __typename: 'Item', itemId: string, resolvedId?: string | null, wordCount?: number | null, title?: string | null, timeToRead?: number | null, listenDuration?: number | null, resolvedUrl?: any | null, givenUrl: any, excerpt?: string | null, domain?: string | null, isArticle?: boolean | null, isIndex?: boolean | null, hasVideo?: Videoness | null, hasImage?: Imageness | null, language?: string | null, authors?: Array<{ __typename?: 'Author', id: string, name?: string | null, url?: string | null } | null> | null, domainMetadata?: { __typename?: 'DomainMetadata', logo?: any | null, logoGreyscale?: any | null, name?: string | null } | null, images?: Array<{ __typename?: 'Image', imageId: number, url: any, height?: number | null, width?: number | null, credit?: string | null, caption?: string | null } | null> | null, videos?: Array<{ __typename?: 'Video', videoId: number, src: string, width?: number | null, type: VideoType, vid?: string | null, length?: number | null, height?: number | null } | null> | null, topImage?: { __typename?: 'Image', url: any } | null } | { __typename: 'PendingItem' }, tags?: Array<{ __typename?: 'Tag', name: string }> | null };

export type SavedItemSimpleFragment = { __typename?: 'SavedItem', id: string, status?: SavedItemStatus | null, url: string, isFavorite: boolean, isArchived: boolean, _updatedAt?: number | null, _createdAt: number, favoritedAt?: number | null, archivedAt?: number | null, title?: string | null, tags?: Array<{ __typename?: 'Tag', name: string }> | null, item: { __typename: 'Item', itemId: string, resolvedId?: string | null, wordCount?: number | null, title?: string | null, timeToRead?: number | null, listenDuration?: number | null, resolvedUrl?: any | null, givenUrl: any, excerpt?: string | null, domain?: string | null, isArticle?: boolean | null, isIndex?: boolean | null, hasVideo?: Videoness | null, hasImage?: Imageness | null, language?: string | null, topImage?: { __typename?: 'Image', url: any } | null } | { __typename: 'PendingItem' } };

export type SavedItemWithParserMetadataFragment = { __typename?: 'SavedItem', id: string, status?: SavedItemStatus | null, url: string, isFavorite: boolean, isArchived: boolean, _updatedAt?: number | null, _createdAt: number, favoritedAt?: number | null, archivedAt?: number | null, title?: string | null, item: { __typename: 'Item', normalUrl: string, resolvedUrl?: any | null, domainId?: string | null, originDomainId?: string | null, responseCode?: number | null, mimeType?: string | null, contentLength?: number | null, encoding?: string | null, dateResolved?: any | null, datePublished?: any | null, innerDomainRedirect?: boolean | null, loginRequired?: boolean | null, timeFirstParsed?: any | null, resolvedNormalUrl?: any | null, usedFallback?: number | null, itemId: string, resolvedId?: string | null, wordCount?: number | null, title?: string | null, timeToRead?: number | null, listenDuration?: number | null, givenUrl: any, excerpt?: string | null, domain?: string | null, isArticle?: boolean | null, isIndex?: boolean | null, hasVideo?: Videoness | null, hasImage?: Imageness | null, language?: string | null, authors?: Array<{ __typename?: 'Author', id: string, name?: string | null, url?: string | null } | null> | null, domainMetadata?: { __typename?: 'DomainMetadata', logo?: any | null, logoGreyscale?: any | null, name?: string | null } | null, images?: Array<{ __typename?: 'Image', imageId: number, url: any, height?: number | null, width?: number | null, credit?: string | null, caption?: string | null } | null> | null, videos?: Array<{ __typename?: 'Video', videoId: number, src: string, width?: number | null, type: VideoType, vid?: string | null, length?: number | null, height?: number | null } | null> | null, topImage?: { __typename?: 'Image', url: any } | null } | { __typename: 'PendingItem' }, tags?: Array<{ __typename?: 'Tag', name: string }> | null };

export type SearchResultHighlightsFragment = { __typename?: 'SavedItemSearchResult', searchHighlights?: { __typename?: 'SaveItemSearchHighlights', fullText?: Array<string | null> | null, url?: Array<string | null> | null, tags?: Array<string | null> | null, title?: Array<string | null> | null } | null };

export type AddAnnotationByUrlMutationVariables = Exact<{
  input: CreateHighlightByUrlInput;
}>;


export type AddAnnotationByUrlMutation = { __typename?: 'Mutation', createHighlightByUrl: { __typename?: 'Highlight', id: string } };

export type AddAnnotationByItemIdMutationVariables = Exact<{
  input: Array<CreateHighlightInput> | CreateHighlightInput;
}>;


export type AddAnnotationByItemIdMutation = { __typename?: 'Mutation', createSavedItemHighlights: Array<{ __typename?: 'Highlight', id: string }> };

export type AddSavedItemCompleteMutationVariables = Exact<{
  input: SavedItemUpsertInput;
}>;


export type AddSavedItemCompleteMutation = { __typename?: 'Mutation', upsertSavedItem: { __typename?: 'SavedItem', id: string, status?: SavedItemStatus | null, url: string, isFavorite: boolean, isArchived: boolean, _updatedAt?: number | null, _createdAt: number, favoritedAt?: number | null, archivedAt?: number | null, title?: string | null, item: { __typename: 'Item', normalUrl: string, resolvedUrl?: any | null, domainId?: string | null, originDomainId?: string | null, responseCode?: number | null, mimeType?: string | null, contentLength?: number | null, encoding?: string | null, dateResolved?: any | null, datePublished?: any | null, innerDomainRedirect?: boolean | null, loginRequired?: boolean | null, timeFirstParsed?: any | null, resolvedNormalUrl?: any | null, usedFallback?: number | null, itemId: string, resolvedId?: string | null, wordCount?: number | null, title?: string | null, timeToRead?: number | null, listenDuration?: number | null, givenUrl: any, excerpt?: string | null, domain?: string | null, isArticle?: boolean | null, isIndex?: boolean | null, hasVideo?: Videoness | null, hasImage?: Imageness | null, language?: string | null, authors?: Array<{ __typename?: 'Author', id: string, name?: string | null, url?: string | null } | null> | null, domainMetadata?: { __typename?: 'DomainMetadata', logo?: any | null, logoGreyscale?: any | null, name?: string | null } | null, images?: Array<{ __typename?: 'Image', imageId: number, url: any, height?: number | null, width?: number | null, credit?: string | null, caption?: string | null } | null> | null, videos?: Array<{ __typename?: 'Video', videoId: number, src: string, width?: number | null, type: VideoType, vid?: string | null, length?: number | null, height?: number | null } | null> | null, topImage?: { __typename?: 'Image', url: any } | null } | { __typename: 'PendingItem' }, tags?: Array<{ __typename?: 'Tag', name: string }> | null } };

export type AddSavedItemBeforeTagMutationVariables = Exact<{
  input: SavedItemUpsertInput;
}>;


export type AddSavedItemBeforeTagMutation = { __typename?: 'Mutation', upsertSavedItem: { __typename?: 'SavedItem', id: string } };

export type AddTagsToSavedItemMutationVariables = Exact<{
  tags: Array<SavedItemTagsInput> | SavedItemTagsInput;
}>;


export type AddTagsToSavedItemMutation = { __typename?: 'Mutation', createSavedItemTags: Array<{ __typename?: 'SavedItem', id: string, status?: SavedItemStatus | null, url: string, isFavorite: boolean, isArchived: boolean, _updatedAt?: number | null, _createdAt: number, favoritedAt?: number | null, archivedAt?: number | null, title?: string | null, item: { __typename: 'Item', normalUrl: string, resolvedUrl?: any | null, domainId?: string | null, originDomainId?: string | null, responseCode?: number | null, mimeType?: string | null, contentLength?: number | null, encoding?: string | null, dateResolved?: any | null, datePublished?: any | null, innerDomainRedirect?: boolean | null, loginRequired?: boolean | null, timeFirstParsed?: any | null, resolvedNormalUrl?: any | null, usedFallback?: number | null, itemId: string, resolvedId?: string | null, wordCount?: number | null, title?: string | null, timeToRead?: number | null, listenDuration?: number | null, givenUrl: any, excerpt?: string | null, domain?: string | null, isArticle?: boolean | null, isIndex?: boolean | null, hasVideo?: Videoness | null, hasImage?: Imageness | null, language?: string | null, authors?: Array<{ __typename?: 'Author', id: string, name?: string | null, url?: string | null } | null> | null, domainMetadata?: { __typename?: 'DomainMetadata', logo?: any | null, logoGreyscale?: any | null, name?: string | null } | null, images?: Array<{ __typename?: 'Image', imageId: number, url: any, height?: number | null, width?: number | null, credit?: string | null, caption?: string | null } | null> | null, videos?: Array<{ __typename?: 'Video', videoId: number, src: string, width?: number | null, type: VideoType, vid?: string | null, length?: number | null, height?: number | null } | null> | null, topImage?: { __typename?: 'Image', url: any } | null } | { __typename: 'PendingItem' }, tags?: Array<{ __typename?: 'Tag', name: string }> | null }> };

export type AddTagsByIdMutationVariables = Exact<{
  input: Array<SavedItemTagsInput> | SavedItemTagsInput;
  timestamp?: InputMaybe<Scalars['ISOString']['input']>;
}>;


export type AddTagsByIdMutation = { __typename?: 'Mutation', createSavedItemTags: Array<{ __typename?: 'SavedItem', id: string }> };

export type AddTagsByUrlMutationVariables = Exact<{
  input: SavedItemTagInput;
  timestamp: Scalars['ISOString']['input'];
}>;


export type AddTagsByUrlMutation = { __typename?: 'Mutation', savedItemTag?: { __typename?: 'SavedItem', url: string } | null };

export type ArchiveSavedItemByUrlMutationVariables = Exact<{
  givenUrl: Scalars['Url']['input'];
  timestamp: Scalars['ISOString']['input'];
}>;


export type ArchiveSavedItemByUrlMutation = { __typename?: 'Mutation', savedItemArchive?: { __typename?: 'SavedItem', url: string } | null };

export type ArchiveSavedItemByIdMutationVariables = Exact<{
  updateSavedItemArchiveId: Scalars['ID']['input'];
  timestamp?: InputMaybe<Scalars['ISOString']['input']>;
}>;


export type ArchiveSavedItemByIdMutation = { __typename?: 'Mutation', updateSavedItemArchive: { __typename?: 'SavedItem', id: string } };

export type ClearTagsMutationVariables = Exact<{
  savedItem: SavedItemRef;
  timestamp?: InputMaybe<Scalars['ISOString']['input']>;
}>;


export type ClearTagsMutation = { __typename?: 'Mutation', clearTags?: { __typename?: 'SavedItem', id: string } | null };

export type DeleteAnnotationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteAnnotationMutation = { __typename?: 'Mutation', deleteSavedItemHighlight: string };

export type DeleteSavedItemByUrlMutationVariables = Exact<{
  givenUrl: Scalars['Url']['input'];
  timestamp: Scalars['ISOString']['input'];
}>;


export type DeleteSavedItemByUrlMutation = { __typename?: 'Mutation', savedItemDelete?: any | null };

export type DeleteSavedItemByIdMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  timestamp?: InputMaybe<Scalars['ISOString']['input']>;
}>;


export type DeleteSavedItemByIdMutation = { __typename?: 'Mutation', deleteSavedItem: string };

export type DeleteTagMutationVariables = Exact<{
  tagName: Scalars['String']['input'];
  timestamp?: InputMaybe<Scalars['ISOString']['input']>;
}>;


export type DeleteTagMutation = { __typename?: 'Mutation', deleteTagByName?: string | null };

export type FavoriteSavedItemByUrlMutationVariables = Exact<{
  givenUrl: Scalars['Url']['input'];
  timestamp: Scalars['ISOString']['input'];
}>;


export type FavoriteSavedItemByUrlMutation = { __typename?: 'Mutation', savedItemFavorite?: { __typename?: 'SavedItem', url: string } | null };

export type FavoriteSavedItemByIdMutationVariables = Exact<{
  updateSavedItemFavoriteId: Scalars['ID']['input'];
  timestamp?: InputMaybe<Scalars['ISOString']['input']>;
}>;


export type FavoriteSavedItemByIdMutation = { __typename?: 'Mutation', updateSavedItemFavorite: { __typename?: 'SavedItem', id: string } };

export type ReAddByIdMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  timestamp: Scalars['ISOString']['input'];
}>;


export type ReAddByIdMutation = { __typename?: 'Mutation', reAddById?: { __typename?: 'SavedItem', id: string, status?: SavedItemStatus | null, url: string, isFavorite: boolean, isArchived: boolean, _updatedAt?: number | null, _createdAt: number, favoritedAt?: number | null, archivedAt?: number | null, title?: string | null, item: { __typename: 'Item', normalUrl: string, resolvedUrl?: any | null, domainId?: string | null, originDomainId?: string | null, responseCode?: number | null, mimeType?: string | null, contentLength?: number | null, encoding?: string | null, dateResolved?: any | null, datePublished?: any | null, innerDomainRedirect?: boolean | null, loginRequired?: boolean | null, timeFirstParsed?: any | null, resolvedNormalUrl?: any | null, usedFallback?: number | null, itemId: string, resolvedId?: string | null, wordCount?: number | null, title?: string | null, timeToRead?: number | null, listenDuration?: number | null, givenUrl: any, excerpt?: string | null, domain?: string | null, isArticle?: boolean | null, isIndex?: boolean | null, hasVideo?: Videoness | null, hasImage?: Imageness | null, language?: string | null, authors?: Array<{ __typename?: 'Author', id: string, name?: string | null, url?: string | null } | null> | null, domainMetadata?: { __typename?: 'DomainMetadata', logo?: any | null, logoGreyscale?: any | null, name?: string | null } | null, images?: Array<{ __typename?: 'Image', imageId: number, url: any, height?: number | null, width?: number | null, credit?: string | null, caption?: string | null } | null> | null, videos?: Array<{ __typename?: 'Video', videoId: number, src: string, width?: number | null, type: VideoType, vid?: string | null, length?: number | null, height?: number | null } | null> | null, topImage?: { __typename?: 'Image', url: any } | null } | { __typename: 'PendingItem' }, tags?: Array<{ __typename?: 'Tag', name: string }> | null } | null };

export type RemoveTagsMutationVariables = Exact<{
  savedItem: SavedItemRef;
  tagNames: Array<Scalars['String']['input']> | Scalars['String']['input'];
  timestamp?: InputMaybe<Scalars['ISOString']['input']>;
}>;


export type RemoveTagsMutation = { __typename?: 'Mutation', removeTagsByName?: { __typename?: 'SavedItem', id: string } | null };

export type RenameTagMutationVariables = Exact<{
  oldName: Scalars['String']['input'];
  newName: Scalars['String']['input'];
  timestamp?: InputMaybe<Scalars['ISOString']['input']>;
}>;


export type RenameTagMutation = { __typename?: 'Mutation', renameTagByName?: { __typename?: 'Tag', name: string } | null };

export type ReplaceTagsMutationVariables = Exact<{
  savedItem: SavedItemRef;
  tagNames: Array<Scalars['String']['input']> | Scalars['String']['input'];
  timestamp?: InputMaybe<Scalars['ISOString']['input']>;
}>;


export type ReplaceTagsMutation = { __typename?: 'Mutation', replaceTags?: { __typename?: 'SavedItem', id: string } | null };

export type SaveSearchMutationVariables = Exact<{
  search: RecentSearchInput;
}>;


export type SaveSearchMutation = { __typename?: 'Mutation', saveSearch?: { __typename?: 'RecentSearch', term: string } | null };

export type UnFavoriteSavedItemByUrlMutationVariables = Exact<{
  givenUrl: Scalars['Url']['input'];
  timestamp: Scalars['ISOString']['input'];
}>;


export type UnFavoriteSavedItemByUrlMutation = { __typename?: 'Mutation', savedItemUnFavorite?: { __typename?: 'SavedItem', url: string } | null };

export type UnFavoriteSavedItemByIdMutationVariables = Exact<{
  updateSavedItemUnFavoriteId: Scalars['ID']['input'];
  timestamp?: InputMaybe<Scalars['ISOString']['input']>;
}>;


export type UnFavoriteSavedItemByIdMutation = { __typename?: 'Mutation', updateSavedItemUnFavorite: { __typename?: 'SavedItem', id: string } };

export type SavedItemsCompleteQueryVariables = Exact<{
  pagination?: InputMaybe<OffsetPaginationInput>;
  filter?: InputMaybe<SavedItemsFilter>;
  sort?: InputMaybe<SavedItemsSort>;
  withAnnotations: Scalars['Boolean']['input'];
  withTagsList: Scalars['Boolean']['input'];
  withAccountData: Scalars['Boolean']['input'];
  withRecentSearches: Scalars['Boolean']['input'];
  tagsListSince?: InputMaybe<Scalars['ISOString']['input']>;
}>;


export type SavedItemsCompleteQuery = { __typename?: 'Query', user?: { __typename?: 'User', tagsList?: Array<string> | null, id: string, username?: string | null, email?: string | null, accountCreationDate?: any | null, name?: string | null, firstName?: string | null, lastName?: string | null, isPremium?: boolean | null, isFxa?: boolean | null, description?: string | null, avatarUrl?: string | null, premiumStatus?: PremiumStatus | null, premiumFeatures?: Array<PremiumFeature | null> | null, savedItemsByOffset?: { __typename?: 'SavedItemsPage', totalCount: number, entries: Array<{ __typename?: 'SavedItem', id: string, status?: SavedItemStatus | null, url: string, isFavorite: boolean, isArchived: boolean, _updatedAt?: number | null, _createdAt: number, favoritedAt?: number | null, archivedAt?: number | null, title?: string | null, item: { __typename: 'Item', itemId: string, resolvedId?: string | null, wordCount?: number | null, title?: string | null, timeToRead?: number | null, listenDuration?: number | null, resolvedUrl?: any | null, givenUrl: any, excerpt?: string | null, domain?: string | null, isArticle?: boolean | null, isIndex?: boolean | null, hasVideo?: Videoness | null, hasImage?: Imageness | null, language?: string | null, authors?: Array<{ __typename?: 'Author', id: string, name?: string | null, url?: string | null } | null> | null, domainMetadata?: { __typename?: 'DomainMetadata', logo?: any | null, logoGreyscale?: any | null, name?: string | null } | null, images?: Array<{ __typename?: 'Image', imageId: number, url: any, height?: number | null, width?: number | null, credit?: string | null, caption?: string | null } | null> | null, videos?: Array<{ __typename?: 'Video', videoId: number, src: string, width?: number | null, type: VideoType, vid?: string | null, length?: number | null, height?: number | null } | null> | null, topImage?: { __typename?: 'Image', url: any } | null } | { __typename: 'PendingItem' }, annotations?: { __typename?: 'SavedItemAnnotations', highlights?: Array<{ __typename?: 'Highlight', id: string, patch: string, quote: string, version: number, _createdAt: any } | null> | null } | null, tags?: Array<{ __typename?: 'Tag', name: string }> | null }> } | null, recentSearches?: Array<{ __typename?: 'RecentSearch', term: string, sortId: number, context?: { __typename?: 'RecentSearchContext', key?: string | null, value?: string | null } | null }> | null } | null };

export type SavedItemsSimpleQueryVariables = Exact<{
  pagination?: InputMaybe<OffsetPaginationInput>;
  filter?: InputMaybe<SavedItemsFilter>;
  sort?: InputMaybe<SavedItemsSort>;
  withAnnotations: Scalars['Boolean']['input'];
  withTagsList: Scalars['Boolean']['input'];
  withAccountData: Scalars['Boolean']['input'];
  withRecentSearches: Scalars['Boolean']['input'];
  tagsListSince?: InputMaybe<Scalars['ISOString']['input']>;
}>;


export type SavedItemsSimpleQuery = { __typename?: 'Query', user?: { __typename?: 'User', tagsList?: Array<string> | null, id: string, username?: string | null, email?: string | null, accountCreationDate?: any | null, name?: string | null, firstName?: string | null, lastName?: string | null, isPremium?: boolean | null, isFxa?: boolean | null, description?: string | null, avatarUrl?: string | null, premiumStatus?: PremiumStatus | null, premiumFeatures?: Array<PremiumFeature | null> | null, savedItemsByOffset?: { __typename?: 'SavedItemsPage', totalCount: number, entries: Array<{ __typename?: 'SavedItem', id: string, status?: SavedItemStatus | null, url: string, isFavorite: boolean, isArchived: boolean, _updatedAt?: number | null, _createdAt: number, favoritedAt?: number | null, archivedAt?: number | null, title?: string | null, tags?: Array<{ __typename?: 'Tag', name: string }> | null, item: { __typename: 'Item', itemId: string, resolvedId?: string | null, wordCount?: number | null, title?: string | null, timeToRead?: number | null, listenDuration?: number | null, resolvedUrl?: any | null, givenUrl: any, excerpt?: string | null, domain?: string | null, isArticle?: boolean | null, isIndex?: boolean | null, hasVideo?: Videoness | null, hasImage?: Imageness | null, language?: string | null, topImage?: { __typename?: 'Image', url: any } | null } | { __typename: 'PendingItem' }, annotations?: { __typename?: 'SavedItemAnnotations', highlights?: Array<{ __typename?: 'Highlight', id: string, patch: string, quote: string, version: number, _createdAt: any } | null> | null } | null }> } | null, recentSearches?: Array<{ __typename?: 'RecentSearch', term: string, sortId: number, context?: { __typename?: 'RecentSearchContext', key?: string | null, value?: string | null } | null }> | null } | null };

export type SearchSavedItemsCompleteQueryVariables = Exact<{
  term: Scalars['String']['input'];
  pagination?: InputMaybe<OffsetPaginationInput>;
  filter?: InputMaybe<SearchFilterInput>;
  sort?: InputMaybe<SearchSortInput>;
  withAnnotations: Scalars['Boolean']['input'];
  withTagsList: Scalars['Boolean']['input'];
  withAccountData: Scalars['Boolean']['input'];
  withRecentSearches: Scalars['Boolean']['input'];
  tagsListSince?: InputMaybe<Scalars['ISOString']['input']>;
}>;


export type SearchSavedItemsCompleteQuery = { __typename?: 'Query', user?: { __typename?: 'User', tagsList?: Array<string> | null, id: string, username?: string | null, email?: string | null, accountCreationDate?: any | null, name?: string | null, firstName?: string | null, lastName?: string | null, isPremium?: boolean | null, isFxa?: boolean | null, description?: string | null, avatarUrl?: string | null, premiumStatus?: PremiumStatus | null, premiumFeatures?: Array<PremiumFeature | null> | null, searchSavedItemsByOffset?: { __typename?: 'SavedItemSearchResultPage', offset: number, limit: number, totalCount: number, entries: Array<{ __typename?: 'SavedItemSearchResult', savedItem: { __typename?: 'SavedItem', id: string, status?: SavedItemStatus | null, url: string, isFavorite: boolean, isArchived: boolean, _updatedAt?: number | null, _createdAt: number, favoritedAt?: number | null, archivedAt?: number | null, title?: string | null, item: { __typename: 'Item', itemId: string, resolvedId?: string | null, wordCount?: number | null, title?: string | null, timeToRead?: number | null, listenDuration?: number | null, resolvedUrl?: any | null, givenUrl: any, excerpt?: string | null, domain?: string | null, isArticle?: boolean | null, isIndex?: boolean | null, hasVideo?: Videoness | null, hasImage?: Imageness | null, language?: string | null, authors?: Array<{ __typename?: 'Author', id: string, name?: string | null, url?: string | null } | null> | null, domainMetadata?: { __typename?: 'DomainMetadata', logo?: any | null, logoGreyscale?: any | null, name?: string | null } | null, images?: Array<{ __typename?: 'Image', imageId: number, url: any, height?: number | null, width?: number | null, credit?: string | null, caption?: string | null } | null> | null, videos?: Array<{ __typename?: 'Video', videoId: number, src: string, width?: number | null, type: VideoType, vid?: string | null, length?: number | null, height?: number | null } | null> | null, topImage?: { __typename?: 'Image', url: any } | null } | { __typename: 'PendingItem' }, annotations?: { __typename?: 'SavedItemAnnotations', highlights?: Array<{ __typename?: 'Highlight', id: string, patch: string, quote: string, version: number, _createdAt: any } | null> | null } | null, tags?: Array<{ __typename?: 'Tag', name: string }> | null }, searchHighlights?: { __typename?: 'SaveItemSearchHighlights', fullText?: Array<string | null> | null, url?: Array<string | null> | null, tags?: Array<string | null> | null, title?: Array<string | null> | null } | null }> } | null, recentSearches?: Array<{ __typename?: 'RecentSearch', term: string, sortId: number, context?: { __typename?: 'RecentSearchContext', key?: string | null, value?: string | null } | null }> | null } | null };

export type SearchSavedItemsSimpleQueryVariables = Exact<{
  term: Scalars['String']['input'];
  pagination?: InputMaybe<OffsetPaginationInput>;
  filter?: InputMaybe<SearchFilterInput>;
  sort?: InputMaybe<SearchSortInput>;
  withAnnotations: Scalars['Boolean']['input'];
  withTagsList: Scalars['Boolean']['input'];
  withAccountData: Scalars['Boolean']['input'];
  withRecentSearches: Scalars['Boolean']['input'];
  tagsListSince?: InputMaybe<Scalars['ISOString']['input']>;
}>;


export type SearchSavedItemsSimpleQuery = { __typename?: 'Query', user?: { __typename?: 'User', tagsList?: Array<string> | null, id: string, username?: string | null, email?: string | null, accountCreationDate?: any | null, name?: string | null, firstName?: string | null, lastName?: string | null, isPremium?: boolean | null, isFxa?: boolean | null, description?: string | null, avatarUrl?: string | null, premiumStatus?: PremiumStatus | null, premiumFeatures?: Array<PremiumFeature | null> | null, searchSavedItemsByOffset?: { __typename?: 'SavedItemSearchResultPage', offset: number, limit: number, totalCount: number, entries: Array<{ __typename?: 'SavedItemSearchResult', savedItem: { __typename?: 'SavedItem', id: string, status?: SavedItemStatus | null, url: string, isFavorite: boolean, isArchived: boolean, _updatedAt?: number | null, _createdAt: number, favoritedAt?: number | null, archivedAt?: number | null, title?: string | null, tags?: Array<{ __typename?: 'Tag', name: string }> | null, item: { __typename: 'Item', itemId: string, resolvedId?: string | null, wordCount?: number | null, title?: string | null, timeToRead?: number | null, listenDuration?: number | null, resolvedUrl?: any | null, givenUrl: any, excerpt?: string | null, domain?: string | null, isArticle?: boolean | null, isIndex?: boolean | null, hasVideo?: Videoness | null, hasImage?: Imageness | null, language?: string | null, topImage?: { __typename?: 'Image', url: any } | null } | { __typename: 'PendingItem' }, annotations?: { __typename?: 'SavedItemAnnotations', highlights?: Array<{ __typename?: 'Highlight', id: string, patch: string, quote: string, version: number, _createdAt: any } | null> | null } | null }, searchHighlights?: { __typename?: 'SaveItemSearchHighlights', fullText?: Array<string | null> | null, url?: Array<string | null> | null, tags?: Array<string | null> | null, title?: Array<string | null> | null } | null }> } | null, recentSearches?: Array<{ __typename?: 'RecentSearch', term: string, sortId: number, context?: { __typename?: 'RecentSearchContext', key?: string | null, value?: string | null } | null }> | null } | null };

export const AccountFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AccountFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"accountCreationDate"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"isPremium"}},{"kind":"Field","name":{"kind":"Name","value":"isFxa"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"premiumStatus"}},{"kind":"Field","name":{"kind":"Name","value":"premiumFeatures"}}]}}]} as unknown as DocumentNode<AccountFieldsFragment, unknown>;
export const HighlightFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HighlightFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"annotations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"highlights"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"patch"}},{"kind":"Field","name":{"kind":"Name","value":"quote"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"_createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<HighlightFieldsFragment, unknown>;
export const RecentSearchFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RecentSearchFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recentSearches"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"term"}},{"kind":"Field","name":{"kind":"Name","value":"context"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sortId"}}]}}]}}]} as unknown as DocumentNode<RecentSearchFieldsFragment, unknown>;
export const ItemSimpleFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ItemSimple"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"itemId"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedId"}},{"kind":"Field","name":{"kind":"Name","value":"wordCount"}},{"kind":"Field","name":{"kind":"Name","value":"topImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"timeToRead"}},{"kind":"Field","name":{"kind":"Name","value":"listenDuration"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedUrl"}},{"kind":"Field","name":{"kind":"Name","value":"givenUrl"}},{"kind":"Field","name":{"kind":"Name","value":"excerpt"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"isArticle"}},{"kind":"Field","name":{"kind":"Name","value":"isIndex"}},{"kind":"Field","name":{"kind":"Name","value":"hasVideo"}},{"kind":"Field","name":{"kind":"Name","value":"hasImage"}},{"kind":"Field","name":{"kind":"Name","value":"language"}}]}}]} as unknown as DocumentNode<ItemSimpleFragment, unknown>;
export const SavedItemSimpleFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SavedItemSimple"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"isFavorite"}},{"kind":"Field","name":{"kind":"Name","value":"isArchived"}},{"kind":"Field","name":{"kind":"Name","value":"_updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"_createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"favoritedAt"}},{"kind":"Field","name":{"kind":"Name","value":"archivedAt"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"tags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"item"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ItemSimple"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ItemSimple"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"itemId"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedId"}},{"kind":"Field","name":{"kind":"Name","value":"wordCount"}},{"kind":"Field","name":{"kind":"Name","value":"topImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"timeToRead"}},{"kind":"Field","name":{"kind":"Name","value":"listenDuration"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedUrl"}},{"kind":"Field","name":{"kind":"Name","value":"givenUrl"}},{"kind":"Field","name":{"kind":"Name","value":"excerpt"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"isArticle"}},{"kind":"Field","name":{"kind":"Name","value":"isIndex"}},{"kind":"Field","name":{"kind":"Name","value":"hasVideo"}},{"kind":"Field","name":{"kind":"Name","value":"hasImage"}},{"kind":"Field","name":{"kind":"Name","value":"language"}}]}}]} as unknown as DocumentNode<SavedItemSimpleFragment, unknown>;
export const ItemCompleteFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ItemComplete"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ItemSimple"}},{"kind":"Field","name":{"kind":"Name","value":"authors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"domainMetadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"logoGreyscale"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"images"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"imageId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"credit"}},{"kind":"Field","name":{"kind":"Name","value":"caption"}}]}},{"kind":"Field","name":{"kind":"Name","value":"videos"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"videoId"}},{"kind":"Field","name":{"kind":"Name","value":"src"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"vid"}},{"kind":"Field","name":{"kind":"Name","value":"length"}},{"kind":"Field","name":{"kind":"Name","value":"height"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ItemSimple"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"itemId"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedId"}},{"kind":"Field","name":{"kind":"Name","value":"wordCount"}},{"kind":"Field","name":{"kind":"Name","value":"topImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"timeToRead"}},{"kind":"Field","name":{"kind":"Name","value":"listenDuration"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedUrl"}},{"kind":"Field","name":{"kind":"Name","value":"givenUrl"}},{"kind":"Field","name":{"kind":"Name","value":"excerpt"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"isArticle"}},{"kind":"Field","name":{"kind":"Name","value":"isIndex"}},{"kind":"Field","name":{"kind":"Name","value":"hasVideo"}},{"kind":"Field","name":{"kind":"Name","value":"hasImage"}},{"kind":"Field","name":{"kind":"Name","value":"language"}}]}}]} as unknown as DocumentNode<ItemCompleteFragment, unknown>;
export const SavedItemCompleteFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SavedItemComplete"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SavedItemSimple"}},{"kind":"Field","name":{"kind":"Name","value":"item"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ItemComplete"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ItemSimple"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"itemId"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedId"}},{"kind":"Field","name":{"kind":"Name","value":"wordCount"}},{"kind":"Field","name":{"kind":"Name","value":"topImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"timeToRead"}},{"kind":"Field","name":{"kind":"Name","value":"listenDuration"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedUrl"}},{"kind":"Field","name":{"kind":"Name","value":"givenUrl"}},{"kind":"Field","name":{"kind":"Name","value":"excerpt"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"isArticle"}},{"kind":"Field","name":{"kind":"Name","value":"isIndex"}},{"kind":"Field","name":{"kind":"Name","value":"hasVideo"}},{"kind":"Field","name":{"kind":"Name","value":"hasImage"}},{"kind":"Field","name":{"kind":"Name","value":"language"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SavedItemSimple"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"isFavorite"}},{"kind":"Field","name":{"kind":"Name","value":"isArchived"}},{"kind":"Field","name":{"kind":"Name","value":"_updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"_createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"favoritedAt"}},{"kind":"Field","name":{"kind":"Name","value":"archivedAt"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"tags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"item"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ItemSimple"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ItemComplete"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ItemSimple"}},{"kind":"Field","name":{"kind":"Name","value":"authors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"domainMetadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"logoGreyscale"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"images"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"imageId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"credit"}},{"kind":"Field","name":{"kind":"Name","value":"caption"}}]}},{"kind":"Field","name":{"kind":"Name","value":"videos"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"videoId"}},{"kind":"Field","name":{"kind":"Name","value":"src"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"vid"}},{"kind":"Field","name":{"kind":"Name","value":"length"}},{"kind":"Field","name":{"kind":"Name","value":"height"}}]}}]}}]} as unknown as DocumentNode<SavedItemCompleteFragment, unknown>;
export const ItemParserMetadataFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ItemParserMetadata"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"normalUrl"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedUrl"}},{"kind":"Field","name":{"kind":"Name","value":"domainId"}},{"kind":"Field","name":{"kind":"Name","value":"originDomainId"}},{"kind":"Field","name":{"kind":"Name","value":"responseCode"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"contentLength"}},{"kind":"Field","name":{"kind":"Name","value":"encoding"}},{"kind":"Field","name":{"kind":"Name","value":"dateResolved"}},{"kind":"Field","name":{"kind":"Name","value":"datePublished"}},{"kind":"Field","name":{"kind":"Name","value":"innerDomainRedirect"}},{"kind":"Field","name":{"kind":"Name","value":"loginRequired"}},{"kind":"Field","name":{"kind":"Name","value":"timeFirstParsed"}},{"kind":"Field","name":{"kind":"Name","value":"topImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedNormalUrl"}},{"kind":"Field","name":{"kind":"Name","value":"usedFallback"}}]}}]} as unknown as DocumentNode<ItemParserMetadataFragment, unknown>;
export const SavedItemWithParserMetadataFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SavedItemWithParserMetadata"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SavedItemSimple"}},{"kind":"Field","name":{"kind":"Name","value":"item"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ItemComplete"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ItemParserMetadata"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PendingItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ItemSimple"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"itemId"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedId"}},{"kind":"Field","name":{"kind":"Name","value":"wordCount"}},{"kind":"Field","name":{"kind":"Name","value":"topImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"timeToRead"}},{"kind":"Field","name":{"kind":"Name","value":"listenDuration"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedUrl"}},{"kind":"Field","name":{"kind":"Name","value":"givenUrl"}},{"kind":"Field","name":{"kind":"Name","value":"excerpt"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"isArticle"}},{"kind":"Field","name":{"kind":"Name","value":"isIndex"}},{"kind":"Field","name":{"kind":"Name","value":"hasVideo"}},{"kind":"Field","name":{"kind":"Name","value":"hasImage"}},{"kind":"Field","name":{"kind":"Name","value":"language"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SavedItemSimple"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"isFavorite"}},{"kind":"Field","name":{"kind":"Name","value":"isArchived"}},{"kind":"Field","name":{"kind":"Name","value":"_updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"_createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"favoritedAt"}},{"kind":"Field","name":{"kind":"Name","value":"archivedAt"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"tags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"item"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ItemSimple"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ItemComplete"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ItemSimple"}},{"kind":"Field","name":{"kind":"Name","value":"authors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"domainMetadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"logoGreyscale"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"images"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"imageId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"credit"}},{"kind":"Field","name":{"kind":"Name","value":"caption"}}]}},{"kind":"Field","name":{"kind":"Name","value":"videos"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"videoId"}},{"kind":"Field","name":{"kind":"Name","value":"src"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"vid"}},{"kind":"Field","name":{"kind":"Name","value":"length"}},{"kind":"Field","name":{"kind":"Name","value":"height"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ItemParserMetadata"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"normalUrl"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedUrl"}},{"kind":"Field","name":{"kind":"Name","value":"domainId"}},{"kind":"Field","name":{"kind":"Name","value":"originDomainId"}},{"kind":"Field","name":{"kind":"Name","value":"responseCode"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"contentLength"}},{"kind":"Field","name":{"kind":"Name","value":"encoding"}},{"kind":"Field","name":{"kind":"Name","value":"dateResolved"}},{"kind":"Field","name":{"kind":"Name","value":"datePublished"}},{"kind":"Field","name":{"kind":"Name","value":"innerDomainRedirect"}},{"kind":"Field","name":{"kind":"Name","value":"loginRequired"}},{"kind":"Field","name":{"kind":"Name","value":"timeFirstParsed"}},{"kind":"Field","name":{"kind":"Name","value":"topImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedNormalUrl"}},{"kind":"Field","name":{"kind":"Name","value":"usedFallback"}}]}}]} as unknown as DocumentNode<SavedItemWithParserMetadataFragment, unknown>;
export const SearchResultHighlightsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SearchResultHighlights"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItemSearchResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"searchHighlights"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fullText"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}}]} as unknown as DocumentNode<SearchResultHighlightsFragment, unknown>;
export const AddAnnotationByUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddAnnotationByUrl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateHighlightByUrlInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createHighlightByUrl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<AddAnnotationByUrlMutation, AddAnnotationByUrlMutationVariables>;
export const AddAnnotationByItemIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddAnnotationByItemId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateHighlightInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSavedItemHighlights"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<AddAnnotationByItemIdMutation, AddAnnotationByItemIdMutationVariables>;
export const AddSavedItemCompleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"addSavedItemComplete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItemUpsertInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertSavedItem"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SavedItemWithParserMetadata"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ItemSimple"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"itemId"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedId"}},{"kind":"Field","name":{"kind":"Name","value":"wordCount"}},{"kind":"Field","name":{"kind":"Name","value":"topImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"timeToRead"}},{"kind":"Field","name":{"kind":"Name","value":"listenDuration"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedUrl"}},{"kind":"Field","name":{"kind":"Name","value":"givenUrl"}},{"kind":"Field","name":{"kind":"Name","value":"excerpt"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"isArticle"}},{"kind":"Field","name":{"kind":"Name","value":"isIndex"}},{"kind":"Field","name":{"kind":"Name","value":"hasVideo"}},{"kind":"Field","name":{"kind":"Name","value":"hasImage"}},{"kind":"Field","name":{"kind":"Name","value":"language"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SavedItemSimple"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"isFavorite"}},{"kind":"Field","name":{"kind":"Name","value":"isArchived"}},{"kind":"Field","name":{"kind":"Name","value":"_updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"_createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"favoritedAt"}},{"kind":"Field","name":{"kind":"Name","value":"archivedAt"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"tags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"item"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ItemSimple"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ItemComplete"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ItemSimple"}},{"kind":"Field","name":{"kind":"Name","value":"authors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"domainMetadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"logoGreyscale"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"images"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"imageId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"credit"}},{"kind":"Field","name":{"kind":"Name","value":"caption"}}]}},{"kind":"Field","name":{"kind":"Name","value":"videos"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"videoId"}},{"kind":"Field","name":{"kind":"Name","value":"src"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"vid"}},{"kind":"Field","name":{"kind":"Name","value":"length"}},{"kind":"Field","name":{"kind":"Name","value":"height"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ItemParserMetadata"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"normalUrl"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedUrl"}},{"kind":"Field","name":{"kind":"Name","value":"domainId"}},{"kind":"Field","name":{"kind":"Name","value":"originDomainId"}},{"kind":"Field","name":{"kind":"Name","value":"responseCode"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"contentLength"}},{"kind":"Field","name":{"kind":"Name","value":"encoding"}},{"kind":"Field","name":{"kind":"Name","value":"dateResolved"}},{"kind":"Field","name":{"kind":"Name","value":"datePublished"}},{"kind":"Field","name":{"kind":"Name","value":"innerDomainRedirect"}},{"kind":"Field","name":{"kind":"Name","value":"loginRequired"}},{"kind":"Field","name":{"kind":"Name","value":"timeFirstParsed"}},{"kind":"Field","name":{"kind":"Name","value":"topImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedNormalUrl"}},{"kind":"Field","name":{"kind":"Name","value":"usedFallback"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SavedItemWithParserMetadata"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SavedItemSimple"}},{"kind":"Field","name":{"kind":"Name","value":"item"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ItemComplete"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ItemParserMetadata"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PendingItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}}]}}]}}]}}]} as unknown as DocumentNode<AddSavedItemCompleteMutation, AddSavedItemCompleteMutationVariables>;
export const AddSavedItemBeforeTagDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"addSavedItemBeforeTag"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItemUpsertInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertSavedItem"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<AddSavedItemBeforeTagMutation, AddSavedItemBeforeTagMutationVariables>;
export const AddTagsToSavedItemDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"addTagsToSavedItem"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tags"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItemTagsInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSavedItemTags"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tags"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SavedItemWithParserMetadata"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ItemSimple"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"itemId"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedId"}},{"kind":"Field","name":{"kind":"Name","value":"wordCount"}},{"kind":"Field","name":{"kind":"Name","value":"topImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"timeToRead"}},{"kind":"Field","name":{"kind":"Name","value":"listenDuration"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedUrl"}},{"kind":"Field","name":{"kind":"Name","value":"givenUrl"}},{"kind":"Field","name":{"kind":"Name","value":"excerpt"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"isArticle"}},{"kind":"Field","name":{"kind":"Name","value":"isIndex"}},{"kind":"Field","name":{"kind":"Name","value":"hasVideo"}},{"kind":"Field","name":{"kind":"Name","value":"hasImage"}},{"kind":"Field","name":{"kind":"Name","value":"language"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SavedItemSimple"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"isFavorite"}},{"kind":"Field","name":{"kind":"Name","value":"isArchived"}},{"kind":"Field","name":{"kind":"Name","value":"_updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"_createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"favoritedAt"}},{"kind":"Field","name":{"kind":"Name","value":"archivedAt"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"tags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"item"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ItemSimple"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ItemComplete"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ItemSimple"}},{"kind":"Field","name":{"kind":"Name","value":"authors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"domainMetadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"logoGreyscale"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"images"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"imageId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"credit"}},{"kind":"Field","name":{"kind":"Name","value":"caption"}}]}},{"kind":"Field","name":{"kind":"Name","value":"videos"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"videoId"}},{"kind":"Field","name":{"kind":"Name","value":"src"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"vid"}},{"kind":"Field","name":{"kind":"Name","value":"length"}},{"kind":"Field","name":{"kind":"Name","value":"height"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ItemParserMetadata"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"normalUrl"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedUrl"}},{"kind":"Field","name":{"kind":"Name","value":"domainId"}},{"kind":"Field","name":{"kind":"Name","value":"originDomainId"}},{"kind":"Field","name":{"kind":"Name","value":"responseCode"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"contentLength"}},{"kind":"Field","name":{"kind":"Name","value":"encoding"}},{"kind":"Field","name":{"kind":"Name","value":"dateResolved"}},{"kind":"Field","name":{"kind":"Name","value":"datePublished"}},{"kind":"Field","name":{"kind":"Name","value":"innerDomainRedirect"}},{"kind":"Field","name":{"kind":"Name","value":"loginRequired"}},{"kind":"Field","name":{"kind":"Name","value":"timeFirstParsed"}},{"kind":"Field","name":{"kind":"Name","value":"topImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedNormalUrl"}},{"kind":"Field","name":{"kind":"Name","value":"usedFallback"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SavedItemWithParserMetadata"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SavedItemSimple"}},{"kind":"Field","name":{"kind":"Name","value":"item"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ItemComplete"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ItemParserMetadata"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PendingItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}}]}}]}}]}}]} as unknown as DocumentNode<AddTagsToSavedItemMutation, AddTagsToSavedItemMutationVariables>;
export const AddTagsByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddTagsById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItemTagsInput"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"timestamp"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ISOString"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSavedItemTags"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}},{"kind":"Argument","name":{"kind":"Name","value":"timestamp"},"value":{"kind":"Variable","name":{"kind":"Name","value":"timestamp"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<AddTagsByIdMutation, AddTagsByIdMutationVariables>;
export const AddTagsByUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddTagsByUrl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItemTagInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"timestamp"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ISOString"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"savedItemTag"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}},{"kind":"Argument","name":{"kind":"Name","value":"timestamp"},"value":{"kind":"Variable","name":{"kind":"Name","value":"timestamp"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}}]} as unknown as DocumentNode<AddTagsByUrlMutation, AddTagsByUrlMutationVariables>;
export const ArchiveSavedItemByUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ArchiveSavedItemByUrl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"givenUrl"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Url"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"timestamp"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ISOString"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"savedItemArchive"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"givenUrl"},"value":{"kind":"Variable","name":{"kind":"Name","value":"givenUrl"}}},{"kind":"Argument","name":{"kind":"Name","value":"timestamp"},"value":{"kind":"Variable","name":{"kind":"Name","value":"timestamp"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}}]} as unknown as DocumentNode<ArchiveSavedItemByUrlMutation, ArchiveSavedItemByUrlMutationVariables>;
export const ArchiveSavedItemByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ArchiveSavedItemById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updateSavedItemArchiveId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"timestamp"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ISOString"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSavedItemArchive"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updateSavedItemArchiveId"}}},{"kind":"Argument","name":{"kind":"Name","value":"timestamp"},"value":{"kind":"Variable","name":{"kind":"Name","value":"timestamp"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<ArchiveSavedItemByIdMutation, ArchiveSavedItemByIdMutationVariables>;
export const ClearTagsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ClearTags"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"savedItem"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItemRef"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"timestamp"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ISOString"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clearTags"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"savedItem"},"value":{"kind":"Variable","name":{"kind":"Name","value":"savedItem"}}},{"kind":"Argument","name":{"kind":"Name","value":"timestamp"},"value":{"kind":"Variable","name":{"kind":"Name","value":"timestamp"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<ClearTagsMutation, ClearTagsMutationVariables>;
export const DeleteAnnotationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteAnnotation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteSavedItemHighlight"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteAnnotationMutation, DeleteAnnotationMutationVariables>;
export const DeleteSavedItemByUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteSavedItemByUrl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"givenUrl"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Url"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"timestamp"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ISOString"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"savedItemDelete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"givenUrl"},"value":{"kind":"Variable","name":{"kind":"Name","value":"givenUrl"}}},{"kind":"Argument","name":{"kind":"Name","value":"timestamp"},"value":{"kind":"Variable","name":{"kind":"Name","value":"timestamp"}}}]}]}}]} as unknown as DocumentNode<DeleteSavedItemByUrlMutation, DeleteSavedItemByUrlMutationVariables>;
export const DeleteSavedItemByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteSavedItemById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"timestamp"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ISOString"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteSavedItem"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"timestamp"},"value":{"kind":"Variable","name":{"kind":"Name","value":"timestamp"}}}]}]}}]} as unknown as DocumentNode<DeleteSavedItemByIdMutation, DeleteSavedItemByIdMutationVariables>;
export const DeleteTagDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteTag"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tagName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"timestamp"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ISOString"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteTagByName"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"tagName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tagName"}}},{"kind":"Argument","name":{"kind":"Name","value":"timestamp"},"value":{"kind":"Variable","name":{"kind":"Name","value":"timestamp"}}}]}]}}]} as unknown as DocumentNode<DeleteTagMutation, DeleteTagMutationVariables>;
export const FavoriteSavedItemByUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"FavoriteSavedItemByUrl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"givenUrl"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Url"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"timestamp"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ISOString"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"savedItemFavorite"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"givenUrl"},"value":{"kind":"Variable","name":{"kind":"Name","value":"givenUrl"}}},{"kind":"Argument","name":{"kind":"Name","value":"timestamp"},"value":{"kind":"Variable","name":{"kind":"Name","value":"timestamp"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}}]} as unknown as DocumentNode<FavoriteSavedItemByUrlMutation, FavoriteSavedItemByUrlMutationVariables>;
export const FavoriteSavedItemByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"FavoriteSavedItemById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updateSavedItemFavoriteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"timestamp"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ISOString"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSavedItemFavorite"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updateSavedItemFavoriteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"timestamp"},"value":{"kind":"Variable","name":{"kind":"Name","value":"timestamp"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<FavoriteSavedItemByIdMutation, FavoriteSavedItemByIdMutationVariables>;
export const ReAddByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReAddById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"timestamp"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ISOString"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reAddById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"timestamp"},"value":{"kind":"Variable","name":{"kind":"Name","value":"timestamp"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SavedItemWithParserMetadata"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ItemSimple"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"itemId"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedId"}},{"kind":"Field","name":{"kind":"Name","value":"wordCount"}},{"kind":"Field","name":{"kind":"Name","value":"topImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"timeToRead"}},{"kind":"Field","name":{"kind":"Name","value":"listenDuration"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedUrl"}},{"kind":"Field","name":{"kind":"Name","value":"givenUrl"}},{"kind":"Field","name":{"kind":"Name","value":"excerpt"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"isArticle"}},{"kind":"Field","name":{"kind":"Name","value":"isIndex"}},{"kind":"Field","name":{"kind":"Name","value":"hasVideo"}},{"kind":"Field","name":{"kind":"Name","value":"hasImage"}},{"kind":"Field","name":{"kind":"Name","value":"language"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SavedItemSimple"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"isFavorite"}},{"kind":"Field","name":{"kind":"Name","value":"isArchived"}},{"kind":"Field","name":{"kind":"Name","value":"_updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"_createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"favoritedAt"}},{"kind":"Field","name":{"kind":"Name","value":"archivedAt"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"tags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"item"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ItemSimple"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ItemComplete"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ItemSimple"}},{"kind":"Field","name":{"kind":"Name","value":"authors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"domainMetadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"logoGreyscale"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"images"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"imageId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"credit"}},{"kind":"Field","name":{"kind":"Name","value":"caption"}}]}},{"kind":"Field","name":{"kind":"Name","value":"videos"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"videoId"}},{"kind":"Field","name":{"kind":"Name","value":"src"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"vid"}},{"kind":"Field","name":{"kind":"Name","value":"length"}},{"kind":"Field","name":{"kind":"Name","value":"height"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ItemParserMetadata"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"normalUrl"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedUrl"}},{"kind":"Field","name":{"kind":"Name","value":"domainId"}},{"kind":"Field","name":{"kind":"Name","value":"originDomainId"}},{"kind":"Field","name":{"kind":"Name","value":"responseCode"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"contentLength"}},{"kind":"Field","name":{"kind":"Name","value":"encoding"}},{"kind":"Field","name":{"kind":"Name","value":"dateResolved"}},{"kind":"Field","name":{"kind":"Name","value":"datePublished"}},{"kind":"Field","name":{"kind":"Name","value":"innerDomainRedirect"}},{"kind":"Field","name":{"kind":"Name","value":"loginRequired"}},{"kind":"Field","name":{"kind":"Name","value":"timeFirstParsed"}},{"kind":"Field","name":{"kind":"Name","value":"topImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"resolvedNormalUrl"}},{"kind":"Field","name":{"kind":"Name","value":"usedFallback"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SavedItemWithParserMetadata"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SavedItemSimple"}},{"kind":"Field","name":{"kind":"Name","value":"item"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ItemComplete"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"ItemParserMetadata"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PendingItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}}]}}]}}]}}]} as unknown as DocumentNode<ReAddByIdMutation, ReAddByIdMutationVariables>;
export const RemoveTagsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveTags"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"savedItem"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItemRef"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tagNames"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"timestamp"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ISOString"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeTagsByName"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"savedItem"},"value":{"kind":"Variable","name":{"kind":"Name","value":"savedItem"}}},{"kind":"Argument","name":{"kind":"Name","value":"tagNames"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tagNames"}}},{"kind":"Argument","name":{"kind":"Name","value":"timestamp"},"value":{"kind":"Variable","name":{"kind":"Name","value":"timestamp"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<RemoveTagsMutation, RemoveTagsMutationVariables>;
export const RenameTagDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RenameTag"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"oldName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"newName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"timestamp"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ISOString"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"renameTagByName"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"oldName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"oldName"}}},{"kind":"Argument","name":{"kind":"Name","value":"newName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"newName"}}},{"kind":"Argument","name":{"kind":"Name","value":"timestamp"},"value":{"kind":"Variable","name":{"kind":"Name","value":"timestamp"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<RenameTagMutation, RenameTagMutationVariables>;
export const ReplaceTagsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReplaceTags"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"savedItem"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItemRef"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tagNames"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"timestamp"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ISOString"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"replaceTags"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"savedItem"},"value":{"kind":"Variable","name":{"kind":"Name","value":"savedItem"}}},{"kind":"Argument","name":{"kind":"Name","value":"tagNames"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tagNames"}}},{"kind":"Argument","name":{"kind":"Name","value":"timestamp"},"value":{"kind":"Variable","name":{"kind":"Name","value":"timestamp"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<ReplaceTagsMutation, ReplaceTagsMutationVariables>;
export const SaveSearchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SaveSearch"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RecentSearchInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"saveSearch"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"term"}}]}}]}}]} as unknown as DocumentNode<SaveSearchMutation, SaveSearchMutationVariables>;
export const UnFavoriteSavedItemByUrlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UnFavoriteSavedItemByUrl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"givenUrl"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Url"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"timestamp"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ISOString"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"savedItemUnFavorite"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"givenUrl"},"value":{"kind":"Variable","name":{"kind":"Name","value":"givenUrl"}}},{"kind":"Argument","name":{"kind":"Name","value":"timestamp"},"value":{"kind":"Variable","name":{"kind":"Name","value":"timestamp"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}}]}}]} as unknown as DocumentNode<UnFavoriteSavedItemByUrlMutation, UnFavoriteSavedItemByUrlMutationVariables>;
export const UnFavoriteSavedItemByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UnFavoriteSavedItemById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updateSavedItemUnFavoriteId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"timestamp"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ISOString"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSavedItemUnFavorite"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updateSavedItemUnFavoriteId"}}},{"kind":"Argument","name":{"kind":"Name","value":"timestamp"},"value":{"kind":"Variable","name":{"kind":"Name","value":"timestamp"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UnFavoriteSavedItemByIdMutation, UnFavoriteSavedItemByIdMutationVariables>;
export const SavedItemsCompleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"savedItemsComplete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OffsetPaginationInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItemsFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sort"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItemsSort"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"withAnnotations"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"withTagsList"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"withAccountData"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"withRecentSearches"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tagsListSince"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ISOString"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AccountFields"},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"include"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"if"},"value":{"kind":"Variable","name":{"kind":"Name","value":"withAccountData"}}}]}]},{"kind":"FragmentSpread","name":{"kind":"Name","value":"RecentSearchFields"},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"include"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"if"},"value":{"kind":"Variable","name":{"kind":"Name","value":"withRecentSearches"}}}]}]},{"kind":"Field","name":{"kind":"Name","value":"tagsList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"syncSince"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tagsListSince"}}}],"directives":[{"kind":"Directive","name":{"kind":"Name","value":"include"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"if"},"value":{"kind":"Variable","name":{"kind":"Name","value":"withTagsList"}}}]}]},{"kind":"Field","name":{"kind":"Name","value":"savedItemsByOffset"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"sort"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sort"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"entries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SavedItemComplete"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"HighlightFields"},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"include"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"if"},"value":{"kind":"Variable","name":{"kind":"Name","value":"withAnnotations"}}}]}]}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ItemSimple"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"itemId"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedId"}},{"kind":"Field","name":{"kind":"Name","value":"wordCount"}},{"kind":"Field","name":{"kind":"Name","value":"topImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"timeToRead"}},{"kind":"Field","name":{"kind":"Name","value":"listenDuration"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedUrl"}},{"kind":"Field","name":{"kind":"Name","value":"givenUrl"}},{"kind":"Field","name":{"kind":"Name","value":"excerpt"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"isArticle"}},{"kind":"Field","name":{"kind":"Name","value":"isIndex"}},{"kind":"Field","name":{"kind":"Name","value":"hasVideo"}},{"kind":"Field","name":{"kind":"Name","value":"hasImage"}},{"kind":"Field","name":{"kind":"Name","value":"language"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SavedItemSimple"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"isFavorite"}},{"kind":"Field","name":{"kind":"Name","value":"isArchived"}},{"kind":"Field","name":{"kind":"Name","value":"_updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"_createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"favoritedAt"}},{"kind":"Field","name":{"kind":"Name","value":"archivedAt"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"tags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"item"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ItemSimple"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ItemComplete"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ItemSimple"}},{"kind":"Field","name":{"kind":"Name","value":"authors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"domainMetadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"logoGreyscale"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"images"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"imageId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"credit"}},{"kind":"Field","name":{"kind":"Name","value":"caption"}}]}},{"kind":"Field","name":{"kind":"Name","value":"videos"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"videoId"}},{"kind":"Field","name":{"kind":"Name","value":"src"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"vid"}},{"kind":"Field","name":{"kind":"Name","value":"length"}},{"kind":"Field","name":{"kind":"Name","value":"height"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AccountFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"accountCreationDate"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"isPremium"}},{"kind":"Field","name":{"kind":"Name","value":"isFxa"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"premiumStatus"}},{"kind":"Field","name":{"kind":"Name","value":"premiumFeatures"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RecentSearchFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recentSearches"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"term"}},{"kind":"Field","name":{"kind":"Name","value":"context"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sortId"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SavedItemComplete"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SavedItemSimple"}},{"kind":"Field","name":{"kind":"Name","value":"item"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ItemComplete"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HighlightFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"annotations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"highlights"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"patch"}},{"kind":"Field","name":{"kind":"Name","value":"quote"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"_createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<SavedItemsCompleteQuery, SavedItemsCompleteQueryVariables>;
export const SavedItemsSimpleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"savedItemsSimple"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OffsetPaginationInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItemsFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sort"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItemsSort"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"withAnnotations"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"withTagsList"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"withAccountData"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"withRecentSearches"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tagsListSince"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ISOString"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AccountFields"},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"include"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"if"},"value":{"kind":"Variable","name":{"kind":"Name","value":"withAccountData"}}}]}]},{"kind":"FragmentSpread","name":{"kind":"Name","value":"RecentSearchFields"},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"include"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"if"},"value":{"kind":"Variable","name":{"kind":"Name","value":"withRecentSearches"}}}]}]},{"kind":"Field","name":{"kind":"Name","value":"tagsList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"syncSince"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tagsListSince"}}}],"directives":[{"kind":"Directive","name":{"kind":"Name","value":"include"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"if"},"value":{"kind":"Variable","name":{"kind":"Name","value":"withTagsList"}}}]}]},{"kind":"Field","name":{"kind":"Name","value":"savedItemsByOffset"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"sort"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sort"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"entries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SavedItemSimple"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"HighlightFields"},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"include"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"if"},"value":{"kind":"Variable","name":{"kind":"Name","value":"withAnnotations"}}}]}]}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ItemSimple"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"itemId"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedId"}},{"kind":"Field","name":{"kind":"Name","value":"wordCount"}},{"kind":"Field","name":{"kind":"Name","value":"topImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"timeToRead"}},{"kind":"Field","name":{"kind":"Name","value":"listenDuration"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedUrl"}},{"kind":"Field","name":{"kind":"Name","value":"givenUrl"}},{"kind":"Field","name":{"kind":"Name","value":"excerpt"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"isArticle"}},{"kind":"Field","name":{"kind":"Name","value":"isIndex"}},{"kind":"Field","name":{"kind":"Name","value":"hasVideo"}},{"kind":"Field","name":{"kind":"Name","value":"hasImage"}},{"kind":"Field","name":{"kind":"Name","value":"language"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AccountFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"accountCreationDate"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"isPremium"}},{"kind":"Field","name":{"kind":"Name","value":"isFxa"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"premiumStatus"}},{"kind":"Field","name":{"kind":"Name","value":"premiumFeatures"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RecentSearchFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recentSearches"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"term"}},{"kind":"Field","name":{"kind":"Name","value":"context"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sortId"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SavedItemSimple"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"isFavorite"}},{"kind":"Field","name":{"kind":"Name","value":"isArchived"}},{"kind":"Field","name":{"kind":"Name","value":"_updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"_createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"favoritedAt"}},{"kind":"Field","name":{"kind":"Name","value":"archivedAt"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"tags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"item"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ItemSimple"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HighlightFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"annotations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"highlights"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"patch"}},{"kind":"Field","name":{"kind":"Name","value":"quote"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"_createdAt"}}]}}]}}]}}]} as unknown as DocumentNode<SavedItemsSimpleQuery, SavedItemsSimpleQueryVariables>;
export const SearchSavedItemsCompleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"searchSavedItemsComplete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"term"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OffsetPaginationInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"SearchFilterInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sort"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"SearchSortInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"withAnnotations"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"withTagsList"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"withAccountData"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"withRecentSearches"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tagsListSince"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ISOString"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AccountFields"},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"include"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"if"},"value":{"kind":"Variable","name":{"kind":"Name","value":"withAccountData"}}}]}]},{"kind":"FragmentSpread","name":{"kind":"Name","value":"RecentSearchFields"},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"include"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"if"},"value":{"kind":"Variable","name":{"kind":"Name","value":"withRecentSearches"}}}]}]},{"kind":"Field","name":{"kind":"Name","value":"tagsList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"syncSince"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tagsListSince"}}}],"directives":[{"kind":"Directive","name":{"kind":"Name","value":"include"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"if"},"value":{"kind":"Variable","name":{"kind":"Name","value":"withTagsList"}}}]}]},{"kind":"Field","name":{"kind":"Name","value":"searchSavedItemsByOffset"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"term"},"value":{"kind":"Variable","name":{"kind":"Name","value":"term"}}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"sort"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sort"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"entries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"savedItem"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SavedItemComplete"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"HighlightFields"},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"include"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"if"},"value":{"kind":"Variable","name":{"kind":"Name","value":"withAnnotations"}}}]}]}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"SearchResultHighlights"}}]}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ItemSimple"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"itemId"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedId"}},{"kind":"Field","name":{"kind":"Name","value":"wordCount"}},{"kind":"Field","name":{"kind":"Name","value":"topImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"timeToRead"}},{"kind":"Field","name":{"kind":"Name","value":"listenDuration"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedUrl"}},{"kind":"Field","name":{"kind":"Name","value":"givenUrl"}},{"kind":"Field","name":{"kind":"Name","value":"excerpt"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"isArticle"}},{"kind":"Field","name":{"kind":"Name","value":"isIndex"}},{"kind":"Field","name":{"kind":"Name","value":"hasVideo"}},{"kind":"Field","name":{"kind":"Name","value":"hasImage"}},{"kind":"Field","name":{"kind":"Name","value":"language"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SavedItemSimple"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"isFavorite"}},{"kind":"Field","name":{"kind":"Name","value":"isArchived"}},{"kind":"Field","name":{"kind":"Name","value":"_updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"_createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"favoritedAt"}},{"kind":"Field","name":{"kind":"Name","value":"archivedAt"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"tags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"item"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ItemSimple"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ItemComplete"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ItemSimple"}},{"kind":"Field","name":{"kind":"Name","value":"authors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"domainMetadata"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"logo"}},{"kind":"Field","name":{"kind":"Name","value":"logoGreyscale"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"images"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"imageId"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"credit"}},{"kind":"Field","name":{"kind":"Name","value":"caption"}}]}},{"kind":"Field","name":{"kind":"Name","value":"videos"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"videoId"}},{"kind":"Field","name":{"kind":"Name","value":"src"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"vid"}},{"kind":"Field","name":{"kind":"Name","value":"length"}},{"kind":"Field","name":{"kind":"Name","value":"height"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AccountFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"accountCreationDate"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"isPremium"}},{"kind":"Field","name":{"kind":"Name","value":"isFxa"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"premiumStatus"}},{"kind":"Field","name":{"kind":"Name","value":"premiumFeatures"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RecentSearchFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recentSearches"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"term"}},{"kind":"Field","name":{"kind":"Name","value":"context"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sortId"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SavedItemComplete"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SavedItemSimple"}},{"kind":"Field","name":{"kind":"Name","value":"item"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ItemComplete"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HighlightFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"annotations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"highlights"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"patch"}},{"kind":"Field","name":{"kind":"Name","value":"quote"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"_createdAt"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SearchResultHighlights"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItemSearchResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"searchHighlights"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fullText"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}}]} as unknown as DocumentNode<SearchSavedItemsCompleteQuery, SearchSavedItemsCompleteQueryVariables>;
export const SearchSavedItemsSimpleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"searchSavedItemsSimple"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"term"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OffsetPaginationInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"SearchFilterInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sort"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"SearchSortInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"withAnnotations"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"withTagsList"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"withAccountData"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"withRecentSearches"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"tagsListSince"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ISOString"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AccountFields"},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"include"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"if"},"value":{"kind":"Variable","name":{"kind":"Name","value":"withAccountData"}}}]}]},{"kind":"FragmentSpread","name":{"kind":"Name","value":"RecentSearchFields"},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"include"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"if"},"value":{"kind":"Variable","name":{"kind":"Name","value":"withRecentSearches"}}}]}]},{"kind":"Field","name":{"kind":"Name","value":"tagsList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"syncSince"},"value":{"kind":"Variable","name":{"kind":"Name","value":"tagsListSince"}}}],"directives":[{"kind":"Directive","name":{"kind":"Name","value":"include"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"if"},"value":{"kind":"Variable","name":{"kind":"Name","value":"withTagsList"}}}]}]},{"kind":"Field","name":{"kind":"Name","value":"searchSavedItemsByOffset"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"term"},"value":{"kind":"Variable","name":{"kind":"Name","value":"term"}}},{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"sort"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sort"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"entries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"savedItem"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SavedItemSimple"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"HighlightFields"},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"include"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"if"},"value":{"kind":"Variable","name":{"kind":"Name","value":"withAnnotations"}}}]}]}]}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"SearchResultHighlights"}}]}},{"kind":"Field","name":{"kind":"Name","value":"offset"}},{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ItemSimple"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"Field","name":{"kind":"Name","value":"itemId"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedId"}},{"kind":"Field","name":{"kind":"Name","value":"wordCount"}},{"kind":"Field","name":{"kind":"Name","value":"topImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"timeToRead"}},{"kind":"Field","name":{"kind":"Name","value":"listenDuration"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedUrl"}},{"kind":"Field","name":{"kind":"Name","value":"givenUrl"}},{"kind":"Field","name":{"kind":"Name","value":"excerpt"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"isArticle"}},{"kind":"Field","name":{"kind":"Name","value":"isIndex"}},{"kind":"Field","name":{"kind":"Name","value":"hasVideo"}},{"kind":"Field","name":{"kind":"Name","value":"hasImage"}},{"kind":"Field","name":{"kind":"Name","value":"language"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AccountFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"accountCreationDate"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"isPremium"}},{"kind":"Field","name":{"kind":"Name","value":"isFxa"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"premiumStatus"}},{"kind":"Field","name":{"kind":"Name","value":"premiumFeatures"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RecentSearchFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recentSearches"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"term"}},{"kind":"Field","name":{"kind":"Name","value":"context"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sortId"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SavedItemSimple"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"isFavorite"}},{"kind":"Field","name":{"kind":"Name","value":"isArchived"}},{"kind":"Field","name":{"kind":"Name","value":"_updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"_createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"favoritedAt"}},{"kind":"Field","name":{"kind":"Name","value":"archivedAt"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"tags"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"item"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ItemSimple"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HighlightFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItem"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"annotations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"highlights"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"patch"}},{"kind":"Field","name":{"kind":"Name","value":"quote"}},{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"_createdAt"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SearchResultHighlights"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItemSearchResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"searchHighlights"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fullText"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"tags"}},{"kind":"Field","name":{"kind":"Name","value":"title"}}]}}]}}]} as unknown as DocumentNode<SearchSavedItemsSimpleQuery, SearchSavedItemsSimpleQueryVariables>;