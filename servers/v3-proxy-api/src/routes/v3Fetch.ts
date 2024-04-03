import { NextFunction, Request, Response, Router } from 'express';
import { setSavedItemsVariables } from '../graph/get/toGraphQL';
import { callSavedItemsByOffsetComplete } from '../graph/graphQLClient';
import {
  savedItemsFetchSharesToRest,
  savedItemsFetchToRest,
} from '../graph/get/toRest';
import { checkSchema, validationResult, matchedData } from 'express-validator';
import { V3FetchParams, V3FetchSchema } from './validations/FetchSchema';
import { InputValidationError } from '../errors/InputValidationError';
import { V3GetParams } from './validations';
import { FetchResponse, GetSharesResponse } from '../graph/types';

const router: Router = Router();

/**
 * Shared controller logic for POST and GET for /v3/fetch endpoint
 * The Web repo supports both to this route, so we must be backwards compatible.
 * @param methodName Whether it's a POST or GET method -- just affects error
 * message prefix.
 */
const v3FetchController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = validationResult(req);
  const data = matchedData(req, { includeOptionals: false }) as V3FetchParams;
  if (!result.isEmpty()) {
    // Send validation error to error handling middleware
    return next(
      new InputValidationError(result.array({ onlyFirstError: true })[0]),
    );
  }
  try {
    const headers = req.headers;
    const accessToken = (data.access_token as string) ?? null;
    const consumerKey = (data.consumer_key as string) ?? null;
    const graphResponse = await processV3call(
      accessToken,
      consumerKey,
      headers,
      data,
    );
    return res.json(graphResponse);
  } catch (err) {
    // Pass along to error handling middleware
    // Has to be in a try/catch block due to async call
    return next(err);
  }
};

router.get('/', checkSchema(V3FetchSchema, ['query']), v3FetchController);
router.post('/', checkSchema(V3FetchSchema, ['body']), v3FetchController);

/**
 * function call to get saves from graphQL and convert it to v3 Fetch response
 * @param accessToken user access token
 * @param consumerKey user consumer key
 * @param variables input variables required for the graphql query
 * @param headers request headers. treated as blackbox pass through for proxy
 */
export async function processV3call(
  accessToken: string,
  consumerKey: string,
  headers: any,
  data: V3FetchParams,
): Promise<FetchResponse | (FetchResponse & GetSharesResponse)> {
  if (data.offset == 0) {
    data.count = 25; // set the intial page size to a smaller value to allow the user to see something as quickly as possible
  }
  const options = { withAnnotations: data.annotations };
  //do sometthing to count here for page size.
  const params: V3GetParams = {
    detailType: 'complete',
    total: true,
    access_token: accessToken,
    consumer_key: consumerKey,
    count: data.count,
    offset: data.offset,
    sort: 'newest',
    annotations: data.annotations,
  };

  // Otherwise call SavedItems list api
  const variables = setSavedItemsVariables(params);

  const response = await callSavedItemsByOffsetComplete(
    accessToken,
    consumerKey,
    headers,
    variables,
    options,
  );

  const nextChunkSize = '250'; // Every chunk after the first one is always 250. This informs the client how many to download next.

  if (data.shares) {
    return savedItemsFetchSharesToRest(
      {
        fetchChunkSize: nextChunkSize,
        firstChunkSize: params.count.toFixed(),
        chunk: data.chunk.toFixed(),
      },
      response,
      options,
    );
  }

  return savedItemsFetchToRest(
    {
      fetchChunkSize: nextChunkSize,
      firstChunkSize: params.count.toFixed(),
      chunk: data.chunk.toFixed(),
    },
    response,
    options,
  );
}

export default router;
