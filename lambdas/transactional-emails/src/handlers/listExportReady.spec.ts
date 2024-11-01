import nock, { cleanAll } from 'nock';
import { exportReadyHandler } from './listExportReady';
import { SQSRecord } from 'aws-lambda';
import { config } from '../config';
import * as ssm from '../ssm';
import { sendListExportReadyEmail } from '../braze';
import { PocketEventType } from '@pocket-tools/event-bridge';

describe('listExportReady handler', () => {
  beforeEach(() => {
    jest
      .spyOn(ssm, 'getBrazeApiKey')
      .mockImplementation(() => Promise.resolve('api-key'));
  });

  afterEach(() => {
    cleanAll();
    jest.restoreAllMocks();
  });

  it('throw an error if event payload is missing encodedId', async () => {
    nock(config.braze.endpoint)
      .post(config.braze.campaignTriggerPath)
      .reply(400, { errors: ['this is an error'] });

    const recordWithoutId = {
      body: JSON.stringify({
        Message: JSON.stringify({
          id: '1234567890',
          version: '0',
          account: '123456789012',
          region: 'us-east-2',
          time: new Date(),
          'detail-type': PocketEventType.EXPORT_READY,
          source: 'web-repo',
          detail: {
            requestId: 'abc123',
          },
        }),
      }),
    };
    expect.assertions(1); // since it's in a try/catch, make sure we assert
    try {
      await exportReadyHandler(recordWithoutId as SQSRecord);
    } catch (e) {
      expect(e.message).toContain(
        "data/detail must have required property 'encodedId'",
      );
    }
  });

  it('throws an error if email send response is not 200 OK', async () => {
    const record = {
      body: JSON.stringify({
        Message: JSON.stringify({
          id: '1234567890',
          version: '0',
          account: '123456789012',
          region: 'us-east-2',
          time: new Date(),
          'detail-type': PocketEventType.EXPORT_READY,
          source: 'web-repo',
          detail: {
            encodedId: 'abc-123',
            requestId: '000-111',
            archiveUrl:
              'https://pocket.co/share/085ba173-fb35-48b0-a76c-33c1561570b9',
          },
        }),
      }),
    };
    nock(config.braze.endpoint)
      .post(config.braze.campaignTriggerPath)
      .reply(400, { errors: ['this is an error'] });
    expect.assertions(1); // since it's in a try/catch, make sure we assert
    try {
      await exportReadyHandler(record as SQSRecord);
    } catch (e) {
      expect(e.message).toContain('Error 400: Failed to send email');
    }
  });

  it('should retry 3 times if post fails', async () => {
    nock(config.braze.endpoint)
      .post(config.braze.campaignTriggerPath)
      .times(2)
      .reply(500, { errors: ['this is an error'] });

    nock(config.braze.endpoint)
      .post(config.braze.campaignTriggerPath)
      .reply(200, { data: ['this is a data'] });

    const res = await sendListExportReadyEmail({
      requestId: 'abc123',
      encodedId: '111',
      archiveUrl: undefined,
    });
    const result = (await res.json()) as any;
    expect(result.data).toEqual(['this is a data']);
  });
});
