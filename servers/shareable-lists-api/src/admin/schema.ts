import { constraintDirectiveTypeDefs } from 'graphql-constraint-directive/apollo4';
import { gql } from 'graphql-tag';

import { typeDefsAdmin } from '../typeDefs';
import { resolvers } from './resolvers';
import { buildSubgraphSchema } from '@apollo/subgraph';

// Add @constraint directive to the schema
export const schema = buildSubgraphSchema({
  typeDefs: [gql(constraintDirectiveTypeDefs), typeDefsAdmin],
  resolvers,
});
