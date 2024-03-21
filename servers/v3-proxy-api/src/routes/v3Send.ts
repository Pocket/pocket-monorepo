import { NextFunction, Request, Response, Router } from 'express';
import { checkSchema, validationResult, matchedData } from 'express-validator';
import { V3SendSchema, ActionSanitizer, V3SendParams } from './validations';
import { InputValidationError } from '../errors/InputValidationError';
import { SendAction } from './validations/SendActionValidators';
import { ActionsRouter } from './ActionsRouter';

const router: Router = Router();

/**
 * Shared controller logic for POST and GET for /v3/get endpoint
 * The Web repo supports both to this route, so we must be backwards compatible.
 * @param methodName Whether it's a POST or GET method -- just affects error
 * message prefix.
 */
const v3SendController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = validationResult(req);
  const data = matchedData(req, { includeOptionals: false }) as V3SendParams;
  if (!result.isEmpty()) {
    // Send validation error to error handling middleware
    return next(
      new InputValidationError(result.array({ onlyFirstError: true })[0]),
    );
  }
  // Additional per-action validation, since validating heterogenous
  // arrays with non-intersecting types is hard
  let actions: SendAction[];
  try {
    actions = data.actions.map((action) => ActionSanitizer(action));
  } catch (err) {
    return next(err);
  }
  try {
    const result = await new ActionsRouter(
      data.access_token,
      data.consumer_key,
      req.headers,
    ).processActions(actions);
    return res.json(result);
  } catch (err) {
    // Pass along to error handling middleware
    // Has to be in a try/catch block due to async call
    return next(err);
  }
};

router.get('/', checkSchema(V3SendSchema, ['query']), v3SendController);
router.post('/', checkSchema(V3SendSchema, ['body']), v3SendController);

export default router;
