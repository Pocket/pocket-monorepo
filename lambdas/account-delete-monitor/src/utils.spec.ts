import * as utils from './utils.js';

describe('util functions', () => {
  describe('epochMsToIsoDate', () => {
    it('returns date for positive epoch time', () => {
      const ms = 1659999736000;
      expect(utils.epochMsToIsoDate(ms)).toEqual('2022-08-08');
    });
  });
});
