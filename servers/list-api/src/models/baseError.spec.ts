import { GraphQLResolveInfo } from 'graphql';
import { BaseErrorModel } from './baseError.js';

describe('Error model', () => {
  const noPrev: GraphQLResolveInfo['path'] = {
    prev: undefined,
    key: 'i',
    typename: 'type',
  };
  const onePrev: GraphQLResolveInfo['path'] = {
    prev: noPrev,
    key: 'say',
    typename: 'type',
  };
  const twoPrev: GraphQLResolveInfo['path'] = {
    prev: onePrev,
    key: 'hey',
    typename: 'type',
  };
  const numberKey: GraphQLResolveInfo['path'] = {
    prev: noPrev,
    key: 1,
    typename: 'type',
  };
  test.each([
    { path: noPrev, expected: 'i' },
    { path: onePrev, expected: 'i.say' },
    { path: twoPrev, expected: 'i.say.hey' },
    { path: numberKey, expected: 'i.1' },
  ])(
    'prints a period-separate path string: $expected',
    ({ path, expected }) => {
      const actual = new BaseErrorModel().path(path);
      expect(actual).toStrictEqual(expected);
    },
  );
});
