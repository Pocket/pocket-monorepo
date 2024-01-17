import { StripeDataDeleter } from './stripeDataDeleter';
import * as Sentry from '@sentry/node';
import * as conn from './clients';

describe.skip('StripeDataDeleter', () => {
  let sentryStub: jest.SpyInstance, crumbStub: jest.SpyInstance;
  beforeAll(() => {
    sentryStub = jest.spyOn(Sentry, 'captureException');
    crumbStub = jest.spyOn(Sentry, 'addBreadcrumb');
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('deleteStripeCustomers', () => {
    let stripeClient: jest.SpyInstance;
    let customerStub: jest.SpyInstance;
    let subscriptionStub: jest.SpyInstance;
    describe('happy path', () => {
      beforeAll(() => {
        subscriptionStub = jest.fn().mockResolvedValue({ customer: 'abc-xyz' });
        customerStub = jest.fn().mockResolvedValue({ id: 'abc-xyz' });
        stripeClient = jest.spyOn(conn, 'stripeClient').mockReturnValue({
          customers: { del: () => customerStub },
          subscriptions: { retrieve: () => subscriptionStub },
        } as any);
      });
      afterAll(() => stripeClient?.mockRestore());
      it('returns a single successfuly deleted id', async () => {
        const deleter = new StripeDataDeleter('1');
        const res = await deleter.deleteStripeCustomers(['abc-xyz']);
        expect(res).toEqual(['abc-xyz']);
        expect(sentryStub).toHaveBeenCalledTimes(0);
      });
      it('returns multiple successfully deleted ids', async () => {
        const deleter = new StripeDataDeleter('1');
        const res = await deleter.deleteStripeCustomers(['abc-xyz', 'alu-min']);
        expect(res).toEqual(['abc-xyz', 'alu-min']);
        expect(sentryStub).toHaveBeenCalledTimes(0);
      });
    });
    describe('with not found id', () => {
      beforeAll(() => {
        subscriptionStub = jest
          .fn()
          .mockRejectedValue({ code: 'resource_missing' });
        stripeClient = jest.spyOn(conn, 'stripeClient').mockReturnValue({
          subscription: { retrieve: subscriptionStub },
        } as any);
      });
      afterAll(() => stripeClient?.mockRestore());
      it('returns as success', async () => {
        const deleter = new StripeDataDeleter('1');
        const res = await deleter.deleteStripeCustomers(['abc-xyz', 'alu-min']);
        expect(res).toEqual(['abc-xyz', 'alu-min']);
        expect(sentryStub).toHaveBeenCalledTimes(0);
      });
    });
    describe('sad path', () => {
      beforeAll(() => {
        customerStub = jest.fn().mockResolvedValue({ id: 'abc-xyz' });
        subscriptionStub = jest
          .fn()
          .mockRejectedValueOnce(new Error('this is an error'))
          .mockResolvedValue({ customer: 'abc-xyz' })();
        stripeClient = jest
          .spyOn(conn, 'stripeClient')
          .mockClear()
          .mockReturnValue({
            customers: { del: customerStub },
            subscriptions: { retrieve: subscriptionStub },
          } as any);
      });
      afterAll(() => stripeClient?.mockRestore());
      it('returns only successful ids', async () => {
        const deleter = new StripeDataDeleter('1');
        const res = await deleter.deleteStripeCustomers(['abc-xyz', 'alu-min']);
        expect(res).toEqual(['alu-min']);
        expect(sentryStub).toHaveBeenCalledTimes(1);
        expect(crumbStub).toHaveBeenCalledTimes(1);
        expect(crumbStub.mock.calls[0][0]).toMatchObject({
          data: { stripeId: 'abc-xyz' },
        });
      });
      it('returns empty array if all failed', async () => {
        const deleter = new StripeDataDeleter('1');
        const res = await deleter.deleteStripeCustomers(['abc-xyz']);
        expect(res).toEqual([]);
        expect(sentryStub).toHaveBeenCalledTimes(1);
        expect(crumbStub).toHaveBeenCalledTimes(1);
        expect(crumbStub.mock.calls[0][0]).toMatchObject({
          data: { stripeId: 'abc-xyz' },
        });
      });
    });
  });
});
