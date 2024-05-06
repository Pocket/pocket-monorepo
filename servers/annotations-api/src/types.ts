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
