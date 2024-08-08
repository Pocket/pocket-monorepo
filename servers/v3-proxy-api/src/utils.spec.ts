import { isExtension, parseApiId } from './utils';

describe('utils', () => {
  describe('parseApiId from consumer key', () => {
    it.each(['123-test', '123-456', '123-a34df234'])(
      'works for expected keys',
      (key) => {
        expect(parseApiId(key)).toEqual(123);
      },
    );
    it.each(['test', 'abc-1234', '1232', '123aa-test'])(
      'returns undefined for malformed/nonconforming keys',
      (key) => {
        expect(parseApiId(key)).toBeUndefined();
      },
    );
  });
  describe('isExtension', () => {
    it.each([7035, 73360])('works for extensions', (key) => {
      expect(isExtension(key)).toEqual(true);
    });
    it.each([NaN, undefined, 9999999, 0])('works for non-extensions', (key) => {
      expect(isExtension(key)).toEqual(false);
    });
  });
});
