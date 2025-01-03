import { ApolloServer } from '@apollo/server';
import { gql } from 'graphql-tag';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { ApolloServerErrorCode } from '@apollo/server/errors';
import assert from 'assert';
import { sentryPlugin, defaultLogger } from '../sentry/apolloSentryPlugin.ts';
import { errorHandler, NotFoundError } from './errorHandler.ts';
import * as Sentry from '@sentry/node';
import { ApolloServerPluginUsageReportingDisabled } from '@apollo/server/plugin/disabled';
import { GraphQLError } from 'graphql';

// Fake resolvers that throw errors
async function badSql() {
  throw new Error(`Cannot read properties of null (reading 'data')`);
}

function notFound() {
  throw new NotFoundError('book id');
}

function graphQLError() {
  throw new GraphQLError('graphql error', {
    extensions: {
      code: ApolloServerErrorCode.GRAPHQL_VALIDATION_FAILED,
    },
  });
}

const typeDefs = gql(`
    type Book {
        title: String
        author: String
    }
    type Query {
        books: [Book]
        lostBook: Book
        foundBook: Book
        badBook: Book
    }
`);

const resolvers = {
  Query: {
    books: badSql,
    lostBook: notFound,
    foundBook: () => ({ title: 'Slaughterhouse 5', author: 'Kurt Vonnegut' }),
    badBook: graphQLError,
  },
};

const server = new ApolloServer({
  schema: buildSubgraphSchema({ typeDefs, resolvers }),
  plugins: [sentryPlugin, ApolloServerPluginUsageReportingDisabled()],
  formatError: errorHandler,
  apollo: {
    key: undefined, //If you have APOLLO_KEY set Apollo won't start the server in tests
    graphVariant: 'current',
  },
});

describe('Server error handling: ', () => {
  const logErrorSpy: jest.SpyInstance<typeof defaultLogger> = jest.spyOn(
    defaultLogger,
    'error',
  );
  const sentrySpy: jest.SpyInstance = jest.spyOn(Sentry, 'captureException');

  afterEach(() => {
    logErrorSpy.mockReset();
    sentrySpy.mockReset();
  });

  it('throws a generic server error if not a special case', async () => {
    const query = `
        query {
            books {
                title
            }
        }
    `;
    const { body } = await server.executeOperation({ query });
    assert(body.kind === 'single');
    const res = body.singleResult;
    assert(res.errors !== undefined);
    expect(res?.errors.length).toBe(1);
    const error = res.errors[0];
    expect(error.message).toBe('Internal server error');
    expect(error.extensions?.code).toBe('INTERNAL_SERVER_ERROR');
    // Just passing through, so check if not undefined
    expect(error.path).toBeDefined();
    expect(error.locations).toBeDefined();
    // Check the error got logged & reported to Sentry
    [logErrorSpy, sentrySpy].forEach((spy) => {
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].message).toEqual(
        "Cannot read properties of null (reading 'data')",
      );
      expect(logErrorSpy.mock.calls[0][0]).toBeDefined();
    });
  });

  it('CustomGraphQLError implementations are returned as is', async () => {
    const query = `
        query {
            lostBook {
                title
            }
        }
    `;
    const { body } = await server.executeOperation({ query });
    assert(body.kind === 'single');
    const res = body.singleResult;
    expect(res?.errors?.length).toBe(1);
    assert(res.errors !== undefined);
    const error = res.errors[0];
    expect(error.message).toBe('Error - Not Found: book id');
    expect(error.extensions?.code).toBe('NOT_FOUND');
    // Just passing through, so check if not undefined
    expect(error.path).toBeDefined();
    expect(error.locations).toBeDefined();
    //not logging not-found errors
    [logErrorSpy, sentrySpy].forEach((spy) => {
      expect(spy).toHaveBeenCalledTimes(0);
    });
  });
  it('Can handle multiple errors and still resolve data', async () => {
    const query = `
        query {
            lostBook {
                title
                author
            }
            foundBook {
                title
                author
            }
            books {
                title
                author
            }
        }
    `;
    const { body } = await server.executeOperation({ query });
    assert(body.kind === 'single');
    const res = body.singleResult;
    assert(res.errors !== undefined);
    expect(res.errors.length).toBe(2);
    const messages = res.errors.map((error) => error.message);
    expect(messages).toEqual([
      'Error - Not Found: book id',
      'Internal server error',
    ]);
    const expectedData = {
      lostBook: null,
      foundBook: { title: 'Slaughterhouse 5', author: 'Kurt Vonnegut' },
      books: null,
    };
    expect(res.data).toEqual(expectedData);
  });
  it('does not mask validation errors or send to sentry/log', async () => {
    const query = `
        query {
            lostBook {
                invalidField
            }
        }
    `;
    const { body } = await server.executeOperation({ query });
    assert(body.kind === 'single');
    const res = body.singleResult;
    assert(res.errors !== undefined);
    expect(res.errors.length).toBe(1);
    expect(res.errors[0].message).toEqual(
      'Cannot query field "invalidField" on type "Book".',
    );
    [logErrorSpy, sentrySpy].forEach((spy) => {
      expect(spy).toHaveBeenCalledTimes(0);
    });
  });
  it('does not mask parsing/syntax errors', async () => {
    const query = `
      query {
        lostBook {
        }
      }
    `;
    const { body } = await server.executeOperation({ query });
    assert(body.kind === 'single');
    const res = body.singleResult;
    assert(res.errors !== undefined);

    expect(res.errors.length).toBe(1);
    expect(res.errors[0].message).toEqual(
      'Syntax Error: Expected Name, found "}".',
    );
    [logErrorSpy, sentrySpy].forEach((spy) => {
      expect(spy).toHaveBeenCalledTimes(0);
    });
  });
  it('does not mask GraphQLErrors with a defined extension', async () => {
    const query = `
    query {
      badBook {
        title
      }
    }
  `;
    const { body } = await server.executeOperation({ query });
    assert(body.kind === 'single');
    const res = body.singleResult;
    assert(res.errors !== undefined);
    expect(res.errors.length).toBe(1);
    expect(res.errors[0].message).toEqual('graphql error');
    // user error - shouldn't be logged
    [logErrorSpy, sentrySpy].forEach((spy) => {
      expect(spy).toHaveBeenCalledTimes(0);
    });
  });
});
