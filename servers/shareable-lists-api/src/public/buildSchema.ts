import { schema } from './schema.js';
import { printSubgraphSchema } from '@apollo/subgraph';
import path from 'path';
import fs from 'fs';
const __dirname = import.meta.dirname;

const sdl = printSubgraphSchema(schema);

const filePath = path.resolve(__dirname, '../..', 'schema-client-api.graphql');

fs.writeFileSync(filePath, sdl);
