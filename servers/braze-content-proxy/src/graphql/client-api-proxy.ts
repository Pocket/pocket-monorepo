import {
  ApolloClient,
  ApolloQueryResult,
  HttpLink,
  InMemoryCache,
} from '@apollo/client/core';
import fetch from 'cross-fetch';
import config from '../config';
import {
  ImageFileType,
  PocketCollectionsDocument,
  PocketCollectionsQuery,
  PocketCollectionsQueryVariables,
  PocketHitsDocument,
  PocketHitsQuery,
  SavedItemStatusFilter,
  UserDigestDocument,
  UserDigestQuery,
  UserDigestQueryVariables,
} from '../generated/graphql/types';
import { generateJwt, PocketJWK } from '@pocket-tools/jwt-utils';
import { IntMask } from '@pocket-tools/int-mask';

export const client = new ApolloClient({
  link: new HttpLink({ fetch, uri: config.clientApi.uri }),
  cache: new InMemoryCache(),
  name: config.app.apolloClientName,
  version: config.app.version,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'no-cache',
    },
    query: {
      fetchPolicy: 'no-cache',
    },
  },
});

/**
 * calls client API to get collections information
 * @param slug slug identifier of the collction
 * @returns collections and its story details required by braze
 */
export async function getCollectionsFromGraph(
  slug: string,
): Promise<ApolloQueryResult<PocketCollectionsQuery>> {
  const response = await client.query<
    PocketCollectionsQuery,
    PocketCollectionsQueryVariables
  >({
    query: PocketCollectionsDocument,
    variables: {
      slug: slug,
    },
  });

  if (!response.data?.getCollectionBySlug) {
    throw new Error(
      `server error: unable to fetch collections for slug: ${slug}.`,
    );
  }

  return response;
}

/**
 * Calls Client API to get Pocket Hits stories for a given Pocket Hits surface
 * and date (in "YYYY-MM-DD" format).
 * @param date Date in "YYYY-MM-DD" format.
 * @param scheduledSurfaceId Valid scheduled surface of the Pocket Hits surface.
 * @returns Stories for the given Pocket Hits surface and date.
 */
export async function getScheduledSurfaceStories(
  date: string,
  scheduledSurfaceId: string,
): Promise<ApolloQueryResult<PocketHitsQuery>> {
  const data = await client.query({
    query: PocketHitsDocument,
    variables: {
      date,
      scheduledSurfaceId,
    },
  });

  if (!data.data?.scheduledSurface?.items) {
    throw new Error(
      `No data returned for ${scheduledSurfaceId} scheduled on ${date}.`,
    );
  }
  return data;
}

/**
 * calls client API to get a digest for a user
 * @param userId user identifier of the user to get a digest for
 * @returns the digest of a user (right now 3 recent saves)
 */
export async function getUserDigestFromGraph(
  userId: string,
): Promise<ApolloQueryResult<UserDigestQuery>> {
  const response = await client.query<
    UserDigestQuery,
    UserDigestQueryVariables
  >({
    query: UserDigestDocument,
    context: {
      headers: {
        Authorization: `Bearer ${generateBrazeJWT(userId)}`,
      },
    },
    variables: {
      pagination: {
        first: 3,
      },
      imageOptions: [
        {
          id: 'thumbnail',
          height: 200,
          width: 200,
          qualityPercentage: 80,
          fileType: ImageFileType.Jpeg,
        },
      ],
      filter: {
        statuses: [SavedItemStatusFilter.Unread],
      },
    },
  });
  return response;
}

/**
 *
 * @param userId User id to generate a jwt for
 * @returns a jwt
 */
const generateBrazeJWT = (userId: string) => {
  return generateJwt(config.jwt.key as unknown as PocketJWK, {
    sub: IntMask.decode(userId).toString(),
    extraOptions: { encoded_id: userId },
    issuer: config.jwt.iss,
    apiId: config.app.apiId,
    applicationName: config.app.applicationName,
    aud: config.jwt.aud,
  });
};
