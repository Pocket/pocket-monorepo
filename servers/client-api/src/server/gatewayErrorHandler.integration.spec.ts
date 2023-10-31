import { gatewayErrorHandler } from './gatewayErrorHandler';
import { ApolloGateway, RemoteGraphQLDataSource } from '@apollo/gateway';
import { ApolloServer } from '@apollo/server';
import { ApolloServerErrorCode } from '@apollo/server/errors';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginUsageReportingDisabled } from '@apollo/server/plugin/disabled';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { errorHandler, NotFoundError } from '@pocket-tools/apollo-utils';
import express, { Application } from 'express';
import { readFileSync } from 'fs';
import { GraphQLError } from 'graphql';
import { gql } from 'graphql-tag';
import request from 'supertest';

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
  plugins: [ApolloServerPluginUsageReportingDisabled()],
  formatError: errorHandler,
  apollo: {
    key: undefined, //If you have APOLLO_KEY set Apollo won't start the server in tests
    graphVariant: 'current',
  },
});

const gatewayServer = new ApolloServer({
  gateway: new ApolloGateway({
    supergraphSdl: readFileSync(
      './src/server/gatewayErrorHandler.local-supergraph.graphql'
    ).toString(),
    buildService({ url }) {
      return new RemoteGraphQLDataSource({
        url,
      });
    },
  }),
  plugins: [ApolloServerPluginUsageReportingDisabled()],
  formatError: gatewayErrorHandler,
  apollo: {
    key: undefined, //If you have APOLLO_KEY set Apollo won't start the server in tests
    graphVariant: 'current',
  },
});

const app: Application = express();
const gateway: Application = express();

describe('Server & Gateway error handling: ', () => {
  beforeAll(async () => {
    await server.start();
    app.use(express.json());
    app.use('/', expressMiddleware(server));
    app.listen(3000, () => console.log('Listening at port 3000'));
    await gatewayServer.start();
    gateway.use(express.json());
    gateway.use('/', expressMiddleware(gatewayServer));
  });
  afterAll(async () => {
    await server.stop();
    await gatewayServer.stop();
  });

  it('subgraph - found book works', async () => {
    const res: request.Response = await request(app)
      .post('/')
      .send({ query: 'query { foundBook { title } }' })
      .expect(200);
    expect(res.body.data.foundBook.title).toBe('Slaughterhouse 5');
    expect(res.body.errors).toBe(undefined);
  });

  it('subgraph - return generic server error if not special case works', async () => {
    const res: request.Response = await request(app)
      .post('/')
      .send({ query: 'query { books { title } }' })
      .expect(200);
    expect(res.body.errors).toHaveLength(1);
    expect(res.body.errors[0].message).toBe('Internal server error');
    expect(res.body.errors[0].extensions.code).toBe('INTERNAL_SERVER_ERROR');
    expect(res.body.errors[0].path).not.toBe(undefined);
    expect(res.body.errors[0].locations).not.toBe(undefined);
  });

  it('subgraph - return custom error works', async () => {
    const res: request.Response = await request(app)
      .post('/')
      .send({ query: 'query { lostBook { title } }' })
      .expect(200);
    expect(res.body.errors).not.toBe(undefined);
    expect(res.body.errors).toHaveLength(1);
    expect(res.body.errors[0].message).toBe('Error - Not Found: book id');
    expect(res.body.errors[0].extensions.code).toBe('NOT_FOUND');
    expect(res.body.errors[0].path).not.toBe(undefined);
    expect(res.body.errors[0].locations).not.toBe(undefined);
  });

  it('subgraph - multiple errors handling works', async () => {
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
    const res: request.Response = await request(app)
      .post('/')
      .send({ query })
      .expect(200);
    expect(res.body.data.foundBook.title).toBe('Slaughterhouse 5');
    expect(res.body.data.foundBook.author).toBe('Kurt Vonnegut');
    expect(res.body.data.lostBook).toBe(null);
    expect(res.body.data.books).toBe(null);
    expect(res.body.errors).not.toBe(undefined);
    expect(res.body.errors).toHaveLength(2);
    expect(res.body.errors).toContainEqual({
      extensions: {
        code: 'NOT_FOUND',
      },
      locations: [
        {
          column: 13,
          line: 3,
        },
      ],
      message: 'Error - Not Found: book id',
      path: ['lostBook'],
    });
    expect(res.body.errors).toContainEqual({
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
      },
      locations: [
        {
          column: 13,
          line: 11,
        },
      ],
      message: 'Internal server error',
      path: ['books'],
    });
  });

  it('subgraph - does not mask GraphQL parsing errors', async () => {
    const res: request.Response = await request(app)
      .post('/')
      .send({ query: 'query { lostBook { } }' })
      .expect(400);
    expect(res.body.errors).not.toBe(undefined);
    expect(res.body.errors).toHaveLength(1);
    expect(res.body.errors[0].message).toBe(
      'Syntax Error: Expected Name, found "}".'
    );
    expect(res.body.errors[0].extensions.code).toBe(
      ApolloServerErrorCode.GRAPHQL_PARSE_FAILED
    );
    // no path in error response for parsing errors
    expect(res.body.errors[0].locations).not.toBe(undefined);
  });

  it('subgraph - does not mask GraphQL validation errors', async () => {
    const res: request.Response = await request(app)
      .post('/')
      .send({ query: 'query { badBook { title } }' })
      .expect(200);
    expect(res.body.errors).not.toBe(undefined);
    expect(res.body.errors).toHaveLength(1);
    expect(res.body.errors[0].message).toBe('graphql error');
    expect(res.body.errors[0].extensions.code).toBe(
      ApolloServerErrorCode.GRAPHQL_VALIDATION_FAILED
    );
    expect(res.body.errors[0].path).not.toBe(undefined);
    expect(res.body.errors[0].locations).not.toBe(undefined);
  });

  it('gateway - found book works', async () => {
    const res: request.Response = await request(gateway)
      .post('/')
      .send({ query: 'query { foundBook { title } }' })
      .expect(200);
    expect(res.body.data.foundBook.title).toBe('Slaughterhouse 5');
    expect(res.body.errors).toBe(undefined);
  });

  it('gateway - return generic server error if not special case works', async () => {
    const res: request.Response = await request(gateway)
      .post('/')
      .send({ query: 'query { books { title } }' })
      .expect(200);
    expect(res.body.errors).toHaveLength(1);
    expect(res.body.errors[0].message).toBe('Internal server error');
    expect(res.body.errors[0].extensions.code).toBe('INTERNAL_SERVER_ERROR');
    expect(res.body.errors[0].path).not.toBe(undefined);
  });

  it('gateway - return custom error works', async () => {
    const res: request.Response = await request(gateway)
      .post('/')
      .send({ query: 'query { lostBook { title } }' })
      .expect(200);
    expect(res.body.errors).not.toBe(undefined);
    expect(res.body.errors).toHaveLength(1);
    expect(res.body.errors[0].message).toBe('Error - Not Found: book id');
    expect(res.body.errors[0].extensions.code).toBe('NOT_FOUND');
    expect(res.body.errors[0].path).not.toBe(undefined);
  });

  it('gateway - multiple errors handling works', async () => {
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
    const res: request.Response = await request(gateway)
      .post('/')
      .send({ query })
      .expect(200);
    expect(res.body.data.foundBook.title).toBe('Slaughterhouse 5');
    expect(res.body.data.foundBook.author).toBe('Kurt Vonnegut');
    expect(res.body.data.lostBook).toBe(null);
    expect(res.body.data.books).toBe(null);
    expect(res.body.errors).not.toBe(undefined);
    expect(res.body.errors).toHaveLength(2);
    expect(res.body.errors).toContainEqual({
      extensions: {
        code: 'NOT_FOUND',
        serviceName: 'test',
      },
      message: 'Error - Not Found: book id',
      path: ['lostBook'],
    });
    expect(res.body.errors).toContainEqual({
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
        serviceName: 'test',
      },
      message: 'Internal server error',
      path: ['books'],
    });
  });

  it('gateway - does not mask GraphQL parsing errors', async () => {
    const res: request.Response = await request(gateway)
      .post('/')
      .send({ query: 'query { lostBook { } }' })
      .expect(400);
    expect(res.body.errors).not.toBe(undefined);
    expect(res.body.errors).toHaveLength(1);
    expect(res.body.errors[0].message).toBe(
      'Syntax Error: Expected Name, found "}".'
    );
    expect(res.body.errors[0].extensions.code).toBe(
      ApolloServerErrorCode.GRAPHQL_PARSE_FAILED
    );
    // no path in error response for parsing errors
    expect(res.body.errors[0].locations).not.toBe(undefined);
  });

  it('gateway - does not mask GraphQL validation errors', async () => {
    const res: request.Response = await request(gateway)
      .post('/')
      .send({ query: 'query { badBook { title } }' })
      .expect(200);
    expect(res.body.errors).not.toBe(undefined);
    expect(res.body.errors).toHaveLength(1);
    expect(res.body.errors[0].message).toBe('graphql error');
    expect(res.body.errors[0].extensions.code).toBe(
      ApolloServerErrorCode.GRAPHQL_VALIDATION_FAILED
    );
    expect(res.body.errors[0].path).not.toBe(undefined);
  });
});
