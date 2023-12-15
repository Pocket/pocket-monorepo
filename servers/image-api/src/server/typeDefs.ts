import path from 'path';
import fs from 'fs';
import { gql } from 'apollo-server';

export const getSchemaFile = () => {
  return fs
    .readFileSync(path.join(__dirname, '..', '..', 'schema.graphql'))
    .toString();
};

export const typeDefs = gql(getSchemaFile());
