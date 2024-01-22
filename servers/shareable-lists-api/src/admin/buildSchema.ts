import { schema } from './schema';
import { printSubgraphSchema } from '@apollo/subgraph';
import path from 'path';
import fs from 'fs';

const sdl = printSubgraphSchema(schema);

const filePath = path.resolve(__dirname, '../..', 'schema-admin-api.graphql');

fs.writeFileSync(filePath, sdl);
