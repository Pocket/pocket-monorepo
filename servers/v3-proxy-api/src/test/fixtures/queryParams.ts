import { V3GetParams } from '../../routes/validations/GetSchema';

export const defaultQuery: V3GetParams = {
  consumer_key: 'abc-def',
  count: 30,
  offset: 0,
  sort: 'newest',
  detailType: 'simple',
};
