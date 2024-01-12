import sinon from 'sinon';
import { expect } from 'chai';
import * as Sentry from '@sentry/node';
import { parseFieldToInt } from '../../../shared/resolvers/fields/PrismaBigInt';

describe('Shared Resolver Helpers', () => {
  let sentryStub;

  beforeEach(() => {
    sentryStub = sinon.stub(Sentry, 'captureException').resolves();
  });

  afterEach(() => {
    sentryStub.restore();
  });
  describe('PrismaBigInt Resolver - parseFieldToInt function', () => {
    it('should return null if field is string of chars', async () => {
      const itemId = 'abc';
      const resolvedValue = parseFieldToInt(itemId);
      expect(resolvedValue).to.be.null;
      // Expect Sentry to get invoked and assert message
      expect(sentryStub.callCount).to.equal(1);
      expect(sentryStub.getCall(0).firstArg).to.equal('Failed to parse itemId');
    });
    it('should return null if field is null', async () => {
      const itemId = null;
      const resolvedValue = parseFieldToInt(itemId);
      expect(resolvedValue).to.be.null;
      // Expect Sentry to get invoked and assert message
      expect(sentryStub.callCount).to.equal(1);
      expect(sentryStub.getCall(0).firstArg).to.equal('Failed to parse itemId');
    });
    it('should return null if field is undefined', async () => {
      const itemId = undefined;
      const resolvedValue = parseFieldToInt(itemId);
      expect(resolvedValue).to.be.null;
      // Expect Sentry to get invoked and assert message
      expect(sentryStub.callCount).to.equal(1);
      expect(sentryStub.getCall(0).firstArg).to.equal('Failed to parse itemId');
    });
    it('should return null if field is empty string', async () => {
      const itemId = '';
      const resolvedValue = parseFieldToInt(itemId);
      expect(resolvedValue).to.be.null;
      // Expect Sentry to get invoked and assert message
      expect(sentryStub.callCount).to.equal(1);
      expect(sentryStub.getCall(0).firstArg).to.equal('Failed to parse itemId');
    });
    it('should successfully resolve value to int', async () => {
      // db returns BigInts in 1234n format
      const itemId = '12345n';
      const resolvedValue = parseFieldToInt(itemId);
      expect(resolvedValue).to.equal(12345);
      // Expect Sentry to NOT get invoked
      expect(sentryStub.callCount).to.equal(0);
    });
  });
});
