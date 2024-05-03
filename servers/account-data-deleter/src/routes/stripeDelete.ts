import { Request, Response, Router } from 'express';
import { checkSchema } from 'express-validator';
import { validate } from './validator.js';
import { nanoid } from 'nanoid';
import { accountDeleteSchema } from './schemas.js';
import { StripeDataDeleter } from '../dataService/stripeDataDeleter.js';

const router = Router();

/**
 * This endpoint is called by the lambda that consumes account delete
 * events forwarded from the event bus. When a user deletes their account,
 * delete all Stripe customer data associated with them.
 */
router.post(
  '/',
  checkSchema(accountDeleteSchema),
  validate,
  async (req: Request, res: Response) => {
    const requestId = req.body.traceId ?? nanoid();
    new StripeDataDeleter(req.body.userId).removeCustomer();
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
