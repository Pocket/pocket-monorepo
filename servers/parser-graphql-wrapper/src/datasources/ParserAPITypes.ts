export type ParserResponse = {
  given_url: string;
  item_id: string;
  resolved_id: string;
  resolvedUrl: string;
  resolved_normal_url: string;
  normal_url: string;
  host: string;
  title: string;
  datePublished: string;
  time_to_read?: number;
  date_resolved: string;
  has_old_dupes: string;
  has_video: string;
  has_image: string;
  timePublished: number;
  domain_id: string;
  origin_domain_id: string;
  mime_type: string;
  content_length: number;
  encoding: string;
  time_first_parsed: string;
  innerdomain_redirect: string;
  responseCode: string;
  excerpt: string;
  domainMetadata?: {
    name: string;
    logo?: string;
    greyscale_logo?: string;
  };
  authors:
    | Record<
        string,
        {
          author_id: string;
          name: string;
          url: string;
        }
      >
    | undefined[];
  images: ParserImageRecord | null | undefined[];
  videos: ParserVideoRecord | null | undefined[];
  wordCount: number;
  isArticle: number;
  isVideo: number;
  isIndex: number;
  usedFallback: number;
  requiresLogin: number;
  lang: string;
  topImageUrl: string;
  article?: string;
};

export type ParserImageRecord = {
  [key: string]: ImageRecord;
};
interface ImageRecord {
  [key: string]: any;
  src: string;
  item_id: string;
  image_id: string;
  width?: string;
  height?: string;
  credit?: string;
  caption?: string;
}

export type ParserVideoRecord = {
  [key: string]: VideoRecord;
};
interface VideoRecord {
  [key: string]: any;
  src: string;
  item_id: string;
  video_id: string;
  width?: string;
  height?: string;
  credit?: string;
  caption?: string;
}
