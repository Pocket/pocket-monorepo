import { Request, Response, Router } from 'express';
import { setSaveInputsFromGetCall } from '../graph/toGraphQL';
import {
  callSavedItemsByOffsetSimple,
  callSavedItemsByOffsetComplete,
} from '../graph/graphQLClient';
import {
  savedItemsSimpleToRest,
  savedItemsCompleteToRest,
} from '../graph/toRest';
import { UserSavedItemsByOffsetArgs } from '../generated/graphql/types';
import * as Sentry from '@sentry/node';
import { ErrorCodes, getErrorHeaders } from './errorMapper';
import { serverLogger } from '@pocket-tools/ts-logger';

const router: Router = Router();
//v3 in web repo can support both POST and GET request.
//proxy need to be backward compatible with both of them

router.get('/', async (req: Request, res: Response) => {
  try {
    const variables = setSaveInputsFromGetCall(req.query);
    const headers = req.headers;
    const accessToken = (req.query.access_token as string) ?? null;
    const consumerKey = (req.query.consumer_key as string) ?? null;
    const type = req.query.detailType === 'complete' ? 'complete' : 'simple';

    return res.json(
      await processV3call(accessToken, consumerKey, headers, variables, type),
    );
  } catch (err) {
    const errMessage = `GET: v3/get: ${err}`;
    serverLogger.error(errMessage);
    Sentry.addBreadcrumb({ message: errMessage });
    Sentry.captureException(err);
    return res
      .status(500)
      .header(getErrorHeaders(ErrorCodes.INTERNAL_SERVER_ERROR))
      .send({ error: errMessage });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const variables = setSaveInputsFromGetCall(req.body);
    const headers = req.headers;
    const accessToken = (req.body.access_token as string) ?? null;
    const consumerKey = (req.body.consumer_key as string) ?? null;
    const type = req.query.detailType === 'complete' ? 'complete' : 'simple';

    return res.json(
      await processV3call(accessToken, consumerKey, headers, variables, type),
    );
  } catch (err) {
    const errMessage = `POST: v3/get: ${err}`;
    serverLogger.error(errMessage);
    Sentry.addBreadcrumb({ message: errMessage });
    Sentry.captureException(err);
    return res
      .status(500)
      .header(getErrorHeaders(ErrorCodes.INTERNAL_SERVER_ERROR))
      .send({ error: errMessage });
  }
});

/**
 * function call to get saves from graphQL and convert it to v3 Get response
 * @param accessToken user access token
 * @param consumerKey user consumer key
 * @param variables input variables required for the graphql query
 * @param headers request headers. treated as blackbox pass through for proxy
 */
export async function processV3call(
  accessToken: string,
  consumerKey: string,
  headers: any,
  variables: UserSavedItemsByOffsetArgs,
  type: 'simple' | 'complete',
) {
  if (type === 'complete') {
    const response = await callSavedItemsByOffsetComplete(
      accessToken,
      consumerKey,
      headers,
      variables,
    );
    return savedItemsCompleteToRest(response);
  }
  const response = await callSavedItemsByOffsetSimple(
    accessToken,
    consumerKey,
    headers,
    variables,
  );
  return savedItemsSimpleToRest(response);
}

export default router;
