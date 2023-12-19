import { Event, handlers } from './handlers';
import { processor } from './index';
import { SQSEvent } from 'aws-lambda';

describe('event handlers', () => {
  let deleteStub: jest.SpyInstance;
  beforeEach(() => {
    jest.restoreAllMocks();
  });
  afterAll(() => jest.restoreAllMocks());
  describe('with no handler errors', () => {
    beforeEach(() => {
      deleteStub = jest.spyOn(handlers, Event.ACCOUNT_DELETION).mockClear().mockResolvedValue();
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
      expect(deleteStub).toHaveBeenCalledTimes(1);
      expect(deleteStub.mock.calls[0]).toEqual([records.Records[0]]);
    });
    it('returns batchItemFailure and logs to Sentry if handler does not exist', async () => {
      const records = {
        Records: [
          {
            body: JSON.stringify({
              Message: JSON.stringify({ 'detail-type': 'NOT_A_TYPE' }),
            }),
            messageId: 'abc',
          },
        ],
      };
      const res = await processor(records as SQSEvent);
      expect(res.batchItemFailures).toEqual([{ itemIdentifier: 'abc' }]);
    });
  });
  describe('with handler errors', () => {
    beforeEach(() => {
      deleteStub = jest.spyOn(handlers, Event.ACCOUNT_DELETION).mockRejectedValue(Error('got an error'));
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
    });
  });
});
