import path, { dirname } from 'node:path';
import fs from 'node:fs';
import { gql } from 'graphql-tag';
//https://stackoverflow.com/questions/46745014/alternative-for-dirname-in-node-js-when-using-es6-modules
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));

export const getSchemaFile = () => {
  return fs
    .readFileSync(path.join(__dirname, '..', '..', 'schema.graphql'))
    .toString();
};

export const typeDefs = gql(getSchemaFile());
