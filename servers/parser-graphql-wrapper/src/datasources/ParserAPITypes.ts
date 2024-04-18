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
  innerdomain_redirect: number;
  responseCode: string;
  excerpt: string;
  domainMetadata?: {
    name: string;
    logo: string;
    greyscale_logo: string;
  };
  authors: Record<
    string,
    {
      author_id: string;
      name: string;
      url: string;
    }
  >;
  images: Record<
    string,
    {
      item_id: string;
      image_id: string;
      src: string;
      width: string;
      height: string;
      credit: string;
      caption: string;
    }
  >;
  videos: string;
  wordCount: number;
  isArticle: number;
  isVideo: number;
  isIndex: number;
  usedFallback: number;
  requiresLogin: number;
  lang: string;
  topImageUrl: string;
  article: string;
};
