import { printSubgraphSchema } from '@apollo/subgraph';
import path from 'path';
import fs from 'fs';
import { schema } from './schema';

const sdl = printSubgraphSchema(schema);
const filePath = path.resolve(
  __dirname,
  'dist/../..',
  'schema-generated.graphql'
);
fs.writeFileSync(filePath, sdl);
