import * as ssm from '../ssm';
import nock from 'nock';
import sinon from 'sinon';
import { config } from '../config';
import { premiumPurchaseHandler } from './premiumPurchaseHandler';
import { SQSRecord } from 'aws-lambda';
import { PremiumPurchaseEvent } from '../schemas/premiumPurchaseSchema/premiumPurchaseEvent';

function generateRecord(eventPayload: PremiumPurchaseEvent) {
  return {
    body: JSON.stringify({
      Message: JSON.stringify({
        detail: {
          ...eventPayload,
        },
        time: '2022-09-10T17:29:22Z',
      }),
    }),
  };
}
describe('premium purchase handler', () => {
  const testPremiumPurchaseEvent = {
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
  };

  const record = generateRecord(testPremiumPurchaseEvent);

  beforeEach(() => {
    sinon.stub(ssm, 'getBrazeApiKey').returns('api-key');
  });

  afterEach(() => {
    nock.cleanAll();
    sinon.restore();
  });

  it('should send braze event and not throw error', async () => {
    nock(config.braze.endpoint)
      .post(config.braze.userTrackPath)
      .reply(200, { data: ['this is a data'] });

    const res = await premiumPurchaseHandler(record as SQSRecord);
    const result = (await res.json()) as any;
    expect(result.data).toEqual(['this is a data']);
  });

  it('should return data if retry succeed', async () => {
    nock(config.braze.endpoint)
      .post(config.braze.userTrackPath)
      .times(2)
      .reply(500, { errors: ['this is server error'] });

    nock(config.braze.endpoint)
      .post(config.braze.userTrackPath)
      .reply(200, { data: ['this is a data'] });

    const res = await premiumPurchaseHandler(record as SQSRecord);
    const result = (await res.json()) as any;
    expect(result.data).toEqual(['this is a data']);
  });

  it('should throw server error if all 3 retries fails', async () => {
    nock(config.braze.endpoint)
      .post(config.braze.userTrackPath)
      .times(3)
      .reply(500, { errors: ['this is server error'] });

    try {
      await premiumPurchaseHandler(record as SQSRecord);
    } catch (e) {
      expect(e.message).toContain(
        'Error 500: Failed to send premium purchase event',
      );
    }
  });

  it('should return status and error for braze client error', async () => {
    nock(config.braze.endpoint)
      .post(config.braze.userTrackPath)
      .reply(400, { errors: ['this is an error'] });

    try {
      await premiumPurchaseHandler(record as SQSRecord);
    } catch (e) {
      expect(e.message).toContain(
        'Error 400: Failed to send premium purchase event',
      );
    }
  });

  it('should throw error if User is not present', async () => {
    const errorEvent = {
      user: {
        ...testPremiumPurchaseEvent.user,
      },
      purchase: {
        ...testPremiumPurchaseEvent.purchase,
      },
    };
    errorEvent.user = null;
    const record = generateRecord(errorEvent);

    try {
      await premiumPurchaseHandler(record as SQSRecord);
    } catch (e) {
      expect(e.message).toContain('user does not exist in message');
    }
  });

  it('should throw error if any field in Purchase is not present', async () => {
    const purchaseErrorEvent = {
      user: {
        ...testPremiumPurchaseEvent.user,
      },
      purchase: {
        ...testPremiumPurchaseEvent.purchase,
      },
    };
    purchaseErrorEvent.purchase.receiptId = null;
    const record = generateRecord(purchaseErrorEvent);

    try {
      await premiumPurchaseHandler(record as SQSRecord);
    } catch (e) {
      expect(e.message).toContain(
        "receiptId does not exist under 'purchase' object in the message",
      );
    }
  });

  it('should throw error if any field in User is not present', async () => {
    const errorEvent = {
      user: {
        ...testPremiumPurchaseEvent.user,
      },
      purchase: {
        ...testPremiumPurchaseEvent.purchase,
      },
    };
    errorEvent.user.encodedId = null;
    const record = generateRecord(errorEvent);

    try {
      await premiumPurchaseHandler(record as SQSRecord);
    } catch (e) {
      expect(e.message).toContain(
        "encodedId does not exist under 'user' object in the message",
      );
    }
  });
});
