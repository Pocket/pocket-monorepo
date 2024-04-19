import {
  mockGraphGetComplete,
  mockGraphGetSimple,
  expectedGetComplete,
  expectedGetSimple,
} from './get';

export const premiumAccount = {
  account: {
    user_id: '4578fghjvcxnw389t90ew23ui23oidfi540549wdsj',
    username: '',
    email: 'vlad@bran.castle',
    birth: '2021-10-31 16:41:35',
    first_name: 'Vlad',
    last_name: 'Țepeș',
    premium_status: '1',
    is_fxa: 'true',
    // TODO POCKET-9982
    aliases: {
      'vlad@bran.castle': {
        email: 'vlad@bran.castle',
        confirmed: '1',
      },
    },
    profile: {
      username: null,
      name: 'Vlad Țepeș',
      description: '',
      avatar_url:
        'https://s3.amazonaws.com/pocket-profile-images/6a1423cabc98a3cfbd3b5c1c92d7609393d208f.jpg',
      follower_count: '0',
      follow_count: '0',
      is_following: '0',
      uid: '4578fghjvcxnw389t90ew23ui23oidfi540549wdsj',
      type: 'pocket',
      sort_id: 1,
    },
    premium_features: [
      'library',
      'suggested_tags',
      'premium_search',
      'annotations',
      'ad_free',
    ],
    premium_alltime_status: '1',
    premium_on_trial: '0', // TODO POCKET-9981 '1',
  },
};

export const freeAccount = {
  account: {
    user_id: 'l2q3sadflkjasdf903493482jkadsfjksadfjk349803489sdfs',
    username: '',
    email: 'adrian@bran.castle',
    birth: '2022-10-31 07:56:11',
    first_name: 'Alucard',
    last_name: '',
    premium_status: '0',
    is_fxa: 'true',
    // TODO
    aliases: {
      'adrian@bran.castle': {
        email: 'adrian@bran.castle',
        confirmed: '1',
      },
    },
    profile: {
      username: null,
      name: 'Alucard',
      description: '',
      avatar_url:
        'https://pocket-profile-images.s3.amazonaws.com/profileGreen.png',
      follower_count: '0',
      follow_count: '0',
      is_following: '0',
      uid: 'l2q3sadflkjasdf903493482jkadsfjksadfjk349803489sdfs',
      type: 'pocket', // static
      sort_id: 1, // static
    },
    premium_features: [],
    premium_alltime_status: '0',
    premium_on_trial: '0',
    annotations_per_article_limit: 3,
  },
};

export const premiumAccountGraph = {
  user: {
    id: '4578fghjvcxnw389t90ew23ui23oidfi540549wdsj',
    username: null, // this is profile.username
    email: 'vlad@bran.castle',
    accountCreationDate: '2021-10-31T23:41:35.000Z',
    firstName: 'Vlad',
    lastName: 'Țepeș',
    isPremium: true,
    isFxa: true,
    description: '',
    avatarUrl:
      'https://s3.amazonaws.com/pocket-profile-images/6a1423cabc98a3cfbd3b5c1c92d7609393d208f.jpg',
    premiumStatus: 'ACTIVE',
    premiumFeatures: [
      'PERMANENT_LIBRARY',
      'SUGGESTED_TAGS',
      'PREMIUM_SEARCH',
      'ANNOTATIONS',
      'AD_FREE',
    ],
    name: 'Vlad Tepes',
  },
};

export const freeAccountGraph = {
  user: {
    id: 'l2q3sadflkjasdf903493482jkadsfjksadfjk349803489sdfs',
    username: null, // this is profile.username
    email: 'adrian@bran.castle',
    accountCreationDate: '2022-10-31T14:56:11.000Z',
    firstName: 'Alucard',
    lastName: '',
    isPremium: false,
    isFxa: true,
    description: '',
    avatarUrl:
      'https://pocket-profile-images.s3.amazonaws.com/profileGreen.png',
    premiumStatus: 'NEVER',
    premiumFeatures: [],
    name: 'Alucard',
  },
};

export const mockGraphGetCompletePremiumAccount = {
  user: {
    ...mockGraphGetComplete.user,
    ...premiumAccountGraph.user,
  },
};

export const expectedGetCompletePremiumAccount = {
  ...expectedGetComplete,
  ...premiumAccount,
};

export const mockGraphGetCompleteFreeAccount = {
  user: {
    ...mockGraphGetComplete.user,
    ...freeAccountGraph.user,
  },
};

export const expectedGetCompleteFreeAccount = {
  ...expectedGetComplete,
  ...freeAccount,
};

export const mockGraphGetSimplePremiumAccount = {
  user: {
    ...mockGraphGetSimple.user,
    ...premiumAccountGraph.user,
  },
};

export const expectedGetSimplePremiumAccount = {
  ...expectedGetSimple,
  ...premiumAccount,
};

export const mockGraphGetSimpleFreeAccount = {
  user: {
    ...mockGraphGetSimple.user,
    ...freeAccountGraph.user,
  },
};

export const expectedGetSimpleFreeAccount = {
  ...expectedGetSimple,
  ...freeAccount,
};
