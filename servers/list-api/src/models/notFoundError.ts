import { BaseErrorModel } from './baseError';
import { NotFound } from '../types';

export class NotFoundErrorModel extends BaseErrorModel {
  public message(key: string, value: string, includeKV = false): NotFound {
    const message = `Entity identified by key=${key}, value=${value} was not found.`;
    if (includeKV) {
      return { message, __typename: 'NotFound', key: key, value: value };
    }
    return { message, __typename: 'NotFound' };
  }
}
