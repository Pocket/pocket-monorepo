import * as ssm from '../ssm';
import nock from 'nock';
import { config } from '../config';
import { SQSEvent, SQSRecord } from 'aws-lambda';
import {
  IncomingBaseEvent,
  PocketEventType,
  PremiumPurchaseEvent,
} from '@pocket-tools/event-bridge';

import { cloneDeep } from 'lodash';
import { serverLogger } from '@pocket-tools/ts-logger';
import { processor } from '..';

function generateRecord(eventPayload: PremiumPurchaseEvent) {
  return {
    body: JSON.stringify({
      Message: JSON.stringify({
        ...eventPayload,
        time: '2022-09-10T17:29:22Z',
      }),
    }),
  };
}
describe('premium purchase handler', () => {
  const testPremiumPurchaseEvent: PremiumPurchaseEvent & IncomingBaseEvent = {
    id: '1234567890',
    version: '0',
    account: '123456789012',
    region: 'us-east-2',
    time: new Date(),
    'detail-type': PocketEventType.PREMIUM_PURCHASE,
    source: 'web-repo',
    detail: {
      user: {
        id: 1,
        email: '1@2.com',
        encodedId: '1ab',
      },
      purchase: {
        amount: '50$',
        cancelAtPeriodEnd: false,
        isFree: false,
        isTrial: false,
        planInterval: 'month',
        planType: 'monthly',
        receiptId: 'sub_c3h5n3o9',
        renewDate: '08/10/22',
      },
    },
  };

  const record = generateRecord(testPremiumPurchaseEvent);
  let serverLoggerSpy: jest.SpyInstance;

  beforeEach(() => {
    jest
      .spyOn(ssm, 'getBrazeApiKey')
      .mockImplementation(() => Promise.resolve('api-key'));
    serverLoggerSpy = jest.spyOn(serverLogger, 'error');
  });

  afterEach(() => {
    nock.cleanAll();
    jest.restoreAllMocks();
  });

  it('should send braze event and not throw error', async () => {
    nock(config.braze.endpoint)
      .post(config.braze.userTrackPath)
      .reply(200, { data: ['this is a data'] });

    await processor({
      Records: [record] as SQSRecord[],
    } as SQSEvent);

    expect(nock.isDone()).toBeTruthy();
  });

  it('should return data if retry succeed', async () => {
    nock(config.braze.endpoint)
      .post(config.braze.userTrackPath)
      .times(2)
      .reply(500, { errors: ['this is server error'] });

    nock(config.braze.endpoint)
      .post(config.braze.userTrackPath)
      .reply(200, { data: ['this is a data'] });

    await processor({
      Records: [record] as SQSRecord[],
    } as SQSEvent);
    expect(nock.isDone()).toBeTruthy();
  });

  it('should throw server error if all 3 retries fails', async () => {
    nock(config.braze.endpoint)
      .post(config.braze.userTrackPath)
      .times(3)
      .reply(500, { errors: ['this is server error'] });

    await processor({
      Records: [record] as SQSRecord[],
    } as SQSEvent);
    expect(nock.isDone()).toBeTruthy();
    expect(serverLoggerSpy).toHaveBeenCalled();
    expect(serverLoggerSpy.mock.calls[0][0]['errorData']['message']).toContain(
      'Error 500: Failed to send premium purchase event',
    );
  });

  it('should return status and error for braze client error', async () => {
    nock(config.braze.endpoint)
      .post(config.braze.userTrackPath)
      .reply(400, { errors: ['this is an error'] });
    await processor({
      Records: [record] as SQSRecord[],
    } as SQSEvent);
    expect(nock.isDone()).toBeTruthy();
    expect(serverLoggerSpy).toHaveBeenCalled();
    expect(serverLoggerSpy.mock.calls[0][0]['errorData']['message']).toContain(
      'Error 400: Failed to send premium purchase event',
    );
  });

  it('should throw error if User is not present', async () => {
    const errorEvent = cloneDeep(testPremiumPurchaseEvent) as any;
    delete errorEvent.detail.user;
    const record = generateRecord(errorEvent);

    await processor({
      Records: [record] as SQSRecord[],
    } as SQSEvent);
    expect(serverLoggerSpy).toHaveBeenCalled();
    expect(serverLoggerSpy.mock.calls[0][0]['errorData']['message']).toContain(
      "data/detail must have required property 'user'",
    );
  });

  it('should throw error if any field in Purchase is not present', async () => {
    const purchaseErrorEvent = cloneDeep(testPremiumPurchaseEvent) as any;
    delete purchaseErrorEvent.detail.purchase.receiptId;
    const record = generateRecord(purchaseErrorEvent);
    await processor({
      Records: [record] as SQSRecord[],
    } as SQSEvent);
    expect(serverLoggerSpy).toHaveBeenCalled();
    expect(serverLoggerSpy.mock.calls[0][0]['errorData']['message']).toContain(
      "data/detail/purchase must have required property 'receiptId'",
    );
  });

  it('should throw error if any field in User is not present', async () => {
    const purchaseErrorEvent = cloneDeep(testPremiumPurchaseEvent) as any;
    delete purchaseErrorEvent.detail.user.encodedId;
    const record = generateRecord(purchaseErrorEvent);

    await processor({
      Records: [record] as SQSRecord[],
    } as SQSEvent);
    expect(serverLoggerSpy).toHaveBeenCalled();
    expect(serverLoggerSpy.mock.calls[0][0]['errorData']['message']).toContain(
      "data/detail/user must have required property 'encodedId'",
    );
  });
});
