import chai, { expect } from 'chai';
import {
  applyFunctionalBoosts,
  buildSearchBody,
  calculateOffset,
  calculateSize,
  ElasticSearchParams,
  extractSearchValues,
  formatFilterKey,
  formatFilterValues,
  FunctionalBoostOperation,
  getFilterTerms,
  getSearchHighlightFields,
  getTerms,
  SearchParams,
  Term,
  cleanSearchTerm,
  generateSearchSavedItemsParams,
  getCleanedupDomainName,
} from './elasticsearchSearch';
import { Pagination, SearchSavedItemParameters } from '../../types';
import deepEqualInAnyOrder from 'deep-equal-in-any-order';

chai.use(deepEqualInAnyOrder);

describe('Elasticsearch', () => {
  describe('term cleaner', () => {
    it('should remove <>', () => {
      const res = cleanSearchTerm('<hi><>?');
      expect(res).to.equal(' hi   \\?');
    });
    it('should escape reserved characters', () => {
      const res = cleanSearchTerm('=hello&&wel~come+you*!(shy?)');
      expect(res).to.equal('\\=hello\\&&wel\\~come\\+you\\*\\!\\(shy\\?\\)');
    });
  });
  describe('getTerms', () => {
    it('should return an empty array if no values are passed', () => {
      expect(getTerms('bowling', [])).to.deep.equal([]);
    });

    it('should return an array of terms based on a single value', () => {
      const field = 'whathaveyous';
      const values = ['bowling'];
      const expected = [
        {
          term: {
            [field]: 'bowling',
          },
        },
      ];

      expect(getTerms(field, values)).to.deep.equal(expected);
    });

    it('should return an array of terms based on values provided', () => {
      const field = 'whathaveyous';
      const values = ['thedude', ' bowling ', true, 42];

      const expected = [
        {
          term: {
            [field]: 'thedude',
          },
        },
        {
          term: {
            [field]: 'bowling', // notice the trim!
          },
        },
        {
          term: {
            [field]: true,
          },
        },
        {
          term: {
            [field]: 42,
          },
        },
      ];

      expect(getTerms(field, values)).to.deep.equal(expected);
    });
  });

  describe('getSearchHighlightFields', () => {
    it('should generate an object of highlight fields', () => {
      const inputParams: SearchParams['highlightFields'] = [
        {
          field: 'lebowski',
          size: 10,
        },
        {
          field: 'walter',
          size: 47,
        },
      ];

      const expected = {
        lebowski: {
          fragment_size: 10,
        },
        walter: {
          fragment_size: 47,
        },
      };

      expect(getSearchHighlightFields(inputParams)).to.deep.equal(expected);
    });
  });

  describe('formatFilterKey', () => {
    it('should re-format the `tags` key', () => {
      expect(formatFilterKey('tags')).to.equal('tags.keyword');
    });

    it('should rename any key in the provided map', () => {
      expect(formatFilterKey('contentType')).to.equal('content_type');
    });

    it('should not change the key if not `tag` or in the provided map', () => {
      expect(formatFilterKey('bowling')).to.equal('bowling');
    });
  });

  describe('formatFilterValues', () => {
    it('should convert a single value into an array', () => {
      expect(formatFilterValues('thedude', 'Bowling')).to.deep.equal([
        'Bowling',
      ]);
    });

    it('should lowercase status values', () => {
      expect(formatFilterValues('status', ['ARCHIVED'])).to.deep.equal([
        'archived',
      ]);
    });

    it('should handle falsy status values', () => {
      expect(formatFilterValues('status', ['ARCHIVED', false])).to.deep.equal([
        'archived',
        null,
      ]);
    });
  });

  describe('getFilterTerms', () => {
    it('should allow false values but skip other false', () => {
      const input: ElasticSearchParams['filters'] = {
        userId: '1',
        favorite: false,
        contentType: '',
      };

      const expectedTerm: Term[] = [
        {
          term: {
            user_id: '1',
          },
        },
        {
          term: {
            favorite: false,
          },
        },
      ];

      const expectedFilter = [
        {
          bool: {
            must: expectedTerm,
          },
        },
      ];

      expect(getFilterTerms(input)).to.deep.equal(expectedFilter);
    });

    it('should collect all terms into a single array', () => {
      const input: ElasticSearchParams['filters'] = {
        userId: '1',
        tags: ['bowling', 'beverage'],
        favorite: true,
      };

      const expectedTerm: Term[] = [
        {
          term: {
            user_id: '1',
          },
        },
        {
          term: {
            'tags.keyword': 'bowling',
          },
        },
        {
          term: {
            'tags.keyword': 'beverage',
          },
        },
        {
          term: {
            favorite: true,
          },
        },
      ];

      const expectedFilter = [
        {
          bool: {
            must: expectedTerm,
          },
        },
      ];

      expect(getFilterTerms(input)).to.deep.equal(expectedFilter);
    });
  });

  it('can generate a function score query', () => {
    let body: any = {
      query: { match_all: {} },
    };

    body = applyFunctionalBoosts(
      body,
      [
        {
          field: 'test',
          value: true,
          operation: FunctionalBoostOperation.ADD,
          factor: 1,
        },
        {
          field: 'test2',
          value: 'flow',
          operation: FunctionalBoostOperation.MULTIPLY,
          factor: 2,
        },
      ],
      2
    );

    expect(body).to.deep.equal({
      query: {
        function_score: {
          query: { match_all: {} },
          boost_mode: 'replace',
          functions: [
            {
              script_score: {
                script: `_score > 0 ? _score : 2`,
              },
            },
            {
              filter: {
                match: { test: true },
              },
              script_score: {
                script: {
                  params: { factor: 1 },
                  source: `_score > 0 ? (_score + params.factor) : (2 + params.factor)`,
                },
              },
            },
            {
              filter: {
                match: { test2: 'flow' },
              },
              script_score: {
                script: {
                  params: { factor: 2 },
                  source: `_score > 0 ? (_score * params.factor) : (2 * params.factor)`,
                },
              },
            },
          ],
        },
      },
    });
  });

  describe(`calculateOffsetTest`, () => {
    const testSize = 10;

    it('should throw error when before and after is set ', () => {
      const testPagination: Pagination = {
        before: Buffer.from(`5`).toString('base64'),
        after: Buffer.from(`5`).toString('base64'),
      };
      expect(() => calculateOffset(testPagination, testSize)).to.throw(
        'Please set either {after and first} or {before and last}'
      );
    });

    it('should return `from` if after is set', () => {
      const testPagination: Pagination = {
        after: Buffer.from(`5`).toString('base64'),
      };
      const from: number = calculateOffset(testPagination, testSize);
      expect(from).to.equals(6);
    });

    it('should return `from` if before is set', () => {
      const testPagination: Pagination = {
        before: Buffer.from(`5`).toString('base64'),
      };
      const from: number = calculateOffset(testPagination, 2);
      expect(from).to.equals(3);
    });

    it('should return `from` to 0 if size greater than before', () => {
      const testPagination: Pagination = {
        before: Buffer.from(`5`).toString('base64'),
      };
      const from: number = calculateOffset(testPagination, testSize);
      expect(from).to.equals(0);
    });

    it('should throw error when last alone is set', () => {
      const testPagination: Pagination = {
        last: 10,
      };
      expect(() => calculateOffset(testPagination, testSize)).to.throw(
        "premium search doesn't support pagination by last alone." +
          'Please use first or first/after or before/last combination'
      );
    });
  });

  describe(`calculateSizeTest`, () => {
    it('should return `size` if after and input size are given', () => {
      const testPagination: Pagination = {
        after: Buffer.from(`2`).toString('base64'),
      };
      const from: number = calculateSize(testPagination, 10);
      expect(from).to.equals(10);
    });

    it('should return input size as size if its lesser than offset', () => {
      const testPagination: Pagination = {
        before: Buffer.from(`5`).toString('base64'),
      };
      const from: number = calculateSize(testPagination, 3);
      expect(from).to.equals(3);
    });

    it('should return input size as offset-1 if its equal to offset', () => {
      const testPagination: Pagination = {
        before: Buffer.from(`5`).toString('base64'),
      };
      const from: number = calculateSize(testPagination, 5);
      expect(from).to.equals(5);
    });

    it('should return input size as offset-1 if its greater than offset', () => {
      const testPagination: Pagination = {
        before: Buffer.from(`5`).toString('base64'),
      };
      const from: number = calculateSize(testPagination, 10);
      expect(from).to.equals(5);
    });
  });

  describe(`test regex`, () => {
    //mocha doesnt have a test.each

    const runs: string[][] = [
      ['yes this is right #coffee tag:bean', 'coffee', 'bean'],
      [
        'yes tag:leaf this #coffee tag:bean is right #tea ',
        'leaf',
        'coffee',
        'bean',
        'tea',
      ],
      [
        'yes tag:"tea leaf" this #"coffee pot" tag:"green" is right #"oolong"',
        'tea leaf',
        'coffee pot',
        'green',
        'oolong',
      ],
    ];

    it(`regex test for input`, function () {
      runs.forEach(function (run) {
        const searchValues = extractSearchValues(run[0]);
        expect(searchValues['tags']).to.deep.equal(run.splice(1));
        expect(searchValues['search']).to.equal('yes this is right');
      });
    });
  });

  describe('buildSearchBody', () => {
    it('uses from and size parameters for pagination', () => {
      const searchBody = buildSearchBody({
        filters: { userId: '1' },
        term: 'test',
        fields: ['test'],
        from: 10,
        size: 20,
      });

      expect(searchBody).to.deep.include({
        from: 10,
        size: 20,
      });
    });

    it('uses from and size parameters for pagination when "from" equals 0', () => {
      const searchBody = buildSearchBody({
        filters: { userId: '1' },
        term: 'test',
        fields: ['test'],
        from: 0,
        size: 20,
      });

      expect(searchBody).to.deep.include({
        from: 0,
        size: 20,
      });
    });
    it('builds search body with tag filters', () => {
      const searchBody = buildSearchBody({
        filters: { userId: '1', tags: ['fang'], domain: null },
        term: 'canine',
        fields: ['title'],
      });
      const expectedFilter = {
        filter: [
          {
            bool: {
              must: [
                {
                  term: {
                    user_id: '1',
                  },
                },
                {
                  term: {
                    'tags.keyword': 'fang',
                  },
                },
              ],
            },
          },
        ],
      };
      expect(searchBody.query['bool']['filter']).to.not.be.undefined;
      expect(searchBody.query['bool']).to.deep.include(expectedFilter);
    });

    it('gives domain only from domain url', () => {
      const domain = getCleanedupDomainName('http://www.admin.getpocket.com');
      expect(domain).equals('admin.getpocket.com');
    });

    it('gives domain only from domain url', () => {
      const domain = getCleanedupDomainName('admin.getpocket.com');
      expect(domain).equals('admin.getpocket.com');
    });

    it('gives domain only from domain url', () => {
      const domain = getCleanedupDomainName('non_url_string');
      expect(domain).equals('non_url_string');
    });

    it('builds search body with domain filters', () => {
      const searchBody = buildSearchBody({
        filters: { userId: '1', tags: ['fang'], domain: 'admin.getpocket.com' },
        term: 'canine',
        fields: ['title'],
      });
      const expectedFilter = {
        filter: [
          {
            bool: {
              must: [
                {
                  term: {
                    user_id: '1',
                  },
                },
                {
                  term: {
                    'tags.keyword': 'fang',
                  },
                },
              ],
            },
          },
          {
            wildcard: {
              url: '*admin.getpocket.com*',
            },
          },
        ],
      };
      expect(searchBody.query['bool']['filter']).to.not.be.undefined;
      expect(searchBody.query['bool']).to.deep.include(expectedFilter);
    });
  });
  describe('generateSearchSavedItemsParams', () => {
    it('extracts tags from search term and adds to filter', () => {
      const params: SearchSavedItemParameters = {
        term: 'tag:"book reviews" #"short story" vampire',
      };
      const searchParams = generateSearchSavedItemsParams(params, '1');
      expect(searchParams.filters).to.not.be.undefined;
      expect(searchParams.filters.tags).to.deep.equalInAnyOrder([
        'book reviews',
        'short story',
      ]);
      expect(searchParams.term).to.equal('vampire');
    });
  });
});
