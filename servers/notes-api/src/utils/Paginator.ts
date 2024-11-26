import {
  ReferenceExpression,
  SelectQueryBuilder,
  StringReference,
  ExpressionWrapper,
  SqlBool,
  CompiledQuery,
} from 'kysely';
import { OrderByDirection } from 'kysely/dist/cjs/parser/order-by-parser';

export type PaginationResult<O> = {
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
  };
  edges: Array<{
    cursor: string;
    node: O;
  }>;
  totalCount?: number;
  __totalCount?: CompiledQuery<{ count: number }>;
};

export type CursorField<DB, TB extends keyof DB, O> =
  | (StringReference<DB, TB> & keyof O & string)
  | (StringReference<DB, TB> & `${string}.${keyof O & string}`);

export type CursorFields<DB, TB extends keyof DB, O> = ReadonlyArray<
  CursorField<DB, TB, O>
>;

export type ExtractFieldKey<
  DB,
  TB extends keyof DB,
  O,
  T extends CursorField<DB, TB, O>,
> = T extends keyof O & string
  ? T
  : T extends `${string}.${infer K}`
    ? K extends keyof O & string
      ? K
      : never
    : never;

type CursorEncoder<
  DB,
  TB extends keyof DB,
  O,
  T extends CursorFields<DB, TB, O>,
> = (
  row: {
    [Field in ExtractFieldKey<DB, TB, O, T[number]>]: O[ExtractFieldKey<
      DB,
      TB,
      O,
      T[number]
    >];
  },
  fields: T,
) => string;

export type CursorDecoder<
  DB,
  TB extends keyof DB,
  O,
  T extends CursorFields<DB, TB, O>,
> = (cursor: string, fields: T) => DecodedCursor<DB, TB, O, T>;

export type DecodedCursor<
  DB,
  TB extends keyof DB,
  O,
  T extends CursorFields<DB, TB, O>,
> = {
  [Field in ExtractFieldKey<DB, TB, O, T[number]>]: O[ExtractFieldKey<
    DB,
    TB,
    O,
    T[number]
  >];
};

type KeyValueTuples<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

export type ExtractOutputType<T> =
  T extends SelectQueryBuilder<any, any, infer O> ? O : never;

type SharedPaginationOptions<
  DB,
  TB extends keyof DB,
  O,
  TCursor extends CursorFields<DB, TB, O>,
> = {
  countLimit?: number;
  sortBy: TCursor;
  order: OrderByDirection;
  encodeCursor: CursorEncoder<DB, TB, O, TCursor>;
  decodeCursor: CursorDecoder<DB, TB, O, TCursor>;
};

export type PaginationOptions<
  DB,
  TB extends keyof DB,
  O,
  TCursor extends CursorFields<DB, TB, O>,
> = SharedPaginationOptions<DB, TB, O, TCursor> &
  (
    | {
        first: number;
        after: string;
        before?: never;
        last?: never;
      }
    | {
        first: number;
        after?: never;
        before?: never;
        last?: never;
      }
    | {
        first?: never;
        after?: never;
        before: string;
        last: number;
      }
    | {
        first?: never;
        after?: never;
        before?: never;
        last: number;
      }
  );

export async function executeWithCursorPagination<
  DB,
  TB extends keyof DB,
  O,
  const TCursor extends CursorFields<DB, TB, O>,
>(
  qb: SelectQueryBuilder<DB, TB, O>,
  opts: PaginationOptions<DB, TB, O, TCursor>,
): Promise<PaginationResult<O>> {
  const applyOrderBy = (
    qb: SelectQueryBuilder<DB, TB, O>,
    sortBy: TCursor,
    order: OrderByDirection,
  ): SelectQueryBuilder<DB, TB, O> => {
    // Have to build this iteratively because you can only pass one orderBy expression
    let orderedQb: SelectQueryBuilder<DB, TB, O> = qb;
    for (let i = 0; i < sortBy.length; i++) {
      const orderByField = sortBy[i];
      orderedQb = orderedQb.orderBy(orderByField, order);
    }
    return orderedQb;
  };

  const applyCursor = (
    qb: SelectQueryBuilder<DB, TB, O>,
    cursor: string,
    cursorFields: TCursor,
    comparator: Comparator,
  ) => {
    const decoded = opts.decodeCursor(cursor, cursorFields);
    return buildLexicographicWhere(qb, decoded, comparator);
  };

  // If cursor is in ascending order, then paginating
  // first/after should use '>', and last/before should
  // use '<'
  // If the cursor is in descending order, then paginating
  // first/after should use '<', and last/before should use
  // '>'
  const comparator =
    opts.order === 'asc'
      ? opts.first != null
        ? '>'
        : '<'
      : opts.first != null
        ? '<'
        : '>';
  // If we are paginating last/before, the order statements
  // are initially reversed (and must be reordered after
  // retrieval)
  // The last N in ascending order are the first N in descending
  // order, reversed after retrieval
  const reversed = opts.last != null;
  const internalOrder =
    reversed === false ? opts.order : opts.order === 'asc' ? 'desc' : 'asc';

  const encodedCursor = opts.after ?? opts.before;
  let query = applyOrderBy(qb, opts.sortBy, internalOrder);
  if (encodedCursor != null) {
    query = applyCursor(query, encodedCursor, opts.sortBy, comparator);
  }

  const countLimit = opts.countLimit ?? 5000;
  const totalCount = query
    .clearOrderBy()
    .clearSelect()
    .select((eb) => eb.fn.countAll().as('count'))
    .limit(countLimit)
    .compile();

  // Fetch one more than necessary to check if there's another page
  // in the same direction
  const pageSize = opts.first ?? opts.last;
  const rows = await query.limit(pageSize + 1).execute();
  // We only evaluate hasNextPage for first/after and hasPreviousPage for
  // last/before, since the client should be able to infer whether the
  // other direction has pages based on previously cached/executed queries
  // (and realistically shouldn't need to re-request a page that was just
  // asked for, if changing pagination direction e.g. by scrolling back up).
  const hasNextPage = opts.first && rows.length > opts.first ? true : false;
  const hasPreviousPage = opts.last && rows.length > opts.last ? true : false;

  if (rows.length === 0) {
    return {
      pageInfo: {
        hasNextPage,
        hasPreviousPage,
        startCursor: undefined,
        endCursor: undefined,
      },
      edges: [],
      totalCount: 0,
    };
  } else {
    const edges = rows
      .slice(0, rows.length - +hasNextPage - +hasPreviousPage)
      .map((row) => {
        return {
          cursor: opts.encodeCursor(row, opts.sortBy),
          node: row,
        };
      });
    const startCursor = edges[0].cursor;
    const endCursor = edges[edges.length - 1].cursor;
    if (reversed) {
      // Mutates in-place
      edges.reverse();
      return {
        pageInfo: {
          hasNextPage,
          hasPreviousPage,
          startCursor: endCursor,
          endCursor: startCursor,
        },
        edges,
        __totalCount: totalCount,
      };
    } else {
      return {
        pageInfo: {
          hasNextPage,
          hasPreviousPage,
          startCursor,
          endCursor,
        },
        edges,
        __totalCount: totalCount,
      };
    }
  }
}

type Comparator = '>' | '<';

/**
 * Generates lexicographic comparison SQL using Kysely `WHERE` conditions.
 * This allows comparing multiple columns against values, e.g.
 * `(x, y, z) > (a, b, c)`
 * This is useful for cursors which require multiple columns to be unique
 * (combination keys).
 *
 * @param qb - a Kysely query builder instance
 * @param cursor - an object containing key-value pairs that correspond
 * to columns and values to compare against
 * @param comparator - The comparison operator ('>', '<')
 * @returns A copy of the query builder with `where` statements applied
 */
export function buildLexicographicWhere<
  DB,
  TB extends keyof DB,
  O,
  const TCursor extends CursorFields<DB, TB, O>,
>(
  qb: SelectQueryBuilder<DB, TB, O>,
  cursor: DecodedCursor<DB, TB, O, TCursor>,
  comparator: Comparator,
): SelectQueryBuilder<DB, TB, O> {
  const cursorTuples = Object.entries(cursor) as KeyValueTuples<TCursor>;
  // Expand lexicographic comparison into multiple logical conditions
  // for query builder, e.g.
  //   `(x, y, z) > (a, b, c)`
  // Expands into:
  //   x > a OR
  //   (x = a AND y > b) OR
  //   (x = a AND y = b AND z > c)
  return qb.where(({ and, or, eb }) => {
    const expandedConditions = cursorTuples.reduce(
      (conditions, cursorTuple, index, tuples) => {
        const comparison = eb(
          cursorTuple[0] as ReferenceExpression<DB, TB>,
          comparator,
          cursorTuple[1],
        );
        if (index === 0) {
          conditions.push(comparison);
        } else {
          const priorConditions = tuples
            .slice(0, index)
            .map(([col, val]) =>
              eb(col as ReferenceExpression<DB, TB>, '=', val),
            );
          conditions.push(and([comparison, ...priorConditions]));
        }
        return conditions;
      },
      [] as Array<ExpressionWrapper<DB, TB, SqlBool>>,
    );
    return or(expandedConditions);
  });
}
