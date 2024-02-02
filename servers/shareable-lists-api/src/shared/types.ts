import { PrismaClient } from '.prisma/client';
import { Kysely } from 'kysely';
import { DB } from '.kysely/client/types';
import { ShareableListItem } from '../database/types';

export interface BaseContext {
  db: PrismaClient;
  conn: Kysely<DB>;
}

export type PaginationInput = {
  after: string;
  before: string;
  first: number;
  last: number;
};

export interface Connection<N> {
  edges: Array<Edge<N>> | null;
  pageInfo: PageInfo;
  totalCount: number;
}

export interface Edge<N> {
  node: N;
  cursor: string;
}

export type ListItemConnection = Connection<ShareableListItem>;

export type ListItemEdge = Edge<ShareableListItem>;

export type PageInfo = {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string;
  endCursor: string;
};
