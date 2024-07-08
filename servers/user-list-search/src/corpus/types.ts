// Generated manually from the corpus index mapping
// Technically all fields can be array or singleton,
// but putting some constraints that we know of the system
// here
export type CorpusDocument = {
  _index: 'string';
  _id: 'string';
  _source: CorpusDocumentProperties;
};

export type CorpusDocumentProperties = Partial<{
  authors: string | string[];
  collection_labels: string | string[];
  content_type_children: string | string[];
  content_type_parent: string;
  created_at: Date;
  curation_category: string;
  curation_source: string;
  est_time_to_consume_minutes: number;
  excerpt: string;
  iab_child: string;
  iab_parent: string;
  is_collection: boolean;
  is_collection_story: boolean;
  is_syndicated: boolean;
  language: string;
  parent_collection_id: string;
  pocket_item_id: number;
  pocket_normal_url: string;
  pocket_parser_extracted_text: string;
  pocket_parser_request_given_url: string;
  pocket_resolved_id: number;
  pocket_resolved_url: string;
  published_at: Date;
  publisher: string;
  quality_rank: number;
  status: string;
  title: string;
  topic: string;
  url: string;
}>;

export type DateRangeInput =
  | {
      after: Date;
      before?: never;
    }
  | {
      before: Date;
      after?: never;
    }
  | {
      after: Date;
      before: Date;
    };
