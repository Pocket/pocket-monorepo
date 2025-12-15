import { getCollectionsFromGraph } from '../graphql/client-api-proxy';
import { getResizedImageUrl } from '../utils';
import { BrazeCollections, BrazeCollectionStory } from './types';
import { Router } from 'express';
import { PocketCollectionsQuery } from '../generated/graphql/types';
import type { ApolloQueryResult } from '@apollo/client/core/types';

const router: Router = Router();

/**
 * GET endpoint to receive collection metadata and its stories information from client
 * Note: will throw only 500 to prevent braze from sending the email if call fails.
 */
router.get('/:slug', async (req, res, next) => {
  const slug = req.params.slug;

  try {
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
  if (collection == null) {
    throw new Error('Could not render collection, because it had an error');
  } else {
    const stories: BrazeCollectionStory[] = collection.stories.map((story) => {
      return {
        title: story.title,
        url: story.url,
        excerpt: story.excerpt,
        imageUrl: getResizedImageUrl(story.imageUrl),
        authors: story.authors.map((author) => author.name),
        // mirror the full url to the short url to stop pocket parser reliance
        shortUrl: story.url,
        publisher: story.publisher ?? '',
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
}
export default router;
