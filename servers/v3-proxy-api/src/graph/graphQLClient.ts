import { GraphQLClient } from 'graphql-request';

import {
  GetSavedItemsDocument,
  GetSavedItemsQuery,
  GetSavedItemsQueryVariables,
  GetSavedItemsByOffsetQuery,
  GetSavedItemsByOffsetQueryVariables,
  SaveArchiveDocument,
  SaveArchiveMutation,
  SaveFavoriteDocument,
  SaveFavoriteMutation,
  SaveFavoriteMutationVariables,
  SaveArchiveMutationVariables,
} from '../generated/graphql/types';
import config from '../config';
import * as Sentry from '@sentry/node';
import { serverLogger } from '@pocket-tools/ts-logger';
/**
 * gives a graphQLClient for pocket-graph url
 *
 * This client initializes a `graphql-request` client
 * @param headers any headers received by proxy is just pass through to web graphQL proxy.
 * @param accessToken accessToken of the user
 * @param consumerKey consumerKey associated with the user
 */
export function getClient(
  accessToken: string,
  consumerKey: string,
  headers: any,
) {
  //these headers are not compatible with GraphQLClient's fetch.
  //they throw an error instead, so ignoring them
  // headers might include cookie, some observability traceIds, apollo studio headers
  // so, we are implicitly passing them and removing only those that causes issues
  delete headers['content-length'];
  delete headers['content-type'];
  delete headers['user-agent'];
  delete headers['host'];
  delete headers['accept-encoding'];
  delete headers['connection'];

  let url: string;

  //to allow both access token/consumer key based auth or cookie based auth
  if (accessToken && consumerKey) {
    url = `${config.graphQLProxy}?consumer_key=${consumerKey}&access_token=${accessToken}`;
  } else {
    url = `${config.graphQLProxy}/?consumer_key=${consumerKey}`;
  }

  try {
    return new GraphQLClient(url, {
      headers: headers,
      //fetch implementation used by node version,
      //can give custom fetch package
      fetch,
    });
  } catch (e) {
    Sentry.addBreadcrumb({ message: `graphQLClient creation failed:` });
    Sentry.captureException(e);
    serverLogger.error(e);
    throw e;
  }
}
/**
 * Calls saveArchive mutation
 *
 * @param accessToken accessToken of the user
 * @param consumerKey consumerKey associated with the user
 * @param variables variables required for the mutation
 * @param headers any headers received by proxy is just pass through to web graphQL proxy.
 */
export async function callSaveArchive(
  accessToken: string,
  consumerKey: string,
  headers: any,
  variables: SaveArchiveMutationVariables,
): Promise<SaveArchiveMutation> {
  const client = getClient(accessToken, consumerKey, headers);
  return client.request<SaveArchiveMutation, SaveArchiveMutationVariables>(
    SaveArchiveDocument,
    variables,
  );
}

/**
 * Calls saveFavorite mutation
 *
 * @param accessToken accessToken of the user
 * @param consumerKey consumerKey associated with the user
 * @param variables variables required for the mutation
 * @param headers any headers received by proxy is just pass through to web graphQL proxy.
 */
export async function callSaveFavorite(
  accessToken: string,
  consumerKey: string,
  headers: any,
  variables: SaveFavoriteMutationVariables,
): Promise<SaveFavoriteMutation> {
  const client = getClient(accessToken, consumerKey, headers);
  return client.request<SaveFavoriteMutation, SaveFavoriteMutationVariables>(
    SaveFavoriteDocument,
    variables,
  );
}

/**
 * function call to get saves
 *
 * @param accessToken accessToken of the user
 * @param consumerKey consumerKey associated with the user
 * @param headers any headers received by proxy is just pass through to web graphQL proxy.
 * @param variables input variables required for the query
 */
export async function callSavedItems(
  accessToken: string,
  consumerKey: string,
  headers: any,
  variables: GetSavedItemsQueryVariables,
): Promise<GetSavedItemsQuery> {
  try {
    const client = getClient(accessToken, consumerKey, headers);
    return client.request<GetSavedItemsQuery, GetSavedItemsQueryVariables>(
      GetSavedItemsDocument,
      variables,
    );
  } catch (e) {
    Sentry.addBreadcrumb({ message: `callSavedItem failed:` });
    Sentry.captureException(e);
    serverLogger.error(e);
    throw e;
  }
}

/**
 * function call to get saves
 *
 * @param accessToken accessToken of the user
 * @param consumerKey consumerKey associated with the user
 * @param headers any headers received by proxy is just pass through to web graphQL proxy.
 * @param variables input variables required for the query
 */
export async function callSavedItemsByOffset(
  accessToken: string,
  consumerKey: string,
  headers: any,
  variables: GetSavedItemsByOffsetQueryVariables,
): Promise<GetSavedItemsQuery> {
  try {
    const client = getClient(accessToken, consumerKey, headers);
    return client.request<
      GetSavedItemsByOffsetQuery,
      GetSavedItemsByOffsetQueryVariables
    >(GetSavedItemsDocument, variables);
  } catch (e) {
    Sentry.addBreadcrumb({ message: `callSavedItemsByOffset failed:` });
    Sentry.captureException(e);
    serverLogger.error(e);
    throw e;
  }
}
