import { URL } from 'url';
import { Author, Image, Video, VideoType } from './model';

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
      imageId: images[index].image_id,
      width: images[index].width,
      height: images[index].height,
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
      return VideoType.YOUTUBE;
    case 2:
      return VideoType.VIMEO_LINK;
    case 3:
      return VideoType.VIMEO_MOOGALOOP;
    case 4:
      return VideoType.VIMEO_IFRAME;
    case 5:
      return VideoType.HTML5;
    case 6:
      return VideoType.FLASH;
    case 7:
      return VideoType.IFRAME;
    case 8:
      return VideoType.BRIGHTCOVE;
  }
};

/**
 * Extracts the domain metadata object from the parser
 * @param rawItem
 * @returns
 */
export const extractDomainMeta = (rawItem): any => {
  // a rawItem may not have any domain_metadata. if that's the case, init
  // domainMeta to be an empty object.
  const domainMeta = rawItem.domain_metadata || {};

  // if the domainMeta doesn't have a name property, and rawItem does have a
  // normal_url, populate the domainMeta.name based on the normal_url hostname
  if (!domainMeta.name && rawItem.normal_url) {
    const url = new URL(rawItem.normal_url);
    domainMeta.name = url.hostname;
  }

  // note that this will _at minimum_ return an empty object, and never `null`
  // or `undefined`. this property is *not* required in our graphql schema.
  return domainMeta;
};

/**
 * Takes dates that can be returned from the parser and makes some sense of them.
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
