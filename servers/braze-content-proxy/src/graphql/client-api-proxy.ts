import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client/core';
import fetch from 'cross-fetch';
import config from '../config';
import gql from 'graphql-tag';
import { ClientApiResponse } from './types';

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
export async function getCollectionsFromGraph(slug: string): Promise<any> {
  const response = await client.query({
    query: gql`
      query PocketCollections($slug: String!) {
        getCollectionBySlug(slug: $slug) {
          externalId
          title
          excerpt
          imageUrl
          intro
          publishedAt
          stories {
            externalId
            title
            excerpt
            imageUrl
            publisher
            authors {
              name
            }
            item {
              shortUrl
            }
            url
          }
        }
      }
    `,
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
): Promise<ClientApiResponse | null> {
  const data = await client.query({
    query: gql`
      query PocketHits($date: Date!, $scheduledSurfaceId: ID!) {
        scheduledSurface(id: $scheduledSurfaceId) {
          items(date: $date) {
            id
            corpusItem {
              url
              shortUrl
              title
              topic
              excerpt
              imageUrl
              authors {
                name
              }
              publisher
            }
          }
        }
      }
    `,
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
