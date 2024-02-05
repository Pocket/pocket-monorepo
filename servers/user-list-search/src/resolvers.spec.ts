import { resolvers } from './resolvers';

describe('search', () => {
  it('should throw AuthenticationError if userId is not in context', async () => {
    const inputParams = {
      term: 'a',
      fields: ['title'],
    };

    const badSearch = async () => {
      return await resolvers.User.search(
        {},
        {
          params: inputParams,
        },
        {
          userId: undefined,
          userIsPremium: false,
          knexDbClient: null,
        },
      );
    };
    return expect(badSearch()).rejects.toThrow(
      'Must be logged in to perform search',
    );
  });
});
