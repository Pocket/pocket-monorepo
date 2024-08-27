import { getCollectionsFromGraph } from '../graphql/client-api-proxy';
import { getResizedImageUrl, validateApiKey } from '../utils';
import { BrazeCollections } from './types';
import config from '../config';
import { Router } from 'express';

const router = Router();

/**
 * GET endpoint to receive collection metadata and its stories information from client
 * Note: will throw only 500 to prevent braze from sending the email if call fails.
 */
router.get('/:slug', async (req, res, next) => {
  // Enable two minute cache when in AWS.
  // The short-lived cache is to speed up the curators' workflow
  // if they need to make last-minute updates.
  if (config.app.environment !== 'development') {
    res.set('Cache-control', 'public, max-age=120');
  }

  const slug = req.params.slug;
  // Get the API key
  const apiKey = req.query.apikey as string;

  try {
    await validateApiKey(apiKey);
    // Fetch data
    return res.json(await getCollection(slug));
  } catch (err) {
    // Let Express handle any errors
    next(err);
  }
});

/**
 * fetch collections and transform them to braze payload
 * @param slug
 */
export async function getCollection(slug: string) {
  const response = await getCollectionsFromGraph(slug);
  return transformToBrazePayload(response);
}

function transformToBrazePayload(response): BrazeCollections {
  const collection = response.data.getCollectionBySlug;
  const stories = collection.stories.map((story) => {
    const res = {
      ...story,
      imageUrl: getResizedImageUrl(story.imageUrl),
      authors: story.authors.map((author) => author.name),
      shortUrl: story.item.shortUrl,
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { item: _, ...rest } = res;
    return rest;
  });
  return {
    ...collection,
    imageUrl: getResizedImageUrl(collection.imageUrl),
    stories: stories,
  };
}
export default router;
