import { Request, Response, Router } from 'express';
import { checkSchema } from 'express-validator';
import { validate } from './validator';
import { nanoid } from 'nanoid';
import { accountDeleteSchema } from './schemas';
import { FxaRevoker } from '../dataService/FxaRevoker';

const router = Router();

/**
 * This endpoint is called by the lambda that consumes account delete
 * events forwarded from the event bus. When a user deletes their account,
 * revoke any FxA access tokens and delete all FxA records in Pocket.
 */
router.post(
  '/',
  checkSchema(accountDeleteSchema),
  validate,
  async (req: Request, res: Response) => {
    const requestId = req.body.traceId ?? nanoid();
    new FxaRevoker(req.body.userId).revokeToken();
    // Error handling and logging is done asynchronously; just respond OK
    // if we received the message and kicked off the work
    return res.send({
      status: 'OK',
      message: `received message body ${JSON.stringify(
        req.body,
      )} (requestId='${requestId}')`,
    });
  },
);

export default router;
