import { V3GetQuery } from '../../routes/validations';

export const defaultQuery: V3GetQuery = {
  count: 30,
  offset: 0,
  sort: 'newest',
  type: 'simple',
};
