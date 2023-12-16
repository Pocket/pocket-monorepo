import { groupByCount, sumByKey } from './dataAggregation';

describe('Data aggregation functions', () => {
  describe('groupByCount', () => {
    it.each([
      { a: [], expected: {} },
      { a: [{ a: 'aa' }], expected: { aa: 1 } },
      { a: [{ a: 'aa' }, { b: 'aa' }], expected: { aa: 1 } },
      {
        a: [{ a: 'aa' }, { a: 'aa' }, { a: 'bb' }],
        expected: { aa: 2, bb: 1 },
      },
    ])(`'(%o)'`, ({ a, expected }) => {
      expect(groupByCount(a, 'a')).toStrictEqual(expected);
    });
  });
  describe('sumByKey', () => {
    it.each([
      { a: {}, b: {}, expected: {} },
      { a: {}, b: { a: 1 }, expected: { a: 1 } },
      { a: { a: 1 }, b: {}, expected: { a: 1 } },
      { a: { a: 1 }, b: { b: 0 }, expected: { a: 1, b: 0 } },
      { a: { a: 1 }, b: { a: 0, b: 0 }, expected: { a: 1, b: 0 } },
      { a: { a: 1 }, b: { a: 1, b: 1 }, expected: { a: 2, b: 1 } },
      { a: { a: 1, b: 1 }, b: { a: 1 }, expected: { a: 2, b: 1 } },
    ])(`'(%o)'`, ({ a, b, expected }) => {
      // Not sure why this type check is so finicky
      expect(sumByKey(a as any, b)).toStrictEqual(expected);
    });
  });
});
