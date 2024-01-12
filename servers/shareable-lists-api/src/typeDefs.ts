import path from 'path';
import fs from 'fs';
import { gql } from 'graphql-tag';

const sharedSchema = fs
  .readFileSync(path.join(__dirname, '..', 'schema-shared.graphql'))
  .toString();

export const typeDefsPublic = gql(
  fs
    .readFileSync(path.join(__dirname, '..', 'schema-public.graphql'))
    .toString()
    .concat(sharedSchema)
);

export const typeDefsAdmin = gql(
  fs
    .readFileSync(path.join(__dirname, '..', 'schema-admin.graphql'))
    .toString()
    .concat(sharedSchema)
);
