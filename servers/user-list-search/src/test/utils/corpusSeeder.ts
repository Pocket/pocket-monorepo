import fs from 'fs';
import path from 'path';
import { client } from '../../datasource/clients/openSearch';
import { config } from '../../config';

const seedBase = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../data/corpusSeeds.json'), 'utf-8'),
);

const embeddings: Record<string, number[]> = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, '../data/corpusEmbeddings.json'),
    'utf-8',
  ),
).reduce(
  (idMap: Record<string, number[]>, entry) => {
    idMap[entry['_id']] = entry['vector'];
    return idMap;
  },
  {} as Record<string, number[]>,
);

const bulkSeed = seedBase.map((entry) => {
  const embedRecord = embeddings[entry['corpusId']];
  if (embedRecord != null) {
    entry['passage_embeddings'] = embedRecord[entry['corpusId']];
  }
  return entry;
});

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
      // Forcemerge the index because with our updates and number of documents the score can change when it should not.
      // https://kulekci.medium.com/understanding-and-resolving-elasticsearch-score-changes-after-document-updates-a9f426b76e38
      await client.indices.forcemerge({
        index,
      });
      await client.indices.refresh({
        index,
      });
    } catch (error) {
      console.log(error);
    }
  }
}
