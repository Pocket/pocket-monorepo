// THIS FILE IS GENERATED, DO NOT EDIT!
/* eslint-disable */
/* tslint:disable */
import { GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { GraphQLResolveInfoWithCacheControl as GraphQLResolveInfo } from '@apollo/cache-control-types';
import { IContext } from '../apollo/context';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A String representing a date in the format of `yyyy-MM-dd HH:mm:ss` */
  DateString: { input: any; output: any; }
  /**
   * ISOString scalar - all datetimes fields are Typescript Date objects on this server &
   * returned as ISO-8601 encoded date strings (e.g. ISOString scalars) to GraphQL clients.
   * See Section 5.6 of the RFC 3339 profile of the ISO 8601 standard: https://www.ietf.org/rfc/rfc3339.txt.
   */
  ISOString: { input: any; output: any; }
  /**
   * A string formatted with CommonMark markdown,
   * plus the strikethrough extension from GFM.
   * This Scalar is for documentation purposes; otherwise
   * not treated differently from String in the API.
   */
  Markdown: { input: any; output: any; }
  /** A String in the format of a url. */
  Url: { input: any; output: any; }
  ValidUrl: { input: any; output: any; }
  _FieldSet: { input: any; output: any; }
};

export type ArticleMarkdown = {
  __typename?: 'ArticleMarkdown';
  images?: Maybe<Array<MarkdownImagePosition>>;
  text: Scalars['String']['output'];
};

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

/** Row in a bulleted (unordered list) */
export type BulletedListElement = ListElement & {
  __typename?: 'BulletedListElement';
  /** Row in a list. */
  content: Scalars['Markdown']['output'];
  /** Zero-indexed level, for handling nested lists. */
  level: Scalars['Int']['output'];
};

export enum CacheControlScope {
  Private = 'PRIVATE',
  Public = 'PUBLIC'
}

export type Collection = {
  __typename?: 'Collection';
  /**
   * Provides short url for the given_url in the format: https://pocket.co/<identifier>.
   * marked as beta because it's not ready yet for large client request.
   */
  shortUrl?: Maybe<Scalars['Url']['output']>;
  slug: Scalars['String']['output'];
};

export type CorpusItem = {
  __typename?: 'CorpusItem';
  /**
   * Provides short url for the given_url in the format: https://pocket.co/<identifier>.
   * marked as beta because it's not ready yet for large client request.
   */
  shortUrl?: Maybe<Scalars['Url']['output']>;
  /** Time to read in minutes. Is nullable. */
  timeToRead?: Maybe<Scalars['Int']['output']>;
  url: Scalars['Url']['output'];
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

/** An image, typically a thumbnail or article view image for an Item */
export type Image = {
  __typename?: 'Image';
  /** A caption or description of the image */
  caption?: Maybe<Scalars['String']['output']>;
  /** A credit for the image, typically who the image belongs to / created by */
  credit?: Maybe<Scalars['String']['output']>;
  /** If known, the height of the image in px */
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
  /** Absolute url to the image */
  url: Scalars['Url']['output'];
  /** If known, the width of the image in px */
  width?: Maybe<Scalars['Int']['output']>;
};

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
  /**
   * The url as provided by the user when saving. Only http or https schemes allowed.
   *
   * CAUTION: this value will *likely* (but not always) change depending on which query is used.
   * itemByItemId will return the normalUrl value here (which is a bug?). itemByUrl will return
   * the URL value passed in to the query. As if that weren't complicated enough, sometimes
   * normalUrl and givenUrl are the same (but not usually).
   */
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
  /** A server generated unique id for this item. Item's whose normalUrl are the same will have the same item_id. Most likely numeric, but to ensure future proofing this can be treated as a String in apps. */
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
  /**
   * Provides short url for the given_url in the format: https://pocket.co/<identifier>.
   * marked as beta because it's not ready yet for large client request.
   */
  shortUrl?: Maybe<Scalars['Url']['output']>;
  /** If the url is an Article, the text in SSML format for speaking, i.e. Listen */
  ssml?: Maybe<Scalars['String']['output']>;
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

export type ItemNotFound = {
  __typename?: 'ItemNotFound';
  message?: Maybe<Scalars['String']['output']>;
};

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

export type ListElement = {
  /** Row in a list. */
  content: Scalars['Markdown']['output'];
  /** Zero-indexed level, for handling nested lists. */
  level: Scalars['Int']['output'];
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

export type Mutation = {
  __typename?: 'Mutation';
  /** Refresh an Item's article content. */
  refreshItemArticle: Item;
};


export type MutationrefreshItemArticleArgs = {
  url: Scalars['String']['input'];
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
  url: Scalars['Url']['output'];
};

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

export type PocketShare = {
  __typename?: 'PocketShare';
  preview?: Maybe<PocketMetadata>;
  targetUrl: Scalars['ValidUrl']['output'];
};

export type Query = {
  __typename?: 'Query';
  /**
   * Look up Item info by a url.
   * @deprecated Use itemByUrl instead
   */
  getItemByUrl?: Maybe<Item>;
  /** Look up Item info by a url. */
  itemByUrl?: Maybe<Item>;
  /**
   * Resolve Reader View links which might point to SavedItems that do not
   * exist, aren't in the Pocket User's list, or are requested by a logged-out
   * user (or user without a Pocket Account).
   * Fetches data to create an interstitial page/modal so the visitor can click
   * through to the shared site.
   */
  readerSlug: ReaderViewResult;
};


export type QuerygetItemByUrlArgs = {
  url: Scalars['String']['input'];
};


export type QueryitemByUrlArgs = {
  url: Scalars['String']['input'];
};


export type QueryreaderSlugArgs = {
  slug: Scalars['ID']['input'];
};

export type ReaderFallback = ItemNotFound | ReaderInterstitial;

export type ReaderInterstitial = {
  __typename?: 'ReaderInterstitial';
  itemCard?: Maybe<PocketMetadata>;
};

export type ReaderViewResult = {
  __typename?: 'ReaderViewResult';
  fallbackPage?: Maybe<ReaderFallback>;
  slug: Scalars['ID']['output'];
};

/** Represents content that could not be parsed into a valid Marticle* component. */
export type UnMarseable = {
  __typename?: 'UnMarseable';
  /** The html that could not be parsed into a Marticle* component. */
  html: Scalars['String']['output'];
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

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;

export type ReferenceResolver<TResult, TReference, TContext> = (
      reference: TReference,
      context: TContext,
      info: GraphQLResolveInfo
    ) => Promise<TResult> | TResult;

      type ScalarCheck<T, S> = S extends true ? T : NullableCheck<T, S>;
      type NullableCheck<T, S> = Maybe<T> extends T ? Maybe<ListCheck<NonNullable<T>, S>> : ListCheck<T, S>;
      type ListCheck<T, S> = T extends (infer U)[] ? NullableCheck<U, S>[] : GraphQLRecursivePick<T, S>;
      export type GraphQLRecursivePick<T, S> = { [K in keyof T & keyof S]: ScalarCheck<T[K], S[K]> };
    

export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping of union types */
export type ResolversUnionTypes<RefType extends Record<string, unknown>> = ResolversObject<{
  MarticleComponent: ( Image ) | ( MarticleBlockquote ) | ( MarticleBulletedList ) | ( MarticleCodeBlock ) | ( MarticleDivider ) | ( MarticleHeading ) | ( MarticleNumberedList ) | ( MarticleTable ) | ( MarticleText ) | ( UnMarseable ) | ( Video );
  ReaderFallback: ( ItemNotFound ) | ( ReaderInterstitial );
}>;

/** Mapping of interface types */
export type ResolversInterfaceTypes<RefType extends Record<string, unknown>> = ResolversObject<{
  ListElement: ( BulletedListElement ) | ( NumberedListElement );
  PocketMetadata: ( ItemSummary ) | ( OEmbed );
}>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  ArticleMarkdown: ResolverTypeWrapper<ArticleMarkdown>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Author: ResolverTypeWrapper<Author>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  BulletedListElement: ResolverTypeWrapper<BulletedListElement>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  CacheControlScope: CacheControlScope;
  Collection: ResolverTypeWrapper<Collection>;
  CorpusItem: ResolverTypeWrapper<CorpusItem>;
  DateString: ResolverTypeWrapper<Scalars['DateString']['output']>;
  DomainMetadata: ResolverTypeWrapper<DomainMetadata>;
  ISOString: ResolverTypeWrapper<Scalars['ISOString']['output']>;
  Image: ResolverTypeWrapper<Image>;
  Imageness: Imageness;
  Item: ResolverTypeWrapper<Omit<Item, 'marticle'> & { marticle?: Maybe<Array<ResolversTypes['MarticleComponent']>> }>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  ItemNotFound: ResolverTypeWrapper<ItemNotFound>;
  ItemSummary: ResolverTypeWrapper<ItemSummary>;
  ListElement: ResolverTypeWrapper<ResolversInterfaceTypes<ResolversTypes>['ListElement']>;
  Markdown: ResolverTypeWrapper<Scalars['Markdown']['output']>;
  MarkdownImagePosition: ResolverTypeWrapper<MarkdownImagePosition>;
  MarticleBlockquote: ResolverTypeWrapper<MarticleBlockquote>;
  MarticleBulletedList: ResolverTypeWrapper<MarticleBulletedList>;
  MarticleCodeBlock: ResolverTypeWrapper<MarticleCodeBlock>;
  MarticleComponent: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['MarticleComponent']>;
  MarticleDivider: ResolverTypeWrapper<MarticleDivider>;
  MarticleHeading: ResolverTypeWrapper<MarticleHeading>;
  MarticleNumberedList: ResolverTypeWrapper<MarticleNumberedList>;
  MarticleTable: ResolverTypeWrapper<MarticleTable>;
  MarticleText: ResolverTypeWrapper<MarticleText>;
  Mutation: ResolverTypeWrapper<{}>;
  NumberedListElement: ResolverTypeWrapper<NumberedListElement>;
  OEmbed: ResolverTypeWrapper<OEmbed>;
  PocketMetadata: ResolverTypeWrapper<ResolversInterfaceTypes<ResolversTypes>['PocketMetadata']>;
  PocketMetadataSource: PocketMetadataSource;
  PocketShare: ResolverTypeWrapper<PocketShare>;
  Query: ResolverTypeWrapper<{}>;
  ReaderFallback: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['ReaderFallback']>;
  ReaderInterstitial: ResolverTypeWrapper<ReaderInterstitial>;
  ReaderViewResult: ResolverTypeWrapper<Omit<ReaderViewResult, 'fallbackPage'> & { fallbackPage?: Maybe<ResolversTypes['ReaderFallback']> }>;
  UnMarseable: ResolverTypeWrapper<UnMarseable>;
  Url: ResolverTypeWrapper<Scalars['Url']['output']>;
  ValidUrl: ResolverTypeWrapper<Scalars['ValidUrl']['output']>;
  Video: ResolverTypeWrapper<Video>;
  VideoType: VideoType;
  Videoness: Videoness;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  ArticleMarkdown: ArticleMarkdown;
  String: Scalars['String']['output'];
  Author: Author;
  ID: Scalars['ID']['output'];
  BulletedListElement: BulletedListElement;
  Int: Scalars['Int']['output'];
  Collection: Collection;
  CorpusItem: CorpusItem;
  DateString: Scalars['DateString']['output'];
  DomainMetadata: DomainMetadata;
  ISOString: Scalars['ISOString']['output'];
  Image: Image;
  Item: Omit<Item, 'marticle'> & { marticle?: Maybe<Array<ResolversParentTypes['MarticleComponent']>> };
  Boolean: Scalars['Boolean']['output'];
  ItemNotFound: ItemNotFound;
  ItemSummary: ItemSummary;
  ListElement: ResolversInterfaceTypes<ResolversParentTypes>['ListElement'];
  Markdown: Scalars['Markdown']['output'];
  MarkdownImagePosition: MarkdownImagePosition;
  MarticleBlockquote: MarticleBlockquote;
  MarticleBulletedList: MarticleBulletedList;
  MarticleCodeBlock: MarticleCodeBlock;
  MarticleComponent: ResolversUnionTypes<ResolversParentTypes>['MarticleComponent'];
  MarticleDivider: MarticleDivider;
  MarticleHeading: MarticleHeading;
  MarticleNumberedList: MarticleNumberedList;
  MarticleTable: MarticleTable;
  MarticleText: MarticleText;
  Mutation: {};
  NumberedListElement: NumberedListElement;
  OEmbed: OEmbed;
  PocketMetadata: ResolversInterfaceTypes<ResolversParentTypes>['PocketMetadata'];
  PocketShare: PocketShare;
  Query: {};
  ReaderFallback: ResolversUnionTypes<ResolversParentTypes>['ReaderFallback'];
  ReaderInterstitial: ReaderInterstitial;
  ReaderViewResult: Omit<ReaderViewResult, 'fallbackPage'> & { fallbackPage?: Maybe<ResolversParentTypes['ReaderFallback']> };
  UnMarseable: UnMarseable;
  Url: Scalars['Url']['output'];
  ValidUrl: Scalars['ValidUrl']['output'];
  Video: Video;
}>;

export type cacheControlDirectiveArgs = {
  maxAge?: Maybe<Scalars['Int']['input']>;
  scope?: Maybe<CacheControlScope>;
};

export type cacheControlDirectiveResolver<Result, Parent, ContextType = IContext, Args = cacheControlDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type ArticleMarkdownResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['ArticleMarkdown'] = ResolversParentTypes['ArticleMarkdown']> = ResolversObject<{
  images?: Resolver<Maybe<Array<ResolversTypes['MarkdownImagePosition']>>, ParentType, ContextType>;
  text?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AuthorResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['Author'] = ResolversParentTypes['Author']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type BulletedListElementResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['BulletedListElement'] = ResolversParentTypes['BulletedListElement']> = ResolversObject<{
  content?: Resolver<ResolversTypes['Markdown'], ParentType, ContextType>;
  level?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CollectionResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['Collection'] = ResolversParentTypes['Collection']> = ResolversObject<{
  __resolveReference?: ReferenceResolver<Maybe<ResolversTypes['Collection']>, { __typename: 'Collection' } & GraphQLRecursivePick<ParentType, {"slug":true}>, ContextType>;
  shortUrl?: Resolver<Maybe<ResolversTypes['Url']>, { __typename: 'Collection' } & GraphQLRecursivePick<ParentType, {"slug":true}>, ContextType>;

  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type CorpusItemResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['CorpusItem'] = ResolversParentTypes['CorpusItem']> = ResolversObject<{
  __resolveReference?: ReferenceResolver<Maybe<ResolversTypes['CorpusItem']>, { __typename: 'CorpusItem' } & GraphQLRecursivePick<ParentType, {"url":true}>, ContextType>;
  shortUrl?: Resolver<Maybe<ResolversTypes['Url']>, { __typename: 'CorpusItem' } & GraphQLRecursivePick<ParentType, {"url":true}>, ContextType>;
  timeToRead?: Resolver<Maybe<ResolversTypes['Int']>, { __typename: 'CorpusItem' } & GraphQLRecursivePick<ParentType, {"url":true}>, ContextType>;

  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface DateStringScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateString'], any> {
  name: 'DateString';
}

export type DomainMetadataResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['DomainMetadata'] = ResolversParentTypes['DomainMetadata']> = ResolversObject<{
  logo?: Resolver<Maybe<ResolversTypes['Url']>, ParentType, ContextType>;
  logoGreyscale?: Resolver<Maybe<ResolversTypes['Url']>, ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface ISOStringScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['ISOString'], any> {
  name: 'ISOString';
}

export type ImageResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['Image'] = ResolversParentTypes['Image']> = ResolversObject<{
  __resolveReference?: ReferenceResolver<Maybe<ResolversTypes['Image']>, { __typename: 'Image' } & GraphQLRecursivePick<ParentType, {"url":true}>, ContextType>;
  caption?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  credit?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  height?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  imageId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  src?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  targetUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  url?: Resolver<ResolversTypes['Url'], ParentType, ContextType>;
  width?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ItemResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['Item'] = ResolversParentTypes['Item']> = ResolversObject<{
  __resolveReference?: ReferenceResolver<Maybe<ResolversTypes['Item']>, { __typename: 'Item' } & (GraphQLRecursivePick<ParentType, {"givenUrl":true}> | GraphQLRecursivePick<ParentType, {"itemId":true}>), ContextType>;
  ampUrl?: Resolver<Maybe<ResolversTypes['Url']>, ParentType, ContextType>;
  article?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  authors?: Resolver<Maybe<Array<Maybe<ResolversTypes['Author']>>>, ParentType, ContextType>;
  contentLength?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  datePublished?: Resolver<Maybe<ResolversTypes['DateString']>, ParentType, ContextType>;
  dateResolved?: Resolver<Maybe<ResolversTypes['DateString']>, ParentType, ContextType>;
  domain?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  domainId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  domainMetadata?: Resolver<Maybe<ResolversTypes['DomainMetadata']>, ParentType, ContextType>;
  encoding?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  excerpt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  givenUrl?: Resolver<ResolversTypes['Url'], ParentType, ContextType>;
  hasImage?: Resolver<Maybe<ResolversTypes['Imageness']>, ParentType, ContextType>;
  hasOldDupes?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  hasVideo?: Resolver<Maybe<ResolversTypes['Videoness']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  images?: Resolver<Maybe<Array<Maybe<ResolversTypes['Image']>>>, ParentType, ContextType>;
  innerDomainRedirect?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  isArticle?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  isIndex?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  itemId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  language?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  listenDuration?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  loginRequired?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  marticle?: Resolver<Maybe<Array<ResolversTypes['MarticleComponent']>>, ParentType, ContextType>;
  mimeType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  normalUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  originDomainId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  preview?: Resolver<Maybe<ResolversTypes['PocketMetadata']>, ParentType, ContextType>;
  readerSlug?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  resolvedId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  resolvedNormalUrl?: Resolver<Maybe<ResolversTypes['Url']>, ParentType, ContextType>;
  resolvedUrl?: Resolver<Maybe<ResolversTypes['Url']>, ParentType, ContextType>;
  responseCode?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  shortUrl?: Resolver<Maybe<ResolversTypes['Url']>, ParentType, ContextType>;
  ssml?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  timeFirstParsed?: Resolver<Maybe<ResolversTypes['DateString']>, ParentType, ContextType>;
  timeToRead?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  topImage?: Resolver<Maybe<ResolversTypes['Image']>, ParentType, ContextType>;
  topImageUrl?: Resolver<Maybe<ResolversTypes['Url']>, ParentType, ContextType>;
  usedFallback?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  videos?: Resolver<Maybe<Array<Maybe<ResolversTypes['Video']>>>, ParentType, ContextType>;
  wordCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ItemNotFoundResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['ItemNotFound'] = ResolversParentTypes['ItemNotFound']> = ResolversObject<{
  message?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ItemSummaryResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['ItemSummary'] = ResolversParentTypes['ItemSummary']> = ResolversObject<{
  authors?: Resolver<Maybe<Array<ResolversTypes['Author']>>, ParentType, ContextType>;
  datePublished?: Resolver<Maybe<ResolversTypes['ISOString']>, ParentType, ContextType>;
  domain?: Resolver<Maybe<ResolversTypes['DomainMetadata']>, ParentType, ContextType>;
  excerpt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  image?: Resolver<Maybe<ResolversTypes['Image']>, ParentType, ContextType>;
  item?: Resolver<Maybe<ResolversTypes['Item']>, ParentType, ContextType>;
  source?: Resolver<ResolversTypes['PocketMetadataSource'], ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  url?: Resolver<ResolversTypes['Url'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ListElementResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['ListElement'] = ResolversParentTypes['ListElement']> = ResolversObject<{
  __resolveType: TypeResolveFn<'BulletedListElement' | 'NumberedListElement', ParentType, ContextType>;
  content?: Resolver<ResolversTypes['Markdown'], ParentType, ContextType>;
  level?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
}>;

export interface MarkdownScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Markdown'], any> {
  name: 'Markdown';
}

export type MarkdownImagePositionResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['MarkdownImagePosition'] = ResolversParentTypes['MarkdownImagePosition']> = ResolversObject<{
  index?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  position?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  src?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MarticleBlockquoteResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['MarticleBlockquote'] = ResolversParentTypes['MarticleBlockquote']> = ResolversObject<{
  content?: Resolver<ResolversTypes['Markdown'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MarticleBulletedListResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['MarticleBulletedList'] = ResolversParentTypes['MarticleBulletedList']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['BulletedListElement']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MarticleCodeBlockResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['MarticleCodeBlock'] = ResolversParentTypes['MarticleCodeBlock']> = ResolversObject<{
  language?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  text?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MarticleComponentResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['MarticleComponent'] = ResolversParentTypes['MarticleComponent']> = ResolversObject<{
  __resolveType: TypeResolveFn<'Image' | 'MarticleBlockquote' | 'MarticleBulletedList' | 'MarticleCodeBlock' | 'MarticleDivider' | 'MarticleHeading' | 'MarticleNumberedList' | 'MarticleTable' | 'MarticleText' | 'UnMarseable' | 'Video', ParentType, ContextType>;
}>;

export type MarticleDividerResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['MarticleDivider'] = ResolversParentTypes['MarticleDivider']> = ResolversObject<{
  content?: Resolver<ResolversTypes['Markdown'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MarticleHeadingResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['MarticleHeading'] = ResolversParentTypes['MarticleHeading']> = ResolversObject<{
  content?: Resolver<ResolversTypes['Markdown'], ParentType, ContextType>;
  level?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MarticleNumberedListResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['MarticleNumberedList'] = ResolversParentTypes['MarticleNumberedList']> = ResolversObject<{
  rows?: Resolver<Array<ResolversTypes['NumberedListElement']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MarticleTableResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['MarticleTable'] = ResolversParentTypes['MarticleTable']> = ResolversObject<{
  html?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MarticleTextResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['MarticleText'] = ResolversParentTypes['MarticleText']> = ResolversObject<{
  content?: Resolver<ResolversTypes['Markdown'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MutationResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = ResolversObject<{
  refreshItemArticle?: Resolver<ResolversTypes['Item'], ParentType, ContextType, RequireFields<MutationrefreshItemArticleArgs, 'url'>>;
}>;

export type NumberedListElementResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['NumberedListElement'] = ResolversParentTypes['NumberedListElement']> = ResolversObject<{
  content?: Resolver<ResolversTypes['Markdown'], ParentType, ContextType>;
  index?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  level?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type OEmbedResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['OEmbed'] = ResolversParentTypes['OEmbed']> = ResolversObject<{
  authors?: Resolver<Maybe<Array<ResolversTypes['Author']>>, ParentType, ContextType>;
  datePublished?: Resolver<Maybe<ResolversTypes['ISOString']>, ParentType, ContextType>;
  domain?: Resolver<Maybe<ResolversTypes['DomainMetadata']>, ParentType, ContextType>;
  excerpt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  htmlEmbed?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  image?: Resolver<Maybe<ResolversTypes['Image']>, ParentType, ContextType>;
  item?: Resolver<Maybe<ResolversTypes['Item']>, ParentType, ContextType>;
  source?: Resolver<ResolversTypes['PocketMetadataSource'], ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  url?: Resolver<ResolversTypes['Url'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type PocketMetadataResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['PocketMetadata'] = ResolversParentTypes['PocketMetadata']> = ResolversObject<{
  __resolveType: TypeResolveFn<'ItemSummary' | 'OEmbed', ParentType, ContextType>;
  authors?: Resolver<Maybe<Array<ResolversTypes['Author']>>, ParentType, ContextType>;
  datePublished?: Resolver<Maybe<ResolversTypes['ISOString']>, ParentType, ContextType>;
  domain?: Resolver<Maybe<ResolversTypes['DomainMetadata']>, ParentType, ContextType>;
  excerpt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  image?: Resolver<Maybe<ResolversTypes['Image']>, ParentType, ContextType>;
  item?: Resolver<Maybe<ResolversTypes['Item']>, ParentType, ContextType>;
  source?: Resolver<ResolversTypes['PocketMetadataSource'], ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  url?: Resolver<ResolversTypes['Url'], ParentType, ContextType>;
}>;

export type PocketShareResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['PocketShare'] = ResolversParentTypes['PocketShare']> = ResolversObject<{
  __resolveReference?: ReferenceResolver<Maybe<ResolversTypes['PocketShare']>, { __typename: 'PocketShare' } & GraphQLRecursivePick<ParentType, {"targetUrl":true}>, ContextType>;
  preview?: Resolver<Maybe<ResolversTypes['PocketMetadata']>, ParentType, ContextType>;
  targetUrl?: Resolver<ResolversTypes['ValidUrl'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type QueryResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  getItemByUrl?: Resolver<Maybe<ResolversTypes['Item']>, ParentType, ContextType, RequireFields<QuerygetItemByUrlArgs, 'url'>>;
  itemByUrl?: Resolver<Maybe<ResolversTypes['Item']>, ParentType, ContextType, RequireFields<QueryitemByUrlArgs, 'url'>>;
  readerSlug?: Resolver<ResolversTypes['ReaderViewResult'], ParentType, ContextType, RequireFields<QueryreaderSlugArgs, 'slug'>>;
}>;

export type ReaderFallbackResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['ReaderFallback'] = ResolversParentTypes['ReaderFallback']> = ResolversObject<{
  __resolveType: TypeResolveFn<'ItemNotFound' | 'ReaderInterstitial', ParentType, ContextType>;
}>;

export type ReaderInterstitialResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['ReaderInterstitial'] = ResolversParentTypes['ReaderInterstitial']> = ResolversObject<{
  itemCard?: Resolver<Maybe<ResolversTypes['PocketMetadata']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type ReaderViewResultResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['ReaderViewResult'] = ResolversParentTypes['ReaderViewResult']> = ResolversObject<{
  __resolveReference?: ReferenceResolver<Maybe<ResolversTypes['ReaderViewResult']>, { __typename: 'ReaderViewResult' } & GraphQLRecursivePick<ParentType, {"slug":true}>, ContextType>;
  fallbackPage?: Resolver<Maybe<ResolversTypes['ReaderFallback']>, ParentType, ContextType>;
  slug?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UnMarseableResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['UnMarseable'] = ResolversParentTypes['UnMarseable']> = ResolversObject<{
  html?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface UrlScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Url'], any> {
  name: 'Url';
}

export interface ValidUrlScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['ValidUrl'], any> {
  name: 'ValidUrl';
}

export type VideoResolvers<ContextType = IContext, ParentType extends ResolversParentTypes['Video'] = ResolversParentTypes['Video']> = ResolversObject<{
  height?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  length?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  src?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['VideoType'], ParentType, ContextType>;
  vid?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  videoId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  width?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = IContext> = ResolversObject<{
  ArticleMarkdown?: ArticleMarkdownResolvers<ContextType>;
  Author?: AuthorResolvers<ContextType>;
  BulletedListElement?: BulletedListElementResolvers<ContextType>;
  Collection?: CollectionResolvers<ContextType>;
  CorpusItem?: CorpusItemResolvers<ContextType>;
  DateString?: GraphQLScalarType;
  DomainMetadata?: DomainMetadataResolvers<ContextType>;
  ISOString?: GraphQLScalarType;
  Image?: ImageResolvers<ContextType>;
  Item?: ItemResolvers<ContextType>;
  ItemNotFound?: ItemNotFoundResolvers<ContextType>;
  ItemSummary?: ItemSummaryResolvers<ContextType>;
  ListElement?: ListElementResolvers<ContextType>;
  Markdown?: GraphQLScalarType;
  MarkdownImagePosition?: MarkdownImagePositionResolvers<ContextType>;
  MarticleBlockquote?: MarticleBlockquoteResolvers<ContextType>;
  MarticleBulletedList?: MarticleBulletedListResolvers<ContextType>;
  MarticleCodeBlock?: MarticleCodeBlockResolvers<ContextType>;
  MarticleComponent?: MarticleComponentResolvers<ContextType>;
  MarticleDivider?: MarticleDividerResolvers<ContextType>;
  MarticleHeading?: MarticleHeadingResolvers<ContextType>;
  MarticleNumberedList?: MarticleNumberedListResolvers<ContextType>;
  MarticleTable?: MarticleTableResolvers<ContextType>;
  MarticleText?: MarticleTextResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  NumberedListElement?: NumberedListElementResolvers<ContextType>;
  OEmbed?: OEmbedResolvers<ContextType>;
  PocketMetadata?: PocketMetadataResolvers<ContextType>;
  PocketShare?: PocketShareResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  ReaderFallback?: ReaderFallbackResolvers<ContextType>;
  ReaderInterstitial?: ReaderInterstitialResolvers<ContextType>;
  ReaderViewResult?: ReaderViewResultResolvers<ContextType>;
  UnMarseable?: UnMarseableResolvers<ContextType>;
  Url?: GraphQLScalarType;
  ValidUrl?: GraphQLScalarType;
  Video?: VideoResolvers<ContextType>;
}>;

export type DirectiveResolvers<ContextType = IContext> = ResolversObject<{
  cacheControl?: cacheControlDirectiveResolver<any, any, ContextType>;
}>;
