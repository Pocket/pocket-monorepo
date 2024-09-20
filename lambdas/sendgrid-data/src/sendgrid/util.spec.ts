import { chunkArray } from './util';

describe('util', () => {
  describe('chunkArray', () => {
    it('should yield arrays of the specified size', () => {
      const events = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const results: any[] = [];

      const generator = chunkArray(events, 3);
      let current = generator.next();

      while (!current.done) {
        results.push(current.value);
        current = generator.next();
      }

      expect(results.length).toEqual(4);
    });
  });
});
