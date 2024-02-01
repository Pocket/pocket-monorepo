import chai, { expect } from 'chai';
import { resolvers } from './resolvers';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

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
    return expect(badSearch()).to.be.rejectedWith(
      'Must be logged in to perform search',
    );
  });
});
