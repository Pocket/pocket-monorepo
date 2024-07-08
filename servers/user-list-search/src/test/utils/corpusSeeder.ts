import fs from 'fs';
import path from 'path';
import { client } from '../../datasource/clients/openSearch';
import { config } from '../../config';

const bulkSeed = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../data/corpusSeeds.json'), 'utf-8'),
);

export async function seedCorpus() {
  const indices = Array.from(
    Object.values(config.aws.elasticsearch.corpus.index),
  );
  await client.bulk({ body: bulkSeed });
  await client.indices.refresh({ index: indices });
}

/**
 * Test cleanup: delete all documents in corpus indices
 */
export async function deleteDocuments() {
  for await (const index of Object.values(
    config.aws.elasticsearch.corpus.index,
  )) {
    try {
      await client.deleteByQuery({
        index,
        body: { query: { match_all: {} } },
        wait_for_completion: true,
      });
      await client.indices.refresh({
        index,
      });
    } catch (error) {
      console.log(error);
    }
  }
}
