import { ParserArticle } from './dataLoaders';

export interface Item {
  itemId: string;
  id: string;
  resolvedId: string;
  topImageUrl?: string;
  topImage?: Image;
  dateResolved?: string;
  normalUrl: string;
  givenUrl?: string;
  title?: string;
  ampUrl?: string;
  resolvedUrl?: string;
  isArticle?: boolean;
  isIndex?: boolean;
  hasVideo?: Videoness;
  hasImage?: Imageness;
  excerpt?: string;
  wordCount?: number;
  timeToRead?: number;
  listenDuration?: number;
  images?: Image[];
  videos?: Video[];
  authors: Author[];
  mimeType?: string;
  encoding?: string;
  domainMetadata: DomainMetadata;
  language?: string;
  datePublished?: string;
  hasOldDupes?: boolean;
  domainId?: string;
  originDomainId?: string;
  responseCode?: number;
  contentLength?: number;
  innerDomainRedirect?: boolean;
  loginRequired?: boolean;
  usedFallback?: boolean;
  timeFirstParsed?: string;
  resolvedNormalUrl?: string;
  article?: string;
  parsedArticle?: ParserArticle;
}

export enum Imageness {
  NO_IMAGES = 'NO_IMAGES',
  HAS_IMAGES = 'HAS_IMAGES',
  IS_IMAGE = 'IS_IMAGE',
}

export interface DomainMetadata {
  name: string;
  logoGreyscale?: string;
  logo: string;
}

export interface Image {
  imageId: string;
  width?: number;
  height?: number;
  src: string;
  url: string;
  caption?: string;
  credit?: string;
}

export interface Video {
  videoId: number;
  width?: number;
  height?: number;
  src: string;
  type: string;
  vid?: string;
  length?: number;
}

export enum VideoType {
  YOUTUBE = 'YOUTUBE',
  VIMEO_LINK = 'VIMEO_LINK',
  VIMEO_MOOGALOOP = 'VIMEO_MOOGALOOP',
  VIMEO_IFRAME = 'VIMEO_IFRAME',
  HTML5 = 'HTML5',
  FLASH = 'FLASH',
  IFRAME = 'IFRAME',
  BRIGHTCOVE = 'BRIGHTCOVE',
}

export const videoTypeMap = {
  1: VideoType.YOUTUBE,
  2: VideoType.VIMEO_LINK,
  3: VideoType.VIMEO_MOOGALOOP,
  4: VideoType.VIMEO_IFRAME,
  5: VideoType.HTML5,
  6: VideoType.FLASH,
  7: VideoType.IFRAME,
  8: VideoType.BRIGHTCOVE,
};

export enum Videoness {
  NO_VIDEOS = 'NO_VIDEOS',
  HAS_VIDEOS = 'HAS_VIDEOS',
  IS_VIDEO = 'IS_VIDEO',
}

export interface Author {
  id: string;
  name?: string;
  url?: string;
}
