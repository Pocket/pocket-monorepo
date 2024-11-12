import { removeEmptyObjects } from './jsonUtils';

describe('jsonUtils - removeEmptyObjects', () => {
  it.each([
    {
      subject: {
        collection: {
          externalId: '12',
          slug: 'a-cool-slug',
          title: 'A cool title',
          status: 'published',
        },
      },
      expected: {
        collection: {
          externalId: '12',
          slug: 'a-cool-slug',
          title: 'A cool title',
          status: 'published',
        },
      },
    },
    {
      subject: {
        collection: {
          externalId: '12',
          IABParentCategory: {},
          IABChildCategory: {},
        },
      },
      expected: {
        collection: {
          externalId: '12',
        },
      },
    },
    {
      subject: {
        collection: {
          externalId: '12',
          authors: [
            { testing: {}, name: 'remove me' },
            { tesing: { test: 'test' }, name: 'keep me' },
          ],
        },
      },
      expected: {
        collection: {
          externalId: '12',
          authors: [
            { name: 'remove me' },
            { tesing: { test: 'test' }, name: 'keep me' },
          ],
        },
      },
    },
    {
      subject: {
        collection: {
          nestedObject: {
            inANestedObject: {
              shouldbeRemoved: {},
              testing: 'but i should stay',
            },
          },
        },
      },
      expected: {
        collection: {
          nestedObject: {
            inANestedObject: {
              testing: 'but i should stay',
            },
          },
        },
      },
    },
  ])('should remove empty objects', ({ subject, expected }) => {
    const result = removeEmptyObjects(subject);
    expect(result).toEqual(expected);
  });
});
