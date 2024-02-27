import { V3GetParams } from '../../routes/validations';

export const defaultQuery: V3GetParams = {
  count: 30,
  offset: 0,
  sort: 'newest',
  detailType: 'simple',
};
