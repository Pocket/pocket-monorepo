// THIS FILE IS GENERATED, DO NOT EDIT!
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable prettier/prettier */
/* tslint:disable */
/* eslint:disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  Date: any;
  DateString: any;
  FunctionalBoostValue: any;
  ISOString: any;
  Markdown: any;
  NonNegativeInt: any;
  Timestamp: any;
  Url: any;
};

export type ArticleMarkdown = {
  __typename?: 'ArticleMarkdown';
  images?: Maybe<Array<MarkdownImagePosition>>;
  text: Scalars['String'];
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
  id: Scalars['ID'];
  /** Display name */
  name?: Maybe<Scalars['String']>;
  /** A url to that Author's site */
  url?: Maybe<Scalars['String']>;
};

export type BaseError = {
  message: Scalars['String'];
  path: Scalars['String'];
};

/** Row in a bulleted (unordered list) */
export type BulletedListElement = ListElement & {
  __typename?: 'BulletedListElement';
  /** Row in a list. */
  content: Scalars['Markdown'];
  /** Zero-indexed level, for handling nested lists. */
  level: Scalars['Int'];
};

export enum CacheControlScope {
  Private = 'PRIVATE',
  Public = 'PUBLIC'
}

/** A requested image that is cached and has the requested image parameters */
export type CachedImage = {
  __typename?: 'CachedImage';
  /** Height of the cached image */
  height?: Maybe<Scalars['Int']>;
  /** Id of the image that matches the ID from the requested options */
  id: Scalars['ID'];
  /** URL of the cached image */
  url?: Maybe<Scalars['Url']>;
  /** Width of the cached image */
  width?: Maybe<Scalars['Int']>;
};

/** Set of parameters that will be used to change an image */
export type CachedImageInput = {
  /** File type of the requested image */
  fileType?: InputMaybe<ImageFileType>;
  /** Height of the image */
  height?: InputMaybe<Scalars['Int']>;
  /** Id of the image in the returned result set */
  id: Scalars['ID'];
  /** Quality of the image in whole percentage, 100 = full, quality 50 = half quality */
  qualityPercentage?: InputMaybe<Scalars['Int']>;
  /** Width of the image */
  width?: InputMaybe<Scalars['Int']>;
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
  excerpt?: Maybe<Scalars['Markdown']>;
  externalId: Scalars['ID'];
  imageUrl?: Maybe<Scalars['Url']>;
  intro?: Maybe<Scalars['Markdown']>;
  labels?: Maybe<Array<Maybe<Label>>>;
  /**
   * note that language is *not* being used as locale - only to specify the
   * language of the collection.
   */
  language: CollectionLanguage;
  partnership?: Maybe<CollectionPartnership>;
  publishedAt?: Maybe<Scalars['DateString']>;
  slug: Scalars['String'];
  status: CollectionStatus;
  stories: Array<CollectionStory>;
  title: Scalars['String'];
};

export type CollectionAuthor = {
  __typename?: 'CollectionAuthor';
  active: Scalars['Boolean'];
  bio?: Maybe<Scalars['Markdown']>;
  externalId: Scalars['ID'];
  imageUrl?: Maybe<Scalars['Url']>;
  name: Scalars['String'];
  slug?: Maybe<Scalars['String']>;
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
  blurb: Scalars['Markdown'];
  externalId: Scalars['String'];
  imageUrl: Scalars['Url'];
  name: Scalars['String'];
  type: CollectionPartnershipType;
  url: Scalars['Url'];
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
  excerpt: Scalars['Markdown'];
  externalId: Scalars['ID'];
  /** if True, the story is provided by a partner and should be displayed as such */
  fromPartner: Scalars['Boolean'];
  imageUrl?: Maybe<Scalars['Url']>;
  item?: Maybe<Item>;
  publisher?: Maybe<Scalars['String']>;
  sortOrder?: Maybe<Scalars['Int']>;
  title: Scalars['String'];
  url: Scalars['Url'];
};

export type CollectionStoryAuthor = {
  __typename?: 'CollectionStoryAuthor';
  name: Scalars['String'];
  sortOrder: Scalars['Int'];
};

export type CollectionsFiltersInput = {
  /** If provided, will return all collections that match at least one of the labels. */
  labels?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  /** If not provided, or if an unsupported language is requested, defaults to `en` */
  language?: InputMaybe<Scalars['String']>;
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
  /** The excerpt of the Approved Item. */
  excerpt: Scalars['String'];
  /** The GUID that is stored on an approved corpus item */
  id: Scalars['ID'];
  /** The image for this item's accompanying picture. */
  image: Image;
  /** The image URL for this item's accompanying picture. */
  imageUrl: Scalars['Url'];
  /** What language this item is in. This is a two-letter code, for example, 'EN' for English. */
  language: CorpusLanguage;
  /** The name of the online publication that published this story. */
  publisher: Scalars['String'];
  /** The user's saved item, from the Corpus Item, if the corpus item was saved to the user's saves */
  savedItem?: Maybe<SavedItem>;
  /** If the Corpus Item is pocket owned with a specific type, this is the associated object (Collection or SyndicatedArticle). */
  target?: Maybe<CorpusTarget>;
  /** The title of the Approved Item. */
  title: Scalars['String'];
  /** The topic associated with the Approved Item. */
  topic?: Maybe<Scalars['String']>;
  /** The URL of the Approved Item. */
  url: Scalars['Url'];
};

/** An author associated with a CorpusItem. */
export type CorpusItemAuthor = {
  __typename?: 'CorpusItemAuthor';
  name: Scalars['String'];
  sortOrder: Scalars['Int'];
};

/** Valid language codes for curated corpus items. */
export enum CorpusLanguage {
  /** German */
  De = 'DE',
  /** English */
  En = 'EN'
}

export type CorpusRecommendation = {
  __typename?: 'CorpusRecommendation';
  /** Content meta data. */
  corpusItem: CorpusItem;
  /** Clients should include this id in the `corpus_recommendation` Snowplow entity for impression, content_open, and engagement events related to this recommendation. This id is different across users, across requests, and across corpus items. The recommendation-api service associates metadata with this id to join and aggregate recommendations in our data warehouse. */
  id: Scalars['ID'];
  /** Reason why this CorpusItem is recommended to the user, or null if no reason is available. */
  reason?: Maybe<RecommendationReason>;
};

/** This is the same as Slate but in this type all recommendations are backed by CorpusItems. This means that the editorial team has editorial control over the items served by this endpoint. */
export type CorpusSlate = {
  __typename?: 'CorpusSlate';
  /** The display headline for the slate. Surface context may be required to render determine what to display. This will depend on if we connect the copy to the Surface, SlateExperiment, or Slate. */
  headline: Scalars['String'];
  /** UUID */
  id: Scalars['ID'];
  /** Link to a page where the user can explore more recommendations similar to this slate, or null if no link is provided. */
  moreLink?: Maybe<Link>;
  /** Indicates the main type of reason why recommendations are included in this slate, or null if none is available. */
  recommendationReasonType?: Maybe<RecommendationReasonType>;
  /** Recommendations for the current request context. */
  recommendations: Array<CorpusRecommendation>;
  /** A smaller, secondary headline that can be displayed to provide additional context on the slate. */
  subheadline?: Maybe<Scalars['String']>;
};


/** This is the same as Slate but in this type all recommendations are backed by CorpusItems. This means that the editorial team has editorial control over the items served by this endpoint. */
export type CorpusSlateRecommendationsArgs = {
  count?: InputMaybe<Scalars['Int']>;
};

/** A collection of slates. */
export type CorpusSlateLineup = {
  __typename?: 'CorpusSlateLineup';
  /** UUID */
  id: Scalars['ID'];
  /** Slates. */
  slates: Array<CorpusSlate>;
};


/** A collection of slates. */
export type CorpusSlateLineupSlatesArgs = {
  count?: InputMaybe<Scalars['Int']>;
};

/**
 * TODO: Make this type implement PocketResource when available.
 * https://getpocket.atlassian.net/wiki/spaces/PE/pages/2771714049/The+Future+of+Item
 */
export type CorpusTarget = Collection | SyndicatedArticle;

/** Input for creating a new User-highlighted passage on a SavedItem. */
export type CreateHighlightInput = {
  /** The ID of the Item that should be annotated in the User's list */
  itemId: Scalars['ID'];
  /** Optional note generated by User */
  note?: InputMaybe<Scalars['String']>;
  /**
   * Patch string generated by 'DiffMatchPatch' library, serialized
   * into text via `patch_toText` method.
   * Format is similar to UniDiff but is character-based.
   * The patched text depends on version. For example, the version 2
   * patch surrounds the highlighted text portion with a pair of
   * sentinel tags: '<pkt_tag_annotation></pkt_tag_annotation>'
   * Reference: https://github.com/google/diff-match-patch
   */
  patch: Scalars['String'];
  /**
   * The full text of the highlighted passage. Used as a fallback for
   * rendering highlight if the patch fails.
   */
  quote: Scalars['String'];
  /** Annotation data version */
  version: Scalars['Int'];
};

/** Input data for creating a Shareable List. */
export type CreateShareableListInput = {
  description?: InputMaybe<Scalars['String']>;
  title: Scalars['String'];
};

/** Input data for creating a Shareable List Item. */
export type CreateShareableListItemInput = {
  authors?: InputMaybe<Scalars['String']>;
  excerpt?: InputMaybe<Scalars['String']>;
  imageUrl?: InputMaybe<Scalars['Url']>;
  itemId?: InputMaybe<Scalars['Float']>;
  listExternalId: Scalars['ID'];
  publisher?: InputMaybe<Scalars['String']>;
  sortOrder: Scalars['Int'];
  title?: InputMaybe<Scalars['String']>;
  url: Scalars['Url'];
};

/** Input data for creating a Shareable List Item during Shareable List creation. */
export type CreateShareableListItemWithList = {
  authors?: InputMaybe<Scalars['String']>;
  excerpt?: InputMaybe<Scalars['String']>;
  imageUrl?: InputMaybe<Scalars['Url']>;
  itemId?: InputMaybe<Scalars['Float']>;
  publisher?: InputMaybe<Scalars['String']>;
  sortOrder: Scalars['Int'];
  title?: InputMaybe<Scalars['String']>;
  url: Scalars['Url'];
};

/** This type represents the information we need on a curated item. */
export type CuratedInfo = {
  __typename?: 'CuratedInfo';
  excerpt?: Maybe<Scalars['String']>;
  /** The image for this item's accompanying picture. */
  image?: Maybe<Image>;
  imageSrc?: Maybe<Scalars['Url']>;
  title?: Maybe<Scalars['String']>;
};

export type CurationCategory = {
  __typename?: 'CurationCategory';
  externalId: Scalars['ID'];
  name: Scalars['String'];
  slug: Scalars['String'];
};

export type DeleteSavedItemTagsInput = {
  /** The id of the SavedItem from which to delete a Tag association */
  savedItemId: Scalars['ID'];
  /** The ids of the Tag to disassociate from the SavedItem */
  tagIds: Array<Scalars['ID']>;
};

/** Metadata from a domain, originally populated from ClearBit */
export type DomainMetadata = {
  __typename?: 'DomainMetadata';
  /** Url for the logo image */
  logo?: Maybe<Scalars['Url']>;
  /** Url for the greyscale logo image */
  logoGreyscale?: Maybe<Scalars['Url']>;
  /** The name of the domain (e.g., The New York Times) */
  name?: Maybe<Scalars['String']>;
};

/** Input field to boost the score of an elasticsearch document based on a specific field and value */
export type FunctionalBoostField = {
  /** A float number to boost the score by */
  factor: Scalars['Float'];
  /** Field to evaluate for boosting */
  field: Scalars['String'];
  /** The mathematical operation to use for boosting */
  operation: SearchFunctionalBoostOperation;
  /** Field value to evaluate */
  value: Scalars['FunctionalBoostValue'];
};

/** A User-highlighted passage on a SavedItem */
export type Highlight = {
  __typename?: 'Highlight';
  /** When the Highlight was created */
  _createdAt: Scalars['Timestamp'];
  /** When the highlight was last updated */
  _updatedAt: Scalars['Timestamp'];
  /** The ID for this Highlight annotation */
  id: Scalars['ID'];
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
  patch: Scalars['String'];
  /**
   * The full text of the highlighted passage. Used as a fallback for
   * rendering highlight if the patch fails.
   */
  quote: Scalars['String'];
  /** Version number for highlight data specification */
  version: Scalars['Int'];
};

export type HighlightNote = {
  __typename?: 'HighlightNote';
  /** When the HighlightNote was created */
  _createdAt: Scalars['Timestamp'];
  /** When the HighlightNote was last updated */
  _updatedAt: Scalars['Timestamp'];
  /** User entered text */
  text: Scalars['String'];
};

/** Interactive Advertising Bureau Category - these are used on clients to serve relevant ads */
export type IabCategory = {
  __typename?: 'IABCategory';
  externalId: Scalars['String'];
  name: Scalars['String'];
  slug: Scalars['String'];
};

export type IabParentCategory = {
  __typename?: 'IABParentCategory';
  children: Array<IabCategory>;
  externalId: Scalars['String'];
  name: Scalars['String'];
  slug: Scalars['String'];
};

/** An image that is keyed on URL */
export type Image = {
  __typename?: 'Image';
  /** Query to get a cached and modified set of images based on the image from the original url, images will be matched by the client assigned id value */
  cachedImages?: Maybe<Array<Maybe<CachedImage>>>;
  /** A caption or description of the image */
  caption?: Maybe<Scalars['String']>;
  /** A credit for the image, typically who the image belongs to / created by */
  credit?: Maybe<Scalars['String']>;
  /** The determined height of the image at the url */
  height?: Maybe<Scalars['Int']>;
  /** The id for placing within an Article View. {articleView.article} will have placeholders of <div id='RIL_IMG_X' /> where X is this id. Apps can download those images as needed and populate them in their article view. */
  imageId: Scalars['Int'];
  /**
   * Absolute url to the image
   * @deprecated use url property moving forward
   */
  src: Scalars['String'];
  /** If the image is also a link, the destination url */
  targetUrl?: Maybe<Scalars['String']>;
  /** The url of the image */
  url: Scalars['Url'];
  /** The determined width of the image at the url */
  width?: Maybe<Scalars['Int']>;
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
  ampUrl?: Maybe<Scalars['Url']>;
  /**
   * The pocket HTML string of the article.
   * Note: Web and Android as of 3/4/2022 use the Article field, any improvements made
   * within MArticle for parsing will not be reflected in the article field.
   * When that happens, the clients will work to move to MArticle.
   */
  article?: Maybe<Scalars['String']>;
  /** List of Authors involved with this article */
  authors?: Maybe<Array<Maybe<Author>>>;
  /** If the item is a collection allow them to get the collection information */
  collection?: Maybe<Collection>;
  /**
   * The length in bytes of the content
   * @deprecated Clients should not use this
   */
  contentLength?: Maybe<Scalars['Int']>;
  /** The date the article was published */
  datePublished?: Maybe<Scalars['DateString']>;
  /** The date the parser resolved this item */
  dateResolved?: Maybe<Scalars['DateString']>;
  /** The domain, such as 'getpocket.com' of the {.resolved_url} */
  domain?: Maybe<Scalars['String']>;
  /**
   * The primary database id of the domain this article is from
   * @deprecated Use a domain as the identifier instead
   */
  domainId?: Maybe<Scalars['String']>;
  /** Additional information about the item domain, when present, use this for displaying the domain name */
  domainMetadata?: Maybe<DomainMetadata>;
  /** The string encoding code of this item's web page */
  encoding?: Maybe<Scalars['String']>;
  /** A snippet of text from the article */
  excerpt?: Maybe<Scalars['String']>;
  /** key field to identify the Item entity in the Parser service */
  givenUrl: Scalars['Url'];
  /** 0=no images, 1=contains images, 2=is an image */
  hasImage?: Maybe<Imageness>;
  /**
   * Indicates that the item was stored via a different search_hash (using the old method), we'll need to look up a different id
   * @deprecated Most new items use a new hash
   */
  hasOldDupes?: Maybe<Scalars['Boolean']>;
  /** 0=no videos, 1=contains video, 2=is a video */
  hasVideo?: Maybe<Videoness>;
  /** Keyword highlights from search */
  highlights?: Maybe<ItemHighlights>;
  /** Array of images within an article */
  images?: Maybe<Array<Maybe<Image>>>;
  /**
   * Indicates if the text of the url is a redirect to another url
   * @deprecated Clients should not use this
   */
  innerDomainRedirect?: Maybe<Scalars['Boolean']>;
  /** true if the item is an article */
  isArticle?: Maybe<Scalars['Boolean']>;
  /** true if the item is an index / home page, rather than a specific single piece of content */
  isIndex?: Maybe<Scalars['Boolean']>;
  /**
   * The Item entity is owned by the Parser service.
   * We only extend it in this service to make this service's schema valid.
   * The key for this entity is the 'itemId'
   */
  itemId: Scalars['String'];
  /** The detected language of the article */
  language?: Maybe<Scalars['String']>;
  /**
   * Indicates if the url requires a login
   * @deprecated Clients should not use this
   */
  loginRequired?: Maybe<Scalars['Boolean']>;
  /** The Marticle format of the article, used by clients for native article view. */
  marticle?: Maybe<Array<MarticleComponent>>;
  /** The mime type of this item's web page */
  mimeType?: Maybe<Scalars['String']>;
  /**
   * A normalized value of the givenUrl.
   * It will look like a url but is not guaranteed to be a valid url, just a unique string that is used to eliminate common duplicates.
   * Item's that share a normal_url should be considered the same item. For example https://getpocket.com and http://getpocket.com will be considered the same since they both normalize to http://getpocket.com
   * This is technically the true identity of an item, since this is what the backend uses to tell if two items are the same.
   * However, for the clients to use this, they would all have to ship an implementation of the normalization function that the backend has exactly.
   * And even if it did that, some items, some of the earliest saves, use a legacy normalize function and the client would have no way to know when to use which normalizing function.
   */
  normalUrl: Scalars['String'];
  /**
   * If a the domainId is a subdomain this is the primary domain id
   * @deprecated Use a domain as the identifier instead
   */
  originDomainId?: Maybe<Scalars['String']>;
  /** Recommend similar articles to show in the bottom of an article. */
  relatedAfterArticle: Array<CorpusRecommendation>;
  /** Recommend similar articles after saving. */
  relatedAfterCreate: Array<CorpusRecommendation>;
  /** The item id of the resolved_url */
  resolvedId?: Maybe<Scalars['String']>;
  /**
   * The resolved url, but ran through the normalized function
   * @deprecated Use the resolved url instead
   */
  resolvedNormalUrl?: Maybe<Scalars['Url']>;
  /** If the givenUrl redirects (once or many times), this is the final url. Otherwise, same as givenUrl */
  resolvedUrl?: Maybe<Scalars['Url']>;
  /**
   * The http response code of the given url
   * @deprecated Clients should not use this
   */
  responseCode?: Maybe<Scalars['Int']>;
  /** Helper property to identify if the given item is in the user's list */
  savedItem?: Maybe<SavedItem>;
  /** If the item has a syndicated counterpart the syndication information */
  syndicatedArticle?: Maybe<SyndicatedArticle>;
  /**
   * Date this item was first parsed in Pocket
   * @deprecated Clients should not use this
   */
  timeFirstParsed?: Maybe<Scalars['DateString']>;
  /** How long it will take to read the article (TODO in what time unit? and by what calculation?) */
  timeToRead?: Maybe<Scalars['Int']>;
  /** The title as determined by the parser. */
  title?: Maybe<Scalars['String']>;
  /** The page's / publisher's preferred thumbnail image */
  topImage?: Maybe<Image>;
  /**
   * The page's / publisher's preferred thumbnail image
   * @deprecated use the topImage object
   */
  topImageUrl?: Maybe<Scalars['Url']>;
  /**
   * Indicates if the parser used fallback methods
   * @deprecated Clients should not use this
   */
  usedFallback?: Maybe<Scalars['Int']>;
  /** Array of videos within the item If the item is a video, this will likely just contain one video */
  videos?: Maybe<Array<Maybe<Video>>>;
  /** Number of words in the article */
  wordCount?: Maybe<Scalars['Int']>;
};


/**
 * The heart of Pocket
 * A url and meta data related to it.
 */
export type ItemRelatedAfterArticleArgs = {
  count?: InputMaybe<Scalars['Int']>;
};


/**
 * The heart of Pocket
 * A url and meta data related to it.
 */
export type ItemRelatedAfterCreateArgs = {
  count?: InputMaybe<Scalars['Int']>;
};

/** Elasticsearch highlights */
export type ItemHighlights = {
  __typename?: 'ItemHighlights';
  full_text?: Maybe<Array<Maybe<Scalars['String']>>>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  title?: Maybe<Array<Maybe<Scalars['String']>>>;
  url?: Maybe<Array<Maybe<Scalars['String']>>>;
};

/** Union type for items that may or may not be processed */
export type ItemResult = Item | PendingItem;

/** A label used to mark and categorize an Entity (e.g. Collection). */
export type Label = {
  __typename?: 'Label';
  externalId: Scalars['ID'];
  name: Scalars['String'];
};

/** Web link */
export type Link = {
  __typename?: 'Link';
  /** The link text displayed to the user. */
  text: Scalars['String'];
  /** The URL to send the user to when clicking on the link. */
  url: Scalars['Url'];
};

export type ListElement = {
  /** Row in a list. */
  content: Scalars['Markdown'];
  /** Zero-indexed level, for handling nested lists. */
  level: Scalars['Int'];
};

export type MarkdownImagePosition = {
  __typename?: 'MarkdownImagePosition';
  index: Scalars['Int'];
  position: Scalars['Int'];
  /** Fallback is to use the images field in the Item entity */
  src?: Maybe<Scalars['String']>;
};

/** Content of a blockquote */
export type MarticleBlockquote = {
  __typename?: 'MarticleBlockquote';
  /** Markdown text content. */
  content: Scalars['Markdown'];
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
  language?: Maybe<Scalars['Int']>;
  /** Content of a pre tag */
  text: Scalars['String'];
};

export type MarticleComponent = Image | MarticleBlockquote | MarticleBulletedList | MarticleCodeBlock | MarticleDivider | MarticleHeading | MarticleNumberedList | MarticleTable | MarticleText | UnMarseable | Video;

export type MarticleDivider = {
  __typename?: 'MarticleDivider';
  /** Always '---'; provided for convenience if building a markdown string */
  content: Scalars['Markdown'];
};

/** A heading in an article, with markdown formatting. */
export type MarticleHeading = {
  __typename?: 'MarticleHeading';
  /** Heading text, in markdown. */
  content: Scalars['Markdown'];
  /** Heading level. Restricted to values 1-6. */
  level: Scalars['Int'];
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
  html: Scalars['String'];
};

/**
 * A section of the article's text content, in markdown.
 * A subset of gfm is supported. See README.md for more information.
 */
export type MarticleText = {
  __typename?: 'MarticleText';
  /** Markdown text content. Typically, a paragraph. */
  content: Scalars['Markdown'];
};

/** Default Mutation Type */
export type Mutation = {
  __typename?: 'Mutation';
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
  deleteSavedItem: Scalars['ID'];
  /** Delete a highlight by its ID. */
  deleteSavedItemHighlight: Scalars['ID'];
  /** Delete a highlight note by the Highlight ID. */
  deleteSavedItemHighlightNote: Scalars['ID'];
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
  deleteTag: Scalars['ID'];
  /** Deletes user information and their pocket data for the given pocket userId. Returns pocket userId. */
  deleteUser: Scalars['ID'];
  /**
   * Deletes user information and their pocket data for the given firefox account ID.
   * Returns firefox account ID sent as the query parameter with the request.
   */
  deleteUserByFxaId: Scalars['ID'];
  /** Refresh an {Item}'s article content. */
  refreshItemArticle: Item;
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
  /** Unarchives PocketSaves */
  saveUnArchive?: Maybe<SaveWriteMutationPayload>;
  /**
   * Unfavorites PocketSaves
   * Accepts a list of PocketSave Ids that we want to unfavorite.
   */
  saveUnFavorite?: Maybe<SaveWriteMutationPayload>;
  /** Archives a SavedItem */
  updateSavedItemArchive: SavedItem;
  /** Favorites a SavedItem */
  updateSavedItemFavorite: SavedItem;
  /**
   * Update an existing highlight annotation, by its ID.
   * If the given highlight ID does not exist, will return error data
   * and the highlight will not be created.
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
  /** Unarchives a SavedItem */
  updateSavedItemUnArchive: SavedItem;
  /** Undo the delete operation for a SavedItem */
  updateSavedItemUnDelete: SavedItem;
  /** Unfavorites a SavedItem */
  updateSavedItemUnFavorite: SavedItem;
  /** Updates a Shareable List. This includes making it public. */
  updateShareableList: ShareableList;
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
export type MutationCreateSavedItemHighlightNoteArgs = {
  id: Scalars['ID'];
  input: Scalars['String'];
};


/** Default Mutation Type */
export type MutationCreateSavedItemHighlightsArgs = {
  input: Array<CreateHighlightInput>;
};


/** Default Mutation Type */
export type MutationCreateSavedItemTagsArgs = {
  input: Array<SavedItemTagsInput>;
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
  id: Scalars['ID'];
};


/** Default Mutation Type */
export type MutationDeleteSavedItemHighlightArgs = {
  id: Scalars['ID'];
};


/** Default Mutation Type */
export type MutationDeleteSavedItemHighlightNoteArgs = {
  id: Scalars['ID'];
};


/** Default Mutation Type */
export type MutationDeleteSavedItemTagsArgs = {
  input: Array<DeleteSavedItemTagsInput>;
};


/** Default Mutation Type */
export type MutationDeleteShareableListArgs = {
  externalId: Scalars['ID'];
};


/** Default Mutation Type */
export type MutationDeleteShareableListItemArgs = {
  externalId: Scalars['ID'];
};


/** Default Mutation Type */
export type MutationDeleteTagArgs = {
  id: Scalars['ID'];
};


/** Default Mutation Type */
export type MutationDeleteUserByFxaIdArgs = {
  id: Scalars['ID'];
};


/** Default Mutation Type */
export type MutationRefreshItemArticleArgs = {
  url: Scalars['String'];
};


/** Default Mutation Type */
export type MutationReplaceSavedItemTagsArgs = {
  input: Array<SavedItemTagsInput>;
};


/** Default Mutation Type */
export type MutationSaveArchiveArgs = {
  id: Array<Scalars['ID']>;
  timestamp: Scalars['ISOString'];
};


/** Default Mutation Type */
export type MutationSaveBatchUpdateTagsArgs = {
  input: Array<SaveUpdateTagsInput>;
  timestamp: Scalars['ISOString'];
};


/** Default Mutation Type */
export type MutationSaveFavoriteArgs = {
  id: Array<Scalars['ID']>;
  timestamp: Scalars['ISOString'];
};


/** Default Mutation Type */
export type MutationSaveUnArchiveArgs = {
  id: Array<Scalars['ID']>;
  timestamp: Scalars['ISOString'];
};


/** Default Mutation Type */
export type MutationSaveUnFavoriteArgs = {
  id: Array<Scalars['ID']>;
  timestamp: Scalars['ISOString'];
};


/** Default Mutation Type */
export type MutationUpdateSavedItemArchiveArgs = {
  id: Scalars['ID'];
};


/** Default Mutation Type */
export type MutationUpdateSavedItemFavoriteArgs = {
  id: Scalars['ID'];
};


/** Default Mutation Type */
export type MutationUpdateSavedItemHighlightArgs = {
  id: Scalars['ID'];
  input: CreateHighlightInput;
};


/** Default Mutation Type */
export type MutationUpdateSavedItemHighlightNoteArgs = {
  id: Scalars['ID'];
  input: Scalars['String'];
};


/** Default Mutation Type */
export type MutationUpdateSavedItemRemoveTagsArgs = {
  savedItemId?: InputMaybe<Scalars['ID']>;
};


/** Default Mutation Type */
export type MutationUpdateSavedItemTagsArgs = {
  input: SavedItemTagUpdateInput;
};


/** Default Mutation Type */
export type MutationUpdateSavedItemUnArchiveArgs = {
  id: Scalars['ID'];
};


/** Default Mutation Type */
export type MutationUpdateSavedItemUnDeleteArgs = {
  id: Scalars['ID'];
};


/** Default Mutation Type */
export type MutationUpdateSavedItemUnFavoriteArgs = {
  id: Scalars['ID'];
};


/** Default Mutation Type */
export type MutationUpdateShareableListArgs = {
  data: UpdateShareableListInput;
};


/** Default Mutation Type */
export type MutationUpdateTagArgs = {
  input: TagUpdateInput;
};


/** Default Mutation Type */
export type MutationUpdateUserEmailArgs = {
  email: Scalars['String'];
};


/** Default Mutation Type */
export type MutationUpdateUserEmailByFxaIdArgs = {
  email: Scalars['String'];
  id: Scalars['ID'];
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
  message: Scalars['String'];
  path: Scalars['String'];
};

export type NumberedListElement = ListElement & {
  __typename?: 'NumberedListElement';
  /** Row in a list */
  content: Scalars['Markdown'];
  /** Numeric index. If a nested item, the index is zero-indexed from the first child. */
  index: Scalars['Int'];
  /** Zero-indexed level, for handling nested lists. */
  level: Scalars['Int'];
};

/** Information about pagination in a connection. */
export type PageInfo = {
  __typename?: 'PageInfo';
  /** When paginating forwards, the cursor to continue. */
  endCursor?: Maybe<Scalars['String']>;
  /** When paginating forwards, are there more items? */
  hasNextPage: Scalars['Boolean'];
  /** When paginating backwards, are there more items? */
  hasPreviousPage: Scalars['Boolean'];
  /** When paginating backwards, the cursor to continue. */
  startCursor?: Maybe<Scalars['String']>;
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
  currentPage: Scalars['Int'];
  perPage: Scalars['Int'];
  totalPages: Scalars['Int'];
  totalResults: Scalars['Int'];
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
  after?: InputMaybe<Scalars['String']>;
  /**
   * Returns the elements in the list that come before the specified cursor.
   * The specified cursor is not included in the result.
   */
  before?: InputMaybe<Scalars['String']>;
  /**
   * Returns the first _n_ elements from the list. Must be a non-negative integer.
   * If `first` contains a value, `last` should be null/omitted in the input.
   */
  first?: InputMaybe<Scalars['Int']>;
  /**
   * Returns the last _n_ elements from the list. Must be a non-negative integer.
   * If `last` contains a value, `first` should be null/omitted in the input.
   */
  last?: InputMaybe<Scalars['Int']>;
};

export type PendingItem = {
  __typename?: 'PendingItem';
  /**
   * URL of the item that the user gave for the SavedItem
   * that is pending processing by parser
   */
  itemId: Scalars['String'];
  status?: Maybe<PendingItemStatus>;
  url: Scalars['Url'];
};

export enum PendingItemStatus {
  Resolved = 'RESOLVED',
  Unresolved = 'UNRESOLVED'
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
  archived: Scalars['Boolean'];
  /** Timestamp that the PocketSave became archived, null if not archived. */
  archivedAt?: Maybe<Scalars['ISOString']>;
  /** Unix timestamp of when the PocketSave was created. */
  createdAt: Scalars['ISOString'];
  /** Unix timestamp of when the entity was deleted. */
  deletedAt?: Maybe<Scalars['ISOString']>;
  /** Indicates if the PocketSave is favorited. */
  favorite: Scalars['Boolean'];
  /** Timestamp that the PocketSave became favorited, null if not favorited. */
  favoritedAt?: Maybe<Scalars['ISOString']>;
  /** The url the user gave (as opposed to normalized URLs). */
  givenUrl: Scalars['String'];
  /** Surrogate primary key. */
  id: Scalars['ID'];
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
  title: Scalars['String'];
  /** Unix timestamp of when the PocketSave was last updated, if any property on the PocketSave is modified this timestamp is set to the modified time. */
  updatedAt?: Maybe<Scalars['ISOString']>;
};

/** Enum to specify the PocketSave Status (mapped to integers in data store). */
export enum PocketSaveStatus {
  Archived = 'ARCHIVED',
  Deleted = 'DELETED',
  Hidden = 'HIDDEN',
  Unread = 'UNREAD'
}

/** The publisher that the curation team set for the syndicated article */
export type Publisher = {
  __typename?: 'Publisher';
  /** Whether or not to show the article appeared on domain */
  appearedOnDomain: Scalars['Boolean'];
  /** The article call to action to show if selected */
  articleCta?: Maybe<PublisherArticleCta>;
  /** Whether or not to attribute the publisher to the article */
  attributeCanonicalToPublisher: Scalars['Boolean'];
  /** Square logo to use for the publisher */
  logo?: Maybe<Scalars['String']>;
  /** Wide logo to use for the publisher */
  logoWide?: Maybe<Scalars['String']>;
  /** Black wide based logo to use for the publisher */
  logoWideBlack?: Maybe<Scalars['String']>;
  /** Name of the publisher of the article */
  name?: Maybe<Scalars['String']>;
  /** The name to show to the article in recommendations */
  recommendationName?: Maybe<Scalars['String']>;
  /** Whether or not to show an article call to action */
  showArticleCta: Scalars['Boolean'];
  /** Whether or not to show the authors of the article */
  showAuthors: Scalars['Boolean'];
  /** Whether or not to show publisher recomendations */
  showPublisherRecommendations?: Maybe<Scalars['Boolean']>;
  /** Url of the publisher */
  url?: Maybe<Scalars['Url']>;
};

/**
 * The call to action to show on a SyndicatedArticle for a specific publisher
 * TODO: rename to SyndicatedPublisherArticle and move to schema-shared.graphql
 * (requires client changes)
 */
export type PublisherArticleCta = {
  __typename?: 'PublisherArticleCta';
  /** The lead in text to show */
  leadIn?: Maybe<Scalars['String']>;
  /** The text to show */
  text?: Maybe<Scalars['String']>;
  /** The url to link to */
  url?: Maybe<Scalars['String']>;
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
   * Look up {Item} info by ID.
   * @deprecated Use itemById instead
   */
  getItemByItemId?: Maybe<Item>;
  /**
   * Look up {Item} info by a url.
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
  /** Get ranked corpus slates and recommendations to deliver a unified Home experience. The locale argument determines the UI and recommendation content language. */
  homeSlateLineup: CorpusSlateLineup;
  /** Look up {Item} info by ID. */
  itemByItemId?: Maybe<Item>;
  /** Look up {Item} info by a url. */
  itemByUrl?: Maybe<Item>;
  /**
   * List all available topics that we have recommendations for.
   * @deprecated Use `getSlateLineup` with a specific SlateLineup instead.
   */
  listTopics: Array<Topic>;
  /** List all topics that the user can express a preference for. */
  recommendationPreferenceTopics: Array<Topic>;
  scheduledSurface: ScheduledSurface;
  /**
   * Looks up and returns a Shareable List with a given external ID for a given user.
   * (the user ID will be coming through with the headers)
   */
  shareableList?: Maybe<ShareableList>;
  /** Returns a publicly-shared Shareable List. Note: this query does not require user authentication. */
  shareableListPublic?: Maybe<ShareableList>;
  /**
   * Looks up and returns an array of Shareable Lists for a given user ID for a given user.
   * (the user ID will be coming through with the headers)
   */
  shareableLists: Array<ShareableList>;
  /** Determines if the userid passed in the headers has access to the pilot program. */
  shareableListsPilotUser: Scalars['Boolean'];
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
  /** Gets a user for a given ID, only admin/internal service credentials will be allowed to do this for IDs other then their own. */
  userById?: Maybe<User>;
  /** Gets a user entity for a given access token */
  userByToken?: Maybe<User>;
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QueryCollectionBySlugArgs = {
  slug: Scalars['String'];
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QueryGetCollectionBySlugArgs = {
  slug: Scalars['String'];
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QueryGetCollectionsArgs = {
  filters?: InputMaybe<CollectionsFiltersInput>;
  page?: InputMaybe<Scalars['Int']>;
  perPage?: InputMaybe<Scalars['Int']>;
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QueryGetItemByItemIdArgs = {
  id: Scalars['ID'];
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QueryGetItemByUrlArgs = {
  url: Scalars['String'];
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QueryGetSlateArgs = {
  recommendationCount?: InputMaybe<Scalars['Int']>;
  slateId: Scalars['String'];
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QueryGetSlateLineupArgs = {
  recommendationCount?: InputMaybe<Scalars['Int']>;
  slateCount?: InputMaybe<Scalars['Int']>;
  slateLineupId: Scalars['String'];
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QueryGetSyndicatedArticleBySlugArgs = {
  slug: Scalars['String'];
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
  locale?: Scalars['String'];
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QueryItemByItemIdArgs = {
  id: Scalars['ID'];
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QueryItemByUrlArgs = {
  url: Scalars['String'];
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QueryScheduledSurfaceArgs = {
  id: Scalars['ID'];
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QueryShareableListArgs = {
  externalId: Scalars['ID'];
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QueryShareableListPublicArgs = {
  externalId: Scalars['ID'];
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QuerySurfaceArgs = {
  id: Scalars['ID'];
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QuerySyndicatedArticleBySlugArgs = {
  slug: Scalars['String'];
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QueryUnleashAssignmentsArgs = {
  context: UnleashContext;
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QueryUserByIdArgs = {
  id: Scalars['ID'];
};


/**
 * Default root level query type. All authorization checks are done in these queries.
 * TODO: These belong in a seperate User Service that provides a User object (the user settings will probably exist there too)
 */
export type QueryUserByTokenArgs = {
  token: Scalars['String'];
};

export type RecItUserProfile = {
  userModels: Array<Scalars['String']>;
};

/** Represents a Recommendation from Pocket */
export type Recommendation = {
  __typename?: 'Recommendation';
  curatedInfo?: Maybe<CuratedInfo>;
  /** The feed id from mysql that this item was curated from (if it was curated) */
  feedId?: Maybe<Scalars['Int']>;
  /**
   * A generated id from the Data and Learning team that represents the Recommendation - Deprecated
   * @deprecated Use `id`
   */
  feedItemId?: Maybe<Scalars['ID']>;
  /** A generated id from the Data and Learning team that represents the Recommendation */
  id?: Maybe<Scalars['ID']>;
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
  itemId: Scalars['ID'];
  /** The publisher of the item */
  publisher?: Maybe<Scalars['String']>;
  /** The source of the recommendation */
  recSrc: Scalars['String'];
};

export type RecommendationReason = {
  __typename?: 'RecommendationReason';
  /** A succinct name for the recommendation reason that can be displayed to the user. */
  name: Scalars['String'];
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
  _createdAt?: Maybe<Scalars['Int']>;
  /** Unix timestamp of when the entity was deleted, 30 days after this date this entity will be HARD deleted from the database and no longer exist */
  _deletedAt?: Maybe<Scalars['Int']>;
  /** Unix timestamp of when the entity was last updated, if any property on the entity is modified this timestamp is set to the modified time */
  _updatedAt?: Maybe<Scalars['Int']>;
  /** Version of the entity, this will increment with each modification of the entity's field */
  _version?: Maybe<Scalars['Int']>;
  /**
   * For tags entity, id denotes the unique tag Id.
   * For savedItems, id denotes the itemId.
   * Along with the userId provided in the header, we will use id to fetch savedItems/tags for the user.
   */
  id: Scalars['ID'];
};

/** Payload for mutations that delete Saves */
export type SaveDeleteMutationPayload = {
  __typename?: 'SaveDeleteMutationPayload';
  /** Any errors associated with the mutation. Empty if the mutation was succesful. */
  errors: Array<SaveMutationError>;
  success: Scalars['Boolean'];
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
  fullText?: Maybe<Array<Maybe<Scalars['String']>>>;
  tags?: Maybe<Array<Maybe<Scalars['String']>>>;
  title?: Maybe<Array<Maybe<Scalars['String']>>>;
  url?: Maybe<Array<Maybe<Scalars['String']>>>;
};

/** All types in this union should implement BaseError, for client fallback */
export type SaveMutationError = NotFound | SyncConflict;

export type SaveUpdateTagsInput = {
  /**
   * Tags to add, by name text; if a Tag
   * with the given name does not exist,
   * one will be created.
   */
  addTagNames: Array<Scalars['String']>;
  /** Tags to remove, by ID */
  removeTagIds: Array<Scalars['ID']>;
  saveId: Scalars['ID'];
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
  _createdAt: Scalars['Int'];
  /** Unix timestamp of when the entity was deleted, 30 days after this date this entity will be HARD deleted from the database and no longer exist */
  _deletedAt?: Maybe<Scalars['Int']>;
  /** Unix timestamp of when the entity was last updated, if any property on the entity is modified this timestamp is set to the modified time */
  _updatedAt?: Maybe<Scalars['Int']>;
  /** Version of the entity, this will increment with each modification of the entity's field */
  _version?: Maybe<Scalars['Int']>;
  /** Annotations associated to this SavedItem */
  annotations?: Maybe<SavedItemAnnotations>;
  /** Timestamp that the SavedItem became archied, null if not archived */
  archivedAt?: Maybe<Scalars['Int']>;
  /** If the item is in corpus allow the saved item to reference it.  Exposing curated info for consistent UX */
  corpusItem?: Maybe<CorpusItem>;
  /** Timestamp that the SavedItem became favorited, null if not favorited */
  favoritedAt?: Maybe<Scalars['Int']>;
  /** Surrogate primary key. This is usually generated by clients, but will be generated by the server if not passed through creation */
  id: Scalars['ID'];
  /** Helper property to indicate if the SavedItem is archived */
  isArchived: Scalars['Boolean'];
  /** Helper property to indicate if the SavedItem is favorited */
  isFavorite: Scalars['Boolean'];
  /** Link to the underlying Pocket Item for the URL */
  item: ItemResult;
  /** The status of this SavedItem */
  status?: Maybe<SavedItemStatus>;
  /** The Suggested Tags associated with this SavedItem, if the user is not premium or there are none, this will be empty. */
  suggestedTags?: Maybe<Array<Tag>>;
  /** The Tags associated with this SavedItem */
  tags?: Maybe<Array<Tag>>;
  /** The url the user saved to their list */
  url: Scalars['String'];
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
  totalCount: Scalars['Int'];
};

/** An edge in a connection. */
export type SavedItemEdge = {
  __typename?: 'SavedItemEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String'];
  /** The SavedItem at the end of the edge. */
  node?: Maybe<SavedItem>;
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
  totalCount: Scalars['Int'];
};

/** An edge in a connection. */
export type SavedItemSearchResultEdge = {
  __typename?: 'SavedItemSearchResultEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String'];
  /** The item at the end of the edge. */
  node: SavedItemSearchResult;
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
  savedItemId: Scalars['ID'];
  /** The ID of the Tag associated with the SavedItem */
  tagId: Scalars['ID'];
};

/** Input field for setting all Tag associations on a SavedItem. */
export type SavedItemTagUpdateInput = {
  /** The SavedItem ID to associate Tags to */
  savedItemId: Scalars['ID'];
  /** The set of Tag IDs to associate to the SavedItem */
  tagIds: Array<Scalars['ID']>;
};

/** Input field for setting all Tag associations on a SavedItem. */
export type SavedItemTagsInput = {
  /** The SavedItem ID to associate Tags to */
  savedItemId: Scalars['ID'];
  /** The set of Tag names to associate to the SavedItem */
  tags: Array<Scalars['String']>;
};

/** Input field for upserting a SavedItem */
export type SavedItemUpsertInput = {
  /** Optional, create/update the SavedItem as a favorited item */
  isFavorite?: InputMaybe<Scalars['Boolean']>;
  /** Optional, time that request was submitted by client epoch/unix time */
  timestamp?: InputMaybe<Scalars['Int']>;
  /** The url to create/update the SavedItem with. (the url to save to the list) */
  url: Scalars['String'];
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
  isArchived?: InputMaybe<Scalars['Boolean']>;
  /** Optional, filter to get SavedItems that have been favorited */
  isFavorite?: InputMaybe<Scalars['Boolean']>;
  /** Optional, filter to get SavedItems with highlights */
  isHighlighted?: InputMaybe<Scalars['Boolean']>;
  /** Optional, filter to get user items based on status. Deprecated: use statuses instead. */
  status?: InputMaybe<SavedItemStatusFilter>;
  /** Optional, filters to get user items based on multiple statuses (OR operator) */
  statuses?: InputMaybe<Array<InputMaybe<SavedItemStatusFilter>>>;
  /** Optional, filter to get SavedItems associated to the specified Tag. */
  tagIds?: InputMaybe<Array<Scalars['ID']>>;
  /**
   * Optional, filter to get SavedItems associated to the specified Tag name.
   * To get untagged items, include the string '_untagged_'.
   */
  tagNames?: InputMaybe<Array<Scalars['String']>>;
  /** Optional, filter to get SavedItems updated since a unix timestamp */
  updatedSince?: InputMaybe<Scalars['Int']>;
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
  id: Scalars['ID'];
  /** Subquery to get the ScheduledSurfaceItems to display to a user for a given date */
  items: Array<ScheduledSurfaceItem>;
  /** Internal name of the surface */
  name: Scalars['String'];
};


/** Represents a surface that has scheduled items by day */
export type ScheduledSurfaceItemsArgs = {
  date: Scalars['Date'];
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
  id: Scalars['ID'];
  /** The date the item should run at */
  scheduledDate: Scalars['Date'];
  /** Agreed on GUID that is from our shared data pocket confluence */
  surfaceId: Scalars['ID'];
};

/** Input filed for filtering items */
export type SearchFilter = {
  /** Optional filter to items of a specific content type */
  contentType?: InputMaybe<Scalars['String']>;
  /**
   * Optional filter to get items that matches the domain
   * domain should be in the url format, e.g getpocket.com (or) list.getpocket.com
   */
  domain?: InputMaybe<Scalars['String']>;
  /** Optional filter to get items that are favorited */
  favorite?: InputMaybe<Scalars['Boolean']>;
  /** Optional filter to get items in a specific state */
  status?: InputMaybe<SearchStatus>;
  /** Optional fitler to get item with specific tags */
  tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};

export type SearchFilterInput = {
  /** Optional, filter to get SavedItems based on content type */
  contentType?: InputMaybe<SearchItemsContentType>;
  /**
   * Optional filter to get items that matches the domain
   * domain should be in the url format, e.g getpocket.com (or) list.getpocket.com
   */
  domain?: InputMaybe<Scalars['String']>;
  /** Optional, filter to get user items that have been favorited */
  isFavorite?: InputMaybe<Scalars['Boolean']>;
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
  field: Scalars['String'];
  /** The number of characters to return in addition to the keyword */
  size: Scalars['Int'];
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
  fields: Array<InputMaybe<Scalars['String']>>;
  /** Filters to be applied to the search */
  filters?: InputMaybe<SearchFilter>;
  /** Offset for pagination */
  from?: InputMaybe<Scalars['Int']>;
  /** Operation to boost the score of a document based */
  functionalBoosts?: InputMaybe<Array<InputMaybe<FunctionalBoostField>>>;
  /** Fields that should be highlighted if keywords are found within them */
  highlightFields?: InputMaybe<Array<InputMaybe<SearchHighlightField>>>;
  /** Number of items to return */
  size?: InputMaybe<Scalars['Int']>;
  /** Sorting for the search */
  sort?: InputMaybe<SearchSort>;
  /** The keyword to search for */
  term: Scalars['String'];
};

/** The return type for the search query */
export type SearchResult = {
  __typename?: 'SearchResult';
  /** @deprecated Not required by implementing clients */
  page?: Maybe<Scalars['Int']>;
  /** @deprecated Not required by implementing client */
  perPage?: Maybe<Scalars['Int']>;
  /** Items found */
  results?: Maybe<Array<Maybe<Item>>>;
  /** Number of items found */
  totalResults: Scalars['Int'];
};

/** Input field for sorting items */
export type SearchSort = {
  /** Direction of the sort (ASC/DESC) */
  direction: SearchSortDirection;
  /** Field in elasticsearch to sort by */
  field: Scalars['String'];
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

/** A user-created list of Pocket saves that can be shared publicly. */
export type ShareableList = {
  __typename?: 'ShareableList';
  /** The timestamp of when the list was created by its owner. */
  createdAt: Scalars['ISOString'];
  /** Optional text description of a Shareable List. Provided by the Pocket user. */
  description?: Maybe<Scalars['String']>;
  /** A unique string identifier in UUID format. */
  externalId: Scalars['ID'];
  /** Pocket Saves that have been added to this list by the Pocket user. */
  listItems: Array<ShareableListItem>;
  /** The moderation status of the list. Defaults to VISIBLE. */
  moderationStatus: ShareableListModerationStatus;
  /**
   * A URL-ready identifier of the list. Generated from the title
   * of the list when it's first made public. Unique per user.
   */
  slug?: Maybe<Scalars['String']>;
  /** The status of the list. Defaults to PRIVATE. */
  status: ShareableListStatus;
  /** The title of the list. Provided by the Pocket user. */
  title: Scalars['String'];
  /**
   * The timestamp of when the list was last updated by its owner
   * or a member of the moderation team.
   */
  updatedAt: Scalars['ISOString'];
  /**
   * Pocket User ID.
   * UserId is of Float type as GraphQL does not support BigInt.
   * This will ensure that all large integer values are handled
   * and will be interpreted as Number type.
   */
  userId: Scalars['Float'];
};

/** A Pocket Save (story) that has been added to a Shareable List. */
export type ShareableListItem = {
  __typename?: 'ShareableListItem';
  /** A comma-separated list of story authors. Supplied by the Parser. */
  authors?: Maybe<Scalars['String']>;
  /** The timestamp of when this story was added to the list by its owner. */
  createdAt: Scalars['ISOString'];
  /** The excerpt of the story. Supplied by the Parser. */
  excerpt?: Maybe<Scalars['String']>;
  /** A unique string identifier in UUID format. */
  externalId: Scalars['ID'];
  /** The URL of the thumbnail image illustrating the story. Supplied by the Parser. */
  imageUrl?: Maybe<Scalars['Url']>;
  /** The Parser Item ID. */
  itemId?: Maybe<Scalars['Float']>;
  /** The name of the publisher for this story. Supplied by the Parser. */
  publisher?: Maybe<Scalars['String']>;
  /** The custom sort order of stories within a list. Defaults to 1. */
  sortOrder: Scalars['Int'];
  /**
   * The title of the story. Supplied by the Parser.
   * May not be available for URLs that cannot be resolved.
   * Not editable by the Pocket user, as are all the other
   * Parser-supplied story properties below.
   */
  title?: Maybe<Scalars['String']>;
  /** The timestamp of when the story was last updated. Not used for the MVP. */
  updatedAt: Scalars['ISOString'];
  /** The URL of the story saved to a list. */
  url: Scalars['Url'];
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

/** The status of a Shareable List. Defaults to PRIVATE - visible only to its owner. */
export enum ShareableListStatus {
  /** The list is only visible to its owner - the Pocket user who created it. */
  Private = 'PRIVATE',
  /** The list has been shared and can be viewed by anyone in the world. */
  Public = 'PUBLIC'
}

/** A grouping of item recommendations that relate to each other under a specific name and description */
export type Slate = {
  __typename?: 'Slate';
  /** The description of the the slate */
  description?: Maybe<Scalars['String']>;
  /** The name to show to the user for this set of recommendations */
  displayName?: Maybe<Scalars['String']>;
  /** A unique guid/slug, provided by the Data & Learning team that can identify a specific experiment. Production apps typically won't request a specific one, but can for QA or during a/b testing. */
  experimentId: Scalars['ID'];
  id: Scalars['String'];
  /** An ordered list of the recommendations to show to the user */
  recommendations: Array<Recommendation>;
  /** A guid that is unique to every API request that returned slates, such as `getSlateLineup` or `getSlate`. The API will provide a new request id every time apps hit the API. */
  requestId: Scalars['ID'];
};

export type SlateLineup = {
  __typename?: 'SlateLineup';
  /** A unique guid/slug, provided by the Data & Learning team that can identify a specific experiment. Production apps typically won't request a specific one, but can for QA or during a/b testing. */
  experimentId: Scalars['ID'];
  /** A unique slug/id that describes a SlateLineup. The Data & Learning team will provide apps what id to use here for specific cases. */
  id: Scalars['ID'];
  /** A guid that is unique to every API request that returned slates, such as `getRecommendationSlateLineup` or `getSlate`. The API will provide a new request id every time apps hit the API. */
  requestId: Scalars['ID'];
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
  message: Scalars['String'];
  path: Scalars['String'];
};

/** An article that Pocket has syndicated and we also host on our own site */
export type SyndicatedArticle = {
  __typename?: 'SyndicatedArticle';
  /** Array of author names in string format */
  authorNames: Array<Maybe<Scalars['String']>>;
  /** Content for the syndicated article */
  content?: Maybe<Scalars['String']>;
  /**
   * The pocket curation category of the Article, maps to the Pocket Curation Topic lists
   * @deprecated use topic instead
   */
  curationCategory?: Maybe<Scalars['String']>;
  /** Excerpt  */
  excerpt?: Maybe<Scalars['String']>;
  /** When does the contract for syndication expire */
  expiresAt?: Maybe<Scalars['String']>;
  /** The Sub IAB category of the article defined at https://support.aerserv.com/hc/en-us/articles/207148516-List-of-IAB-Categories */
  iabSubCategory?: Maybe<Scalars['String']>;
  /** The Main IAB category of the article defined at https://support.aerserv.com/hc/en-us/articles/207148516-List-of-IAB-Categories */
  iabTopCategory?: Maybe<Scalars['String']>;
  /** The item id of this Syndicated Article */
  itemId?: Maybe<Scalars['ID']>;
  /** The locale country of the article */
  localeCountry?: Maybe<Scalars['String']>;
  /** The language of the article */
  localeLanguage?: Maybe<Scalars['String']>;
  /** Primary image to use in surfacing this content */
  mainImage?: Maybe<Scalars['String']>;
  /** The item id of the article we cloned */
  originalItemId: Scalars['ID'];
  /** AWSDateTime — Format: YYYY-MM-DDThh:mm:ss.sssZ */
  publishedAt: Scalars['String'];
  /** The manually set publisher information for this article */
  publisher?: Maybe<Publisher>;
  publisherUrl: Scalars['String'];
  /** Recommend similar syndicated articles. */
  relatedEndOfArticle: Array<CorpusRecommendation>;
  /** Recommend similar articles from the same publisher. */
  relatedRightRail: Array<CorpusRecommendation>;
  /** Should ads be shown on this article or not */
  showAds: Scalars['Boolean'];
  /** Slug that pocket uses for this article in the url */
  slug?: Maybe<Scalars['String']>;
  /**
   * DRAFT — Article is not meant to be available to the public
   * EXPIRED — Article contract is up and should be redirected to original article
   * ACTIVE — Article is clear to be shown in syndicated form
   */
  status: ArticleStatus;
  /** Title of syndicated article */
  title: Scalars['String'];
  /** The pocket topic of the Article, maps to the Pocket Curation Topic lists */
  topic?: Maybe<Scalars['String']>;
};


/** An article that Pocket has syndicated and we also host on our own site */
export type SyndicatedArticleRelatedEndOfArticleArgs = {
  count?: InputMaybe<Scalars['Int']>;
};


/** An article that Pocket has syndicated and we also host on our own site */
export type SyndicatedArticleRelatedRightRailArgs = {
  count?: InputMaybe<Scalars['Int']>;
};

/** Represents a Tag that a User has created for their list */
export type Tag = {
  __typename?: 'Tag';
  /** Unix timestamp of when the entity was deleted, 30 days after this date this entity will be HARD deleted from the database and no longer exist */
  _deletedAt?: Maybe<Scalars['Int']>;
  /** Version of the entity, this will increment with each modification of the entity's field */
  _version?: Maybe<Scalars['Int']>;
  /** Surrogate primary key. This is usually generated by clients, but will be generated by the server if not passed through creation */
  id: Scalars['ID'];
  /** The actual tag string the user created for their list */
  name: Scalars['String'];
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
  totalCount: Scalars['Int'];
};

/** Input field for creating a Tag */
export type TagCreateInput = {
  /** The user provided tag string */
  name: Scalars['String'];
  /** ID of the SavedItem to associate with this Tag */
  savedItemId: Scalars['ID'];
};

/** Payload for mutations that delete Tags */
export type TagDeleteMutationPayload = {
  __typename?: 'TagDeleteMutationPayload';
  /** Any errors associated with the mutation. Empty if the mutation was succesful. */
  errors: Array<TagMutationError>;
  success: Scalars['Boolean'];
};

/** An edge in a connection. */
export type TagEdge = {
  __typename?: 'TagEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String'];
  /** The Tag at the end of the edge. */
  node?: Maybe<Tag>;
};

/** All types in this union should implement BaseError, for client fallback */
export type TagMutationError = NotFound | SyncConflict;

/** Input field for updating a Tag */
export type TagUpdateInput = {
  /** Tag ID */
  id: Scalars['ID'];
  /** The updated tag string */
  name: Scalars['String'];
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
  curatorLabel: Scalars['String'];
  /** The internal feed id that this topic will pull from if set */
  customFeedId?: Maybe<Scalars['ID']>;
  /**
   * The name of the topic to show to the user
   * @deprecated displayName is deprecated. Use name instead.
   */
  displayName: Scalars['String'];
  /** If returned a note to show to the user about the topic */
  displayNote?: Maybe<Scalars['String']>;
  /** The id of the topic */
  id: Scalars['ID'];
  /** Whether or not clients should show this topic ot users */
  isDisplayed: Scalars['Boolean'];
  /** Whether or not this topic should be visiblly promoted (prominent on the page) */
  isPromoted: Scalars['Boolean'];
  /** The name of the topic to show to the user */
  name: Scalars['String'];
  /** The type of page this topic represents used in  generation */
  pageType: PageType;
  /** The query that was used internally for elasticsearch to find items */
  query: Scalars['String'];
  /** The slug that should be used in the url to represent the topic */
  slug: Scalars['String'];
  /** The description to use in the HTML markup for SEO and social media sharing */
  socialDescription?: Maybe<Scalars['String']>;
  /** The image to use in the HTML markup for SEO and social media sharing */
  socialImage?: Maybe<Scalars['String']>;
  /** The title to use in the HTML markup for SEO and social media sharing */
  socialTitle?: Maybe<Scalars['String']>;
};

export type TopicInput = {
  /** The id of the topic */
  id: Scalars['ID'];
};

/** Represents content that could not be parsed into a valid Marticle* component. */
export type UnMarseable = {
  __typename?: 'UnMarseable';
  /** The html that could not be parsed into a Marticle* component. */
  html: Scalars['String'];
};

/** Details on the variant/status of this toggle for a given user/context */
export type UnleashAssignment = {
  __typename?: 'UnleashAssignment';
  /** Whether or not the provided context is assigned */
  assigned: Scalars['Boolean'];
  /** The unleash toggle name, the same name as it appears in the admin interface and feature api */
  name: Scalars['String'];
  /** If the variant has a payload, its payload value */
  payload?: Maybe<Scalars['String']>;
  /** If the toggle has variants, the variant name it is assigned to */
  variant?: Maybe<Scalars['String']>;
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
  appName?: InputMaybe<Scalars['String']>;
  /**
   * The environment the device is running in:
   * - `prod`
   * - `beta`
   * - `alpha`
   */
  environment?: InputMaybe<UnleashEnvironment>;
  properties?: InputMaybe<UnleashProperties>;
  /** The device's IP address. If omitted, inferred from either request header `x-forwarded-for` or the origin IP of the request. */
  remoteAddress?: InputMaybe<Scalars['String']>;
  /** A device specific identifier that will be consistent across sessions, typically the encoded {guid} or some session token. */
  sessionId?: InputMaybe<Scalars['String']>;
  /** If logged in, the user's encoded user id (uid). The {Account.user_id}. */
  userId?: InputMaybe<Scalars['String']>;
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
  accountCreatedAt?: InputMaybe<Scalars['String']>;
  /** If omitted, inferred from request header `accept-langauge`. */
  locale?: InputMaybe<Scalars['String']>;
  /** Only required on activation strategies that are based whether a user model exists */
  recItUserProfile?: InputMaybe<RecItUserProfile>;
};

/** Input data for updating a Shareable List. */
export type UpdateShareableListInput = {
  description?: InputMaybe<Scalars['String']>;
  externalId: Scalars['ID'];
  status?: InputMaybe<ShareableListStatus>;
  title?: InputMaybe<Scalars['String']>;
};

export type UpdateUserRecommendationPreferencesInput = {
  /** Topics that the user expressed interest in. */
  preferredTopics: Array<TopicInput>;
};

export type User = {
  __typename?: 'User';
  /** The public avatar url for the user */
  avatarUrl?: Maybe<Scalars['String']>;
  /** A users bio for their profile */
  description?: Maybe<Scalars['String']>;
  /** User id, provided by the user service. */
  id: Scalars['ID'];
  /** The user's premium status */
  isPremium?: Maybe<Scalars['Boolean']>;
  /** The users first name and last name combined */
  name?: Maybe<Scalars['String']>;
  /** Preferences for recommendations that the user has explicitly set. */
  recommendationPreferences?: Maybe<UserRecommendationPreferences>;
  /** Get a PocketSave by its id */
  saveById?: Maybe<PocketSave>;
  /** Get a SavedItem by its id */
  savedItemById?: Maybe<SavedItem>;
  /** Get a general paginated listing of all SavedItems for the user */
  savedItems?: Maybe<SavedItemConnection>;
  /**
   * Premium search query. Name will be updated after client input
   * @deprecated Use searchSavedItems
   */
  search: SearchResult;
  /** Get a paginated list of user items that match a given term */
  searchSavedItems?: Maybe<SavedItemSearchResultConnection>;
  /** Get a paginated listing of all a user's Tags */
  tags?: Maybe<TagConnection>;
  /** The public username for the user */
  username?: Maybe<Scalars['String']>;
};


export type UserSaveByIdArgs = {
  id: Scalars['ID'];
};


export type UserSavedItemByIdArgs = {
  id: Scalars['ID'];
};


export type UserSavedItemsArgs = {
  filter?: InputMaybe<SavedItemsFilter>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SavedItemsSort>;
};


export type UserSearchArgs = {
  params: SearchParams;
};


export type UserSearchSavedItemsArgs = {
  filter?: InputMaybe<SearchFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
  sort?: InputMaybe<SearchSortInput>;
  term: Scalars['String'];
};


export type UserTagsArgs = {
  pagination?: InputMaybe<PaginationInput>;
};

export type UserRecommendationPreferences = {
  __typename?: 'UserRecommendationPreferences';
  /** Topics that the user expressed interest in. */
  preferredTopics?: Maybe<Array<Topic>>;
};

/** A Video, typically within an Article View of an {Item} or if the Item is a video itself. */
export type Video = {
  __typename?: 'Video';
  /** If known, the height of the video in px */
  height?: Maybe<Scalars['Int']>;
  /** If known, the length of the video in seconds */
  length?: Maybe<Scalars['Int']>;
  /** Absolute url to the video */
  src: Scalars['String'];
  /** The type of video */
  type: VideoType;
  /** The video's id within the service defined by type */
  vid?: Maybe<Scalars['String']>;
  /** The id of the video within Article View. {articleView.article} will have placeholders of <div id='RIL_VID_X' /> where X is this id. Apps can download those images as needed and populate them in their article view. */
  videoId: Scalars['Int'];
  /** If known, the width of the video in px */
  width?: Maybe<Scalars['Int']>;
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

export type SaveArchiveMutationVariables = Exact<{
  id: Array<Scalars['ID']> | Scalars['ID'];
  timestamp: Scalars['ISOString'];
}>;


export type SaveArchiveMutation = { __typename?: 'Mutation', saveArchive?: { __typename?: 'SaveWriteMutationPayload', save: Array<{ __typename?: 'PocketSave', id: string, favorite: boolean, favoritedAt?: any | null, updatedAt?: any | null }>, errors: Array<{ __typename: 'NotFound', path: string, message: string } | { __typename: 'SyncConflict', path: string, message: string }> } | null };

export type SaveFavoriteMutationVariables = Exact<{
  id: Array<Scalars['ID']> | Scalars['ID'];
  timestamp: Scalars['ISOString'];
}>;


export type SaveFavoriteMutation = { __typename?: 'Mutation', saveFavorite?: { __typename?: 'SaveWriteMutationPayload', save: Array<{ __typename?: 'PocketSave', id: string, favorite: boolean, favoritedAt?: any | null, updatedAt?: any | null }>, errors: Array<{ __typename: 'NotFound', path: string, message: string } | { __typename: 'SyncConflict', path: string, message: string }> } | null };

export type GetSavedItemsQueryVariables = Exact<{
  pagination?: InputMaybe<PaginationInput>;
  filters?: InputMaybe<SavedItemsFilter>;
  sort?: InputMaybe<SavedItemsSort>;
}>;


export type GetSavedItemsQuery = { __typename?: 'Query', user?: { __typename?: 'User', savedItems?: { __typename?: 'SavedItemConnection', edges?: Array<{ __typename?: 'SavedItemEdge', cursor: string, node?: { __typename?: 'SavedItem', id: string, status?: SavedItemStatus | null, url: string, isFavorite: boolean, isArchived: boolean, _updatedAt?: number | null, _createdAt: number, favoritedAt?: number | null, archivedAt?: number | null, item: { __typename: 'Item', itemId: string, resolvedId?: string | null, wordCount?: number | null, title?: string | null, timeToRead?: number | null, resolvedUrl?: any | null, givenUrl: any, excerpt?: string | null, domain?: string | null, isArticle?: boolean | null, isIndex?: boolean | null, hasVideo?: Videoness | null, hasImage?: Imageness | null, language?: string | null, ampUrl?: any | null, topImage?: { __typename?: 'Image', url: any } | null } | { __typename: 'PendingItem' } } | null } | null> | null } | null } | null };


export const SaveArchiveDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"saveArchive"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"timestamp"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ISOString"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"saveArchive"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"timestamp"},"value":{"kind":"Variable","name":{"kind":"Name","value":"timestamp"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"save"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"favorite"}},{"kind":"Field","name":{"kind":"Name","value":"favoritedAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BaseError"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]}}]} as unknown as DocumentNode<SaveArchiveMutation, SaveArchiveMutationVariables>;
export const SaveFavoriteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"saveFavorite"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"timestamp"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ISOString"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"saveFavorite"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"timestamp"},"value":{"kind":"Variable","name":{"kind":"Name","value":"timestamp"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"save"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"favorite"}},{"kind":"Field","name":{"kind":"Name","value":"favoritedAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BaseError"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]}}]}}]} as unknown as DocumentNode<SaveFavoriteMutation, SaveFavoriteMutationVariables>;
export const GetSavedItemsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"getSavedItems"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItemsFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sort"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"SavedItemsSort"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"savedItems"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}},{"kind":"Argument","name":{"kind":"Name","value":"sort"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sort"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cursor"}},{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"isFavorite"}},{"kind":"Field","name":{"kind":"Name","value":"isArchived"}},{"kind":"Field","name":{"kind":"Name","value":"_updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"_createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"favoritedAt"}},{"kind":"Field","name":{"kind":"Name","value":"archivedAt"}},{"kind":"Field","name":{"kind":"Name","value":"item"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Item"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"itemId"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedId"}},{"kind":"Field","name":{"kind":"Name","value":"wordCount"}},{"kind":"Field","name":{"kind":"Name","value":"topImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"timeToRead"}},{"kind":"Field","name":{"kind":"Name","value":"resolvedUrl"}},{"kind":"Field","name":{"kind":"Name","value":"givenUrl"}},{"kind":"Field","name":{"kind":"Name","value":"excerpt"}},{"kind":"Field","name":{"kind":"Name","value":"domain"}},{"kind":"Field","name":{"kind":"Name","value":"isArticle"}},{"kind":"Field","name":{"kind":"Name","value":"isIndex"}},{"kind":"Field","name":{"kind":"Name","value":"hasVideo"}},{"kind":"Field","name":{"kind":"Name","value":"hasImage"}},{"kind":"Field","name":{"kind":"Name","value":"language"}},{"kind":"Field","name":{"kind":"Name","value":"ampUrl"}}]}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetSavedItemsQuery, GetSavedItemsQueryVariables>;