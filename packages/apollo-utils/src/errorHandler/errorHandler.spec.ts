import { ApolloServer } from '@apollo/server';
import { gql } from 'graphql-tag';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { ApolloServerErrorCode } from '@apollo/server/errors';
import assert from 'assert';
import { sentryPlugin } from '../plugins/sentryPlugin';
import { errorHandler } from './errorHandler';
import chai, { expect } from 'chai';
import { NotFoundError } from './errorHandler';
import sinon from 'sinon';
import * as Sentry from '@sentry/node';
import deepEqualInAnyOrder from 'deep-equal-in-any-order';
import { ApolloServerPluginUsageReportingDisabled } from '@apollo/server/plugin/disabled';
import { GraphQLError } from 'graphql';
import { defaultLogger } from '../plugins/sentryPlugin';

chai.use(deepEqualInAnyOrder);

// Fake resolvers that throw errors
async function badSql() {
  const db = null;
  return db.data;
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
  const logErrorSpy = sinon.spy(defaultLogger, 'error');
  const sentrySpy = sinon.spy(Sentry, 'captureException');

  afterEach(() => {
    logErrorSpy.resetHistory();
    sentrySpy.resetHistory();
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
    expect(res?.errors.length).to.equal(1);
    const error = res.errors[0];
    expect(error.message).to.equal('Internal server error');
    expect(error.extensions?.code).to.equal('INTERNAL_SERVER_ERROR');
    // Just passing through, so check if not undefined
    expect(error.path).to.not.be.undefined;
    expect(error.locations).to.not.be.undefined;
    // Check the error got logged & reported to Sentry
    [logErrorSpy, sentrySpy].forEach((spy) => {
      expect(spy.calledOnce).to.be.true;
      expect(spy.getCall(0).args[0].message).to.contain(
        "Cannot read properties of null (reading 'data')",
      );
      expect(logErrorSpy.getCall(0).args[0].stack).to.not.be.undefined;
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
    expect(res?.errors?.length).to.equal(1);
    assert(res.errors !== undefined);
    const error = res.errors[0];
    expect(error.message).to.equal('Error - Not Found: book id');
    expect(error.extensions?.code).to.equal('NOT_FOUND');
    // Just passing through, so check if not undefined
    expect(error.path).to.not.be.undefined;
    expect(error.locations).to.not.be.undefined;
    //not logging not-found errors
    [logErrorSpy, sentrySpy].forEach((spy) => {
      expect(spy.callCount).to.equal(0);
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
    expect(res.errors.length).to.equal(2);
    const messages = res.errors.map((error) => error.message);
    expect(messages).to.deep.equalInAnyOrder([
      'Error - Not Found: book id',
      'Internal server error',
    ]);
    const expectedData = {
      lostBook: null,
      foundBook: { title: 'Slaughterhouse 5', author: 'Kurt Vonnegut' },
      books: null,
    };
    expect(res.data).to.deep.equal(expectedData);
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
    expect(res.errors.length).to.equal(1);
    expect(res.errors[0].message).to.contain('Cannot query field');
    [logErrorSpy, sentrySpy].forEach((spy) => {
      expect(spy.callCount).to.equal(0);
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

    expect(res.errors.length).to.equal(1);
    expect(res.errors[0].message).to.contain('Syntax Error');
    [logErrorSpy, sentrySpy].forEach((spy) => {
      expect(spy.callCount).to.equal(0);
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
    expect(res.errors.length).to.equal(1);
    expect(res.errors[0].message).to.contain('graphql error');
    // user error - shouldn't be logged
    [logErrorSpy, sentrySpy].forEach((spy) => {
      expect(spy.callCount).to.equal(0);
    });
  });
});
