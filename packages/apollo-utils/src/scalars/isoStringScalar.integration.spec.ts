import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginUsageReportingDisabled } from '@apollo/server/plugin/disabled';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { gql } from 'graphql-tag';
import { errorHandler } from '../errorHandler/errorHandler.js';
import { isoStringScalar } from './isoStringScalar.js';

const isoUTCDateStr = '2023-02-11T18:39:48.000Z';
const isoUTCDateObj = new Date(isoUTCDateStr);
const mysqlDateStr = '2008-10-21 13:57:01';
const mysqlNullDateStr = '0000-00-00 00:00:00';
const mysqlNullDateObj = new Date(mysqlNullDateStr);
const otherDateStr = '10/21/2008';

const fakeData = [
  {
    id: '1',
    createdAt: isoUTCDateObj,
    deletedAt: null, // '0000-00-00 00:00:00' from database translated to null
  },
  {
    id: '2',
    createdAt: isoUTCDateObj,
    deletedAt: isoUTCDateObj,
  },
  {
    id: '3',
    createdAt: isoUTCDateObj,
    deletedAt: mysqlNullDateObj,
  },
];

function getSomething(_parent, args, _contextValue, _info) {
  return fakeData.find((something) => something.id === args.id);
}

function getSomethingDeleted(_parent, args, _contextValue, _info) {
  if (args.date === null) {
    return fakeData.find((something) => something.deletedAt === args.date);
  }
  return fakeData.find(
    (something) =>
      something.deletedAt?.toISOString() === args.date.toISOString(),
  );
}

const typeDefs = gql(`
    """
    ISOString scalar - all datetimes fields are Typescript Date objects on this server &
    returned as ISO-8601 encoded date strings (e.g. ISOString scalars) to GraphQL clients.
    See Section 5.6 of the RFC 3339 profile of the ISO 8601 standard: https://www.ietf.org/rfc/rfc3339.txt.
    """
    scalar ISOString

    type Something {
        id: ID!

        """Timestamp that the Something entity was created."""
        createdAt: ISOString!

        """Timestamp that the Something entity was deleted, null if not deleted."""
        deletedAt: ISOString
    }

    type Query {
        something(id: ID!): Something
        somethingDeleted(date: ISOString): Something
    }
`);

const resolvers = {
  ISOString: isoStringScalar,
  Query: {
    something: getSomething,
    somethingDeleted: getSomethingDeleted,
  },
};

const server = new ApolloServer({
  apollo: {
    key: undefined,
    graphVariant: 'current',
  },
  formatError: errorHandler,
  plugins: [ApolloServerPluginUsageReportingDisabled()],
  schema: buildSubgraphSchema({ typeDefs, resolvers }),
});

const GET_SOMETHING = gql`
  query GetSomething($id: ID!) {
    something(id: $id) {
      id
      createdAt
      deletedAt
    }
  }
`;

const GET_SOMETHING_BY_DATE_VAR = gql`
  query GetSomethingDeleted($date: ISOString) {
    somethingDeleted(date: $date) {
      id
      createdAt
      deletedAt
    }
  }
`;

describe('isoStringScalar ApolloServer usage', () => {
  describe('serialize', () => {
    it('valid date & null responses', async () => {
      const response = await server.executeOperation({
        query: GET_SOMETHING,
        variables: { id: '1' },
      });
      const result = response.body['singleResult'];
      expect(result.data.something.createdAt).toBe(isoUTCDateStr);
      expect(result.data.something.deletedAt).toBe(null);
    });
    it('valid date & date responses', async () => {
      const response = await server.executeOperation({
        query: GET_SOMETHING,
        variables: { id: '2' },
      });
      const result = response.body['singleResult'];
      expect(result.data.something.createdAt).toBe(isoUTCDateStr);
      expect(result.data.something.deletedAt).toBe(isoUTCDateStr);
    });
    it('invalid date & non-date responses', async () => {
      const response = await server.executeOperation({
        query: GET_SOMETHING,
        variables: { id: '3' },
      });
      const result = response.body['singleResult'];
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].extensions.code).toBe('INTERNAL_SERVER_ERROR');
      expect(result.errors[0].locations[0]).toStrictEqual({
        column: 5,
        line: 5,
      });
      expect(result.errors[0].message).toBe(
        'Invalid Data Store Response: invalid Date object',
      );
      expect(result.errors[0].path).toStrictEqual(['something', 'deletedAt']);
    });
  });
  describe('parseValue', () => {
    it('valid ISO date in, valid response out', async () => {
      const response = await server.executeOperation({
        query: GET_SOMETHING_BY_DATE_VAR,
        variables: { date: isoUTCDateStr },
      });
      const result = response.body['singleResult'];
      expect(result.data.somethingDeleted.deletedAt).toBe(isoUTCDateStr);
      expect(result.data.somethingDeleted.createdAt).toBe(isoUTCDateStr);
      expect(result.data.somethingDeleted.id).toBe('2');
      expect(result.errors).toBeUndefined;
    });
    it('valid null in, valid response out', async () => {
      const response = await server.executeOperation({
        query: GET_SOMETHING_BY_DATE_VAR,
        variables: { date: null },
      });
      const result = response.body['singleResult'];
      expect(result.data.somethingDeleted.deletedAt).toBe(null);
      expect(result.data.somethingDeleted.createdAt).toBe(isoUTCDateStr);
      expect(result.data.somethingDeleted.id).toBe('1');
      expect(result.errors).toBeUndefined;
    });
    it('invalid date format in, error out', async () => {
      const response = await server.executeOperation({
        query: GET_SOMETHING_BY_DATE_VAR,
        variables: { date: otherDateStr },
      });
      const result = response.body['singleResult'];
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].extensions.code).toBe('BAD_USER_INPUT');
      expect(result.errors[0].message).toBe(
        'Variable "$date" got invalid value "10/21/2008"; Invalid User Input: ISOString Scalar parse expected a UTC-based, ISO-8601-compliant string',
      );
    });
    it('invalid MySQL date in, error out', async () => {
      const response = await server.executeOperation({
        query: GET_SOMETHING_BY_DATE_VAR,
        variables: { date: mysqlDateStr },
      });
      const result = response.body['singleResult'];
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].extensions.code).toBe('BAD_USER_INPUT');
      expect(result.errors[0].message).toBe(
        'Variable "$date" got invalid value "2008-10-21 13:57:01"; Invalid User Input: ISOString Scalar parse expected a UTC-based, ISO-8601-compliant string',
      );
    });
    it('invalid type in, error out', async () => {
      const response = await server.executeOperation({
        query: GET_SOMETHING_BY_DATE_VAR,
        variables: { date: 2023 },
      });
      const result = response.body['singleResult'];
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].extensions.code).toBe('BAD_USER_INPUT');
      expect(result.errors[0].message).toBe(
        'Variable "$date" got invalid value 2023; Invalid User Input: ISOString Scalar parse expected a value of type string or null',
      );
    });
  });
  describe('parseLiteral', () => {
    it('valid ISO date in, valid response out', async () => {
      const response = await server.executeOperation({
        query: gql`
          query GetSomethingDeleted {
            somethingDeleted(date: "2023-02-11T18:39:48.000Z") {
              id
              createdAt
              deletedAt
            }
          }
        `,
      });
      const result = response.body['singleResult'];
      expect(result.data.somethingDeleted.deletedAt).toBe(isoUTCDateStr);
      expect(result.data.somethingDeleted.createdAt).toBe(isoUTCDateStr);
      expect(result.data.somethingDeleted.id).toBe('2');
      expect(result.errors).toBeUndefined;
    });
    it('valid null in, valid response out', async () => {
      const response = await server.executeOperation({
        query: gql`
          query GetSomethingDeleted {
            somethingDeleted(date: null) {
              id
              createdAt
              deletedAt
            }
          }
        `,
      });
      const result = response.body['singleResult'];
      expect(result.data.somethingDeleted.deletedAt).toBe(null);
      expect(result.data.somethingDeleted.createdAt).toBe(isoUTCDateStr);
      expect(result.data.somethingDeleted.id).toBe('1');
      expect(result.errors).toBeUndefined;
    });
    it('invalid date format in, error out', async () => {
      const response = await server.executeOperation({
        query: gql`
          query GetSomethingDeleted {
            somethingDeleted(date: "2/2/2023") {
              id
              createdAt
              deletedAt
            }
          }
        `,
      });
      const result = response.body['singleResult'];
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].extensions.code).toBe(
        'GRAPHQL_VALIDATION_FAILED',
      );
      expect(result.errors[0].message).toBe(
        'Invalid User Input: ISOString Scalar parse expected a UTC-based, ISO-8601-compliant string',
      );
    });
    it('invalid MySQL date in, error out', async () => {
      const response = await server.executeOperation({
        query: gql`
          query GetSomethingDeleted {
            somethingDeleted(date: "2/2/2023") {
              id
              createdAt
              deletedAt
            }
          }
        `,
      });
      const result = response.body['singleResult'];
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].extensions.code).toBe(
        'GRAPHQL_VALIDATION_FAILED',
      );
      expect(result.errors[0].message).toBe(
        'Invalid User Input: ISOString Scalar parse expected a UTC-based, ISO-8601-compliant string',
      );
    });
    it('invalid type in, error out', async () => {
      const response = await server.executeOperation({
        query: gql`
          query GetSomethingDeleted {
            somethingDeleted(date: 2022) {
              id
              createdAt
              deletedAt
            }
          }
        `,
      });
      const result = response.body['singleResult'];
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].extensions.code).toBe(
        'GRAPHQL_VALIDATION_FAILED',
      );
      expect(result.errors[0].message).toBe(
        'Invalid User Input: ISOString Scalar parse expected a value of type string or null',
      );
    });
    it('invalid 0000-00-00 date format in, error out', async () => {
      const response = await server.executeOperation({
        query: gql`
          query GetSomethingDeleted {
            somethingDeleted(date: "0000-00-00 00:00:00") {
              id
              createdAt
              deletedAt
            }
          }
        `,
      });
      const result = response.body['singleResult'];
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].extensions.code).toBe(
        'GRAPHQL_VALIDATION_FAILED',
      );
      expect(result.errors[0].message).toBe(
        'Invalid User Input: ISOString Scalar parse expected a UTC-based, ISO-8601-compliant string',
      );
    });
  });
});
