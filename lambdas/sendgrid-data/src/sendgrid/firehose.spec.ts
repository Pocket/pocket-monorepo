import { FirehoseClient } from '@aws-sdk/client-firehose';
import config from '../config/index.js';
import { deliver, createRecords, encodeRecord } from './firehose.js';

describe('firehose', () => {
  describe('deliver', () => {
    const events = [
      { id: '1', body: 'testing...' },
      { id: '2', body: 'testing...' },
      { id: '3', body: 'testing...' },
      { id: '4', body: 'testing...' },
      { id: '5', body: 'testing...' },
    ];

    const parameters = { accountId: 'test-account' };

    let spy: jest.SpyInstance;

    beforeEach(() => {
      spy = jest.spyOn(FirehoseClient.prototype, 'send');
      spy.mockResolvedValueOnce(() => {
        Promise.resolve();
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should deliver the correct number of batches', async () => {
      await deliver(events, parameters, 3);
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('should call putRecordBatch with the correct arguments', async () => {
      await deliver(events, 5);

      expect(spy.mock.calls[0][0].input.DeliveryStreamName).toEqual(
        config.aws.firehose.deliveryStreamName,
      );
      expect(spy.mock.calls[0][0].input.Records.length).toEqual(5);
    });
  });

  describe('encodeRecord', () => {
    it('should create a record from an event', () => {
      const event = {
        sg_event_id: 'YKWj0oaiRvipyGE3GH2gjQ',
        sg_message_id: 'sendgrid_internal_message_id',
        email: 'john.doe@sendgrid.com',
        timestamp: 1337197600,
        'smtp-id': '<4FB4041F.6080505@sendgrid.com>',
        event: 'processed',
      };

      const result = encodeRecord(event);
      expect(result.Data).toEqual(
        new TextEncoder().encode(JSON.stringify(event) + '\n'),
      );
    });
  });

  describe('createRecords', () => {
    it('should return an array of encoded records', () => {
      const events = [{ id: 1234 }, { id: 4534 }, { id: 6838 }];
      const accountId = 'test-account';

      const result = createRecords(events, accountId);
      expect(result.length).toEqual(3);
      expect(result[0].Data).toEqual(
        new TextEncoder().encode(
          JSON.stringify({ id: 1234, accountId }) + '\n',
        ),
      );
    });
  });
});
