import { advancedSearch } from './elasticsearchSearch';
import { bulkDocument } from './elasticsearchBulk';
import { faker } from '@faker-js/faker';
import {
  SearchItemsContentType,
  SearchItemsSortBy,
  SearchItemsSortOrder,
  SearchItemsStatusFilter,
} from '../../__generated__/types';
import { deleteDocuments } from '../../test/utils/searchIntegrationTestHelpers';
import { client } from '.';
import { config } from '../../config';

const defaultDocProps = {
  resolved_id: 1,
  excerpt: '',
  user_id: 1,
  domain_id: 1,
  content_type: ['web', 'article'],
  favorite: false,
  action: 'index' as const,
  status: 'queued',
  lang: 'en',
  word_count: 100,
};

describe('Elasticsearch Search Query', () => {
  beforeEach(async () => {
    await deleteDocuments();
    await bulkDocument([
      {
        ...defaultDocProps,
        item_id: 666,
        url: 'https://theonyxpath.com/category/worlds/exalted/',
        title: 'Abyssals: Sworn to the Grave',
        date_added: '2020-01-01T00:00:00.000Z',
        tags: ['3e', 'abyssals', 'exalted'],
        date_published: faker.date.recent().toISOString(),
        status: 'archived',
        full_text: `"Even the birds?" She immediately felt foolish. Why hadn't she asked about her family? Why
        waste her last breath? Not that it would have changed the answer.`,
      },
      {
        ...defaultDocProps,
        item_id: 777,
        url: 'https://theonyxpath.com/category/worlds/exalted/',
        title: 'Exalted: Essence',
        date_added: '2021-01-01T00:00:00.000Z',
        tags: ['exalted'],
        date_published: faker.date.recent().toISOString(),
        full_text: `Far away, a soulsteel-clad knight rides through the city of Thorns. Hoof-
        beats echo off the stalls of a once-vibrant market, its brilliant banners now
        faded. Ghosts bow their heads as the deathknight passes. The living avert their
        eyes. The rising sun merely makes the shadowland's gray light a little paler.
        He passes through the city gates, toward a castle of jagged bone. Within, the
        Abyssal's master waits.`,
        content_type: ['web', 'video'],
      },
      {
        ...defaultDocProps,
        item_id: 3,
        url: 'https://theonyxpath.com/category/worlds/exalted/',
        title: 'Exalted: Third Edition',
        // Collision with 411, tiebreaker of item_id asc for sorting on this field
        date_added: '2022-01-01T00:00:00.000Z',
        tags: ['3e', 'exalted'],
        date_published: faker.date.past().toISOString(),
        full_text: `The sunlight was blinding. It roared out from her, towered
        in a great pillar above her like a flame, filled the lower
        levels for the first time in decades if not centuries; the
        dawn spilled golden and glorious out into the space the
        woman cut—`,
      },
      {
        ...defaultDocProps,
        action: 'index',
        item_id: 411,
        url: 'https://en.wikipedia.org/wiki/Exalted',
        title: 'Exalted',
        // Collision with 3, tiebreaker of item_id asc for sorting on this field
        date_added: '2022-01-01T00:00:00.000Z',
        tags: ['exalted'],
        date_published: faker.date.past().toISOString(),
        full_text: `Exalted is a high fantasy tabletop role-playing game originally published 
        by White Wolf Publishing in July 2001. The game is currently in its third edition. 
        It was originally created by Robert Hatch, Justin Achilli and Stephan Wieck, and was 
        inspired by world mythologies and anime.`,
      },
    ]);

    // Wait for index to finish
    await client.indices.refresh({
      index: config.aws.elasticsearch.list.index,
    });
  });

  afterAll(async () => {
    await deleteDocuments();
  });
  it.each([
    {
      name: 'wildcard',
      search: { queryString: 'sun*' },
      expected: {
        edges: expect.toIncludeSameMembers([
          expect.objectContaining({
            node: expect.objectContaining({
              savedItem: expect.objectContaining({ id: '3' }),
            }),
          }),
          expect.objectContaining({
            node: expect.objectContaining({
              savedItem: expect.objectContaining({ id: '777' }),
            }),
          }),
        ]),
      },
    },
    {
      name: 'basic',
      search: { queryString: 'flame pillar' },
      expected: {
        edges: expect.toIncludeSameMembers([
          expect.objectContaining({
            node: expect.objectContaining({
              savedItem: expect.objectContaining({ id: '3' }),
            }),
          }),
        ]),
      },
    },
    {
      name: 'boolean, multi-field',
      search: { queryString: 'sun* AND third' },
      expected: {
        edges: expect.toIncludeSameMembers([
          expect.objectContaining({
            node: expect.objectContaining({
              savedItem: expect.objectContaining({ id: '3' }),
            }),
          }),
        ]),
      },
    },
    {
      name: 'not operator',
      search: { queryString: 'third AND NOT fantasy' },
      expected: {
        edges: expect.toIncludeSameMembers([
          expect.objectContaining({
            node: expect.objectContaining({
              savedItem: expect.objectContaining({ id: '3' }),
            }),
          }),
        ]),
      },
    },
  ])('can search for a document: $name', async ({ search, expected }) => {
    const document = await advancedSearch(search, '1');
    expect(document).toMatchObject(expected);
  });
  it.each([
    {
      name: 'title',
      filter: { title: 'abyssal' },
      expected: {
        edges: expect.toIncludeSameMembers([
          expect.objectContaining({
            node: expect.objectContaining({
              savedItem: expect.objectContaining({ id: '666' }),
            }),
          }),
        ]),
      },
    },
    {
      name: 'title and tag',
      filter: { title: 'exalted', tags: ['3e'] },
      expected: {
        edges: expect.toIncludeSameMembers([
          expect.objectContaining({
            node: expect.objectContaining({
              savedItem: expect.objectContaining({ id: '3' }),
            }),
          }),
        ]),
      },
    },
    {
      name: 'domain',
      filter: { domain: 'wikipedia.org' },
      expected: {
        edges: expect.toIncludeSameMembers([
          expect.objectContaining({
            node: expect.objectContaining({
              savedItem: expect.objectContaining({ id: '411' }),
            }),
          }),
        ]),
      },
    },
    {
      name: 'tag',
      filter: { tags: ['3e'] },
      expected: {
        edges: expect.toIncludeSameMembers([
          expect.objectContaining({
            node: expect.objectContaining({
              savedItem: expect.objectContaining({ id: '3' }),
            }),
          }),
          expect.objectContaining({
            node: expect.objectContaining({
              savedItem: expect.objectContaining({ id: '666' }),
            }),
          }),
        ]),
      },
    },
    {
      name: 'title, tag, domain',
      filter: {
        title: 'exalted',
        tags: ['exalted'],
        domain: 'theonyxpath',
      },
      expected: {
        edges: expect.toIncludeSameMembers([
          expect.objectContaining({
            node: expect.objectContaining({
              savedItem: expect.objectContaining({ id: '3' }),
            }),
          }),
          expect.objectContaining({
            node: expect.objectContaining({
              savedItem: expect.objectContaining({ id: '777' }),
            }),
          }),
        ]),
      },
    },
    {
      name: 'content type',
      filter: {
        contentType: SearchItemsContentType.Video,
      },
      expected: {
        edges: expect.toIncludeSameMembers([
          expect.objectContaining({
            node: expect.objectContaining({
              savedItem: expect.objectContaining({ id: '777' }),
            }),
          }),
        ]),
      },
    },
    {
      name: 'status',
      filter: {
        status: SearchItemsStatusFilter.Archived,
      },
      expected: {
        edges: expect.toIncludeSameMembers([
          expect.objectContaining({
            node: expect.objectContaining({
              savedItem: expect.objectContaining({ id: '666' }),
            }),
          }),
        ]),
      },
    },
  ])('can search for filters only: $name', async ({ filter, expected }) => {
    const document = await advancedSearch(
      {
        filter,
      },
      '1',
    );
    expect(document).toMatchObject(expected);
  });
  it('retrieves next page of results if more exist', async () => {
    const filter = {
      title: 'exalted',
      tags: ['exalted'],
      domain: 'theonyxpath',
    };
    const document = await advancedSearch(
      {
        filter,
        pagination: { first: 1 },
      },
      '1',
    );
    const after = document.pageInfo.endCursor;
    const nextDoc = await advancedSearch(
      {
        filter,
        pagination: { first: 1, after },
      },
      '1',
    );
    expect(document.edges.length).toBe(1);
    expect(document.edges[0].node.savedItem.id).toBe('3');
    expect(nextDoc.edges.length).toBe(1);
    expect(nextDoc.edges[0].node.savedItem.id).toBe('777');
  });
  it('retrieves empty array if no more results exist', async () => {
    const filter = {
      title: 'exalted',
      tags: ['exalted'],
      domain: 'theonyxpath',
    };
    const document = await advancedSearch(
      {
        filter,
        pagination: { first: 5 },
      },
      '1',
    );
    const after = document.pageInfo.endCursor;
    const nextDoc = await advancedSearch(
      {
        filter,
        pagination: { first: 1, after },
      },
      '1',
    );
    expect(document.edges.length).toBe(2);
    expect(document.edges[0].node.savedItem.id).toBe('3');
    expect(document.edges[1].node.savedItem.id).toBe('777');
    expect(nextDoc.edges.length).toBe(0);
  });
  it.each([
    {
      name: 'desc',
      sort: { sortBy: SearchItemsSortBy.CreatedAt },
      expectedIds: ['3', '411', '777', '666'],
    },
    {
      name: 'asc',
      sort: {
        sortBy: SearchItemsSortBy.CreatedAt,
        sortOrder: SearchItemsSortOrder.Asc,
      },
      expectedIds: ['666', '777', '3', '411'],
    },
  ])(
    'supports timestamp-based sort on date added ($name)',
    async ({ sort, expectedIds }) => {
      const document = await advancedSearch(
        {
          filter: { tags: ['exalted'] },
          sort,
        },
        '1',
      );
      const actualIds = document.edges.map((edge) => edge.node.savedItem.id);
      expect(actualIds).toEqual(expectedIds);
    },
  );
});
