import { buildSubgraphSchema } from '@apollo/subgraph';
import { constraintDirectiveTypeDefs } from 'graphql-constraint-directive/apollo4.js';
import { gql } from 'graphql-tag';
import { typeDefs } from './typeDefs.js';
import { resolvers } from '../resolvers.js';

// Add @constraint directive to the schema
export const schema = buildSubgraphSchema({
  typeDefs: [gql(constraintDirectiveTypeDefs), typeDefs],
  resolvers,
});
