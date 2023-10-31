import { IContext } from '../context';
import { resolvers } from './index';
import { ForbiddenError } from '@pocket-tools/apollo-utils';
import { UserModel } from '../models/User';
import { mockRequest } from 'jest-mock-req-res';

describe('tests for context factory initialization', () => {
  it('Throws a forbidden error if there is no user model in the context', async () => {
    const context = {
      models: { user: null },
    } as IContext;

    try {
      await resolvers.Query.user(null, null, context);
      fail('Expected ForbiddenError not thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.extensions).toHaveProperty('status', 401);
    }
  });
  it('Returns the user model if there is one in the context', async () => {
    // this test is kind of contrived, but it does test the current
    // logic in the resolver without coupling to header content.
    const request = mockRequest({
      headers: {}, // just here because we need a headers object for this case
    });
    const context = {
      models: { user: null },
      headers: request.headers,
    } as IContext;

    context.models.user = new UserModel(context);
    const resolverResult = await resolvers.Query.user(null, null, context);
    expect(resolverResult).toEqual(expect.any(UserModel));
  });
});
