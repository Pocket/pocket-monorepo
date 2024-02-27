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

export type RestResponseSimple = {
  //todo: add top level fields and sortId
  //e.g status, complete - as they are not mapped by developer portal docs
  list: { [key: string]: ListItemObject };
  cacheType: string;
};
export type RestResponseComplete = {
  //todo: add top level fields
  //e.g status, complete - as they are not mapped by developer portal docs
  // note that complete returns 1 for detailType=simple and
  // detailType=complete when querying v3 API directly
  list: { [key: string]: ListItemObjectComplete };
  cacheType: string;
};

export type TagsItemObject = {
  [tag: string]: {
    item_id: string;
    // Same as top-level key
    tag: string;
  };
};

export type TagItem = TagsItemObject[string];

export type ImagesItemObject = {
  [imageId: string]: ImageDataBase & {
    // Same as top-level ID
    image_id: string;
    // Can be empty string
    credit: string;
    // Can be empty string
    caption: string;
  };
};

export type ImageDataBase = {
  item_id: string;
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
    item_id: string;
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

export type AuthorsItemObject = {
  [authorId: string]: {
    item_id: string;
    // Same as top-level key
    author_id: string;
    name: string;
    url: string;
  };
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
  has_video: '0' | '1';
  has_image: '0' | '1';
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
  image?: ImageDataBase;
};
