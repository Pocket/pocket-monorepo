import { ShareNotFound } from '../__generated__/types';

export class ShareNotFoundModel implements ShareNotFound {
  static message = `The link has expired or does not exist.`;
  static __typename = 'ShareNotFound' as const;
}
