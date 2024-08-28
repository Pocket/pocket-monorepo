import { getCollectionsFromGraph } from '../graphql/client-api-proxy';
import { getResizedImageUrl, validateApiKey } from '../utils';
import { BrazeCollections, BrazeCollectionStory } from './types';
import config from '../config';
import { Router } from 'express';
import { PocketCollectionsQuery } from '../generated/graphql/types';
import type { ApolloQueryResult } from '@apollo/client/core/types';

const router: Router = Router();

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

function transformToBrazePayload(
  response: ApolloQueryResult<PocketCollectionsQuery>,
): BrazeCollections {
  const collection = response.data.getCollectionBySlug;
  const stories: BrazeCollectionStory[] = collection.stories.map((story) => {
    return {
      title: story.title,
      url: story.url,
      excerpt: story.excerpt,
      imageUrl: getResizedImageUrl(story.imageUrl),
      authors: story.authors.map((author) => author.name),
      shortUrl: story.item.shortUrl,
      publisher: story.publisher,
      externalId: story.externalId,
    };
  });
  return {
    title: collection.title,
    intro: collection.intro,
    excerpt: collection.excerpt,
    publishedAt: collection.publishedAt,
    imageUrl: getResizedImageUrl(collection.imageUrl),
    externalId: collection.externalId,
    stories: stories,
  };
}
export default router;
