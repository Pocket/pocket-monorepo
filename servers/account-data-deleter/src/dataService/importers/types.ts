import { OmnivoreImportRecord } from './OmnivoreImport';

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
