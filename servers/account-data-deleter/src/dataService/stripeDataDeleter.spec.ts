import { StripeDataDeleter } from './stripeDataDeleter';
import sinon from 'sinon';
import * as Sentry from '@sentry/node';
import * as conn from './clients';

describe.skip('StripeDataDeleter', () => {
  let sentryStub: sinon.SinonStub, crumbStub: sinon.SinonStub;
  beforeAll(() => {
    sentryStub = sinon.stub(Sentry, 'captureException');
    crumbStub = sinon.stub(Sentry, 'addBreadcrumb');
  });
  afterEach(() => {
    sinon.resetHistory();
    sinon.restore();
  });

  describe('deleteStripeCustomers', () => {
    let stripeClient: sinon.SinonStub;
    let customerStub: sinon.SinonStub;
    let subscriptionStub: sinon.SinonStub;
    describe('happy path', () => {
      beforeAll(() => {
        subscriptionStub = sinon.stub().resolves({ customer: 'abc-xyz' });
        customerStub = sinon.stub().resolves({ id: 'abc-xyz' });
        stripeClient = sinon.stub(conn, 'stripeClient').returns({
          customers: { del: () => customerStub },
          subscriptions: { retrieve: () => subscriptionStub },
        } as any);
      });
      afterAll(() => stripeClient?.restore());
      it('returns a single successfuly deleted id', async () => {
        const deleter = new StripeDataDeleter('1');
        const res = await deleter.deleteStripeCustomers(['abc-xyz']);
        expect(res).toEqual(['abc-xyz']);
        expect(sentryStub.callCount).toEqual(0);
      });
      it('returns multiple successfully deleted ids', async () => {
        const deleter = new StripeDataDeleter('1');
        const res = await deleter.deleteStripeCustomers(['abc-xyz', 'alu-min']);
        expect(res).toEqual(['abc-xyz', 'alu-min']);
        expect(sentryStub.callCount).toEqual(0);
      });
    });
    describe('with not found id', () => {
      beforeAll(() => {
        subscriptionStub = sinon.stub().rejects({ code: 'resource_missing' });
        stripeClient = sinon
          .stub(conn, 'stripeClient')
          .returns({ subscription: { retrieve: subscriptionStub } } as any);
      });
      afterAll(() => stripeClient?.restore());
      it('returns as success', async () => {
        const deleter = new StripeDataDeleter('1');
        const res = await deleter.deleteStripeCustomers(['abc-xyz', 'alu-min']);
        expect(res).toEqual(['abc-xyz', 'alu-min']);
        expect(sentryStub.callCount).toEqual(0);
      });
    });
    describe('sad path', () => {
      beforeAll(() => {
        customerStub = sinon.stub().resolves({ id: 'abc-xyz' });
        subscriptionStub = sinon
          .stub()
          .onFirstCall()
          .rejects(new Error('this is an error'))
          .onSecondCall()
          .resolves({ customer: 'abc-xyz' })();
        stripeClient = sinon.stub(conn, 'stripeClient').returns({
          customers: { del: customerStub },
          subscriptions: { retrieve: subscriptionStub },
        } as any);
      });
      afterAll(() => stripeClient?.restore());
      it('returns only successful ids', async () => {
        const deleter = new StripeDataDeleter('1');
        const res = await deleter.deleteStripeCustomers(['abc-xyz', 'alu-min']);
        expect(res).toEqual(['alu-min']);
        expect(sentryStub.callCount).toEqual(1);
        expect(crumbStub.callCount).toEqual(1);
        expect(crumbStub.firstCall.args[0]).toMatchObject({
          data: { stripeId: 'abc-xyz' },
        });
      });
      it('returns empty array if all failed', async () => {
        const deleter = new StripeDataDeleter('1');
        const res = await deleter.deleteStripeCustomers(['abc-xyz']);
        expect(res).toEqual([]);
        expect(sentryStub.callCount).toEqual(1);
        expect(crumbStub.callCount).toEqual(1);
        expect(crumbStub.firstCall.args[0]).toMatchObject({
          data: { stripeId: 'abc-xyz' },
        });
      });
    });
  });
});
