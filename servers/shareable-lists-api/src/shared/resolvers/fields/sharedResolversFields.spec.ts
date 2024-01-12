import { expect } from 'chai';
import * as Sentry from '@sentry/node';
import { parseFieldToInt } from '../../../shared/resolvers/fields/PrismaBigInt';

describe('Shared Resolver Helpers', () => {
  let sentryStub;

  beforeEach(() => {
    sentryStub = jest.spyOn(Sentry, 'captureException').mockClear().mockImplementation().resolves();
  });

  afterEach(() => {
    sentryStub.mockRestore();
  });
  describe('PrismaBigInt Resolver - parseFieldToInt function', () => {
    it('should return null if field is string of chars', async () => {
      const itemId = 'abc';
      const resolvedValue = parseFieldToInt(itemId);
      expect(resolvedValue).to.be.null;
      // Expect Sentry to get invoked and assert message
      expect(sentryStub).toHaveBeenCalledTimes(1);
      expect(sentryStub.mock.calls[0].firstArg).to.equal('Failed to parse itemId');
    });
    it('should return null if field is null', async () => {
      const itemId = null;
      const resolvedValue = parseFieldToInt(itemId);
      expect(resolvedValue).to.be.null;
      // Expect Sentry to get invoked and assert message
      expect(sentryStub).toHaveBeenCalledTimes(1);
      expect(sentryStub.mock.calls[0].firstArg).to.equal('Failed to parse itemId');
    });
    it('should return null if field is undefined', async () => {
      const itemId = undefined;
      const resolvedValue = parseFieldToInt(itemId);
      expect(resolvedValue).to.be.null;
      // Expect Sentry to get invoked and assert message
      expect(sentryStub).toHaveBeenCalledTimes(1);
      expect(sentryStub.mock.calls[0].firstArg).to.equal('Failed to parse itemId');
    });
    it('should return null if field is empty string', async () => {
      const itemId = '';
      const resolvedValue = parseFieldToInt(itemId);
      expect(resolvedValue).to.be.null;
      // Expect Sentry to get invoked and assert message
      expect(sentryStub).toHaveBeenCalledTimes(1);
      expect(sentryStub.mock.calls[0].firstArg).to.equal('Failed to parse itemId');
    });
    it('should successfully resolve value to int', async () => {
      // db returns BigInts in 1234n format
      const itemId = '12345n';
      const resolvedValue = parseFieldToInt(itemId);
      expect(resolvedValue).to.equal(12345);
      // Expect Sentry to NOT get invoked
      expect(sentryStub).toHaveBeenCalledTimes(0);
    });
  });
});
