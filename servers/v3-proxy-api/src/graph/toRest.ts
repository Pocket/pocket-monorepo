/**
 * method to convert graph responses to REST responses
 */

import {
  GetSavedItemsByOffsetCompleteQuery,
  Tag,
  Author,
  DomainMetadata,
  Image,
  Video,
  GetSavedItemsByOffsetSimpleQuery,
  Imageness,
  Videoness,
} from '../generated/graphql/types';
import {
  TagsItemObject,
  AuthorsItemObject,
  DomainMetadataItemObject,
  ImagesItemObject,
  VideosItemObject,
  VideoTypeMap,
  ListItemObject,
  ListItemObjectComplete,
  ListItemObjectAdditional,
} from './types';
import { RestResponseSimple, RestResponseComplete } from './types';

export function TagsReducer(
  tags: Array<Pick<Tag, 'name'>> | undefined,
  itemId: string,
): TagsItemObject | undefined {
  if (tags == null) {
    return undefined;
  }
  return tags.reduce((tagsObj, tag) => {
    tagsObj[tag.name] = {
      tag: tag.name,
      item_id: itemId,
    };
    return tagsObj;
  }, {} as TagsItemObject);
}

export function AuthorsReducer(
  authors: Author[] | undefined,
  itemId: string,
): AuthorsItemObject | undefined {
  if (authors == null) {
    return undefined;
  }
  return authors.reduce((authorsObj, author) => {
    authorsObj[author.id] = {
      item_id: itemId,
      author_id: author.id,
      name: author.name,
      url: author.url,
    };
    return authorsObj;
  }, {} as AuthorsItemObject);
}

export function ImagesReducer(
  images: Array<Omit<Image, 'src'>> | undefined,
  itemId: string,
): ImagesItemObject | undefined {
  if (images == null) {
    return undefined;
  }
  return images.reduce((imagesObj, image) => {
    imagesObj[image.imageId.toString()] = {
      item_id: itemId,
      image_id: image.imageId.toString(),
      src: image.url,
      width: image.width.toString() ?? '0',
      height: image.height.toString() ?? '0',
      credit: image.credit ?? '',
      caption: image.caption ?? '',
    };
    return imagesObj;
  }, {} as ImagesItemObject);
}

export function VideosReducer(
  videos: Video[] | undefined,
  itemId: string,
): VideosItemObject | undefined {
  if (videos == null) {
    return undefined;
  }
  return videos.reduce((videosObj, video) => {
    videosObj[video.videoId.toString()] = {
      item_id: itemId,
      video_id: video.videoId.toString(),
      src: video.src,
      width: (video.width ?? 0).toString(),
      height: (video.height ?? 0).toString(),
      type: VideoTypeMap[video.type],
      length: (video.length ?? 0).toString(),
      vid: video.vid,
    };
    return videosObj;
  }, {} as VideosItemObject);
}

export function DomainMetadataTransformer(
  metadata: DomainMetadata | undefined,
): DomainMetadataItemObject {
  return {
    name: metadata.name,
    logo: metadata.logo,
    greyscale_logo: metadata.logoGreyscale,
  };
}

type SavedItemSimple =
  GetSavedItemsByOffsetSimpleQuery['user']['savedItemsByOffset']['entries'][number];

type SavedItemComplete =
  GetSavedItemsByOffsetCompleteQuery['user']['savedItemsByOffset']['entries'][number];

export function ListItemTransformerSimple(
  savedItem: SavedItemSimple,
  index: number,
): ListItemObject {
  return ListItemTransformer(savedItem, index);
}
export function ListItemTransformerComplete(
  savedItem: SavedItemComplete,
  index: number,
): ListItemObjectComplete {
  const simple = ListItemTransformer(savedItem, index);
  if (savedItem.item.__typename === 'PendingItem') {
    return simple;
  }
  const completeFieldMap = {
    authors: AuthorsReducer(savedItem.item.authors, savedItem.id),
    domain_metadata: DomainMetadataTransformer(savedItem.item.domainMetadata),
    images: ImagesReducer(savedItem.item.images, savedItem.id),
    tags: TagsReducer(savedItem.tags, savedItem.id),
    videos: VideosReducer(savedItem.item.videos, savedItem.id),
  };
  const complete = Object.entries(completeFieldMap).reduce(
    (complete, [k, v]) => {
      if (v !== undefined) {
        complete[k] = v;
      }
      return complete;
    },
    {} as ListItemObjectAdditional,
  );
  return { ...simple, ...complete };
}
export function ListItemTransformer(
  savedItem: SavedItemSimple | SavedItemComplete,
  index: number,
): ListItemObject | ListItemObjectComplete {
  const baseFields = {
    item_id: savedItem.id,
    favorite: savedItem.isFavorite ? ('1' as const) : ('0' as const),
    status: savedItem.isArchived ? ('0' as const) : ('1' as const),
    time_added: savedItem._createdAt?.toString(),
    time_updated: savedItem._updatedAt?.toString(),
    time_read: savedItem.archivedAt?.toString(),
    time_favorited: savedItem.favoritedAt?.toString(),
    // TODO @kschelonka
    listen_duration_estimate: 0,
    sort_id: index,
  };
  switch (savedItem.item.__typename) {
    case 'PendingItem':
      // This case shouldn't happen, but we set values to defaults
      // if there isn't an item
      return {
        ...baseFields,
        resolved_id: '',
        given_url: '',
        given_title: '',
        resolved_title: '',
        resolved_url: '',
        title: '',
        excerpt: '',
        is_article: '0' as const,
        is_index: '0' as const,
        has_video: '0' as const,
        has_image: '0' as const,
        word_count: '0',
        lang: '',
        time_to_read: 0,
        amp_url: '',
        top_image_url: '',
      };
    case 'Item':
      return {
        ...baseFields,
        // Most of these that default to empty strings should never
        // be undefined in practice, but we will provide defaults to
        // properly conform to expected type
        resolved_id: savedItem.item.resolvedId ?? '',
        given_url: savedItem.item.givenUrl ?? '',
        given_title: savedItem.item.title ?? '',
        resolved_title: savedItem.item.title ?? '',
        resolved_url: savedItem.item.resolvedUrl ?? '',
        title: savedItem.item.title ?? '',
        excerpt: savedItem.item.excerpt ?? '',
        is_article: savedItem.item.isArticle ? ('1' as const) : ('0' as const),
        is_index: savedItem.item.isIndex ? ('1' as const) : ('0' as const),
        has_video: convertHasVideo(savedItem.item.hasVideo),
        has_image: convertHasImage(savedItem.item.hasImage),
        word_count: (savedItem.item.wordCount ?? 0).toString(),
        lang: savedItem.item.language ?? '',
        time_to_read: savedItem.item.timeToRead ?? 0,
        amp_url: savedItem.item.ampUrl ?? '',
        top_image_url: savedItem.item.topImage?.url ?? '',
      };
  }
}

/**
 * process if the item fields are populated. if its pendingItem, we just return null
 * @param savedItem
 */

function convertHasImage(imageStatus: Imageness) {
  switch (imageStatus) {
    case Imageness.IsImage:
    case Imageness.HasImages:
      return '1' as const;
    case Imageness.NoImages:
      return '0' as const;
    default:
      return '0' as const;
  }
}

function convertHasVideo(videoStatus: Videoness) {
  switch (videoStatus) {
    case Videoness.HasVideos:
    case Videoness.IsVideo:
      return '1' as const;
    case Videoness.NoVideos:
      return '0' as const;
    default:
      return '0' as const;
  }
}

/**
 * converts list to map
 * @param input list of entities
 * @param key key to assign the entity
 */
function listToMap<T>(input: T[], key: string): { [key: string]: T } {
  return input.reduce((map, item) => {
    map[item[key]] = item;
    return map;
  }, {});
}

/**
 * converts graphql response to rest response
 * todo: map top level fields as a part of v3/get implementation ticket
 * @param response
 */
export function savedItemsSimpleToRest(
  response: GetSavedItemsByOffsetSimpleQuery,
): RestResponseSimple {
  return {
    // todo: map top level fields
    cacheType: 'db',
    list: listToMap(
      response.user.savedItemsByOffset.entries
        .map((savedItem, index) => ListItemTransformerSimple(savedItem, index))
        .filter((s) => s !== null),
      'item_id',
    ),
  };
}

/**
 * Convert GraphQL response for detailType=complete to v3 API format
 */
export function savedItemsCompleteToRest(
  response: GetSavedItemsByOffsetCompleteQuery,
): RestResponseComplete {
  return {
    cacheType: 'db',
    list: listToMap(
      response.user.savedItemsByOffset.entries
        .map((savedItem, index) =>
          ListItemTransformerComplete(savedItem, index),
        )
        .filter((s) => s !== null),
      'item_id',
    ),
  };
}
