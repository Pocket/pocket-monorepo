import path from 'path';
import fs from 'fs';
import { gql } from 'graphql-tag';
import { DocumentNode } from 'graphql';

export const getSchemaFile = () => {
  return fs
    .readFileSync(path.join(__dirname, '..', '..', 'schema.graphql'))
    .toString();
};

export const typeDefs: DocumentNode = gql(getSchemaFile());
