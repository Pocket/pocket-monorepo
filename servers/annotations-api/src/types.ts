// The highlight DB entity
export type HighlightEntity = {
  annotation_id: string;
  user_id: number;
  item_id: number;
  quote: string;
  patch: string;
  version: number;
  status: number;
  created_at: Date;
  updated_at: Date;
};

// Highlight type conforming to GraphQL schema
export type Highlight = {
  id: string;
  quote: string;
  patch: string;
  version: number;
  _createdAt: number;
  _updatedAt: number;
  note?: HighlightNote;
};

export type HighlightNote = {
  highlightId: string;
  text: string;
  _createdAt: number;
  _updatedAt: number;
};

// In DynamoDB can't use underscore in projection expression
export type HighlightNoteEntity = {
  highlightId: string;
  note: string; // text is reserved keyword
  createdAt: number;
  updatedAt: number;
};

// SavedItemAnnotations type conforming to GraphQL Schema
export type SavedItemAnnotations = {
  highlights: Highlight[];
};

export type SavedItem = {
  id: string;
  annotations: SavedItemAnnotations;
};

export type HighlightInput = {
  id?: string;
  quote: string;
  patch: string;
  version: number;
  itemId: string;
  note?: string;
};

export type HighlightUpdateInput = Omit<HighlightInput, 'id'>;

export type NoteInput = {
  id: string;
  input: string;
};
