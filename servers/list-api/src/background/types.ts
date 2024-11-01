export interface QueueConfig {
  batchSize: number;
  url: string;
  visibilityTimeout: number;
  maxMessages: number;
  waitTimeSeconds: number;
  defaultPollIntervalSeconds: number;
  afterMessagePollIntervalSeconds: number;
  messageRetentionSeconds: number;
  name: string;
}

/**
 * Payload of an import chunk message sent to SQS
 * Copied from types in AccountDataDeleter
 * TODO - shared event types, event schema
 */

// A record in the omnivore metadata json export
export type OmnivoreImportRecord = {
  id: string;
  // Used as the key for highlights markdown files (<slug>.md)
  slug: string;
  title: string;
  description: string | null;
  author: string | null;
  url: string;
  state: 'Active' | 'Archived';
  readingProgress: number;
  thumbnail: string | null;
  labels: string[]; // empty if no labels exist
  savedAt: string; // ISO timestamp e.g. "2024-10-30T12:39:28.023Z"
  updatedAt: string; // ISO timestamp
  publishedAt: string | null; // ISO timestamp
};

// Supported imports and their types
// Mostly for documentation of SQS message schemas
// When you implement a new exporter, add it here
export type ImportMapping = {
  omnivore: OmnivoreImportRecord[];
};

export type ImportMessage<T extends keyof ImportMapping> = {
  userId: string;
  records: ImportMapping[T];
  importer: T;
};
