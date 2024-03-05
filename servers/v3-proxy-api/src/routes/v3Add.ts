import { NextFunction, Request, Response, Router } from 'express';

import { addSavedItem } from '../graph/graphQLClient';

import {
  AddSavedItemBeforeTagMutationVariables,
  AddSavedItemCompleteMutationVariables,
  SavedItemUpsertInput,
} from '../generated/graphql/types';
import { checkSchema, validationResult, matchedData } from 'express-validator';
import { V3AddSchema, V3AddParams } from './validations/AddSchema';
import { InputValidationError } from '../errors/InputValidationError';
import { AddItemTransformer } from '../graph/add/toRest';

const router: Router = Router();

/**
 * Shared controller logic for POST and GET for /v3/add endpoint
 * The Web repo supports both to this route, so we must be backwards compatible.
 * message prefix.
 */
const v3AddController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = validationResult(req);
  const data = matchedData(req, { includeOptionals: false }) as V3AddParams;
  if (!result.isEmpty()) {
    // Send validation error to error handling middleware
    return next(
      new InputValidationError(result.array({ onlyFirstError: true })[0]),
    );
  }
  try {
    const variables = buildVariables(data);
    const headers = req.headers;
    const accessToken = (data.access_token as string) ?? null;
    const consumerKey = (data.consumer_key as string) ?? null;
    const graphResponse = await processV3Add(
      accessToken,
      consumerKey,
      headers,
      variables,
      data.tags,
    );
    return res.json(graphResponse);
  } catch (err) {
    // Pass along to error handling middleware
    // Has to be in a try/catch block due to async call
    return next(err);
  }
};

router.get('/', checkSchema(V3AddSchema, ['query']), v3AddController);
router.post('/', checkSchema(V3AddSchema, ['body']), v3AddController);

/**
 * Set variables for the initial 'upsert' query
 */
function buildVariables(
  data: V3AddParams,
):
  | AddSavedItemCompleteMutationVariables
  | AddSavedItemBeforeTagMutationVariables {
  const input: SavedItemUpsertInput = {
    url: data.url,
    timestamp: Math.round(new Date().getTime() / 1000),
  };
  data.title && (input['title'] = data.title);
  return { input };
}

/**
 * function call to get saves from graphQL and convert it to v3 Get response
 * @param accessToken user access token
 * @param consumerKey user consumer key
 * @param variables input variables required for the graphql query
 * @param headers request headers. treated as blackbox pass through for proxy
 */
export async function processV3Add(
  accessToken: string,
  consumerKey: string,
  headers: any,
  variables:
    | AddSavedItemCompleteMutationVariables // these are the same
    | AddSavedItemBeforeTagMutationVariables,
  tags?: string[],
) {
  if (tags == null) {
    const result = await addSavedItem(
      accessToken,
      consumerKey,
      headers,
      variables,
    );
    return AddItemTransformer(result['upsertSavedItem']);
  } else {
    // Note that the  /v3/add response does not include tags (even if they were added)
    const result = await addSavedItem(
      accessToken,
      consumerKey,
      headers,
      variables,
      tags,
    );
    return AddItemTransformer(result['createSavedItemTags'][0]);
  }
}

export default router;
