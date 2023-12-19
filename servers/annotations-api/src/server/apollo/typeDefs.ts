import path from 'path';
import fs from 'fs';
import { gql } from 'graphql-tag';

export default gql(
  fs
    .readFileSync(path.join(__dirname, '..', '..', '..', 'schema.graphql'))
    .toString(),
);
