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
  list: { [key: string]: ListItemObject } | []; // Can also be an empty array
  cachetype: string;
};

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

export type ListItemWithSearchHighlights = ListItemObject & SearchHighlights;
export type ListItemCompleteWithSearchHighlights = ListItemObjectComplete &
  SearchHighlights;

export type GetSearchResponseSimple = Omit<GetResponseSimple, 'list'> &
  SearchMeta & {
    list: { [key: string]: ListItemWithSearchHighlights } | never[];
  };
export type GetSearchResponseComplete = Omit<GetResponseComplete, 'list'> &
  SearchMeta & {
    list: { [key: string]: ListItemCompleteWithSearchHighlights } | never[];
  };
export type GetSearchResponseSimpleTotal = GetSearchResponseSimple & {
  total: string;
};
export type GetSearchResponseCompleteTotal = GetSearchResponseComplete & {
  total: string;
};

export type GetResponseComplete = {
  //todo: add top level fields
  //e.g status, complete - as they are not mapped by developer portal docs
  // note that complete returns 1 for detailType=simple and
  // detailType=complete when querying v3 API directly
  list: { [key: string]: ListItemObjectComplete };
  cachetype: string;
};
export type GetResponseSimpleTotal = GetResponseSimple & { total: string };
export type GetResponseCompleteTotal = GetResponseComplete & {
  total: string;
};

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
  status: '0' | '1';
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
  tags?: TagsItemObject;
  videos?: VideosItemObject;
  domain_metadata?: DomainMetadataItemObject;
  image?: BaseImageData;
};

export type SavedItemWithParserMetadata =
  AddSavedItemCompleteMutation['upsertSavedItem'];
