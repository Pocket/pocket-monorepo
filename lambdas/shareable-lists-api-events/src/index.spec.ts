import { Event, handlers } from './handlers/index.js';
import { processor } from './index.js';
import { SQSEvent, SQSRecord } from 'aws-lambda';
import * as Sentry from '@sentry/serverless';

describe('event handlers', () => {
  let accountDeleteStub: jest.SpyInstance<
    Promise<void>,
    [message: SQSRecord],
    any
  >;
  let sentryStub: jest.SpyInstance<string, [exception: any, hint?: any], any>;

  beforeEach(() => {
    jest.restoreAllMocks();
    sentryStub = jest
      .spyOn(Sentry, 'captureException')
      .mockImplementation(() => 'ok');
  });

  afterAll(() => jest.restoreAllMocks());

  describe('with no handler errors', () => {
    beforeEach(() => {
      accountDeleteStub = jest
        .spyOn(handlers, Event.ACCOUNT_DELETION)
        .mockResolvedValue();
    });

    it('routes to the correct handler function based on detail-type', async () => {
      const records = {
        Records: [
          {
            body: JSON.stringify({
              Message: JSON.stringify({
                'detail-type': Event.ACCOUNT_DELETION,
              }),
            }),
          },
        ],
      };

      await processor(records as SQSEvent);
      expect(accountDeleteStub).toHaveBeenCalledTimes(1);
      expect(accountDeleteStub).toHaveBeenNthCalledWith(1, records.Records[0]);
    });

    it('is a NOOP if a handler does not exist', async () => {
      const records = {
        Records: [
          {
            body: JSON.stringify({
              Message: JSON.stringify({
                'detail-type': 'NOT_A_TYPE_I_CAN_HANDLE',
              }),
            }),
            messageId: 'abc',
          },
        ],
      };

      const res = await processor(records as SQSEvent);

      // no failures/errors
      expect(res.batchItemFailures).toEqual([]);
      expect(sentryStub).not.toHaveBeenCalled();

      // no handlers were called
      expect(accountDeleteStub).not.toHaveBeenCalled();
    });
  });
  describe('with handler errors', () => {
    beforeEach(() => {
      accountDeleteStub = jest
        .spyOn(handlers, Event.ACCOUNT_DELETION)
        .mockRejectedValue(Error('got an error'));
    });
    it('returns batchItemFailure and logs to Sentry if handler throws error', async () => {
      const records = {
        Records: [
          {
            body: JSON.stringify({
              Message: JSON.stringify({
                'detail-type': Event.ACCOUNT_DELETION,
              }),
            }),
            messageId: 'abc',
          },
        ],
      };
      const res = await processor(records as SQSEvent);
      expect(res.batchItemFailures).toEqual([{ itemIdentifier: 'abc' }]);
      expect(sentryStub).toHaveBeenCalledTimes(1);
      expect(sentryStub.mock.calls[0][0].message).toEqual('got an error');
    });
  });
});
