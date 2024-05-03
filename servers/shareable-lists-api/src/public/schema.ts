import { constraintDirectiveTypeDefs } from 'graphql-constraint-directive/apollo4.js';
import { gql } from 'graphql-tag';

import { typeDefsPublic } from '../typeDefs.js';
import { resolvers } from './resolvers/index.js';
import { buildSubgraphSchema } from '@apollo/subgraph';

// Add @constraint directive to the schema
export const schema = buildSubgraphSchema({
  typeDefs: [gql(constraintDirectiveTypeDefs), typeDefsPublic],
  resolvers,
});
