import { reorderResultByKey } from './utils';

type MyObject = {
  name: string;
  id: number;
  next: MyObject | null;
};

describe('reorder by key', () => {
  it('works with unique mapping array', () => {
    const results: MyObject[] = [
      {
        id: 1,
        name: '1',
        next: { id: 1, name: '2', next: null },
      },
      {
        id: 2,
        name: '2',
        next: null,
      },
    ];
    const expected = [results[1], results[0]];
    const orderMapping = { key: 'name' as const, values: ['2', '1'] };
    const actual = reorderResultByKey<MyObject, 'name'>(orderMapping, results);
    expect(actual).toEqual(expected);
  });
  it('undefined returned when key is not found', () => {
    const results: MyObject[] = [
      {
        id: 1,
        name: '1',
        next: { id: 1, name: '2', next: null },
      },
      {
        id: 2,
        name: '2',
        next: null,
      },
    ];
    const expected = [undefined, results[0]];
    const orderMapping = { key: 'name' as const, values: ['3', '1'] };
    const actual = reorderResultByKey<MyObject, 'name'>(orderMapping, results);
    expect(actual).toEqual(expected);
  });
  it('works with singleton mapping array', () => {
    const results: MyObject[] = [
      {
        id: 1,
        name: '1',
        next: { id: 1, name: '2', next: null },
      },
      {
        id: 2,
        name: '2',
        next: null,
      },
    ];
    const orderMapping = { key: 'name' as const, values: ['1'] };
    const actual = reorderResultByKey<MyObject, 'name'>(orderMapping, results);
    expect(actual).toEqual([results[0]]);
  });
  it('works with empty mapping array', () => {
    const results: MyObject[] = [
      {
        id: 1,
        name: '1',
        next: { id: 1, name: '2', next: null },
      },
    ];
    const orderMapping = { key: 'name' as const, values: [] };
    const actual = reorderResultByKey<MyObject, 'name'>(orderMapping, results);
    expect(actual).toEqual([]);
  });
  it('works with numerical mapping key', () => {
    const results: MyObject[] = [
      {
        id: 1,
        name: '1',
        next: { id: 1, name: '2', next: null },
      },
      {
        id: 2,
        name: '2',
        next: null,
      },
    ];
    const expected = [results[1], results[0]];
    const orderMapping = { key: 'id' as const, values: [2, 1] };
    const actual = reorderResultByKey<MyObject, 'id'>(orderMapping, results);
    expect(actual).toEqual(expected);
  });
  it('works with mapping array that has duplicates', () => {
    const results: MyObject[] = [
      {
        id: 1,
        name: '1',
        next: { id: 1, name: '2', next: null },
      },
      {
        id: 2,
        name: '2',
        next: null,
      },
    ];
    const expected = [results[1], results[0], results[1]];
    const orderMapping = { key: 'id' as const, values: [2, 1, 2] };
    const actual = reorderResultByKey<MyObject, 'id'>(orderMapping, results);
    expect(actual).toEqual(expected);
  });
});
