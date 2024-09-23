import { BrazeContentProxyResponse, TransformedCorpusItem } from './types';
import { getResizedImageUrl, validateDate } from '../utils';
import { getScheduledSurfaceStories } from '../graphql/client-api-proxy';
import { Router } from 'express';

const router: Router = Router();

router.get('/:scheduledSurfaceID', async (req, res, next) => {
  // Get the scheduled surface GUID
  const scheduledSurfaceID = req.params.scheduledSurfaceID;
  // Get the date the stories are scheduled for
  const date = req.query.date as string;

  try {
    // Validate inputs
    validateDate(date);
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
    const data = await getScheduledSurfaceStories(date, scheduledSurfaceId);

    const stories = data ? data.data.scheduledSurface.items : [];

    const transformedStories: TransformedCorpusItem[] = stories
      .filter((item) => item.corpusItem.shortUrl != null)
      .map((item) => {
        return {
          // The id of the Scheduled Surface Item
          id: item.id,
          url: item.corpusItem.url,
          shortUrl: item.corpusItem.shortUrl,
          title: item.corpusItem.title,
          topic: item.corpusItem.topic ?? '', // set to an empty string if null
          excerpt: item.corpusItem.excerpt,
          publisher: item.corpusItem.publisher,
          // Resize images on the fly so that they don't distort emails when sent out.
          imageUrl: getResizedImageUrl(item.corpusItem.imageUrl),
          // Flatten the authors into a comma-separated string.
          authors: item.corpusItem.authors
            ?.map((author) => author.name)
            .join(', '),
          __typename: 'CorpusItem',
        };
      });

    return {
      stories: transformedStories,
    };
  },
};

export default router;
