import { ListenModel } from './ListenModel.js';

describe('Listen', () => {
  it.each([
    [155, 60],
    [300, 116],
    [0, 0],
    [null, null],
    [undefined, null],
    [-100, null],
  ])(
    'computes estimated listen duration from word count',
    (words, expected) => {
      expect(ListenModel.estimateDuration(words)).toEqual(expected);
    },
  );
});
