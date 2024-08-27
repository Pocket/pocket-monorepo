/**
 * The properties of curated items that we need to fetch from Client API.
 */
export type CorpusItem = {
  url: string;
  shortUrl: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  authors: { name: string };
  publisher: string;
  topic: string;
};

export interface ScheduledSurfaceItem {
  id: string;
  corpusItem: CorpusItem;
}

/**
 * A very lean Corpus Item type with just the data Pocket Hits emails need.
 */
export type TransformedCorpusItem = Omit<CorpusItem, 'authors'> & {
  // Unlike in the Client API response, the Braze Content Proxy response contains
  // a string that lists all the authors for each story, not an object.
  authors: string;
  // This value is the id of the Scheduled Surface Item, rather than the Corpus Item
  id: string;
};

/**
 * The response we serve from this proxy for Braze.
 */
export type BrazeContentProxyResponse = {
  stories: TransformedCorpusItem[];
};

/**
 * response payload type for /GET collections call
 */
export type BrazeCollections = {
  title: string;
  excerpt: string;
  imageUrl: string;
  intro: string;
  publishedAt: string;
  stories: BrazeCollectionStory[];
};

type BrazeCollectionStory = {
  title: string;
  url: string;
  shortUrl: string;
  excerpt: string;
  imageUrl: string;
  publisher: string;
  authors: string[];
};
