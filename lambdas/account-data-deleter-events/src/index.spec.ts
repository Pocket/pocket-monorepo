import { Event, handlers } from './handlers/index.ts';
import { handlerFn } from './index.ts';
import { SQSEvent } from 'aws-lambda';
import * as Sentry from '@sentry/aws-serverless';

describe('event handlers', () => {
  let deleteStub: jest.SpyInstance;
  let sentryStub: jest.SpyInstance;
  beforeEach(() => {
    jest.restoreAllMocks();
    sentryStub = jest.spyOn(Sentry, 'captureException');
  });
  afterAll(() => jest.restoreAllMocks());
  describe('with no handler errors', () => {
    beforeEach(() => {
      deleteStub = jest
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
      await handlerFn(records as SQSEvent);
      expect(deleteStub).toHaveBeenCalledTimes(1);
      expect(deleteStub).toHaveBeenCalledWith(records.Records[0]);
    });
    it('ignore the message if handler does not exist', async () => {
      const records = {
        Records: [
          {
            body: JSON.stringify({
              Message: JSON.stringify({ 'detail-type': 'NOT_A_TYPE' }),
            }),
            messageId: 'abc',
          },
          {
            body: JSON.stringify({
              Message: JSON.stringify({
                'detail-type': Event.ACCOUNT_DELETION,
              }),
            }),
            messageId: 'def',
          },
        ],
      };
      await handlerFn(records as SQSEvent);
      expect(sentryStub).toHaveBeenCalledTimes(0);
    });
  });
  describe('with handler errors', () => {
    beforeEach(() => {
      deleteStub = jest
        .spyOn(handlers, Event.ACCOUNT_DELETION)
        .mockRejectedValue(new Error('got an error'));
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
      const res = await handlerFn(records as SQSEvent);
      expect(res.batchItemFailures).toEqual([{ itemIdentifier: 'abc' }]);
      expect(sentryStub).toHaveBeenCalledTimes(1);
      expect(sentryStub).toHaveBeenCalledWith(new Error('got an error'));
    });
  });
});
