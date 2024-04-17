import { ShareNotFound } from '../__generated__/resolvers-types';

export class ShareNotFoundModel implements ShareNotFound {
  static message = `The link you followed has expired or does not exist.`;
  static __typename = 'ShareNotFound' as const;
}
