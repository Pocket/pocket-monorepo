import {
  BaseDocument,
  DeleteDocument,
  getId,
  IndexDocument,
} from '../../saves/elasticsearch';
import { client } from './index';
import { config } from '../../config';
import { serverLogger } from '@pocket-tools/ts-logger';

const index = config.aws.elasticsearch.list.index;

type BulkDeleteEntry = {
  delete: {
    _id: string;
    routing: string;
  };
};

type BulkIndexEntry = {
  index: {
    _id: string;
    routing: string;
  };
};

export type BulkEntry = IndexDocument | BulkIndexEntry | BulkDeleteEntry;

/**
 * Given a set of input documents, generate bulk indexing structure:
 *
 * [
 *   {index: {_id: "id1"} },
 *   {title: "title1", ...},
 *   {index: {_id: "id2"} },
 *   {title: "title2", ...}
 * ]
 */
type BulkDocumentConverter = (
  docs: (BaseDocument | IndexDocument)[],
) => BulkEntry[];

/**
 * Given a set of documents index them
 */
type BulkDocumentProcessor = (
  docs: (BaseDocument | IndexDocument)[],
) => Promise<any>;

/**
 * The default elasticsearch document converter.
 * @param docs
 */
export const defaultDocConverter: BulkDocumentConverter = (
  docs: (DeleteDocument | IndexDocument)[],
): BulkEntry[] => {
  return docs.flatMap((doc): BulkEntry[] => {
    if (doc.action === 'index') {
      //Clone the doc so we can remove the action value.
      const docToIndex = { ...doc };
      delete docToIndex.action;
      return [
        { index: { _id: getId(doc), routing: doc.user_id.toString() } },
        docToIndex,
      ];
    }

    serverLogger.info('deleting', getId(doc));
    //If its not index its a delete.
    return [{ delete: { _id: getId(doc), routing: doc.user_id.toString() } }];
  });
};

/**
 * The default elasticsearch indexing converter
 */
export const defaultDocProcessor: BulkDocumentProcessor = async (
  docs: IndexDocument[],
) => {
  return client.bulk({ body: defaultDocConverter(docs), index });
};

/**
 * Allow indexing to multiple indices. Modify the default behavior based on need
 * (e.g. double-writing to a new cluster or index before switching to it).
 */
let bulkChain: BulkDocumentProcessor[] = [defaultDocProcessor];

/**
 * Allows task-specific overrides (e.g. backfill)
 * @param processors
 */
export const setBulkChain = (processors: BulkDocumentProcessor[]): void => {
  serverLogger.info({ setBulkChain: processors });
  bulkChain = processors;
};

/**
 * Perform a bulk operation on a set of given documents.
 * @param body
 */
export const bulkDocument = async (
  body: (IndexDocument | DeleteDocument)[],
): Promise<any[]> => {
  return await Promise.all(bulkChain.map((fn) => fn(body)));
};
