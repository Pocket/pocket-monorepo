import { BrazeContentProxyResponse, TransformedCorpusItem } from './types';
import { ClientApiResponse } from '../graphql/types';
import { getResizedImageUrl, validateApiKey, validateDate } from '../utils';
import { getScheduledSurfaceStories } from '../graphql/client-api-proxy';
import config from '../config';
import { Router } from 'express';

const router = Router();

router.get('/:scheduledSurfaceID', async (req, res, next) => {
  // Enable two minute cache when in AWS.
  // The short-lived cache is to speed up the curators' workflow
  // if they need to make last-minute updates.
  if (config.app.environment !== 'development') {
    res.set('Cache-control', 'public, max-age=120');
  }

  // Get the scheduled surface GUID
  const scheduledSurfaceID = req.params.scheduledSurfaceID;
  // Get the date the stories are scheduled for
  const date = req.query.date as string;
  // Get the API key
  const apiKey = req.query.apikey as string;

  try {
    // Validate inputs
    validateDate(date);
    await validateApiKey(apiKey);

    // Fetch data
    return res.json(await stories.getStories(date, scheduledSurfaceID));
  } catch (err) {
    // Let Express handle any errors
    next(err);
  }
});

/**
 * Entry point to this module. Retrieves data from Client API and transforms it
 * to match expected schema.
 * note: getStories is wrapped inside object to enable mocking testing.
 */
export const stories = {
  getStories: async (
    date: string,
    scheduledSurfaceId: string,
  ): Promise<BrazeContentProxyResponse> => {
    const data: ClientApiResponse | null = await getScheduledSurfaceStories(
      date,
      scheduledSurfaceId,
    );

    const stories = data ? data.data.scheduledSurface.items : [];

    const transformedStories: TransformedCorpusItem[] = stories.map(function (
      item,
      index,
    ) {
      return {
        // The id of the Scheduled Surface Item
        id: item.id,
        // Properties of the Corpus Item the proxy needs to make available for Braze
        ...item.corpusItem,
        // Resize images on the fly so that they don't distort emails when sent out.
        imageUrl: getResizedImageUrl(this[index].corpusItem.imageUrl),
        // Flatten the authors into a comma-separated string.
        authors: this[index].corpusItem.authors
          ?.map((author) => author.name)
          .join(', '),
      };
    }, stories);

    return {
      stories: transformedStories,
    };
  },
};

export default router;
