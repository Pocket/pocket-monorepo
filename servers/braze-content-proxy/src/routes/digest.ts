import { Router } from 'express';
import { getUserDigestFromGraph } from '../graphql/client-api-proxy';
import { UserDigestQuery } from '../generated/graphql/types';
import { BrazeSavedItem } from './types';
import { ApolloQueryResult } from '@apollo/client/core';
import { validateUserId } from '../utils';

const router: Router = Router();

/**
 * GET endpoint to receive user digest data for a given user
 * Note: will throw only 500 to prevent braze from sending the email if call fails.
 */
router.get('/:userid', async (req, res, next) => {
  const userid = req.params.userid;

  try {
    validateUserId(userid);
    // Fetch data to build a users digest
    return res.json(await getUserDigest(userid));
  } catch (err) {
    // Let Express handle any errors
    next(err);
  }
});

/**
 * fetch the user digest and transform it into a Braze payload
 * @param slug
 */
export async function getUserDigest(userId: string) {
  const response = await getUserDigestFromGraph(userId);
  return transformToBrazePayload(response);
}

function transformToBrazePayload(
  response: ApolloQueryResult<UserDigestQuery>,
): BrazeSavedItem[] {
  const edges = response.data.user.savedItems.edges;
  const savedItems: BrazeSavedItem[] = edges
    .filter((edge) => edge.node.item.__typename == 'Item')
    .map((edge) => {
      const item = edge.node.item;
      if (item.__typename == 'Item') {
        return {
          title: item.preview.title,
          imageUrl: item.preview.image.cachedImages[0].url,
          url: item.preview.url,
        };
      }
    });
  return savedItems;
}

export default router;
