import {
  mockGraphGetComplete,
  mockGraphGetSimple,
  expectedGetComplete,
  expectedGetSimple,
} from './get';

export const premiumRecentSearches = {
  recent_searches: [
    {
      search: 'stakes',
      context_key: '',
      context_value: '',
      sort_id: '1',
    },
    {
      search: '#recipe garlic',
      context_key: '',
      context_value: '',
      sort_id: '2',
    },
    {
      search: 'belmont',
      context_key: '',
      context_value: '',
      sort_id: '3',
    },
    {
      search: 'bats',
      context_key: 'key',
      context_value: 'value',
      sort_id: '4',
    },
    {
      search: 'siege tactics',
      context_key: '',
      context_value: '',
      sort_id: '5',
    },
  ],
};

export const premiumRecentSearchesGraph = {
  user: {
    recentSearches: [
      {
        term: 'stakes',
        context: null,
        sortId: 0,
      },
      {
        term: '#recipe garlic',
        context: null,
        sortId: 1,
      },
      {
        term: 'belmont',
        context: null,
        sortId: 2,
      },
      {
        term: 'bats',
        context: {
          key: 'key',
          value: 'value',
        },
        sortId: 3,
      },
      {
        term: 'siege tactics',
        context: null,
        sortId: 4,
      },
    ],
  },
};

export const freeRecentSearchesGraph = {
  user: {
    recentSearches: null,
  },
};

export const premiumNoSearchesGraph = {
  user: {
    recentSearches: [],
  },
};

export const mockGraphGetCompletePremiumRecentSearches = {
  user: {
    ...mockGraphGetComplete.user,
    ...premiumRecentSearchesGraph.user,
  },
};

export const expectedGetCompletePremiumRecentSearches = {
  ...expectedGetComplete,
  ...premiumRecentSearches,
};

export const mockGraphGetCompleteFreeRecentSearches = {
  user: {
    ...mockGraphGetComplete.user,
    ...freeRecentSearchesGraph.user,
  },
};

export const mockGraphGetSimplePremiumRecentSearches = {
  user: {
    ...mockGraphGetSimple.user,
    ...premiumRecentSearchesGraph.user,
  },
};

export const expectedGetSimplePremiumRecentSearches = {
  ...expectedGetSimple,
  ...premiumRecentSearches,
};

export const mockGraphGetSimpleFreeRecentSearches = {
  user: {
    ...mockGraphGetSimple.user,
    ...freeRecentSearchesGraph.user,
  },
};

export const mockGraphGetSimplePremiumNoRecentSearches = {
  user: {
    ...mockGraphGetSimple.user,
    ...premiumNoSearchesGraph.user,
  },
};
