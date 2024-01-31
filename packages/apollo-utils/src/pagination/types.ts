export type PaginationInput = {
  after?: string;
  before?: string;
  first?: number;
  last?: number;
};

// first/after, last/before, after, last
export type ValidatedPagination =
  | {
      first: number;
      after: string;
      last?: never;
      before?: never;
    }
  | {
      last: number;
      before: string;
      after?: never;
      first?: never;
    }
  | {
      first: number;
      after?: never;
      last?: never;
      before?: never;
    }
  | {
      last: number;
      after?: never;
      before?: never;
      first?: never;
    };
