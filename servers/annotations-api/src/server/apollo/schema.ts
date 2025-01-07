import { buildSubgraphSchema } from '@apollo/subgraph';
import { constraintDirectiveTypeDefs } from 'graphql-constraint-directive/apollo4';
import { gql } from 'graphql-tag';
import typeDefs from './typeDefs.ts';
import { resolvers } from './resolvers.ts';

// Add @constraint directive to the schema
export const schema = buildSubgraphSchema({
  typeDefs: [gql(constraintDirectiveTypeDefs), typeDefs],
  resolvers,
});
