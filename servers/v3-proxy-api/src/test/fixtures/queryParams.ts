import { V3GetParams } from '../../routes/validations/GetSchema.js';

export const defaultQuery: V3GetParams = {
  consumer_key: 'abc-def',
  count: 30,
  offset: 0,
  sort: 'newest',
  detailType: 'simple',
  total: false,
  annotations: false,
  taglist: false,
  forcetaglist: false,
  account: false,
  forceaccount: false,
  premium: false,
  forcepremium: false,
};

export const defaultSearchQuery: V3GetParams = {
  consumer_key: 'abc-def',
  count: 30,
  offset: 0,
  sort: 'relevance',
  detailType: 'simple',
  search: 'abc',
  total: false,
  annotations: false,
  taglist: false,
  forcetaglist: false,
  account: false,
  forceaccount: false,
  premium: false,
  forcepremium: false,
};
