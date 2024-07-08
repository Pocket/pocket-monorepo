import fs from 'fs';
import path from 'path';
import { client } from '../../datasource/clients/openSearch';
import { config } from '../../config';

const bulkSeed = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../data/corpusSeeds.json'), 'utf-8'),
);

let seeded = false;

export async function seedCorpus() {
  if (seeded) return;
  await client.bulk({ body: bulkSeed });
  seeded = true;
}

/**
 * Test cleanup: delete all documents in corpus indices
 */
export async function deleteDocuments() {
  for await (const index of Object.values(
    config.aws.elasticsearch.corpus.index,
  )) {
    await client.deleteByQuery({
      index,
      body: { query: { match_all: {} } },
      wait_for_completion: true,
    });
  }
}
