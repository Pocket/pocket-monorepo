import { expect } from 'chai';
import 'mocha';
import sinon from 'sinon';
import AWSMock from 'aws-sdk-mock';

import config from '../config';
import { deliver, createRecords, encodeRecord } from './firehose';

describe('firehose', () => {
  describe('deliver', () => {
    const events = [
      { id: '1', body: 'testing...' },
      { id: '2', body: 'testing...' },
      { id: '3', body: 'testing...' },
      { id: '4', body: 'testing...' },
      { id: '5', body: 'testing...' },
    ];

    const parameters = {accountId: 'test-account'};

    const sandbox = sinon.createSandbox();
    let spy: any;

    beforeEach(() => {
      spy = sandbox.spy();
      AWSMock.mock('Firehose', 'putRecordBatch', spy);
    });

    afterEach(() => {
      sandbox.restore();
      AWSMock.restore();
    });

    it('should deliver the correct number of batches', () => {
      deliver(events, parameters, 3);
      expect(spy.callCount).to.equal(2);
    });

    it('should call putRecordBatch with the correct arguments', () => {
      deliver(events, 5);

      const expectedArgs = {
        DeliveryStreamName: config.aws.firehose.deliveryStreamName,
        Records: sinon.match.array,
      };

      sinon.assert.calledWith(spy, expectedArgs);
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
      expect(result.Data).to.equal(JSON.stringify(event) + '\n');
    });
  });

  describe('createRecords', () => {
    it('should return an array of encoded records', () => {
      const events = [{ id: 1234 }, { id: 4534 }, { id: 6838 }];
      const accountId = 'test-account';

      const result = createRecords(events, accountId);
      expect(result.length).to.equal(3);
      expect(result[0].Data).to.equal(JSON.stringify({id: 1234, accountId}) + '\n');
    });
  });
});
