/**
 * A very lean Corpus Item type with just the data Pocket Hits emails need.
 */
export type TransformedCorpusItem = {
  // Unlike in the Client API response, the Braze Content Proxy response contains
  // a string that lists all the authors for each story, not an object.
  authors: string;
  // This value is the id of the Scheduled Surface Item, rather than the Corpus Item
  id: string;

  url: string;

  shortUrl: string;

  title: string;

  topic: string;

  excerpt: string;

  publisher: string;

  imageUrl: string;

  __typename: string;
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
  externalId: string;
  stories: BrazeCollectionStory[];
};

export type BrazeCollectionStory = {
  title: string;
  url: string;
  shortUrl: string;
  excerpt: string;
  imageUrl: string;
  publisher: string;
  authors: string[];
  externalId: string;
};

export type BrazeSavedItem = {
  title: string;
  url: string;
  imageUrl: string;
};
