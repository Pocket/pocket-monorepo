import { isInResolverChain } from './utils';

describe('isInResolverChain', () => {
  it.each([
    {
      path: {
        prev: { key: 'refresh', prev: undefined, typename: 'Mutation' },
        key: 'preview',
        typename: 'ItemMetadata',
      },
    },
    {
      path: {
        prev: {
          key: 'Item',
          prev: {
            key: 'refresh',
            prev: { key: 'refresh', prev: undefined, typename: 'Mutation' },
            typename: 'Mutation',
          },
          typename: 'Item',
        },
        key: 'preview',
        typename: 'ItemMetadata',
      },
    },
  ])('returns true if the resolve is in the chain', ({ path }) => {
    expect(isInResolverChain('refresh', path)).toBeTruthy();
  });
  it.each([
    {
      path: {
        prev: { key: 'refresh', prev: undefined, typename: 'Mutation' },
        key: 'preview',
        typename: 'ItemMetadata',
      },
    },
    {
      path: {
        prev: undefined,
        key: 'item',
        typename: 'ItemMetadata',
      },
    },
  ])('returns false if not', ({ path }) => {
    expect(isInResolverChain('danger', path)).toBeFalsy();
  });
  it.each([
    {
      path: {
        prev: { key: 'refresh', prev: undefined, typename: 'Mutation' },
        key: 'item',
        typename: 'ItemMetadata',
      },
    },
    {
      path: {
        prev: undefined,
        key: 'item',
        typename: 'ItemMetadata',
      },
    },
  ])('excludes lowest node if inclusive is false', ({ path }) => {
    expect(isInResolverChain('item', path, false)).toBeFalsy();
  });
});
