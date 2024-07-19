import { AddSavedItemCompleteMutation } from '../generated/graphql/types';

/**
 * Reusable types intended for use throughout the process go here.
 */

/**
 * type helper, extracts embedded array types
 */
export type Unpack<ArrType extends readonly unknown[]> =
  ArrType extends readonly (infer ElementType)[] ? ElementType : never;

/**
 * Type helper, creates a type with the same keys as another type,
 * but all string type properties. This is the type of express query
 * parameters before they are coerced to appropriate types
 */
export type ToStringParams<T> = {
  [Property in keyof T]: string;
};

export type GetResponseSimple = {
  //todo: add top level fields
  //e.g status, complete - as they are not mapped by developer portal docs
  list: { [key: string]: ListItemObject };
} & GetStaticResponse &
  GetTopLevelDefaultResponse &
  TagsList;

export type SearchMeta = {
  search_meta: {
    // Technicaly the free tier search does not include
    // these fields, but I don't see any issue being additive
    // since the data are available regardless
    total_result_count: number;
    count: number;
    offset: number;
    has_more: boolean;
  };
};

export type SearchHighlights = {
  highlights: {
    fullText: string | null;
    tags: string | null;
    title: string | null;
    url: string | null;
  } | null;
};

export type Annotation = {
  annotation_id: string;
  item_id: string;
  quote: string;
  patch: string;
  version: string;
  created_at: string;
};

export type Annotations = {
  annotations?: Annotation[];
};

export type TagsList = {
  tags?: string[];
};

export type ListItemWithSearchHighlights = ListItemObject & SearchHighlights;
export type ListItemCompleteWithSearchHighlights = ListItemObjectComplete &
  SearchHighlights;

export type GetSearchResponseSimple = Omit<GetResponseSimple, 'list'> &
  SearchMeta &
  TagsList & {
    list: { [key: string]: ListItemWithSearchHighlights } | never[];
  };
export type GetSearchResponseComplete = Omit<GetResponseComplete, 'list'> &
  SearchMeta &
  TagsList & {
    list: { [key: string]: ListItemCompleteWithSearchHighlights } | never[];
  };
export type GetSearchResponseSimpleAnnotations = Omit<
  GetResponseSimple,
  'list'
> &
  TagsList &
  SearchMeta & {
    list:
      | { [key: string]: ListItemWithSearchHighlights & Annotations }
      | never[];
  };
export type GetSearchResponseCompleteAnnotations = Omit<
  GetResponseComplete,
  'list'
> &
  TagsList &
  SearchMeta & {
    list:
      | { [key: string]: ListItemCompleteWithSearchHighlights & Annotations }
      | never[];
  };
export type GetSearchResponseSimpleTotal = GetSearchResponseSimple & {
  total: string;
};
export type GetSearchResponseCompleteTotal = GetSearchResponseComplete & {
  total: string;
};

/**
 * Represents a static response that we still need to return from Get with static
 */
export type GetStaticResponse = {
  // Always return 30.
  maxActions: number;
  cachetype: string;
};

/**
 * Represents a static response that we still need to return from Get with empty values when a client requests `shares=1`
 */
export type GetSharesResponse = {
  // empty data fields that used to have a use, but now are empty and Android will crash without.
  recent_friends: [];
  auto_complete_emails: [];
  unconfirmed_shares: [];
};

/**
 * Represents a set of fields that are always included in /v3/get responses
 */
export type GetTopLevelDefaultResponse = {
  complete: number; // 0 if preg_match('/^[0-9]*$/', $since) && $since > 0, else 1
  status: number; // 1 if no error & list > 0, 2 if no error & list == 0, 0 if error
  since: number; // unix timestamp of the last updated at in the response of items
  error: number | null; // maps to pocket error codes or null if no error
};

export type GetResponseComplete = {
  // search_meta: { search_type: 'normal' };
  list: { [key: string]: ListItemObjectComplete };
} & GetStaticResponse &
  GetTopLevelDefaultResponse &
  TagsList;

export type GetResponseSimpleTotal = GetResponseSimple & {
  total: string;
};
export type GetResponseCompleteTotal = GetResponseComplete & {
  total: string;
};

export type PassthroughResponse = {
  firstChunkSize: string; // the count of the amount we just asked for
  fetchChunkSize: string; // the count of how many the client should ask for next.
  chunk: string;
};

export type FetchResponse = {
  list: { [key: string]: ListItemObjectComplete };
  passthrough: PassthroughResponse;
} & GetResponseCompleteTotal;

// The response type for an 'add' action which is pending
// Separating because unless it's pending, some of these values
// cannot be null but instead default to empty strings or other
// default vaules (see AddResponse)
export type PendingAddResponse = {
  item: {
    item_id: string;
    normal_url: string;
    resolved_id: string;
    resolved_url: null;
    domain_id: null;
    origin_domain_id: null;
    response_code: null;
    mime_type: null;
    content_length: null;
    encoding: null;
    date_resolved: null;
    date_published: null;
    title: null;
    excerpt: null;
    word_count: null;
    innerdomain_redirect: null;
    login_required: null;
    has_image: null;
    has_video: null;
    is_index: null;
    is_article: null;
    used_fallback: null;
    lang: null;
    time_first_parsed: null;
    given_url: string;
  };
  status: 1;
};

export type AddResponse = {
  // There is some overlap with GetResponse but enough is different to warrant
  // defining them without composition (the differences aren't along an obvious
  // domain boundary)
  item: {
    item_id: string;
    normal_url: string;
    resolved_id: string;
    resolved_url: string;
    domain_id: string;
    origin_domain_id: string;
    response_code: string;
    mime_type: string; // MIME_TYPES
    content_length: string;
    encoding: string;
    date_resolved: string; // timestamp string without timezone
    date_published: string; // not nullable (deafult='0000-00-00 00:00:00')
    title: string;
    excerpt: string; // not nullable (deafult='')
    word_count: string; // stringified int; not nullable (default='0')
    innerdomain_redirect: '0' | '1';
    login_required: '0' | '1';
    has_image: '0' | '1' | '2';
    has_video: '0' | '1' | '2';
    is_index: '0' | '1';
    is_article: '0' | '1';
    used_fallback: '0' | '1';
    lang: string; // 2-letter lang code
    time_first_parsed: string; // epoch time in seconds as string
    authors: AddAuthorsObject | []; // non-nullable, non-optional (default=[])
    images: ImagesItemObject | []; // non-nullable, non-optional (default=[])
    videos: VideosItemObject | []; // non-nullable, non-optional (default=[])
    top_image_url?: string;
    resolved_normal_url: string;
    domain_metadata?: DomainMetadataItemObject;
    given_url: string;
  };
  // what does this mean
  status: 1;
};

export type TagsItemObject = {
  [tag: string]: {
    item_id: string; // item.item_id
    // Same as top-level key
    tag: string;
  };
};

export type TagItem = TagsItemObject[string];

export type ImagesItemObject = {
  [imageId: string]: BaseImageData & {
    // Same as top-level ID
    image_id: string;
    // Can be empty string
    credit: string;
    // Can be empty string
    caption: string;
  };
};

export type BaseImageData = {
  item_id: string; // item.resolved_id
  src: string;
  // Number as string
  width: string;
  // Number as string
  height: string;
};

export const VideoTypeMap = {
  YOUTUBE: '1',
  VIMEO_LINK: '2',
  VIMEO_MOOGALOOP: '3',
  VIMEO_IFRAME: '4',
  HTML5: '5',
  FLASH: '6',
  IFRAME: '7',
  BRIGHTCOVE: '8',
};

export type VideosItemObject = {
  [videoId: string]: {
    // Same as top-level ID
    video_id: string;
    item_id: string; // item.resolved_id
    src: string;
    // Number as string
    width: string;
    // Number as string
    height: string;
    type: string;
    vid: string;
    // Number as string
    length: string;
  };
};

export type AddAuthorsObject = {
  [authorId: string]: Omit<AuthorData, 'item_id'>;
};

type AuthorData = {
  item_id: string; // item.resolved_id
  // Same as top-level key
  author_id: string;
  name: string;
  url: string;
};

export type AuthorsItemObject = {
  [authorId: string]: AuthorData;
};

export type DomainMetadataItemObject = {
  // Fields exist if data is non-null
  name?: string;
  logo?: string;
  greyscale_logo?: string;
};

export type ListItemObject = {
  item_id: string;
  resolved_id: string;
  given_url: string;
  resolved_url: string;
  given_title: string;
  resolved_title: string;
  sort_id: number;
  favorite: '0' | '1';
  status: '0' | '1' | '2' | '3'; // UNREAD/ARCHIVED/DELETED/HIDDEN
  //timestamps are string in v3 response
  time_added: string;
  time_updated: string;
  time_read: string;
  time_favorited: string;
  excerpt: string;
  is_article: '0' | '1';
  is_index: '0' | '1';
  has_video: '0' | '1' | '2';
  has_image: '0' | '1' | '2';
  word_count: string;
  // Empty if unavailable, 2-letter lang code
  lang: string;
  time_to_read: number;
  tags?: TagsItemObject;
  // Not present if null
  top_image_url?: string;
  // Zero if estimate is unavailable
  listen_duration_estimate: number;
};

export type ListItemObjectComplete = ListItemObject & ListItemObjectAdditional;

export type ListItemObjectAdditional = {
  // Optional fields are included only if data is present
  authors?: AuthorsItemObject;
  images?: ImagesItemObject;
  videos?: VideosItemObject;
  domain_metadata?: DomainMetadataItemObject;
  image?: BaseImageData;
};

export type SavedItemWithParserMetadata =
  AddSavedItemCompleteMutation['upsertSavedItem'];

export type AccountResponse = {
  account: {
    user_id: string;
    username: string;
    email: string;
    birth: string;
    first_name: string;
    last_name: string;
    premium_status: string;
    is_fxa: string;
    aliases: Aliases;
    profile: Profile;
    premium_features: Array<PremiumFeatures>;
    premium_alltime_status: string;
    premium_on_trial: string;
    annotations_per_article_limit?: number;
  };
};

export type RecentSearch = {
  context_key: string;
  context_value: string;
  search: string;
  sort_id: string;
};

export type RecentSearchResponse = {
  recent_searches: Array<RecentSearch>;
};

export type Profile = {
  username: string | null;
  name: string;
  description: string | null;
  avatar_url: string;
  follower_count: string;
  follow_count: string;
  is_following: string;
  uid: string;
  type: 'pocket';
  sort_id: 1;
};

export type PremiumFeatures =
  | 'library'
  | 'suggested_tags'
  | 'premium_search'
  | 'annotations'
  | 'ad_free';

export type Aliases = {
  [key: string]: {
    email: string;
    confirmed: string;
  };
};
