export enum OmnivoreState {
  Active = 'Active',
  Archived = 'Archived',
}

// A record in the omnivore metadata json export
export interface OmnivoreImportRecord {
  id: string;
  // Used as the key for highlights markdown files (<slug>.md)
  slug: string;
  title: string;
  description?: string;
  author?: string;
  url: string;
  state: OmnivoreState;
  readingProgress: number;
  thumbnail?: string;
  labels: string[]; // empty if no labels exist
  savedAt: string; // ISO timestamp e.g. "2024-10-30T12:39:28.023Z"
  updatedAt: string; // ISO timestamp
  publishedAt?: string; // ISO timestamp
}
