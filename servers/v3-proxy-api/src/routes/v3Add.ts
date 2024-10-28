import { NextFunction, Request, Response, Router } from 'express';

import { addSavedItem, getClient } from '../graph/graphQLClient';

import {
  AddSavedItemBeforeTagMutationVariables,
  AddSavedItemCompleteMutationVariables,
  SavedItemUpsertInput,
} from '../generated/graphql/types';
import { checkSchema, validationResult, matchedData } from 'express-validator';
import { V3AddSchema, V3AddParams } from './validations';
import { InputValidationError } from '../errors/InputValidationError';
import { AddItemTransformer } from '../graph/add/toRest';
import { GraphQLClient } from 'graphql-request';
import { asyncHandler } from '../middleware/asyncHandler';
import { AddResponse, PendingAddResponse } from '../graph/types';

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
    throw new InputValidationError(result.array({ onlyFirstError: true })[0]);
  }
  const variables = buildVariables(data);
  const headers = req.headers;
  const accessToken = (data.access_token as string) ?? null;
  const consumerKey = (data.consumer_key as string) ?? null;
  const client = getClient(accessToken, consumerKey, headers);
  const graphResponse = await processV3Add(client, variables, data.tags);
  return graphResponse;
};

router.get(
  '/',
  checkSchema(V3AddSchema, ['query', 'body']),
  asyncHandler(async (req, res, next) => {
    const result = await v3AddController(req, res, next);
    res.json(result);
  }),
);
router.post(
  '/',
  checkSchema(V3AddSchema, ['body', 'query']),
  asyncHandler(async (req, res, next) => {
    const result = await v3AddController(req, res, next);
    res.json(result);
  }),
);

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
  client: GraphQLClient,
  variables:
    | AddSavedItemCompleteMutationVariables // these are the same
    | AddSavedItemBeforeTagMutationVariables,
  tags?: string[],
): Promise<AddResponse | PendingAddResponse> {
  if (tags == null) {
    const result = await addSavedItem(client, variables);
    return AddItemTransformer(result['upsertSavedItem']);
  } else {
    // Note that the  /v3/add response does not include tags (even if they were added)
    const result = await addSavedItem(client, variables, tags);
    return AddItemTransformer(result['createSavedItemTags'][0]);
  }
}

export default router;
