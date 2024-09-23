import { Router } from 'express';
import { getUserDigestFromGraph } from '../graphql/client-api-proxy';
import { Item, UserDigestQuery } from '../generated/graphql/types';
import { BrazeSavedItem } from './types';
import { ApolloQueryResult } from '@apollo/client/core';
import { validateUserId } from '../utils';

const router: Router = Router();

/**
 * GET endpoint to receive user digest data for a given user
 * Note: will throw only 500 to prevent braze from sending the email if call fails.
 */
router.get('/:userId', async (req, res, next) => {
  const userid = req.params.userId;
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
  const edges = response.data.user?.savedItems?.edges;
  if (!edges) {
    return [];
  }
  const savedItems: BrazeSavedItem[] = edges
    .filter(
      (edge) =>
        edge?.node?.item != null && edge?.node?.item.__typename === 'Item',
    )
    .map((edge) => {
      const item = edge?.node?.item as Item; // force cast to Item because map can't infer type from the above filter.
      return {
        title: item.preview?.title ?? null,
        imageUrl: item.preview?.image?.cachedImages?.at(0)?.url ?? null,
        url: item.preview?.url ?? null,
      };
    });
  return savedItems;
}

export default router;
