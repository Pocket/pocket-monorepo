/**
 * method to convert graph responses to REST responses
 */

import {
  Tag,
  Author,
  DomainMetadata,
  Image,
  Video,
  ItemCompleteFragment,
  Imageness,
  Videoness,
} from '../../generated/graphql/index.js';
import {
  TagsItemObject,
  AuthorsItemObject,
  DomainMetadataItemObject,
  ImagesItemObject,
  VideosItemObject,
  VideoTypeMap,
  AddAuthorsObject,
} from '../types.js';

/**
 * Convert tag response array into a map keyed by tag name
 */
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

/**
 * Convert authors response array into a map keyed by author id
 */
export function AuthorsReducer(
  authors: Author[],
  itemId?: undefined,
): AddAuthorsObject;
export function AuthorsReducer(
  authors: undefined,
  itemId?: string | undefined,
): undefined;
export function AuthorsReducer(
  authors: Author[],
  itemId: string,
): AuthorsItemObject;
export function AuthorsReducer(
  authors: Author[] | undefined,
  itemId: string | undefined,
): AuthorsItemObject | AddAuthorsObject | undefined {
  if (authors == null || authors.length === 0) {
    return undefined;
  }
  return authors.reduce(
    (authorsObj, author) => {
      authorsObj[author.id] = {
        author_id: author.id,
        name: author.name,
        url: author.url,
      };
      if (itemId != null) {
        authorsObj[author.id]['item_id'] = itemId;
      }
      return authorsObj;
    },
    {} as AuthorsItemObject | AddAuthorsObject,
  );
}

/**
 * Convert images array into a map keyed by image id
 */
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
      width: (image.width ?? 0).toString(),
      height: (image.height ?? 0).toString(),
      credit: image.credit ?? '',
      caption: image.caption ?? '',
    };
    return imagesObj;
  }, {} as ImagesItemObject);
}

export function DisplayImageTransformer(
  images: ItemCompleteFragment['images'] | undefined,
  itemId: string,
):
  | Pick<ImagesItemObject[string], 'item_id' | 'src' | 'width' | 'height'>
  | undefined {
  if (images == null || images.length === 0) {
    return undefined;
  }
  return {
    item_id: itemId,
    src: images[0].url,
    width: (images[0].width ?? 0).toString(),
    height: (images[0].height ?? 0).toString(),
  };
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

/**
 * Transform domain metadata response into format
 * that complies with v3 api
 */
export function DomainMetadataTransformer(
  metadata: DomainMetadata | undefined,
): DomainMetadataItemObject {
  const metadataResponse = {} as DomainMetadataItemObject;
  metadata.name && (metadataResponse['name'] = metadata.name);
  metadata.logo && (metadataResponse['logo'] = metadata.logo);
  metadata.logoGreyscale &&
    (metadataResponse['greyscale_logo'] = metadata.logoGreyscale);
  return metadataResponse;
}

/**
 * process if the item fields are populated. if its pendingItem, we just return null
 * @param savedItem
 */

export function convertHasImage(imageStatus: Imageness) {
  switch (imageStatus) {
    case Imageness.IsImage:
      return '2' as const;
    case Imageness.HasImages:
      return '1' as const;
    case Imageness.NoImages:
      return '0' as const;
    default:
      return '0' as const;
  }
}

export function convertHasVideo(videoStatus: Videoness) {
  switch (videoStatus) {
    case Videoness.HasVideos:
      return '1' as const;
    case Videoness.IsVideo:
      return '2' as const;
    case Videoness.NoVideos:
      return '0' as const;
    default:
      return '0' as const;
  }
}
