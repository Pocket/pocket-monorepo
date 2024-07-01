import fs from 'fs';
import path from 'path';
import { client } from '../../datasource/clients/openSearch';

const bulkSeed = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../data/corpusSeeds.json'), 'utf-8'),
);

let seeded = false;

export async function seedCorpus() {
  if (seeded) return;
  await client.bulk({ body: bulkSeed });
  seeded = true;
}
