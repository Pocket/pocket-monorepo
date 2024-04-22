import { URL } from 'url';
import {
  Author,
  Image,
  Imageness,
  Video,
  VideoType,
  Videoness,
} from '../__generated__/resolvers-types';
import { ParserResponse } from './ParserAPITypes';

/**
 * Get Author array from raw authors object returned from the parser
 * @param authors
 */
export const getAuthors = (authors): Author[] => {
  return Object.keys(authors).map((authorId: string): Author => {
    return {
      id: authors[authorId].author_id,
      name: authors[authorId].name,
      url: authors[authorId].url,
    };
  });
};

/**
 * Get ItemImage array from raw images object
 * @param images
 */
export const getImages = (images): Image[] => {
  return Object.keys(images).map((index: string): Image => {
    return {
      imageId: parseInt(images[index].image_id),
      width: parseInt(images[index]?.width) ?? null,
      height: parseInt(images[index]?.height) ?? null,
      src: images[index].src,
      url: images[index].src,
      caption: images[index].caption,
      credit: images[index].credit,
    };
  });
};

/**
 * Get ItemImage array from raw images object
 * @param videos
 */
export const getVideos = (videos): Video[] => {
  return Object.keys(videos).map((index: string): Video => {
    return {
      videoId: parseInt(videos[index].video_id),
      width: parseInt(videos[index]?.width) ?? null,
      height: parseInt(videos[index]?.height) ?? null,
      src: videos[index].src,
      type: parseVideoType(videos[index].type),
      vid: videos[index]?.vid,
      length: videos[index]?.length,
    };
  });
};

/**
 * Converts an item's video_type to schema enum value
 * @param videoType
 */
const parseVideoType = (videoType) => {
  switch (parseInt(videoType)) {
    case 1:
      return VideoType.Youtube;
    case 2:
      return VideoType.VimeoLink;
    case 3:
      return VideoType.VimeoMoogaloop;
    case 4:
      return VideoType.VimeoIframe;
    case 5:
      return VideoType.Html5;
    case 6:
      return VideoType.Flash;
    case 7:
      return VideoType.Iframe;
    case 8:
      return VideoType.Brightcove;
  }
};

/**
 * Extracts the domain metadata object from the parser
 * @param rawItem
 * @returns
 */
export const extractDomainMeta = (parserResponse: ParserResponse): any => {
  // a rawItem may not have any domain_metadata. if that's the case, init
  // domainMeta to be an empty object.
  const domainMeta = parserResponse.domainMetadata || { name: undefined };

  // if the domainMeta doesn't have a name property, and rawItem does have a
  // normal_url, populate the domainMeta.name based on the normal_url hostname
  if (!domainMeta.name && parserResponse.given_url) {
    const url = new URL(parserResponse.given_url);
    domainMeta.name = url.hostname;
  }

  // note that this will _at minimum_ return an empty object, and never `null`
  // or `undefined`. this property is *not* required in our graphql schema.
  return domainMeta;
};

/**
 * Takes dates that can be returned from the parser and makes somse sense of them.
 * @param date
 */

export const normalizeDate = (date?: string): string | null => {
  // catches date like "0000-00-00 00:00:00" as well as whitespace only
  const REGEX_DATE_NULL = /^[0:-\s]+$/;
  if (!date) {
    return null;
  }

  if (REGEX_DATE_NULL.test(date)) {
    return null;
  }

  return date;
};

/**
 * Converts parser item.has_video to a graphql enum
 * @param hasVideo
 */
export const parseVideoness = (hasVideo: string): Videoness => {
  switch (parseInt(hasVideo)) {
    case 0:
      return Videoness.NoVideos;
    case 1:
      return Videoness.HasVideos;
    case 2:
      return Videoness.IsVideo;
    default:
      return Videoness.NoVideos;
  }
};

/**
 * Converts parser item.has_image to a graphql enum
 * @param hasImage
 */
export const parseImageness = (hasImage: string): Imageness => {
  switch (hasImage) {
    case '0':
      return Imageness.NoImages;
    case '1':
      return Imageness.HasImages;
    case '2':
      return Imageness.IsImage;
    default:
      return Imageness.NoImages;
  }
};
