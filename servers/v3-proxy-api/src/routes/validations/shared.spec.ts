import { timeSeconds } from './shared';

describe('shared validators/sanitizers', () => {
  describe('timeSeconds', () => {
    it('converts milliseconds to seconds', () => {
      expect(timeSeconds(1719263946000)).toEqual(1719263946);
    });
    it('leaves seconds alone', () => {
      expect(timeSeconds(171926394)).toEqual(171926394);
    });
  });
});
