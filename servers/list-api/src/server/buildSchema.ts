import { printSubgraphSchema } from '@apollo/subgraph';
import path from 'path';
import fs from 'fs';
import { schema } from './schema.js';
const __dirname = import.meta.dirname;

const sdl = printSubgraphSchema(schema);
const filePath = path.resolve(
  __dirname,
  'dist/../..',
  'schema-generated.graphql',
);
fs.writeFileSync(filePath, sdl);
