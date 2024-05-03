import path from 'path';
import fs from 'fs';
import { gql } from 'graphql-tag';
const __dirname = import.meta.dirname;

export const typeDefs = gql(
  fs.readFileSync(path.join(__dirname, '../..', 'schema.graphql')).toString(),
);
